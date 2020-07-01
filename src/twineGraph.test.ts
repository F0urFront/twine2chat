import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { convertStory, serialize } from './twineGraph';
import meetPaigeGraph from '../meet-paige.json';

const readFile = promisify(fs.readFile);


test('convert twine html to graph', async () => {
  const twineFile = await readFile(path.join(__dirname, '..', 'meet-paige.html'), { encoding: 'utf-8' });
  const graph = await convertStory(twineFile);
  const graphJson = serialize(graph);
  expect(graphJson).toEqual(meetPaigeGraph);
});
