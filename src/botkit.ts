import { Botkit, BotkitConversation } from 'botkit';
const { HangoutsAdapter } = require('botbuilder-adapter-hangouts');


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
    });

    this.controller.webserver.get('/bot', async (req: any, res: any) => {
      res.send(`This app is running Botkit ${ this.controller.version }.`);
    });
  }

  train(story: any) {
    const convo = new BotkitConversation('experience', this.controller);

    // if node text is [[something]] it just redirects

    this.controller.addDialog(convo);

    this.controller.on(['bot_dm_join', 'channel_join', 'message', 'event'], async (bot, message) => {
      await bot.beginDialog('experience');
    });

    console.log('training finished');
  }
}
