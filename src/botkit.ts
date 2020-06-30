import { Botkit, BotkitConversation, BotWorker } from 'botkit';
import { TelegramAdapter, TelegramEventTypeMiddleware } from 'botkit-adapter-telegram';
import { traverse, deserialize } from './twineGraph';
import Storage from './storage';


async function middlewareDelay(bot: BotWorker & { api: any }, message: { text: string, chat_id: string }, next: () => void) {
  if (message.text.length > 0) {
    let time = message.text.length * 40;
    const activity = bot.getConfig('activity');
    console.log(activity.conversation.id);
    await bot.api.callAPI('sendChatAction', 'POST', { chat_id: activity.conversation.id, action: "typing" });
    await setTimeout(async ()=> { await next(); }, time);
  } else {
    await next();
  } 
}

const yesPattern = 'yes|ya|yeah|yep|sure|ok|probably|yuh|yeah';
const noPattern = 'no|nah|nope|na';

function linkToPattern(link: string) {
  if (link.includes('no response')) return 'huh';
  else if (link.includes('yes, short answer')) return yesPattern;
  else if (link.includes('yes, detailed answer')) return yesPattern;
  else if (link.includes('yes')) return yesPattern;
  else if (link.includes('no')) return noPattern;
  return 'huh';
}

export default class Bot {
  controller: Botkit;
  constructor(telegramToken: string, webhookHost: string, private storage: Storage) {
    const adapter = new TelegramAdapter({
      access_token: telegramToken,
      webhook_url_host_name: webhookHost,
    });

    // adapter.use(new TelegramEventTypeMiddleware());

    this.controller = new Botkit({
      // webserver_middlewares: [],
      webhook_uri: '/api/messages',
      adapter,
      storage,
    });

    this.controller.middleware.send.use(middlewareDelay);

    this.startConvo();
  }

  train(story: any) {
    console.log('training...');
    const convo = new BotkitConversation('experience', this.controller);

    traverse(story, (n, e) => {
      const threadId = n.isRoot ? 'default' : n.pid;

      if (!n.text && e.length === 1) { // if text is [[something]] it just redirects
        convo.addAction(e[0].nodeId, threadId);
      } else {
        const text: string = n.text || `Choose: ${e.map(op => op.text).join(', ')}`;
        const texts: string[] = text
          .replace(/\{(.+?)\}/g, '{{vars.$1}}')
          .split('\n')
          .map(t => t.trim());
        // console.log(texts);

        let initial: string[] = [];
        if (texts.length > 1) initial = texts.slice(0, texts.length - 1);
        const last = texts[texts.length - 1];

        initial.forEach(t => convo.addMessage(t, threadId));

        let varKey = null;
        const varLinks = e.map(op => {
          const m = op.text.match(/\{(.*?)\}/);
          return {
            key: m ? m[1] : null,
            nodeId: op.nodeId,
          };
        });
        const varLink = varLinks.find(op => op.key);

        if (e.length <= 0) {
          convo.addMessage(last, threadId);
          convo.addAction('complete', threadId);
        } else if (!varLink && e.length === 1) {
          convo.addMessage(last, threadId);
          convo.addAction(e[0].nodeId, threadId);
        } else {
          let def;
          if (varLink) {
            varKey = varLink.key;
            def = {
              default: true,
              handler: async (res: any, conv: any, bot: any) => conv.gotoThread(varLink.nodeId),
            };
          } else {
            def = {
              default: true,
              handler: async (res: any, conv: any, bot: any) => {
                const confusedResponse = e.find(op => op.text.includes('confused'));
                confusedResponse
                  ? conv.gotoThread(confusedResponse.nodeId)
                  : conv.repeat();
              },
            };
          }

          convo.addQuestion(last, [
            ...e.map(op => ({
              pattern: linkToPattern(op.text.substr(op.text.indexOf(" ") + 1)), // remove first word
              handler: async (res: any, conv: any, bot: any) => conv.gotoThread(op.nodeId),
            })),
            def,
          ], varKey, threadId);
        }
      }
    });

    this.controller.addDialog(convo);
    console.log('training finished');
  }

  startConvo() {
    console.log('starting convo...');
    this.controller.ready(async () => {
      console.log('ready!');
      // load script
      try {
        const { scriptGraph } = await this.storage.read(['scriptGraph']);
        console.log(scriptGraph);
        const story = deserialize(scriptGraph)
        this.train(story);
      } catch (err) {
        console.error(err.message);
        console.error('No script graph exists');
      }
    });

    this.controller.on(['message'], async (bot, message) => {
      console.log('received message!');
      // load script
      try {
        // @ts-ignore
        if (this.controller.dialogSet.dialogs['experience']) {
          // @ts-ignore
          delete this.controller.dialogSet.dialogs['experience'];
        }

        const { scriptGraph } = await this.storage.read(['scriptGraph']);
        console.log(scriptGraph);
        const story = deserialize(scriptGraph)
        this.train(story);
      } catch (err) {
        console.error(err.message);
        console.error('No script graph exists');
      }

      await bot.beginDialog('experience');
    });
  }
}
