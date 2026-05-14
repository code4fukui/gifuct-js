# gifuct-js

ブラウザやDeno環境でGIFファイルを解析・レンダリングするためのシンプルなJavaScript GIFデコーダーです。

## デモ

ライブラリの動作を確認できます: [ライブデモ](https://code4fukui.github.io/gifuct-js/)

*例として使用されているGIF [a01-kanta.gif](https://code4fukui.github.io/gifuct-js/demo/a01-kanta.gif) は [福井市動物園オープンデータ](https://github.com/code4fukui/lessergo-puyo/) から取得したものです。*

## 特徴

-   GIFファイルをフレームデータとメタデータに解析します。
-   LZW圧縮されたフレームデータを展開します。
-   インタレースGIFを処理します。
-   キャンバスで簡単にレンダリングできる `Uint8ClampedArray` 形式のピクセルデータを提供します。
-   GIFのディスポーザル（消去）メソッドと透過を正しく処理します。

## 使い方

このライブラリはESモジュールとして配布されており、URLから直接インポート可能です。インストール手順は必要ありません。

### GIFのデコード

GIFをデコードするには、`ArrayBuffer` として取得した後、`parseGIF` と `decompressFrames` 関数を使用します。

```js
import { parseGIF, decompressFrames } from 'https://code4fukui.github.io/gifuct-js/src/index.js';

// GIFファイルを取得
const response = await fetch('path/to/your.gif');
const buffer = await response.arrayBuffer();

// GIFを解析
const gif = parseGIF(buffer);

// GIFフレームを展開
const frames = decompressFrames(gif, true); // true を指定するとキャンバス描画用のパッチが生成されます
```

### フレームのレンダリング

`frames` 配列には、アニメーションをレンダリングするために必要なすべてのデータが含まれています。各フレームは、`disposalType` に従って前のフレームの出力の上に描画されるべきパッチです。

推奨されるレンダリング方法は、2つのキャンバスを使用することです。1つはGIF画像全体を合成するための非表示キャンバス、もう1つはそれを表示するための可視キャンバスです。

```js
const canvas = document.querySelector('#player');
const ctx = canvas.getContext('2d');

// キャンバスのサイズを設定
canvas.width = gif.lsd.width;
canvas.height = gif.lsd.height;

// 合成用の一時キャンバスを作成
const tempCanvas = document.createElement('canvas');
const tempCtx = tempCanvas.getContext('2d');
tempCanvas.width = canvas.width;
tempCanvas.height = canvas.height;

let frameIndex = 0;

function draw() {
  const frame = frames[frameIndex];
  const { dims, patch, disposalType } = frame;

  // 方法2: 新しいパッチを一時キャンバスに描画し、
  // その後、一時キャンバスをメインキャンバスに描画します。
  if (disposalType === 2) {
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
  }

  // パッチからImageDataオブジェクトを作成
  const imageData = tempCtx.createImageData(dims.width, dims.height);
  imageData.data.set(patch);
  
  // パッチを一時キャンバスに描画
  tempCtx.putImageData(imageData, dims.left, dims.top);

  // 一時キャンバスを可視キャンバスにコピー
  ctx.drawImage(tempCanvas, 0, 0);

  // 次のフレームをスケジュール
  frameIndex = (frameIndex + 1) % frames.length;
  setTimeout(draw, frame.delay);
}

draw();
```

## API

### 関数

#### `parseGIF(arrayBuffer)`

-   **`arrayBuffer`**: `ArrayBuffer` | 生のGIFファイルデータ。
-   **戻り値**: `ParsedGif` | 解析されたGIFファイルを表す構造化オブジェクト。

GIFの上位構造（ヘッダ、カラーテーブル、生のフレームデータなど）を解析します。この関数は画像データの展開は行いません。

#### `decompressFrames(parsedGif, buildImagePatches)`

-   **`parsedGif`**: `ParsedGif` | `parseGIF` から返されたオブジェクト。
-   **`buildImagePatches`**: `boolean` | `true` を指定すると、キャンバス描画用の `Uint8ClampedArray` を持つ `patch` プロパティが各フレームオブジェクトに追加されます。
-   **戻り値**: `ParsedFrame[]` | 展開されたフレームオブジェクトの配列。

### データ構造

#### `ParsedFrame`

`decompressFrames` が返す配列の各オブジェクトは以下の構造を持ちます:

-   **`pixels`**: `number[]`
    -   フレームのパッチの色インデックスの配列。
-   **`dims`**: `{ top: number, left: number, width: number, height: number }`
    -   画像パッチの位置と寸法。
-   **`delay`**: `number`
    -   フレームを表示する時間（ミリ秒単位）。
-   **`disposalType`**: `number`
    -   ディスポーザル（消去）メソッド（1-3）。次のフレームをレンダリングする前にキャンバスをどのように処理するかを示します。
-   **`colorTable`**: `[r, g, b][]`
    -   このフレームで使用されるカラーテーブル（ローカルまたはグローバル）。
-   **`transparentIndex`**: `number`
    -   透過として扱われるカラーテーブルのインデックス。
-   **`patch`**: `Uint8ClampedArray` (オプション)
    -   `[R, G, B, A, ...]` 形式のキャンバス描画用ピクセル配列。`buildImagePatches` が `true` の場合のみ存在します。

## ライセンス

MIT License — [LICENSE](LICENSE) を参照してください。
