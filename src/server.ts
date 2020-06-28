import util from 'util';
import path from 'path';
import fs from 'fs';
import Bot from './botkit';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { convertStory } from './twineGraph';

const upload = multer({ dest: 'uploads/' });
const readFile = util.promisify(fs.readFile);


class App {
  public app: express.Application;
  public port: (string | number);
  public env: boolean;
  private bot: Bot;

  constructor(bot: Bot) {
    this.app = express();
    this.port = process.env.PORT || 4000;
    this.env = process.env.NODE_ENV === 'production' ? true : false;

    this.app.use(cors());
    this.initializeRoutes();
    this.bot = bot;
  }

  public listen() {
    this.app.listen(this.port, () => {
      console.log(`🚀 App listening on the port ${this.port}`);
    });
  }

  public getServer() {
    return this.app;
  }

  private initializeRoutes() {
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
    });

    this.app.post('/experience', upload.single('twineFile'), async (req, res) => {
      const twineFile = await readFile(req.file.path, { encoding: 'utf-8' });

      const story = await convertStory(twineFile);

      // console.log(JSON.stringify(story, null, 2));

      this.bot.train(story);

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
