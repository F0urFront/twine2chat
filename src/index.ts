import App from './server';
import Storage from './storage';

if (!process.env.AWS_DEFAULT_REGION) throw new Error('AWS_DEFAULT_REGION env variable undefined');
if (!process.env.TELEGRAM_TOKEN) throw new Error('TELEGRAM_TOKEN env variable undefined');
if (!process.env.WEBHOOK_HOST) throw new Error('WEBHOOK_HOST env variable undefined');

const storage = new Storage(process.env.AWS_DEFAULT_REGION, 'chatbot-data');

export const app = new App(process.env.TELEGRAM_TOKEN, process.env.WEBHOOK_HOST, storage);
// app.listen();
