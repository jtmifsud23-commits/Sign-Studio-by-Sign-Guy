const FLOATING_SUPPORT_CLUSTER_ORIGINAL = -7777;
const DEFAULT_FLOATING_SUPPORT_COLOUR = '#fdfdfd';

self.onmessage = async (event) => {
  const message = event.data || {};
  if (message.type !== 'processPlaqueRaster') return;
  try {
    postProgress(message.id, 60, 'Preparing layers');
    const processed = processPlaqueRasterArtwork(message);
    if (!message.config?.includeDebugPayload) stripPlaqueDeferredDebugData(processed);
    postProgress(message.id, 84, 'Finalizing plaque vectors');
    const artworkBitmap = processed.artworkCanvas.transferToImageBitmap();
    processed.artworkCanvas = null;
    processed.artworkUrl = '';
    const transfer = collectProcessedTransferables(processed);
    transfer.push(artworkBitmap);
    self.postMessage({
      id: message.id,
      type: 'result',
      ok: true,
      processed,
      artworkBitmap,
    }, transfer);
  } catch (error) {
    self.postMessage({
      id: message.id,
      type: 'result',
      ok: false,
      error: error?.message || String(error),
    });
  } finally {
    message.bitmap?.close?.();
  }
};

function stripPlaqueDeferredDebugData(processed) {
  (processed?.colours || []).forEach((region) => {
    if (!region) return;
    delete region.removedMask;
    delete region.removedPixels;
  });
  return processed;
}

function postProgress(id, percent, label) {
  self.postMessage({ id, type: 'progress', percent, label });
}

function processPlaqueRasterArtwork(message) {
  const { bitmap, imageWidth, imageHeight, artworkType, palette, crop, options, config } = message;
  if (!bitmap) throw new Error('No plaque image bitmap was provided.');
  if (config?.fixFloatingRegions) throw new Error('Floating region bridge processing is not available in the worker.');
  const safeCrop = normalizeCrop(crop);
  const srcW = Math.max(1, Math.round(imageWidth * safeCrop.w));
  const srcH = Math.max(1, Math.round(imageHeight * safeCrop.h));
  const maxSide = Number(options?.maxSide) || 1200;
  const scale = Math.min(maxSide / srcW, maxSide / srcH, 1);
  let width = Math.max(12, Math.round(srcW * scale));
  let height = Math.max(12, Math.round(srcH * scale));
  let canvas = new OffscreenCanvas(width, height);
  let ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, width, height);
  drawBitmapIntoExpandedCrop(ctx, bitmap, imageWidth, imageHeight, safeCrop, scale);
  let img = ctx.getImageData(0, 0, width, height);
  let data = img.data;
  if (config?.removeBg) {
    removeConnectedBackgroundFromImageData(data, width, height, config);
    ctx.putImageData(img, 0, 0);
  }
  ({ canvas, ctx, img, data, width, height } = tightenProcessedCanvasToVisibleArtwork(canvas, ctx, img, width, height));
  ({ canvas, ctx, img, data, width, height } = addTransparentCanvasPadding(canvas, ctx, width, height));
  postProgress(message.id, 66, 'Detecting colours');

  const paletteClusters = Array.isArray(palette) && palette.length
    ? palette.map((rgb, idx) => ({ original: idx, rgb: rgb.map(Number), count: 0 }))
    : null;
  let clusters = paletteClusters || [];
  const clusterTolerance = getColourClusterTolerance(config);
  const alphaMask = new Uint8Array(width * height);
  const alphaValues = new Uint8Array(width * height);
  const regionIndex = new Int16Array(width * height).fill(-1);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const offset = index * 4;
      const a = data[offset + 3];
      if (a < 28) {
        data[offset + 3] = 0;
        continue;
      }
      let idx;
      if (a < 74) {
        idx = -1;
      } else {
        const normalizedRgb = normalizeVectorRgb([data[offset], data[offset + 1], data[offset + 2]]);
        if (paletteClusters) {
          const paletteCluster = paletteClusters[nearestCluster(paletteClusters, normalizedRgb, { excludeSupport: true })];
          idx = paletteCluster.original;
          paletteCluster.count += a / 255;
        } else {
          idx = findOrCreateCluster(clusters, normalizedRgb, a, clusterTolerance);
        }
      }
      alphaMask[index] = 1;
      alphaValues[index] = a;
      regionIndex[index] = idx;
    }
  }
  ctx.putImageData(img, 0, 0);

  let clusterMergeAliases = new Map();
  clusters = clusters.filter((cluster) => cluster.count > 1);
  ({ clusters, aliases: clusterMergeAliases } = mergeSimilarColourClusters(clusters, clusterTolerance));
  for (let i = 0; i < regionIndex.length; i += 1) {
    if (regionIndex[i] >= 0 && clusterMergeAliases.has(regionIndex[i])) {
      regionIndex[i] = clusterMergeAliases.get(regionIndex[i]);
    }
  }
  clusters.sort((a, b) => b.count - a.count);
  const sourceClusters = clusters;
  const stableClusters = selectStableColourClusters(sourceClusters, regionIndex, alphaMask, alphaValues, width, height);
  const activeClusters = rankActiveColourClusters(sourceClusters, stableClusters);
  const floatingSupportCluster = sourceClusters.find((cluster) => cluster.original === FLOATING_SUPPORT_CLUSTER_ORIGINAL);
  const sourceByOriginal = new Map(sourceClusters.map((cluster) => [cluster.original, cluster]));
  const printableClusters = sourceClusters.filter((cluster) => cluster.original !== FLOATING_SUPPORT_CLUSTER_ORIGINAL);
  const printableWeight = printableClusters.reduce((sum, cluster) => sum + cluster.count, 0);
  const meaningfulColourCount = printableClusters.filter((cluster) => (
    cluster.count >= Math.max(12, printableWeight * 0.006)
  )).length;
  const naturalColourCount = Math.min(Math.max(stableClusters.length, meaningfulColourCount, printableClusters.length ? 1 : 0), 8);
  const requestedColourCount = clamp(Number(config?.targetColorCount) || 8, 1, 8);
  const plaqueTraceQuality = normalizePlaqueTraceQuality(config?.traceQuality);
  const plaqueRasterAutoPalette = !config?.frontColoursCustomized;
  const plaqueAutoColourLimit = plaqueRasterAutoPalette
    ? getPlaqueAutoPaletteLimit(activeClusters.filter((cluster) => cluster.original !== FLOATING_SUPPORT_CLUSTER_ORIGINAL), printableWeight)
    : null;
  const colourLimit = config?.frontColoursCustomized ? requestedColourCount : (plaqueAutoColourLimit || naturalColourCount);
  const main = activeClusters
    .filter((cluster) => cluster.original !== FLOATING_SUPPORT_CLUSTER_ORIGINAL)
    .slice(0, Math.max(0, colourLimit - (floatingSupportCluster ? 1 : 0)));
  if (floatingSupportCluster) main.push(floatingSupportCluster);
  const remap = new Map(main.map((cluster, idx) => [cluster.original, idx]));
  for (let i = 0; i < regionIndex.length; i += 1) {
    if (!alphaMask[i] || !main.length) continue;
    if (regionIndex[i] < 0) {
      const offset = i * 4;
      regionIndex[i] = nearestCluster(main, [data[offset], data[offset + 1], data[offset + 2]]);
      continue;
    }
    const mapped = remap.get(regionIndex[i]);
    regionIndex[i] = mapped ?? nearestCluster(main, sourceByOriginal.get(regionIndex[i])?.rgb);
  }

  postProgress(message.id, 72, 'Cleaning colour map');
  assignPlaqueRasterPixelsToFinalColours(regionIndex, alphaMask, alphaValues, data, main, width, height, config);
  refinePlaqueRasterPaletteFromAssignedPixels(regionIndex, alphaMask, alphaValues, data, main);
  if (plaqueTraceQuality !== 'raw') {
    cleanupPlaqueExactAntiAliasRegions(regionIndex, alphaMask, alphaValues, data, main, width, height);
    cleanPlaqueLabelledColourMap(regionIndex, alphaMask, alphaValues, data, main, width, height);
    refinePlaqueRasterPaletteFromAssignedPixels(regionIndex, alphaMask, alphaValues, data, main);
  }

  main.forEach((cluster, idx) => {
    cluster.id = idx;
    cluster.hex = rgbToHex(cluster.rgb);
    cluster.mask = new Uint8Array(width * height);
  });
  for (let i = 0; i < regionIndex.length; i += 1) {
    if (alphaMask[i] && regionIndex[i] >= 0) main[regionIndex[i]].mask[i] = 1;
  }
  if (plaqueTraceQuality === 'smooth') {
    cleanPlaqueRasterRegionMasks(main, regionIndex, alphaMask, width, height, {
      includeRemoved: Boolean(config?.includeDebugPayload),
    });
  }

  postProgress(message.id, 78, 'Tracing plaque layers');
  const plaqueLabelledMap = buildPlaqueExactLabelledMap(main, regionIndex, alphaMask, alphaValues, width, height);
  const silhouette = buildSilhouette(alphaMask, width, height);
  const minIslandPixels = Math.max(10, Math.round((width * height) * 0.00045));
  const regionPaths = main.map((cluster) => ({
    ...cluster,
    path: maskToSvgPath(cluster.mask, width, height, 4),
    components: countComponents(cluster.mask, width, height, minIslandPixels),
  }));
  const islands = regionPaths.reduce((sum, region) => sum + Math.max(0, region.components - 1), 0);
  const opaqueCount = alphaMask.reduce((sum, value) => sum + value, 0);
  const tinyShapes = regionPaths.filter((region) => region.count / Math.max(opaqueCount, 1) < 0.012).length;

  return {
    width,
    height,
    aspect: width / height,
    artworkType,
    artworkUrl: '',
    artworkCanvas: canvas,
    naturalColourCount,
    alphaMask,
    alphaValues,
    regionIndex,
    colours: regionPaths,
    plaqueLabelledMap,
    silhouette,
    warnings: buildWarnings({ artworkType, clusters: sourceClusters, main, islands, tinyShapes, opaqueCount, width, height }).concat(
      plaqueLabelledMap?.warnings || [],
    ),
  };
}

function collectProcessedTransferables(processed) {
  const transfer = [];
  const seen = new Set();
  const add = (value) => {
    if (!(value?.buffer instanceof ArrayBuffer) || seen.has(value.buffer)) return;
    seen.add(value.buffer);
    transfer.push(value.buffer);
  };
  add(processed.alphaMask);
  add(processed.alphaValues);
  add(processed.regionIndex);
  (processed.colours || []).forEach((region) => {
    add(region.mask);
    add(region.removedMask);
  });
  if (processed.plaqueLabelledMap) {
    add(processed.plaqueLabelledMap.regionIndex);
    add(processed.plaqueLabelledMap.alphaMask);
    add(processed.plaqueLabelledMap.alphaValues);
    (processed.plaqueLabelledMap.regions || []).forEach((region) => add(region.mask));
  }
  return transfer;
}

function normalizeCrop(crop = {}) {
  return {
    x: Number(crop.x) || 0,
    y: Number(crop.y) || 0,
    w: Math.max(0.001, Number(crop.w) || 1),
    h: Math.max(0.001, Number(crop.h) || 1),
  };
}

function drawBitmapIntoExpandedCrop(ctx, bitmap, imageWidth, imageHeight, crop, scale) {
  const srcX = imageWidth * crop.x;
  const srcY = imageHeight * crop.y;
  const srcW = imageWidth * crop.w;
  const srcH = imageHeight * crop.h;
  const visibleX = clamp(srcX, 0, imageWidth);
  const visibleY = clamp(srcY, 0, imageHeight);
  const visibleRight = clamp(srcX + srcW, 0, imageWidth);
  const visibleBottom = clamp(srcY + srcH, 0, imageHeight);
  const visibleW = Math.max(0, visibleRight - visibleX);
  const visibleH = Math.max(0, visibleBottom - visibleY);
  if (!visibleW || !visibleH) return;
  ctx.drawImage(
    bitmap,
    visibleX,
    visibleY,
    visibleW,
    visibleH,
    (visibleX - srcX) * scale,
    (visibleY - srcY) * scale,
    visibleW * scale,
    visibleH * scale,
  );
}

function tightenProcessedCanvasToVisibleArtwork(canvas, ctx, img, width, height) {
  const bounds = getImageDataAlphaBounds(img.data, width, height, 28);
  if (!bounds) return { canvas, ctx, img, data: img.data, width, height };
  const pad = Math.max(18, Math.round(Math.max(bounds.w, bounds.h) * 0.075));
  const x = Math.max(0, bounds.x - pad);
  const y = Math.max(0, bounds.y - pad);
  const right = Math.min(width, bounds.x + bounds.w + pad);
  const bottom = Math.min(height, bounds.y + bounds.h + pad);
  const croppedWidth = Math.max(1, right - x);
  const croppedHeight = Math.max(1, bottom - y);
  if (croppedWidth === width && croppedHeight === height) {
    return { canvas, ctx, img, data: img.data, width, height };
  }
  const nextCanvas = new OffscreenCanvas(croppedWidth, croppedHeight);
  const nextCtx = nextCanvas.getContext('2d', { willReadFrequently: true });
  nextCtx.clearRect(0, 0, croppedWidth, croppedHeight);
  nextCtx.drawImage(canvas, x, y, croppedWidth, croppedHeight, 0, 0, croppedWidth, croppedHeight);
  const nextImg = nextCtx.getImageData(0, 0, croppedWidth, croppedHeight);
  return { canvas: nextCanvas, ctx: nextCtx, img: nextImg, data: nextImg.data, width: croppedWidth, height: croppedHeight };
}

function addTransparentCanvasPadding(canvas, ctx, width, height) {
  const pad = Math.max(20, Math.round(Math.max(width, height) * 0.065));
  const nextWidth = width + pad * 2;
  const nextHeight = height + pad * 2;
  const nextCanvas = new OffscreenCanvas(nextWidth, nextHeight);
  const nextCtx = nextCanvas.getContext('2d', { willReadFrequently: true });
  nextCtx.clearRect(0, 0, nextWidth, nextHeight);
  nextCtx.drawImage(canvas, pad, pad);
  const nextImg = nextCtx.getImageData(0, 0, nextWidth, nextHeight);
  return { canvas: nextCanvas, ctx: nextCtx, img: nextImg, data: nextImg.data, width: nextWidth, height: nextHeight };
}

function getImageDataAlphaBounds(data, width, height, alphaThreshold = 1) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] < alphaThreshold) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < minX || maxY < minY) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function removeConnectedBackgroundFromImageData(data, width, height, config) {
  const bg = collectBackgroundSeedColours(data, width, height);
  const mask = buildConnectedBackgroundMask(data, width, height, bg, config?.tolerance || 34);
  for (let i = 0; i < mask.length; i += 1) {
    if (!mask[i]) continue;
    data[i * 4 + 3] = 0;
  }
  return mask;
}

function collectBackgroundSeedColours(data, width, height) {
  const seeds = [];
  const sample = Math.max(3, Math.round(Math.min(width, height) * 0.018));
  const corners = [
    [0, 0, sample, sample],
    [Math.max(0, width - sample), 0, width, sample],
    [0, Math.max(0, height - sample), sample, height],
    [Math.max(0, width - sample), Math.max(0, height - sample), width, height],
  ];
  corners.forEach(([x0, y0, x1, y1]) => {
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) {
        const offset = (y * width + x) * 4;
        if (data[offset + 3] < 28) continue;
        const rgb = [data[offset], data[offset + 1], data[offset + 2]];
        const existing = seeds.find((seed) => colourDistance(seed.rgb, rgb) <= 22);
        if (existing) {
          existing.count += 1;
          existing.rgb = existing.rgb.map((value, index) => value + (rgb[index] - value) / existing.count);
        } else {
          seeds.push({ rgb: rgb.map(Number), count: 1 });
        }
      }
    }
  });
  return seeds.length
    ? seeds.sort((a, b) => b.count - a.count).slice(0, 4).map((seed) => seed.rgb)
    : [averageCornerColour(data, width, height)];
}

function averageCornerColour(data, width, height) {
  const samples = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]];
  const sum = [0, 0, 0];
  let count = 0;
  samples.forEach(([x, y]) => {
    const i = (y * width + x) * 4;
    if (data[i + 3] > 20) {
      sum[0] += data[i];
      sum[1] += data[i + 1];
      sum[2] += data[i + 2];
      count += 1;
    }
  });
  return count ? sum.map((value) => value / count) : [255, 255, 255];
}

function buildConnectedBackgroundMask(data, width, height, bg, tolerance) {
  const threshold = Math.max(34, tolerance * 0.82);
  const backgrounds = Array.isArray(bg?.[0]) ? bg : [bg];
  const mask = new Uint8Array(width * height);
  const queue = [];
  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const index = y * width + x;
    if (mask[index]) return;
    const o = index * 4;
    const alpha = data[o + 3];
    const rgb = [data[o], data[o + 1], data[o + 2]];
    const isTransparent = alpha < 28;
    const matchedBackground = backgrounds.find((seed) => colourDistance(rgb, seed) <= threshold);
    if (isTransparent || (matchedBackground && !hasNearbyArtworkDetail(data, width, height, x, y, backgrounds, threshold))) {
      mask[index] = 1;
      queue.push(index);
    }
  };
  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }
  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head];
    const x = current % width;
    const y = Math.floor(current / width);
    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }
  return mask;
}

function hasNearbyArtworkDetail(data, width, height, x, y, bg, threshold) {
  const backgrounds = Array.isArray(bg?.[0]) ? bg : [bg];
  const radius = 3;
  const detailThreshold = Math.max(48, threshold * 1.35);
  for (let oy = -radius; oy <= radius; oy += 1) {
    for (let ox = -radius; ox <= radius; ox += 1) {
      if (!ox && !oy) continue;
      const nx = x + ox;
      const ny = y + oy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const o = (ny * width + nx) * 4;
      if (data[o + 3] < 40) continue;
      const rgb = [data[o], data[o + 1], data[o + 2]];
      if (!backgrounds.some((seed) => colourDistance(rgb, seed) <= detailThreshold)) return true;
    }
  }
  return false;
}

function getColourClusterTolerance(config) {
  const requested = clamp(Number(config?.targetColorCount) || 8, 1, 8);
  const tolerance = Number(config?.tolerance) || 34;
  if (requested >= 4) return Math.min(Math.max(tolerance, 34), 42);
  if (requested === 3) return Math.min(Math.max(tolerance, 38), 48);
  return Math.min(Math.max(tolerance, 42), 56);
}

function normalizeVectorRgb(rgb) {
  const next = rgb.map((value) => clamp(Math.round(Number(value) || 0), 0, 255));
  const luma = colourLuma(next);
  const chroma = colourChroma(next);
  if (luma <= 38 && chroma <= 28) return [0, 0, 0];
  if (luma <= 58 && chroma <= 14) return [0, 0, 0];
  if (luma >= 236 && chroma <= 26) return [255, 255, 255];
  if (luma >= 218 && chroma <= 10) return [255, 255, 255];
  return next;
}

function findOrCreateCluster(clusters, rgb, alpha, tolerance) {
  let best = -1;
  let bestDistance = Infinity;
  clusters.forEach((cluster, idx) => {
    if (cluster.original === FLOATING_SUPPORT_CLUSTER_ORIGINAL) return;
    const distance = colourDistance(rgb, cluster.rgb);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = idx;
    }
  });
  if (best >= 0 && shouldMergeColourClusters(clusters[best], { rgb }, tolerance)) {
    const cluster = clusters[best];
    const nextCount = cluster.count + alpha / 255;
    cluster.rgb = cluster.rgb.map((value, i) => (value * cluster.count + rgb[i]) / nextCount);
    cluster.count = nextCount;
    return cluster.original;
  }
  const original = clusters.length;
  clusters.push({ original, rgb: rgb.map(Number), count: alpha / 255 });
  return original;
}

function mergeSimilarColourClusters(clusters, tolerance) {
  const support = clusters.find((cluster) => cluster.original === FLOATING_SUPPORT_CLUSTER_ORIGINAL);
  const normal = clusters
    .filter((cluster) => cluster.original !== FLOATING_SUPPORT_CLUSTER_ORIGINAL)
    .sort((a, b) => b.count - a.count)
    .map((cluster) => ({ ...cluster, rgb: [...cluster.rgb], mergedOriginals: [cluster.original] }));
  const aliases = new Map();
  const merged = [];
  normal.forEach((cluster) => {
    const target = merged.find((item) => shouldMergeColourClusters(item, cluster, tolerance));
    if (!target) {
      merged.push(cluster);
      aliases.set(cluster.original, cluster.original);
      return;
    }
    const total = target.count + cluster.count;
    target.rgb = target.rgb.map((value, idx) => (value * target.count + cluster.rgb[idx] * cluster.count) / total);
    target.count = total;
    target.mergedOriginals.push(cluster.original);
    aliases.set(cluster.original, target.original);
  });
  merged.forEach((cluster) => {
    cluster.mergedOriginals.forEach((original) => aliases.set(original, cluster.original));
    delete cluster.mergedOriginals;
  });
  if (support) {
    merged.push(support);
    aliases.set(support.original, support.original);
  }
  return { clusters: merged, aliases };
}

function shouldMergeColourClusters(a, b, tolerance) {
  if (!a || !b) return false;
  const distance = colourDistance(a.rgb, b.rgb);
  const lumaA = colourLuma(a.rgb);
  const lumaB = colourLuma(b.rgb);
  const chromaA = colourChroma(a.rgb);
  const chromaB = colourChroma(b.rgb);
  if (lumaA <= 58 && lumaB <= 58 && chromaA <= 30 && chromaB <= 30) return true;
  if (lumaA >= 218 && lumaB >= 218 && chromaA <= 30 && chromaB <= 30) return true;
  if (distance > tolerance) return false;
  const hueA = colourHue(a.rgb);
  const hueB = colourHue(b.rgb);
  const lumaGap = Math.abs(lumaA - lumaB);
  const chromaGap = Math.abs(chromaA - chromaB);
  const hueGap = Math.min(Math.abs(hueA - hueB), 360 - Math.abs(hueA - hueB));
  if (lumaGap >= 18 && Math.max(chromaA, chromaB) >= 24) return false;
  if (chromaGap >= 28 && distance >= tolerance * 0.58) return false;
  if (hueGap >= 10 && Math.max(chromaA, chromaB) >= 34 && distance >= tolerance * 0.5) return false;
  return true;
}

function nearestCluster(clusters, rgb = [0, 0, 0], options = {}) {
  let best = -1;
  let distance = Infinity;
  clusters.forEach((cluster, idx) => {
    if (options.excludeSupport && cluster.original === FLOATING_SUPPORT_CLUSTER_ORIGINAL) return;
    const next = colourDistance(rgb, cluster.rgb);
    if (next < distance) {
      distance = next;
      best = idx;
    }
  });
  return best >= 0 ? best : 0;
}

function selectStableColourClusters(clusters, regionIndex, alphaMask, alphaValues, width, height) {
  const stats = new Map(clusters.map((cluster) => [cluster.original, { interior: 0, count: cluster.count }]));
  let opaqueCount = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      if (!alphaMask[index]) continue;
      opaqueCount += 1;
      if (alphaValues[index] < 230) continue;
      const region = regionIndex[index];
      const sameRegion =
        regionIndex[index - 1] === region
        && regionIndex[index + 1] === region
        && regionIndex[index - width] === region
        && regionIndex[index + width] === region;
      const stat = stats.get(region);
      if (sameRegion && stat) stat.interior += 1;
    }
  }
  if (!opaqueCount) return clusters;
  const minInterior = Math.max(10, Math.round(opaqueCount * 0.0012));
  const minShare = Math.max(14, opaqueCount * 0.006);
  const stable = clusters.filter((cluster) => {
    const stat = stats.get(cluster.original);
    const luma = colourLuma(cluster.rgb);
    const chroma = colourChroma(cluster.rgb);
    const isKeyNeutral = (luma <= 48 && chroma <= 32) || (luma >= 224 && chroma <= 34);
    const interiorRatio = stat ? stat.interior / Math.max(cluster.count, 1) : 0;
    return stat
      && (cluster.count >= minShare || (isKeyNeutral && cluster.count >= opaqueCount * 0.003))
      && ((stat.interior >= minInterior && interiorRatio >= 0.12) || cluster.count >= opaqueCount * 0.035);
  });
  return stable.length ? stable : clusters;
}

function rankActiveColourClusters(sourceClusters, stableClusters) {
  const ranked = [];
  const seen = new Set();
  stableClusters.forEach((cluster) => {
    ranked.push(cluster);
    seen.add(cluster.original);
  });
  sourceClusters.forEach((cluster) => {
    if (seen.has(cluster.original)) return;
    ranked.push(cluster);
    seen.add(cluster.original);
  });
  return ranked.length ? ranked : sourceClusters;
}

function getPlaqueAutoPaletteLimit(clusters, totalWeight = 0) {
  const usable = (clusters || [])
    .filter((cluster) => cluster?.count > Math.max(4, totalWeight * 0.0015))
    .sort((a, b) => b.count - a.count);
  if (!usable.length) return 1;
  const keyColours = [];
  usable.forEach((cluster) => {
    const rgb = Array.isArray(cluster.rgb) ? cluster.rgb : [0, 0, 0];
    const share = cluster.count / Math.max(totalWeight, 1);
    const luma = colourLuma(rgb);
    const chroma = colourChroma(rgb);
    const isCriticalNeutral = (luma <= 46 && chroma <= 34) || (luma >= 228 && chroma <= 36);
    const isStrongLogoColour = chroma >= 68;
    const nearest = keyColours.reduce((best, item) => Math.min(best, colourDistance(rgb, item.rgb)), Infinity);
    const distinctEnough = nearest > (isCriticalNeutral ? 42 : 58);
    const shareThreshold = isStrongLogoColour ? 0.004 : 0.01;
    if ((share >= shareThreshold || isCriticalNeutral) && distinctEnough) keyColours.push(cluster);
  });
  return clamp(keyColours.length || Math.min(usable.length, 8), 1, 8);
}

function assignPlaqueRasterPixelsToFinalColours(regionIndex, alphaMask, alphaValues, data, main, width, height, config) {
  if (!regionIndex || !alphaMask || !alphaValues || !data || !main?.length) return;
  const zeroGap = config?.zeroGapColourLayers !== false;
  for (let i = 0; i < regionIndex.length; i += 1) {
    if (!alphaMask[i]) continue;
    const offset = i * 4;
    const match = nearestPlaqueColourMatch(main, [data[offset], data[offset + 1], data[offset + 2]]);
    if (alphaValues[i] < 170) {
      const touching = getNearestTouchingPlaqueRegion(regionIndex, alphaMask, i, width, height, match.index);
      regionIndex[i] = zeroGap ? (touching >= 0 ? touching : match.index) : -1;
      continue;
    }
    if (match.distance > 46 && match.secondDistance - match.distance < 18) {
      const touching = getNearestTouchingPlaqueRegion(regionIndex, alphaMask, i, width, height, match.index);
      regionIndex[i] = zeroGap ? (touching >= 0 ? touching : match.index) : touching;
      continue;
    }
    regionIndex[i] = match.index;
  }
}

function getNearestTouchingPlaqueRegion(regionIndex, alphaMask, index, width, height, preferred) {
  const x = index % width;
  const y = Math.floor(index / width);
  const counts = new Map();
  for (let oy = -1; oy <= 1; oy += 1) {
    for (let ox = -1; ox <= 1; ox += 1) {
      if (!ox && !oy) continue;
      const nx = x + ox;
      const ny = y + oy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const nextIndex = ny * width + nx;
      if (!alphaMask[nextIndex]) continue;
      const region = regionIndex[nextIndex];
      if (region < 0) continue;
      counts.set(region, (counts.get(region) || 0) + 1);
    }
  }
  if ((counts.get(preferred) || 0) >= 2) return preferred;
  let bestRegion = -1;
  let bestCount = 0;
  counts.forEach((count, region) => {
    if (count > bestCount) {
      bestRegion = region;
      bestCount = count;
    }
  });
  return bestCount >= 3 ? bestRegion : -1;
}

function nearestPlaqueColourMatch(clusters, rgb = [0, 0, 0]) {
  let index = 0;
  let distance = Infinity;
  let secondDistance = Infinity;
  clusters.forEach((cluster, idx) => {
    const next = colourDistance(rgb, cluster.rgb);
    if (next < distance) {
      secondDistance = distance;
      distance = next;
      index = idx;
    } else if (next < secondDistance) {
      secondDistance = next;
    }
  });
  return { index, distance, secondDistance };
}

function refinePlaqueRasterPaletteFromAssignedPixels(regionIndex, alphaMask, alphaValues, data, main) {
  if (!regionIndex || !alphaMask || !alphaValues || !data || !main?.length) return;
  const buckets = main.map(() => new Map());
  for (let i = 0; i < regionIndex.length; i += 1) {
    const region = regionIndex[i];
    if (!alphaMask[i] || region < 0 || region >= main.length || alphaValues[i] < 230) continue;
    const offset = i * 4;
    const key = `${data[offset] >> 3}:${data[offset + 1] >> 3}:${data[offset + 2] >> 3}`;
    const bucket = buckets[region].get(key) || { count: 0, rgb: [0, 0, 0] };
    bucket.count += 1;
    bucket.rgb[0] += data[offset];
    bucket.rgb[1] += data[offset + 1];
    bucket.rgb[2] += data[offset + 2];
    buckets[region].set(key, bucket);
  }
  buckets.forEach((bucketMap, index) => {
    let best = null;
    bucketMap.forEach((bucket) => {
      if (!best || bucket.count > best.count) best = bucket;
    });
    if (!best || best.count < 8) return;
    main[index].rgb = best.rgb.map((value) => value / best.count);
  });
}

function cleanupPlaqueExactAntiAliasRegions(regionIndex, alphaMask, alphaValues, data, main, width, height) {
  if (!regionIndex || !alphaMask || !alphaValues || !data || !main?.length || width < 2 || height < 2) return;
  const clusterInfo = main.map((cluster) => {
    const rgb = Array.isArray(cluster.rgb) ? cluster.rgb : hexToRgb(cluster.hex || '#ffffff');
    return { rgb, isYellow: rgb[0] > 180 && rgb[1] > 140 && rgb[2] < 90 };
  });
  const next = new Int16Array(regionIndex);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      if (!alphaMask[index]) continue;
      const current = regionIndex[index];
      if (current < 0 || !clusterInfo[current]) continue;
      const offset = index * 4;
      const rgb = [data[offset], data[offset + 1], data[offset + 2]];
      const currentDistance = colourDistance(rgb, clusterInfo[current].rgb);
      const counts = new Map();
      let same4 = 0;
      let different4 = 0;
      for (let oy = -1; oy <= 1; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          if (!ox && !oy) continue;
          const neighborIndex = (y + oy) * width + (x + ox);
          if (!alphaMask[neighborIndex]) continue;
          const neighbor = regionIndex[neighborIndex];
          if (neighbor < 0 || !clusterInfo[neighbor]) continue;
          counts.set(neighbor, (counts.get(neighbor) || 0) + 1);
          if (Math.abs(ox) + Math.abs(oy) === 1) {
            if (neighbor === current) same4 += 1;
            else different4 += 1;
          }
        }
      }
      let bestRegion = current;
      let bestCount = counts.get(current) || 0;
      counts.forEach((count, region) => {
        if (region === current) return;
        const distance = colourDistance(rgb, clusterInfo[region].rgb);
        if (count > bestCount || (count === bestCount && distance + 8 < currentDistance)) {
          bestRegion = region;
          bestCount = count;
        }
      });
      if (bestRegion === current || bestCount < 3) continue;
      const bestDistance = colourDistance(rgb, clusterInfo[bestRegion].rgb);
      const translucentEdge = alphaValues[index] < 246;
      const isolatedStripePixel = same4 <= 1 && different4 >= 2;
      const badPaletteFit = currentDistance > bestDistance + 16 && bestCount >= 3;
      const yellowBleed = clusterInfo[current].isYellow && !clusterInfo[bestRegion].isYellow && bestCount >= 4 && same4 <= 2;
      if (translucentEdge || isolatedStripePixel || badPaletteFit || yellowBleed) {
        next[index] = bestRegion;
      }
    }
  }
  for (let i = 0; i < regionIndex.length; i += 1) regionIndex[i] = next[i];
}

function cleanPlaqueLabelledColourMap(regionIndex, alphaMask, alphaValues, data, main, width, height) {
  if (!regionIndex || !alphaMask || !main?.length || width < 3 || height < 3) return;
  const regionInfo = getPlaqueRegionColourInfo(main);
  for (let pass = 0; pass < 2; pass += 1) {
    const next = new Int16Array(regionIndex);
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const index = y * width + x;
        if (!alphaMask[index]) continue;
        const current = regionIndex[index];
        if (current < 0) continue;
        const counts = new Map();
        let same4 = 0;
        let different4 = 0;
        const cardinals = [index - 1, index + 1, index - width, index + width];
        cardinals.forEach((neighborIndex) => {
          if (!alphaMask[neighborIndex]) return;
          const region = regionIndex[neighborIndex];
          if (region < 0) return;
          if (region === current) same4 += 1;
          else different4 += 1;
          counts.set(region, (counts.get(region) || 0) + 2);
        });
        [index - width - 1, index - width + 1, index + width - 1, index + width + 1].forEach((neighborIndex) => {
          if (!alphaMask[neighborIndex]) return;
          const region = regionIndex[neighborIndex];
          if (region >= 0) counts.set(region, (counts.get(region) || 0) + 1);
        });
        let bestRegion = current;
        let bestCount = counts.get(current) || 0;
        counts.forEach((count, region) => {
          if (region !== current && count > bestCount) {
            bestRegion = region;
            bestCount = count;
          }
        });
        if (bestRegion === current) continue;
        const alpha = alphaValues?.[index] ?? 255;
        const offset = index * 4;
        const rgb = data ? [data[offset], data[offset + 1], data[offset + 2]] : null;
        const currentDistance = rgb ? colourDistance(rgb, regionInfo[current]?.rgb || [0, 0, 0]) : 0;
        const bestDistance = rgb ? colourDistance(rgb, regionInfo[bestRegion]?.rgb || [0, 0, 0]) : 0;
        const currentIsWhite = Boolean(regionInfo[current]?.isWhite);
        const bestIsWhite = Boolean(regionInfo[bestRegion]?.isWhite);
        const currentIsYellow = Boolean(regionInfo[current]?.isYellow);
        const currentIsGrey = Boolean(regionInfo[current]?.isGrey);
        const bestIsGrey = Boolean(regionInfo[bestRegion]?.isGrey);
        const isolated = same4 === 0 && bestCount >= 3;
        const onePixelSliver = same4 <= 1 && different4 >= 2 && bestCount >= 5;
        const antiAliasBadFit = !currentIsWhite && alpha < 252 && bestDistance + 10 < currentDistance && bestCount >= 4;
        const whiteEdgeRecovery = bestIsWhite && !currentIsWhite && alpha >= 185 && bestCount >= 4 && same4 <= 2;
        const yellowLetterBleed = currentIsYellow && bestIsWhite && bestCount >= 3 && same4 <= 2;
        const greyEdgeSpeck = currentIsGrey && !bestIsGrey && same4 <= 1 && bestCount >= 5 && (alpha < 252 || bestDistance + 12 < currentDistance);
        if (isolated || onePixelSliver || antiAliasBadFit || whiteEdgeRecovery || yellowLetterBleed || greyEdgeSpeck || (pass > 0 && same4 <= 1 && bestCount >= 6)) {
          next[index] = bestRegion;
        }
      }
    }
    for (let i = 0; i < regionIndex.length; i += 1) regionIndex[i] = next[i];
  }
  reassignPlaqueGreyEdgePixels(regionIndex, alphaMask, width, height, regionInfo);
  reassignTinyPlaqueLabelComponents(regionIndex, alphaMask, width, height, main, regionInfo);
  reassignPlaqueGreyEdgePixels(regionIndex, alphaMask, width, height, regionInfo);
}

function getPlaqueRegionColourInfo(main) {
  return (main || []).map((cluster) => {
    const rgb = Array.isArray(cluster.rgb) ? cluster.rgb : hexToRgb(cluster.hex || '#ffffff');
    const luma = colourLuma(rgb);
    const chroma = colourChroma(rgb);
    return {
      rgb,
      luma,
      chroma,
      isWhite: luma >= 222 && chroma <= 38,
      isYellow: rgb[0] > 180 && rgb[1] > 140 && rgb[2] < 95,
      isGrey: luma >= 58 && luma <= 178 && chroma <= 48,
      isDark: luma <= 62 && chroma <= 48,
      isSkin: rgb[0] > 170 && rgb[1] > 120 && rgb[1] < 220 && rgb[2] > 80 && rgb[2] < 190,
    };
  });
}

function reassignTinyPlaqueLabelComponents(regionIndex, alphaMask, width, height, main, regionInfo = getPlaqueRegionColourInfo(main)) {
  if (!regionIndex || !alphaMask || !main?.length) return;
  const visited = new Uint8Array(regionIndex.length);
  const queue = [];
  const component = [];
  const opaquePixels = alphaMask.reduce((sum, value) => sum + value, 0);
  const tinyPixels = clamp(Math.round(opaquePixels * 0.000016), 6, 58);
  const speckPixels = clamp(Math.round(opaquePixels * 0.00007), 18, 180);
  const greySpeckPixels = clamp(Math.round(opaquePixels * 0.00042), 120, 1150);
  const narrowLimit = clamp(Math.round(Math.max(width, height) * 0.008), 4, 14);
  for (let start = 0; start < regionIndex.length; start += 1) {
    if (visited[start] || !alphaMask[start] || regionIndex[start] < 0) continue;
    const region = regionIndex[start];
    const neighborCounts = new Map();
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;
    queue.length = 0;
    component.length = 0;
    queue.push(start);
    visited[start] = 1;
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const index = queue[cursor];
      component.push(index);
      const x = index % width;
      const y = Math.floor(index / width);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      const neighbors = [x > 0 ? index - 1 : -1, x + 1 < width ? index + 1 : -1, y > 0 ? index - width : -1, y + 1 < height ? index + width : -1];
      neighbors.forEach((neighborIndex) => {
        if (neighborIndex < 0 || !alphaMask[neighborIndex]) return;
        const nextRegion = regionIndex[neighborIndex];
        if (nextRegion === region && !visited[neighborIndex]) {
          visited[neighborIndex] = 1;
          queue.push(neighborIndex);
        } else if (nextRegion >= 0 && nextRegion !== region) {
          neighborCounts.set(nextRegion, (neighborCounts.get(nextRegion) || 0) + 1);
        }
      });
    }
    if (!neighborCounts.size) continue;
    let replacement = -1;
    let bestCount = 0;
    let totalNeighborCount = 0;
    let bestNonGreyReplacement = -1;
    let bestNonGreyCount = 0;
    let whiteNeighborCount = 0;
    let skinNeighborCount = 0;
    let darkNeighborCount = 0;
    let yellowNeighborCount = 0;
    neighborCounts.forEach((count, nextRegion) => {
      totalNeighborCount += count;
      if (count > bestCount) {
        bestCount = count;
        replacement = nextRegion;
      }
      const nextInfo = regionInfo[nextRegion] || {};
      if (nextInfo.isWhite) whiteNeighborCount += count;
      if (nextInfo.isSkin) skinNeighborCount += count;
      if (nextInfo.isDark) darkNeighborCount += count;
      if (nextInfo.isYellow) yellowNeighborCount += count;
      if (!nextInfo.isGrey && count > bestNonGreyCount) {
        bestNonGreyCount = count;
        bestNonGreyReplacement = nextRegion;
      }
    });
    if (replacement < 0) continue;
    const info = regionInfo[region] || {};
    const replacementInfo = regionInfo[replacement] || {};
    const componentWidth = maxX - minX + 1;
    const componentHeight = maxY - minY + 1;
    const bboxArea = Math.max(1, componentWidth * componentHeight);
    const fillRatio = component.length / bboxArea;
    const dominantNeighborRatio = bestCount / Math.max(totalNeighborCount, 1);
    const dominantNonGreyRatio = bestNonGreyCount / Math.max(totalNeighborCount, 1);
    const whiteNeighborRatio = whiteNeighborCount / Math.max(totalNeighborCount, 1);
    const skinNeighborRatio = skinNeighborCount / Math.max(totalNeighborCount, 1);
    const darkNeighborRatio = darkNeighborCount / Math.max(totalNeighborCount, 1);
    const yellowNeighborRatio = yellowNeighborCount / Math.max(totalNeighborCount, 1);
    const isNarrow = Math.min(componentWidth, componentHeight) <= narrowLimit;
    const isSparse = fillRatio <= 0.42;
    const isLongRealTrimCandidate = info.isGrey
      && Math.max(componentWidth, componentHeight) >= Math.max(width, height) * 0.18
      && whiteNeighborRatio < 0.06
      && skinNeighborRatio < 0.08;
    const tinySurroundedSpeck = component.length <= tinyPixels && dominantNeighborRatio >= 0.5;
    const isolatedFloatingSpeck = component.length <= speckPixels && dominantNeighborRatio >= 0.62 && !info.isWhite;
    const greyFloatingSpeck = info.isGrey
      && !replacementInfo.isGrey
      && component.length <= greySpeckPixels
      && dominantNeighborRatio >= 0.46
      && (isNarrow || isSparse || bestCount >= component.length * 0.55);
    const greyTextOrSkinContamination = info.isGrey
      && bestNonGreyReplacement >= 0
      && component.length <= greySpeckPixels
      && dominantNonGreyRatio >= 0.34
      && (whiteNeighborRatio >= 0.08 || skinNeighborRatio >= 0.1 || (darkNeighborRatio >= 0.28 && yellowNeighborRatio < 0.18))
      && !isLongRealTrimCandidate;
    const misplacedYellowEdge = info.isYellow
      && !replacementInfo.isYellow
      && component.length <= speckPixels
      && dominantNeighborRatio >= 0.5
      && (isNarrow || isSparse);
    if (info.isWhite && component.length > tinyPixels) continue;
    if (greyTextOrSkinContamination) replacement = bestNonGreyReplacement;
    if (!tinySurroundedSpeck && !isolatedFloatingSpeck && !greyFloatingSpeck && !greyTextOrSkinContamination && !misplacedYellowEdge) continue;
    component.forEach((index) => {
      regionIndex[index] = replacement;
    });
  }
}

function reassignPlaqueGreyEdgePixels(regionIndex, alphaMask, width, height, regionInfo) {
  if (!regionIndex || !alphaMask || !regionInfo?.length || width < 5 || height < 5) return;
  const next = new Int16Array(regionIndex);
  for (let y = 2; y < height - 2; y += 1) {
    for (let x = 2; x < width - 2; x += 1) {
      const index = y * width + x;
      const current = regionIndex[index];
      if (!alphaMask[index] || current < 0 || !regionInfo[current]?.isGrey) continue;
      const counts = new Map();
      let sameGrey = 0;
      let whiteCount = 0;
      let skinCount = 0;
      let darkCount = 0;
      let yellowCount = 0;
      for (let oy = -2; oy <= 2; oy += 1) {
        for (let ox = -2; ox <= 2; ox += 1) {
          if (!ox && !oy) continue;
          const neighborIndex = (y + oy) * width + (x + ox);
          if (!alphaMask[neighborIndex]) continue;
          const region = regionIndex[neighborIndex];
          if (region < 0) continue;
          if (region === current) {
            sameGrey += 1;
            continue;
          }
          const weight = Math.abs(ox) + Math.abs(oy) <= 1 ? 2 : 1;
          counts.set(region, (counts.get(region) || 0) + weight);
          const info = regionInfo[region] || {};
          if (info.isWhite) whiteCount += weight;
          if (info.isSkin) skinCount += weight;
          if (info.isDark) darkCount += weight;
          if (info.isYellow) yellowCount += weight;
        }
      }
      let replacement = -1;
      let bestCount = 0;
      counts.forEach((count, region) => {
        if (regionInfo[region]?.isGrey) return;
        if (count > bestCount) {
          bestCount = count;
          replacement = region;
        }
      });
      if (replacement < 0) continue;
      const textEdgeContamination = whiteCount >= 5 && darkCount >= 4 && sameGrey <= 9 && bestCount >= 7;
      const skinEdgeContamination = skinCount >= 5 && darkCount >= 3 && sameGrey <= 9 && bestCount >= 7;
      const isolatedGreyInLogoColour = sameGrey <= 4 && bestCount >= 8 && (whiteCount + skinCount + darkCount + yellowCount >= 10);
      if (textEdgeContamination || skinEdgeContamination || isolatedGreyInLogoColour) next[index] = replacement;
    }
  }
  for (let i = 0; i < regionIndex.length; i += 1) regionIndex[i] = next[i];
}

function cleanPlaqueRasterRegionMasks(regions, regionIndex, alphaMask, width, height, options = {}) {
  if (!regions?.length || !regionIndex || !alphaMask || !width || !height) return;
  const totalPixels = width * height;
  regions.forEach((region, regionId) => {
    if (!region?.mask) return;
    const minPixels = Math.max(7, Math.round(totalPixels * (regionId === 0 ? 0.000018 : 0.000012)));
    const cleaned = filterPlaqueMaskComponents(region.mask, width, height, minPixels, {
      includeRemoved: Boolean(options.includeRemoved),
    });
    region.mask = cleaned.mask;
    if (options.includeRemoved) {
      region.removedMask = cleaned.removed;
      region.removedPixels = cleaned.removedPixels;
    } else {
      delete region.removedMask;
      delete region.removedPixels;
    }
  });
  for (let i = 0; i < regionIndex.length; i += 1) {
    if (!alphaMask[i]) continue;
    const region = regionIndex[i];
    if (region >= 0 && regions[region]?.mask?.[i]) continue;
    const replacement = getNearestPlaqueMaskRegion(regions, i, width, height);
    if (replacement >= 0) {
      regionIndex[i] = replacement;
      regions[replacement].mask[i] = 1;
    } else if (region >= 0 && regions[region]?.mask) {
      regions[region].mask[i] = 1;
    }
  }
}

function filterPlaqueMaskComponents(mask, width, height, minPixels, options = {}) {
  const output = new Uint8Array(mask.length);
  const removed = options.includeRemoved ? new Uint8Array(mask.length) : null;
  const visited = new Uint8Array(mask.length);
  const queue = [];
  let removedPixels = 0;
  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || visited[start]) continue;
    queue.length = 0;
    queue.push(start);
    visited[start] = 1;
    const component = [];
    for (let head = 0; head < queue.length; head += 1) {
      const current = queue[head];
      component.push(current);
      const x = current % width;
      const y = Math.floor(current / width);
      const neighbors = [x > 0 ? current - 1 : -1, x < width - 1 ? current + 1 : -1, y > 0 ? current - width : -1, y < height - 1 ? current + width : -1];
      neighbors.forEach((next) => {
        if (next < 0 || visited[next] || !mask[next]) return;
        visited[next] = 1;
        queue.push(next);
      });
    }
    const keep = component.length >= minPixels;
    component.forEach((index) => {
      if (keep) output[index] = 1;
      else if (removed) {
        removed[index] = 1;
        removedPixels += 1;
      }
    });
  }
  return { mask: output, removed, removedPixels };
}

function getNearestPlaqueMaskRegion(regions, index, width, height) {
  const x = index % width;
  const y = Math.floor(index / width);
  for (let radius = 1; radius <= 4; radius += 1) {
    const counts = new Map();
    for (let oy = -radius; oy <= radius; oy += 1) {
      for (let ox = -radius; ox <= radius; ox += 1) {
        if (Math.max(Math.abs(ox), Math.abs(oy)) !== radius) continue;
        const nx = x + ox;
        const ny = y + oy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const nextIndex = ny * width + nx;
        regions.forEach((region, regionId) => {
          if (region?.mask?.[nextIndex]) counts.set(regionId, (counts.get(regionId) || 0) + 1);
        });
      }
    }
    let best = -1;
    let bestCount = 0;
    counts.forEach((count, regionId) => {
      if (count > bestCount) {
        best = regionId;
        bestCount = count;
      }
    });
    if (best >= 0) return best;
  }
  return -1;
}

function buildPlaqueExactLabelledMap(regions, regionIndex, alphaMask, alphaValues, width, height) {
  if (!regions?.length || !regionIndex || !alphaMask || !width || !height) return null;
  const masks = regions.map(() => new Uint8Array(width * height));
  let opaquePixels = 0;
  let emptyOpaquePixels = 0;
  let sharedBoundaryEdges = 0;
  for (let index = 0; index < regionIndex.length; index += 1) {
    if (!alphaMask[index]) continue;
    opaquePixels += 1;
    const region = regionIndex[index];
    if (region >= 0 && masks[region]) masks[region][index] = 1;
    else emptyOpaquePixels += 1;
  }
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (!alphaMask[index]) continue;
      const region = regionIndex[index];
      if (x + 1 < width && alphaMask[index + 1] && regionIndex[index + 1] !== region) sharedBoundaryEdges += 1;
      if (y + 1 < height && alphaMask[index + width] && regionIndex[index + width] !== region) sharedBoundaryEdges += 1;
    }
  }
  const exactRegions = regions.map((region, index) => ({
    type: 'raster-exact',
    index,
    hex: region.hex,
    rgb: Array.isArray(region.rgb) ? [...region.rgb] : hexToRgb(region.hex || '#ffffff'),
    count: region.count,
    mask: masks[index],
    originalRegion: null,
  }));
  const warnings = [];
  if (emptyOpaquePixels > 0) {
    warnings.push({ level: 'error', text: `${emptyOpaquePixels} opaque pixels were not assigned to a plaque colour layer.` });
  }
  return {
    mode: 'exact-labelled-colour-map',
    width,
    height,
    regionIndex,
    alphaMask,
    alphaValues,
    regions: exactRegions,
    opaquePixels,
    emptyOpaquePixels,
    sharedBoundaryEdges,
    warnings,
  };
}

function buildSilhouette(mask, width, height) {
  let count = 0;
  for (let i = 0; i < mask.length; i += 1) if (mask[i]) count += 1;
  if (!count) return defaultSilhouette();
  const clean = keepPrintableMaskComponents(mask, width, height, Math.max(16, Math.round(count * 0.00018)));
  const traced = traceMaskOutline(clean, width, height);
  if (traced.length >= 12) {
    const averaged = smoothPolygon(traced, 1);
    const simplified = simplifyPolygon(averaged, Math.max(0.85, Math.max(width, height) / 1280));
    const polished = chaikinSmoothClosed(simplified, 2);
    return polished.map(([x, y]) => [clamp(x / width, 0, 1), clamp(y / height, 0, 1)]);
  }
  return buildEnvelopeSilhouette(clean, width, height);
}

function buildEnvelopeSilhouette(mask, width, height) {
  const rows = [];
  const pad = Math.max(2, Math.round(Math.max(width, height) / 460));
  for (let y = 0; y < height; y += 1) {
    let minX = width;
    let maxX = -1;
    for (let x = 0; x < width; x += 1) {
      if (!mask[y * width + x]) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
    }
    if (maxX >= 0) rows.push({ y, minX: Math.max(0, minX - pad), maxX: Math.min(width - 1, maxX + pad) });
  }
  if (rows.length < 3) return defaultSilhouette();
  const step = Math.max(1, Math.round(Math.max(width, height) / 520));
  const left = [];
  const right = [];
  rows.forEach((row, idx) => {
    if (idx % step && idx !== rows.length - 1) return;
    left.push([row.minX, row.y]);
    right.push([row.maxX, row.y]);
  });
  const outline = [...left, ...right.reverse()];
  const smoothed = smoothPolygon(outline, 2);
  const simplified = simplifyPolygon(smoothed, Math.max(1.2, Math.max(width, height) / 760));
  return simplified.map(([x, y]) => [clamp(x / width, 0, 1), clamp(y / height, 0, 1)]);
}

function traceMaskOutline(mask, width, height) {
  const edgeMap = new Map();
  const edges = [];
  const addEdge = (ax, ay, bx, by) => {
    const edge = { ax, ay, bx, by, from: `${ax},${ay}`, to: `${bx},${by}`, used: false };
    edges.push(edge);
    const bucket = edgeMap.get(edge.from);
    if (bucket) bucket.push(edge);
    else edgeMap.set(edge.from, [edge]);
  };
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!mask[y * width + x]) continue;
      if (y === 0 || !mask[(y - 1) * width + x]) addEdge(x, y, x + 1, y);
      if (x === width - 1 || !mask[y * width + x + 1]) addEdge(x + 1, y, x + 1, y + 1);
      if (y === height - 1 || !mask[(y + 1) * width + x]) addEdge(x + 1, y + 1, x, y + 1);
      if (x === 0 || !mask[y * width + x - 1]) addEdge(x, y + 1, x, y);
    }
  }
  let bestLoop = [];
  let bestArea = 0;
  edges.forEach((startEdge) => {
    if (startEdge.used) return;
    const loop = [];
    let edge = startEdge;
    const startKey = startEdge.from;
    for (let guard = 0; edge && !edge.used && guard < edges.length + 4; guard += 1) {
      edge.used = true;
      loop.push([edge.ax, edge.ay]);
      const nextKey = edge.to;
      if (nextKey === startKey) break;
      const nextEdges = edgeMap.get(nextKey) || [];
      edge = chooseNextOutlineEdge(edge, nextEdges);
    }
    if (loop.length < 12) return;
    const area = Math.abs(polygonArea(loop));
    if (area > bestArea) {
      bestArea = area;
      bestLoop = loop;
    }
  });
  return bestLoop;
}

function chooseNextOutlineEdge(previous, candidates) {
  const available = candidates.filter((edge) => !edge.used);
  if (available.length <= 1) return available[0] || null;
  const px = previous.bx - previous.ax;
  const py = previous.by - previous.ay;
  let best = available[0];
  let bestScore = -Infinity;
  available.forEach((edge) => {
    const nx = edge.bx - edge.ax;
    const ny = edge.by - edge.ay;
    const dot = px * nx + py * ny;
    const cross = px * ny - py * nx;
    const score = dot * 3 - Math.abs(cross);
    if (score > bestScore) {
      bestScore = score;
      best = edge;
    }
  });
  return best;
}

function keepPrintableMaskComponents(mask, width, height, minPixels) {
  const output = new Uint8Array(mask.length);
  const seen = new Uint8Array(mask.length);
  const stack = [];
  const component = [];
  for (let i = 0; i < mask.length; i += 1) {
    if (!mask[i] || seen[i]) continue;
    seen[i] = 1;
    stack.push(i);
    component.length = 0;
    while (stack.length) {
      const current = stack.pop();
      component.push(current);
      const x = current % width;
      const y = Math.floor(current / width);
      [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].forEach(([nx, ny]) => {
        const ni = ny * width + nx;
        if (nx >= 0 && ny >= 0 && nx < width && ny < height && mask[ni] && !seen[ni]) {
          seen[ni] = 1;
          stack.push(ni);
        }
      });
    }
    if (component.length >= minPixels) component.forEach((index) => { output[index] = 1; });
  }
  return output.some((value) => value) ? output : mask;
}

function maskToSvgPath(mask, width, height, step) {
  const sx = 1000 / width;
  const sy = 1000 / height;
  const rects = [];
  for (let y = 0; y < height; y += step) {
    let x = 0;
    while (x < width) {
      while (x < width && !blockHasPixel(mask, width, height, x, y, step)) x += step;
      const start = x;
      while (x < width && blockHasPixel(mask, width, height, x, y, step)) x += step;
      if (x > start) rects.push([start * sx - 500, y * sy - 500, (x - start) * sx, step * sy]);
    }
  }
  return rects
    .map(([x, y, w, h]) => `M${x.toFixed(1)} ${y.toFixed(1)}h${w.toFixed(1)}v${h.toFixed(1)}h${(-w).toFixed(1)}z`)
    .join('');
}

function blockHasPixel(mask, width, height, bx, by, step) {
  for (let y = by; y < Math.min(height, by + step); y += 1) {
    for (let x = bx; x < Math.min(width, bx + step); x += 1) {
      if (mask[y * width + x]) return true;
    }
  }
  return false;
}

function countComponents(mask, width, height, minPixels = 1) {
  const seen = new Uint8Array(mask.length);
  let components = 0;
  const stack = [];
  for (let i = 0; i < mask.length; i += 1) {
    if (!mask[i] || seen[i]) continue;
    seen[i] = 1;
    stack.push(i);
    let pixels = 0;
    while (stack.length) {
      const current = stack.pop();
      pixels += 1;
      const x = current % width;
      const y = Math.floor(current / width);
      [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].forEach(([nx, ny]) => {
        const ni = ny * width + nx;
        if (nx >= 0 && ny >= 0 && nx < width && ny < height && mask[ni] && !seen[ni]) {
          seen[ni] = 1;
          stack.push(ni);
        }
      });
    }
    if (pixels >= minPixels) components += 1;
  }
  return components;
}

function buildWarnings({ artworkType, clusters, main, islands, tinyShapes, opaqueCount, width, height }) {
  const warnings = [];
  if (!opaqueCount) warnings.push({ level: 'error', text: 'No opaque logo area was detected after background removal.' });
  if (clusters.length > 8) warnings.push({ level: 'warn', text: `${clusters.length} source colours were merged to the 8-colour print limit.` });
  if (artworkType === 'png') warnings.push({ level: 'warn', text: 'PNG geometry is approximated from pixels. Upload SVG for cleaner separate printable colour parts.' });
  if (islands > 10) warnings.push({ level: 'warn', text: `${islands} floating colour islands detected. They may need bridges or separate print handling.` });
  if (tinyShapes > 0) warnings.push({ level: 'warn', text: `${tinyShapes} tiny colour region${tinyShapes > 1 ? 's' : ''} may be too small for diffuser fit.` });
  if (opaqueCount / (width * height) < 0.08) warnings.push({ level: 'warn', text: 'The silhouette is very sparse; internal islands may need manual support.' });
  if (main.length <= 8 && !warnings.length) warnings.push({ level: 'ok', text: 'Artwork is within the 8-colour print limit and ready for preview export.' });
  return warnings;
}

function defaultSilhouette() {
  return [[0.18, 0.16], [0.82, 0.16], [0.88, 0.52], [0.7, 0.86], [0.3, 0.86], [0.12, 0.52]];
}

function smoothPolygon(points, passes) {
  let output = points;
  for (let pass = 0; pass < passes; pass += 1) {
    const input = output;
    output = input.map((point, idx) => {
      const prev = input[(idx - 1 + input.length) % input.length];
      const next = input[(idx + 1) % input.length];
      return [(prev[0] + point[0] * 2 + next[0]) / 4, (prev[1] + point[1] * 2 + next[1]) / 4];
    });
  }
  return output;
}

function simplifyPolygon(points, tolerance) {
  if (points.length <= 24) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  simplifyRange(points, 0, points.length - 1, tolerance * tolerance, keep);
  const simplified = points.filter((_, idx) => keep[idx]);
  return simplified.length >= 12 ? simplified : points;
}

function simplifyRange(points, first, last, toleranceSq, keep) {
  let bestDistance = 0;
  let bestIndex = -1;
  for (let i = first + 1; i < last; i += 1) {
    const distance = pointLineDistanceSq(points[i], points[first], points[last]);
    if (distance > bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }
  if (bestDistance > toleranceSq && bestIndex > 0) {
    keep[bestIndex] = 1;
    simplifyRange(points, first, bestIndex, toleranceSq, keep);
    simplifyRange(points, bestIndex, last, toleranceSq, keep);
  }
}

function pointLineDistanceSq(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  if (!dx && !dy) {
    const px = point[0] - start[0];
    const py = point[1] - start[1];
    return px * px + py * py;
  }
  const t = clamp(((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy), 0, 1);
  const x = start[0] + dx * t;
  const y = start[1] + dy * t;
  const px = point[0] - x;
  const py = point[1] - y;
  return px * px + py * py;
}

function chaikinSmoothClosed(points, passes = 1) {
  if (!Array.isArray(points) || points.length < 6 || passes <= 0) return points;
  let output = points;
  for (let pass = 0; pass < passes; pass += 1) {
    const next = [];
    for (let i = 0; i < output.length; i += 1) {
      const a = output[i];
      const b = output[(i + 1) % output.length];
      next.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
      next.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    output = next;
  }
  return output;
}

function polygonArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const next = points[(i + 1) % points.length];
    area += points[i][0] * next[1] - next[0] * points[i][1];
  }
  return area / 2;
}

function normalizePlaqueTraceQuality(value) {
  if (value === 'raw') return 'raw';
  if (value === 'clean') return 'clean';
  return 'smooth';
}

function colourDistance(a, b = [0, 0, 0]) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function colourLuma(rgb) {
  return (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
}

function colourChroma(rgb) {
  return Math.max(...rgb) - Math.min(...rgb);
}

function colourHue(rgb) {
  const [r, g, b] = rgb.map((value) => clamp(Number(value) || 0, 0, 255) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (!delta) return 0;
  let hue;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  return (hue * 60 + 360) % 360;
}

function rgbToHex(rgb) {
  return `#${rgb.map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0')).join('')}`;
}

function normalizeHex(value) {
  const raw = String(value || '').trim();
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(raw)) return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toLowerCase();
  return '#ffffff';
}

function hexToRgb(hex) {
  const normalized = normalizeHex(hex || DEFAULT_FLOATING_SUPPORT_COLOUR);
  return [
    parseInt(normalized.slice(1, 3), 16),
    parseInt(normalized.slice(3, 5), 16),
    parseInt(normalized.slice(5, 7), 16),
  ];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
