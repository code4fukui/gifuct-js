import { parseGIF, decompressFrames } from '../src/index.js'

const bin = await Deno.readFile("horses.gif");
const gif = parseGIF(bin);
const frames = decompressFrames(gif, true);
console.log(frames);
