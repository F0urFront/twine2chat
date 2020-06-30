import { parseStringPromise } from 'xml2js';
// @ts-ignore
import { Graph, json as jsonGraph } from '@dagrejs/graphlib';


// Adapted from https://raw.githubusercontent.com/lazerwalker/twison

function extractLinksFromText(txt: string) {
  const rawLinks = txt.match(/\[\[.+?\]\]/g) || [];
  const text = txt.startsWith('[[') ? null : txt.split('[[')[0].trimRight();

  const links = rawLinks.map((link) => {
    var differentName = link.match(/\[\[(.*?)\-\&gt;(.*?)\]\]/);
    if (differentName) { // [[name->link]]
      return { name: differentName[1], link: differentName[2] };
    }
    // [[link]]
    return { link: link.substring(2, link.length-2), name: link };
  });

  return { text, links };
};

export async function convertStory(twineFile: string) {
  const graph = new Graph({ multigraph: true });
  const twineJson = await parseStringPromise(twineFile, { strict: false });

  const pidsByName: any = {};
  const passages: any[] = twineJson.HTML.BODY[0]['TW-STORYDATA'][0]['TW-PASSAGEDATA'];
  passages.forEach((passage: any) => {
    // const text = passage._;

    const { text, links } = extractLinksFromText(passage._);

    const attributes: any = {};
    ["NAME", "PID", "POSITION", "TAGS"].forEach(function(attr) {
      var value = passage['$'][attr];
      if (value) {
        attributes[attr.toLowerCase()] = value;
      }
    });

    pidsByName[attributes.name] = attributes.pid;

    graph.setNode(attributes.pid, { text, links, ...attributes });
  });

  // Add PIDs to links
  graph.nodes().forEach((passageId: any) => {
    const passage = graph.node(passageId);
    if (!passage.links) return;
    passage.links.forEach((link: any) => {
      const pid = pidsByName[link.link];
      // if (!link.pid) link.broken = true;

      if (pid) graph.setEdge(passageId, pid, { text: link.link });
    });
  });

  return graph;
};

function _traverse(graph: Graph, node: any, callback: (node: any, outEdges: any[]) => void, visited: any, isRoot = false) {
  if (visited[node]) return;

  const nodeObj = graph.node(node);
  if (isRoot) nodeObj.isRoot = true;
  callback(nodeObj, graph.outEdges(node).map((e: any) => ({ ...graph.edge(e), nodeId: e.w })));
  visited[node] = true;
  graph.successors(node).forEach((c: any) => _traverse(graph, c, callback, visited));
}

export function traverse(graph: Graph, callback: (node: any, outEdges: any[]) => void) {
  const root = graph.sources()[0]; // should only be one
  const visited: any = {};
  _traverse(graph, root, callback, visited, true);
}

export function serialize(graph: Graph): string {
  return jsonGraph.write(graph);
}

export function deserialize(json: string): Graph {
  return jsonGraph.read(json);
}
