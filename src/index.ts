import App from './server';
import Bot from './botkit';

const bot = new Bot({ /* TODO: google creds */ });

const app = new App(bot);
app.listen();
