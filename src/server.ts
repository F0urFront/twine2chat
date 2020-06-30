import util from 'util';
import path from 'path';
import fs from 'fs';
import Bot from './botkit';
import Storage from './storage';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { convertStory, serialize, deserialize } from './twineGraph';

const upload = multer({ dest: '/tmp/' });
const readFile = util.promisify(fs.readFile);


class App {
  // @ts-ignore
  public app: express.Application;
  // public port: (string | number);
  // @ts-ignore
  private bot: Bot;

  constructor(private telegramToken: string, private webhookHost: string, private storage: Storage) {
    this.init();
  }

  init(webserver?: express.Application) {
    if (webserver && this.bot) delete this.bot;
    this.bot = new Bot(this.telegramToken, this.webhookHost, this.storage, webserver);
    // this.app = express();
    this.app = this.bot.controller.webserver;

    if (!webserver) {
      this.app.use(cors());
      this.initializeRoutes();
    }

    // this.app.use((req, res, next) => {
    //   console.log('middleware');
    //   console.log(req);
    //   console.log(res);
    //   next();
    // });
  }

  // public listen() {
  //   this.app.listen(this.port, () => {
  //     console.log(`🚀 App listening on the port ${this.port}`);
  //   });
  // }

  private initializeRoutes() {
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
    });

    this.app.post('/experience', upload.single('twineFile'), async (req, res) => {
      const twineFile = await readFile(req.file.path, { encoding: 'utf-8' });

      const story = await convertStory(twineFile);

      // delete everything first
      await this.storage.deleteAll();

      await this.storage.write({ scriptGraph: serialize(story) });

      // delete this.bot;
      this.init(this.bot.controller.webserver);

      res.sendFile(path.join(__dirname, '..', 'public', 'experience.html'));
    });

    this.app.get('/experience', (req, res) => {
      res.json({
        status: 'creating experience...',
        url: 'http://www.creativelogic.me',
      });
    });
  }
}

export default App;
