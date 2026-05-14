# gifuct-js

> 日本語のREADMEはこちらです: [README.ja.md](README.ja.md)

A simple JavaScript GIF decoder for parsing and rendering GIF files in browsers or Deno environments.

## Demo

See the library in action: [Live Demo](https://code4fukui.github.io/gifuct-js/)

*The example GIF [a01-kanta.gif](https://code4fukui.github.io/gifuct-js/demo/a01-kanta.gif) is sourced from [Fukui City Zoo open data](https://github.com/code4fukui/lessergo-puyo/).*

## Features

-   Parses GIF files into frame data with metadata.
-   Decompresses LZW-encoded frame data.
-   Handles interlaced GIFs.
-   Provides canvas-ready `Uint8ClampedArray` pixel data for easy rendering.
-   Correctly handles GIF disposal methods and transparency.

## Usage

This library is distributed as an ES module and can be imported directly from a URL. No installation step is required.

### Decoding a GIF

To decode a GIF, fetch it as an `ArrayBuffer`, then use the `parseGIF` and `decompressFrames` functions.

```js
import { parseGIF, decompressFrames } from 'https://code4fukui.github.io/gifuct-js/src/index.js';

// Fetch the GIF file
const response = await fetch('path/to/your.gif');
const buffer = await response.arrayBuffer();

// Parse the GIF
const gif = parseGIF(buffer);

// Decompress the GIF frames
const frames = decompressFrames(gif, true); // true to generate canvas-ready patches
```

### Rendering Frames

The `frames` array contains all the data needed to render the animation. Each frame is a patch that should be drawn on top of the previous frame's output, respecting the `disposalType`.

The recommended rendering approach is to use two canvases: one hidden canvas to compose the full GIF image and one visible canvas to display it.

```js
const canvas = document.querySelector('#player');
const ctx = canvas.getContext('2d');

// Set canvas dimensions
canvas.width = gif.lsd.width;
canvas.height = gif.lsd.height;

// Create a temporary canvas for compositing
const tempCanvas = document.createElement('canvas');
const tempCtx = tempCanvas.getContext('2d');
tempCanvas.width = canvas.width;
tempCanvas.height = canvas.height;

let frameIndex = 0;

function draw() {
  const frame = frames[frameIndex];
  const { dims, patch, disposalType } = frame;

  // Method 2: Draw the new patch onto the temporary canvas,
  // then draw the temporary canvas onto the main canvas.
  if (disposalType === 2) {
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
  }

  // Create an ImageData object from the patch
  const imageData = tempCtx.createImageData(dims.width, dims.height);
  imageData.data.set(patch);
  
  // Draw the patch onto the temporary canvas
  tempCtx.putImageData(imageData, dims.left, dims.top);

  // Copy the temporary canvas to the visible canvas
  ctx.drawImage(tempCanvas, 0, 0);

  // Schedule the next frame
  frameIndex = (frameIndex + 1) % frames.length;
  setTimeout(draw, frame.delay);
}

draw();
```

## API

### Functions

#### `parseGIF(arrayBuffer)`

-   **`arrayBuffer`**: `ArrayBuffer` | The raw GIF file data.
-   **Returns**: `ParsedGif` | A structured object representing the parsed GIF file.

Parses the high-level structure of the GIF, including headers, color tables, and raw frame data. This function does not decompress the image data.

#### `decompressFrames(parsedGif, buildImagePatches)`

-   **`parsedGif`**: `ParsedGif` | The object returned from `parseGIF`.
-   **`buildImagePatches`**: `boolean` | If `true`, a `patch` property with a `Uint8ClampedArray` will be added to each frame object, ready for canvas rendering.
-   **Returns**: `ParsedFrame[]` | An array of decompressed frame objects.

### Data Structures

#### `ParsedFrame`

Each object in the array returned by `decompressFrames` has the following structure:

-   **`pixels`**: `number[]`
    -   An array of color indices for the frame's patch.
-   **`dims`**: `{ top: number, left: number, width: number, height: number }`
    -   The position and dimensions of the image patch.
-   **`delay`**: `number`
    -   The time, in milliseconds, to display the frame.
-   **`disposalType`**: `number`
    -   The disposal method (1-3), which indicates how to treat the canvas before rendering the next frame.
-   **`colorTable`**: `[r, g, b][]`
    -   The color table used for this frame (either local or global).
-   **`transparentIndex`**: `number`
    -   The index in the color table that should be treated as transparent.
-   **`patch`**: `Uint8ClampedArray` (optional)
    -   A canvas-ready pixel array in `[R, G, B, A, ...]` format. Only present if `buildImagePatches` was `true`.

## License

MIT License — see [LICENSE](LICENSE).