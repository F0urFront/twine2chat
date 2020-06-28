import { Botkit, BotkitConversation } from 'botkit';
const { HangoutsAdapter } = require('botbuilder-adapter-hangouts');
import { traverse } from './twineGraph';


async function middlewareDelay(bot: any, message: { text: string }, next: () => void) {
  if(message.text.length > 0){
    let time = message.text.length * 50;
    await setTimeout(async ()=> { await next(); }, time);
  } else {
    await next();
  } 
}

const yesPattern = 'yes|ya|yeah|yep|sure|ok|probably|yuh';
const noPattern = 'no|nah|nope';

function linkToIntent(link: string) {
  switch (link) {
    case 'yes':
      return yesPattern;
    case 'no':
      return noPattern;
    case 'no response':
    default:
      return 'huh';
  }
}

export default class Bot {
  controller: Botkit;
  constructor(googleCreds: any) {
    const adapter = new HangoutsAdapter({
      // REMOVE THIS OPTION AFTER YOU HAVE CONFIGURED YOUR APP!
      enable_incomplete: true,
      
      token: process.env.GOOGLE_TOKEN,
      google_auth_params: {
          credentials: googleCreds,
      }
    });

    this.controller = new Botkit({
      webhook_uri: '/api/messages',
      // adapter,
    });

    this.controller.middleware.send.use(middlewareDelay);

    this.controller.webserver.get('/bot', async (req: any, res: any) => {
      res.send(`This app is running Botkit ${ this.controller.version }.`);
    });
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

        if (!varLink && e.length === 1) {
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
                confusedResponse ? conv.gotoThread(confusedResponse.nodeId) : conv.repeat();
              },
            };
          }

          console.log(varKey);
          convo.addQuestion(last, [
            ...e.map(op => ({
              pattern: linkToIntent(op.text.substr(op.text.indexOf(" ") + 1)), // remove first word
              handler: async (res: any, conv: any, bot: any) => conv.gotoThread(op.nodeId),
            })),
            def,
          ], varKey, threadId);
        }
      }
      
      console.log(e);
    });

    console.log(JSON.stringify(convo.script, null, 2));
    this.controller.addDialog(convo);

    this.controller.on(['bot_dm_join', 'channel_join', 'message', 'event'], async (bot, message) => {
      await bot.beginDialog('experience');
    });

    console.log('training finished');
  }
}
