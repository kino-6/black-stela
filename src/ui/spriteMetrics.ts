// Where the creature actually IS inside its image file.
//
// Enemy art arrives with arbitrary padding: the subject may sit centred with empty space
// under it, or fill the frame, and each file differs. The renderer used to compensate with
// one hand-tuned anchor constant (`center.y = 0.38`) applied to every sprite — so most
// creatures floated above the floor and every creature drew the same size.
//
// Instead, measure the silhouette: scan the alpha channel for the subject's bounding box.
// The renderer then plants the subject's real feet on the floor and scales its real height
// to the creature's world size. Framing inside the file stops mattering, which also means
// today's art and the reframed art both work without a renderer change.
export interface SpriteMetrics {
  /** Subject's lowest opaque pixel, as a fraction of image height measured from the BOTTOM. */
  bottomFrac: number;
  /** Subject's height, as a fraction of image height. */
  heightFrac: number;
  /** Subject's width, as a fraction of image width — how much room it needs beside its
   *  neighbours when a pack lines up. */
  widthFrac: number;
  /** Subject's horizontal centre, as a fraction of image width from the LEFT. */
  centerXFrac: number;
  /** Image aspect (width / height) — the sprite plane must keep it or the art skews. */
  imageAspect: number;
}

// A fully-opaque image (a JPG, or a PNG whose background was never keyed out) has no
// silhouette to find; treat it as "the subject is the whole frame" rather than reporting
// a bogus box.
const FULL_FRAME: SpriteMetrics = { bottomFrac: 0, heightFrac: 1, widthFrac: 1, centerXFrac: 0.5, imageAspect: 1 };

const ALPHA_THRESHOLD = 24; // ignore near-transparent halo pixels from the chroma-key
const cache = new Map<string, SpriteMetrics>();

/** Cached metrics, or undefined if this url has not been measured yet. */
export function getSpriteMetrics(url: string): SpriteMetrics | undefined {
  return cache.get(url);
}

/** Measure (once) and cache. Safe to call repeatedly; returns the cached value after the first. */
export function measureSpriteMetrics(url: string, image: HTMLImageElement | ImageBitmap): SpriteMetrics {
  const hit = cache.get(url);
  if (hit) {
    return hit;
  }
  const metrics = measure(image);
  cache.set(url, metrics);
  return metrics;
}

function measure(image: HTMLImageElement | ImageBitmap): SpriteMetrics {
  const width = "naturalWidth" in image ? image.naturalWidth : image.width;
  const height = "naturalHeight" in image ? image.naturalHeight : image.height;
  if (!width || !height) {
    return FULL_FRAME;
  }
  const aspect = width / height;

  let pixels: Uint8ClampedArray;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      return { ...FULL_FRAME, imageAspect: aspect };
    }
    ctx.drawImage(image as CanvasImageSource, 0, 0);
    pixels = ctx.getImageData(0, 0, width, height).data;
  } catch {
    // Tainted canvas (cross-origin art) — fall back rather than throw mid-render.
    return { ...FULL_FRAME, imageAspect: aspect };
  }
  return measureFromPixels(pixels, width, height);
}

/** The silhouette scan itself: pure, so it can be tested without a DOM or a GPU. */
export function measureFromPixels(pixels: Uint8ClampedArray, width: number, height: number): SpriteMetrics {
  const aspect = width / height;
  let top = -1;
  let bottom = -1;
  let left = width;
  let right = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (pixels[(y * width + x) * 4 + 3] < ALPHA_THRESHOLD) {
        continue;
      }
      if (top < 0) {
        top = y;
      }
      bottom = y;
      if (x < left) {
        left = x;
      }
      if (x > right) {
        right = x;
      }
    }
  }
  if (top < 0) {
    return { ...FULL_FRAME, imageAspect: aspect }; // fully transparent — nothing to measure
  }

  return {
    // Image y grows downward; the renderer wants a fraction measured up from the bottom.
    bottomFrac: (height - 1 - bottom) / height,
    heightFrac: (bottom - top + 1) / height,
    widthFrac: (right - left + 1) / width,
    centerXFrac: (left + right + 1) / 2 / width,
    imageAspect: aspect
  };
}

/** Test seam: drop cached measurements. */
export function resetSpriteMetrics() {
  cache.clear();
}
