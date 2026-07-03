// Plaque product runtime. Loaded before app.js so app.js can stay focused on core studio orchestration.

const DEFAULT_PLAQUE_DESKTOP_PREVIEW_ZOOM = 1;
const DEFAULT_PLAQUE_MOBILE_PREVIEW_ZOOM = 1;
const PLAQUE_RASTER_FALLBACK_MAX_SIDE = 760;
const PLAQUE_LAYER_Z_EPSILON = 0.02;
const plaqueBaseDilationOffsetCache = new Map();

function normalizePlaqueTraceQuality() {
  return 'smooth';
}

function getPlaqueDefaultPreviewZoom() {
  if (typeof getDefaultProductPreviewZoom === 'function') return getDefaultProductPreviewZoom();
  return isMobilePreviewViewport() ? DEFAULT_PLAQUE_MOBILE_PREVIEW_ZOOM : DEFAULT_PLAQUE_DESKTOP_PREVIEW_ZOOM;
}

function getPlaqueDefaultPreviewRotation() {
  if (typeof getDefaultProductPreviewRotation === 'function') return getDefaultProductPreviewRotation();
  return { x: -5.232392578125, y: 13.203134765624998, z: 0 };
}

function setupPlaqueControls() {
  setupFileButtonKeyboard(els.plaqueChooseFile, els.fileInput);
  els.plaqueUsageButtons?.forEach((button) => {
    button.addEventListener('click', () => setPlaqueUsage(button.dataset.plaqueUsage));
  });
  els.plaqueBaseThickness?.addEventListener('input', () => {
    state.plaque.baseThickness = clamp(Number(els.plaqueBaseThickness.value) || PLAQUE_DEFAULT_BASE_THICKNESS, PLAQUE_BASE_THICKNESS_MIN, PLAQUE_BASE_THICKNESS_MAX);
    updateRangeFill(els.plaqueBaseThickness);
    renderPlaqueBaseControl();
    if (!updateRenderedPlaqueBaseThickness(state.plaque.baseThickness)) schedulePlaqueBuild(40);
  });
  els.plaqueBasePadding?.addEventListener('input', () => {
    state.plaque.basePadding = clamp(Number(els.plaqueBasePadding.value) || PLAQUE_DEFAULT_BASE_PADDING, 0, 6);
    updateRangeFill(els.plaqueBasePadding);
    renderPlaqueBaseControl();
    schedulePlaqueBuild(40);
  });
  bindPlaqueLayerControlEvents(els.plaqueLayerList);
  bindPlaqueLayerControlEvents(els.plaqueVisualLayerList, { openControls: false, visualDepthEditor: true });
  els.plaqueVisualLayerToggle?.addEventListener('click', () => {
    state.plaque.visualLayerTrayCollapsed = !state.plaque.visualLayerTrayCollapsed;
    renderPlaqueVisualizerLayerTray();
  });
  els.plaqueTraceQualityButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const quality = normalizePlaqueTraceQuality(button.dataset.plaqueTraceQuality);
      if (state.plaque.traceQuality === quality) return;
      state.plaque.traceQuality = quality;
      state.plaque.exactPixelBoundaryMode = quality !== 'smooth';
      state.plaque.usePngFrontTextureFallback = false;
      state.plaque.svgLayerCache = null;
      if (state.productType === 'plaque' && state.plaque.artwork) {
        reprocessPlaqueArtwork();
      }
      renderPlaqueControls();
      schedulePlaqueBuild(30);
    });
  });
  els.plaqueVectorDebug?.addEventListener('change', () => {
    state.plaque.showVectorDebug = Boolean(els.plaqueVectorDebug.checked);
    schedulePlaqueBuild(30);
  });
  els.plaqueHideTopTexture?.addEventListener('change', () => {
    state.plaque.hideTopTexture = Boolean(els.plaqueHideTopTexture.checked);
    schedulePlaqueBuild(30);
  });
  els.plaqueShowBackingOnly?.addEventListener('change', () => {
    state.plaque.showBackingOnly = Boolean(els.plaqueShowBackingOnly.checked);
    applyPlaqueBackingOnlyMode();
    renderThree();
  });
  els.plaqueWireframe?.addEventListener('change', () => {
    state.plaque.wireframe = Boolean(els.plaqueWireframe.checked);
    applyPlaqueDebugMaterials();
    renderThree();
  });
  els.plaqueNormals?.addEventListener('change', () => {
    state.plaque.normals = Boolean(els.plaqueNormals.checked);
    schedulePlaqueBuild(30);
  });
  els.plaqueTopologyDebug?.addEventListener('change', () => {
    state.plaque.topologyDebug = Boolean(els.plaqueTopologyDebug.checked);
    schedulePlaqueBuild(30);
  });
  els.plaqueShowShells?.addEventListener('change', () => {
    state.plaque.showShells = Boolean(els.plaqueShowShells.checked);
    schedulePlaqueBuild(30);
  });
  els.plaqueBooleanOnly?.addEventListener('change', () => {
    state.plaque.booleanOnly = Boolean(els.plaqueBooleanOnly.checked);
    schedulePlaqueBuild(30);
  });
  setupMobileAccordion(els.plaqueAdvancedSection, els.plaqueAdvancedHeading);
  renderPlaqueControls();
}

function bindPlaqueLayerControlEvents(container, options = {}) {
  if (!container) return;
  const openControls = options.openControls !== false;
  const visualDepthEditor = options.visualDepthEditor === true;
  container.addEventListener('click', (event) => {
    if (event.target.closest('[data-plaque-depth]')) return;
    const backingColourButton = event.target.closest('[data-plaque-backing-colour]');
    if (backingColourButton) {
      openPlaqueBackingColourPopover(backingColourButton);
      return;
    }
    const colourButton = event.target.closest('[data-plaque-colour]');
    if (colourButton) {
      const index = Number(colourButton.dataset.plaqueColour);
      selectPlaqueLayer(index, { openControls });
      openPlaqueColourPopover(index, colourButton);
      return;
    }
    const row = event.target.closest('[data-plaque-layer]');
    if (!row || !container.contains(row)) return;
    const index = Number(row.dataset.plaqueLayer);
    const resetButton = event.target.closest('[data-plaque-layer-reset]');
    if (visualDepthEditor) {
      state.plaque.visualLayerEditorOpen = true;
      selectPlaqueLayer(index, { openControls: false });
      if (resetButton) resetPlaqueLayerDepth(index);
      return;
    }
    selectPlaqueLayer(index, { openControls });
    if (resetButton) {
      resetPlaqueLayerDepth(index);
    }
  });
  container.addEventListener('input', (event) => {
    const slider = event.target.closest('[data-plaque-depth]');
    if (!slider || !container.contains(slider)) return;
    const index = Number(slider.dataset.plaqueDepth);
    updateRangeFill(slider);
    setPlaqueLayerDepth(index, Number(slider.value), { renderControls: false, rebuild: false });
  });
  container.addEventListener('change', (event) => {
    const slider = event.target.closest('[data-plaque-depth]');
    if (!slider || !container.contains(slider)) return;
    const index = Number(slider.dataset.plaqueDepth);
    setPlaqueLayerDepth(index, Number(slider.value), { renderControls: true, rebuild: false });
  });
}

function getPlaqueUsageKey() {
  return USAGE_PRESETS[state.plaque.usage] ? state.plaque.usage : 'indoor';
}

function setPlaqueUsage(usage) {
  if (!USAGE_PRESETS[usage]) return;
  state.plaque.usage = usage;
  els.plaqueUsageButtons?.forEach((button) => {
    button.classList.toggle('active', button.dataset.plaqueUsage === usage);
  });
  updateStats();
  updateProjectControls();
}

function setupPlaquePicking() {
  if (!els.stage) return;
  let down = null;
  els.stage.addEventListener('pointerdown', (event) => {
    if (state.productType !== 'plaque') return;
    if (event.target.closest('button, label, input, select, textarea, .preview-alert, .plaque-visual-layer-tray')) return;
    down = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
  });
  els.stage.addEventListener('pointerup', (event) => {
    if (state.productType !== 'plaque' || !down) return;
    const moved = Math.hypot(event.clientX - down.x, event.clientY - down.y);
    down = null;
    if (moved > 10 || state.previewTouchGestureActive) return;
    const layer = pickPlaqueLayer(event.clientX, event.clientY);
    if (layer !== null) selectPlaqueLayer(layer, { openControls: false });
  });
  els.stage.addEventListener('pointercancel', () => {
    down = null;
  });
}

function pickPlaqueLayer(clientX, clientY) {
  if (!state.three?.camera || !state.three?.group || !window.THREE) return null;
  const meshes = state.three.group.userData?.plaqueMeshes || [];
  if (!meshes.length) return null;
  const rect = state.three.renderer.domElement.getBoundingClientRect();
  const pointer = new THREE.Vector2(
    ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1,
    -(((clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1),
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(pointer, state.three.camera);
  const hits = raycaster.intersectObjects(meshes, true)
    .filter((hit) => Number.isFinite(hit.object?.userData?.plaqueLayer) || Array.isArray(hit.object?.userData?.layerByMaterialIndex))
    .sort((a, b) => (b.point?.z || 0) - (a.point?.z || 0));
  if (!hits.length) return null;
  const hit = hits[0];
  const layerByMaterial = hit.object.userData.layerByMaterialIndex;
  if (Array.isArray(layerByMaterial) && hit.face) {
    const layer = layerByMaterial[hit.face.materialIndex];
    if (Number.isFinite(layer)) return layer;
  }
  return hit.object.userData.plaqueLayer;
}

async function handlePlaqueFiles(fileList) {
  const file = fileList?.[0];
  if (!file) return;
  let plaqueUploadStage = 'starting upload';
  const previousProductType = state.productType;
  if (previousProductType === 'led') state.led.snapshot = captureCurrentArtworkState();
  const previousPlaqueState = {
    fileName: state.plaque.fileName,
    uploadedFile: state.plaque.uploadedFile,
    uploadFingerprint: state.plaque.uploadFingerprint || '',
    artwork: state.plaque.artwork,
    processed: state.plaque.processed,
    isDefaultPreview: state.plaque.isDefaultPreview,
    designName: state.plaque.designName,
    projectId: state.plaque.projectId,
    usage: getPlaqueUsageKey(),
    processingDirty: state.plaque.processingDirty,
    removeBg: state.plaque.removeBg,
    fixFloatingRegions: state.plaque.fixFloatingRegions,
    floatingSupportColour: state.plaque.floatingSupportColour,
      targetColorCount: state.plaque.targetColorCount,
      colorOverrides: [...(state.plaque.colorOverrides || [])],
      colourOverrides: [...(state.plaque.colourOverrides || [])],
      layerSourceIndices: [...(state.plaque.layerSourceIndices || [])],
      backingColourOverride: state.plaque.backingColourOverride || '',
      frontColoursCustomized: state.plaque.frontColoursCustomized,
    selectedColor: state.plaque.selectedColor,
    selectedColourTarget: { ...(state.plaque.selectedColourTarget || { type: 'front', index: 0 }) },
    edit: {
      crop: { ...(state.plaque.edit?.crop || { x: 0, y: 0, w: 1, h: 1 }) },
      cropAspect: state.plaque.edit?.cropAspect || 'free',
      zoom: state.plaque.edit?.zoom || 1,
    },
    previewZoom: state.plaque.previewZoom,
    previewPan: { ...(state.plaque.previewPan || { x: 0, y: 0 }) },
    dismissedPreviewAlert: state.plaque.dismissedPreviewAlert,
    rotation: { ...(state.plaque.rotation || getPlaqueDefaultPreviewRotation()) },
    traceQuality: normalizePlaqueTraceQuality(state.plaque.traceQuality),
    zeroGapColourLayers: state.plaque.zeroGapColourLayers !== false,
    exactPixelBoundaryMode: normalizePlaqueTraceQuality(state.plaque.traceQuality) !== 'smooth',
    usePngFrontTextureFallback: false,
    previewDebugMode: 'extruded',
    svgLayerCache: state.plaque.svgLayerCache,
    fastPreviewOnly: state.plaque.fastPreviewOnly,
  };
  state.productType = 'plaque';
  state.uploadTarget = 'plaque';
  cancelPlaqueBuild();

  const validation = validateUploadFile(file);
  if (!validation.ok) {
    showUploadError(validation.message);
    return;
  }

  setUploadLoading('plaque');
  let uploadFile = file;
  state.designName = '';
  if (els.designName) els.designName.value = '';
  try {
    plaqueUploadStage = 'converting image';
    if (validation.kind === 'heic') {
      uploadFile = await convertHeicToPngFile(file);
    }
    const uploadFingerprintPromise = getPlaqueArtworkFingerprint(null, uploadFile).catch((error) => {
      console.warn('Could not precompute uploaded plaque fingerprint.', error);
      return '';
    });
    Object.assign(state.plaque, {
      fileName: uploadFile.name,
      uploadedFile: uploadFile,
      uploadFingerprint: '',
      artwork: null,
      processed: null,
      isDefaultPreview: false,
      isExampleProject: false,
      designName: '',
      projectId: null,
      usage: getPlaqueUsageKey(),
      processingDirty: false,
      backingColourOverride: '',
    });
    activatePlaqueArtworkState();
    renderUploadControl();

    setPlaqueLoadingProgress(22, 'Reading logo file');
    await waitFrame();
    plaqueUploadStage = 'reading logo file';
    const artworkRead = validation.kind === 'svg'
      ? readSvgArtwork(uploadFile)
      : readPlaqueRasterArtwork(uploadFile);
    state.plaque.artwork = await withTimeout(artworkRead, PLAQUE_UPLOAD_READ_TIMEOUT_MS, 'plaque-upload-read-timeout');
    state.plaque.uploadFingerprint = await uploadFingerprintPromise;

    setPlaqueLoadingProgress(42, 'Detecting colours');
    await waitFrame();
    plaqueUploadStage = 'preparing plaque artwork';
    state.plaque.removeBg = state.plaque.artwork.hasTransparency ? false : true;
    state.plaque.fixFloatingRegions = false;
    state.plaque.floatingSupportColour = DEFAULT_FLOATING_SUPPORT_COLOUR;
    state.plaque.targetColorCount = 8;
    state.plaque.colorOverrides = [];
    state.plaque.colourOverrides = [];
    state.plaque.layerSourceIndices = [];
    state.plaque.svgLayerCache = null;
    state.plaque.fastPreviewOnly = false;
    state.plaque.previewDebugMode = 'extruded';
    state.plaque.traceQuality = PLAQUE_DEFAULT_TRACE_QUALITY;
    state.plaque.zeroGapColourLayers = true;
    state.plaque.exactPixelBoundaryMode = PLAQUE_DEFAULT_TRACE_QUALITY !== 'smooth';
    state.plaque.usePngFrontTextureFallback = false;
    state.plaque.baseThickness = PLAQUE_DEFAULT_BASE_THICKNESS;
    state.plaque.layerDepths = [];
    state.plaque.frontColoursCustomized = false;
    state.plaque.selectedColor = 0;
    state.plaque.selectedColourTarget = { type: 'front', index: 0 };
    state.plaque.previewZoom = getPlaqueDefaultPreviewZoom();
    state.plaque.previewPan = { x: 0, y: 0 };
    state.plaque.dismissedPreviewAlert = '';
    state.plaque.rotation = getPlaqueDefaultPreviewRotation();
    state.previewZoom = state.plaque.previewZoom;
    state.previewPan = { x: 0, y: 0 };
    resetRotation();
    state.plaque.rotation = { ...state.rotation };
    state.plaque.edit = {
      crop: detectDefaultCrop(state.plaque.artwork),
      cropAspect: 'free',
      zoom: 0.86,
    };
    activatePlaqueArtworkState();
    if (els.removeBg) els.removeBg.checked = state.removeBg;

    setPlaqueLoadingProgress(58, 'Preparing layers');
    await waitFrame();
    plaqueUploadStage = 'processing plaque layers';
    try {
      await reprocessPlaqueArtwork();
    } catch (processError) {
      console.warn('3D Plaque layer processing failed; using raster fallback preview.', processError);
      state.plaque.processed = createPlaqueRasterFallbackProcessed(state.plaque.artwork);
      state.plaque.fastPreviewOnly = true;
      state.plaque.usePngFrontTextureFallback = false;
      activatePlaqueArtworkState();
      syncColorOverrides();
      renderPreview();
      renderPlaqueDiagnostics();
      updateProjectControls();
      setStatus('Ready');
    }

    setPlaqueLoadingProgress(92, 'Rendering plaque');
    await waitFrame();
    if (els.submitNote) els.submitNote.textContent = '';
    openWizard('edit');
    trackSignStudioEvent('artwork_upload', {
      product_type: 'plaque',
      file_type: validation.kind,
    });
  } catch (error) {
    error.plaqueUploadStage = error.plaqueUploadStage || plaqueUploadStage;
    console.warn(`3D Plaque upload failed while ${plaqueUploadStage}.`, error);
    Object.assign(state.plaque, previousPlaqueState);
    activatePlaqueArtworkState();
    if (state.plaque.processed) renderPreview();
    showUploadError(getUploadErrorMessage(error));
  }
}

async function readPlaqueRasterArtwork(file) {
  const decodeFile = await normalizeRasterUploadFile(file);
  try {
    const originalDataUrl = await fileToDataUrl(decodeFile);
    const originalImage = await loadImage(originalDataUrl, { timeout: IMAGE_DECODE_TIMEOUT_MS, skipDecode: true });
    const normalizedDataUrl = await makeNormalizedRasterDataUrl(originalImage, { maxSide: PLAQUE_UPLOAD_MAX_SIDE });
    const image = await loadImage(normalizedDataUrl, { timeout: IMAGE_DECODE_TIMEOUT_MS, skipDecode: true });
    return makeRasterArtworkPayload(decodeFile, file, image, normalizedDataUrl);
  } catch (error) {
    console.warn('Plaque data URL raster read failed; trying LED raster reader fallback.', error);
    return readRasterArtwork(file, {
      quickObjectUrl: true,
      skipBitmapVerify: true,
      skipTransparencyCheck: true,
      maxSide: PLAQUE_UPLOAD_MAX_SIDE,
    });
  }
}

function createPlaqueRasterFallbackProcessed(artwork) {
  const sourceWidth = getArtworkImageWidth(artwork.image);
  const sourceHeight = getArtworkImageHeight(artwork.image);
  const scale = Math.min(1, PLAQUE_RASTER_FALLBACK_MAX_SIDE / Math.max(sourceWidth, sourceHeight));
  let width = Math.max(12, Math.round(sourceWidth * scale));
  let height = Math.max(12, Math.round(sourceHeight * scale));
  let canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  let ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(artwork.image, 0, 0, width, height);
  let frame = ctx.getImageData(0, 0, width, height);
  ({ canvas, ctx, img: frame, width, height } = tightenProcessedCanvasToVisibleArtwork(canvas, ctx, frame, width, height));
  ({ canvas, ctx, img: frame, width, height } = addTransparentCanvasPadding(canvas, ctx, width, height));
  const alphaMask = new Uint8Array(width * height);
  const alphaValues = new Uint8Array(width * height);
  const regionIndex = new Int16Array(width * height).fill(-1);
  const palette = detectPlaqueFallbackPalette(frame.data, width, height, clamp(Number(state.plaque.targetColorCount) || 8, 1, 8));
  const masks = palette.map(() => new Uint8Array(width * height));
  for (let i = 0; i < width * height; i += 1) {
    const offset = i * 4;
    const alpha = frame.data[offset + 3];
    if (alpha < 24) {
      frame.data[offset + 3] = 0;
      continue;
    }
    alphaMask[i] = 1;
    alphaValues[i] = alpha;
    const colourIndex = nearestPaletteColourIndex(palette, normalizeVectorRgb([
      frame.data[offset],
      frame.data[offset + 1],
      frame.data[offset + 2],
    ]));
    regionIndex[i] = colourIndex;
    if (masks[colourIndex]) masks[colourIndex][i] = 1;
  }
  ctx.putImageData(frame, 0, 0);
  const silhouette = buildSilhouette(alphaMask, width, height);
  const minIslandPixels = Math.max(10, Math.round((width * height) * 0.00045));
  const colours = palette.map((cluster, index) => ({
    id: index,
    original: index,
    rgb: cluster.rgb,
    hex: rgbToHex(cluster.rgb),
    count: cluster.count,
    mask: masks[index],
    path: maskToSvgPath(masks[index], width, height, 4),
    components: countComponents(masks[index], width, height, minIslandPixels),
  })).filter((region) => region.count > 0);
  const processed = {
    width,
    height,
    aspect: width / height,
    artworkType: artwork.type,
    artworkUrl: canvas.toDataURL('image/png'),
    artworkCanvas: canvas,
    naturalColourCount: Math.max(1, colours.length),
    alphaMask,
    alphaValues,
    regionIndex,
    colours,
    silhouette,
    warnings: [{ level: 'warn', text: 'PNG colour layers were simplified with raster fallback. Upload an SVG for the cleanest plaque geometry.' }],
  };
  return reorderPlaqueRasterColoursByEdge(processed);
}

function getPlaqueOuterEdgeColourIndex(processed) {
  const width = processed?.width || 0;
  const height = processed?.height || 0;
  const colours = processed?.colours || [];
  const alphaMask = processed?.alphaMask;
  const regionIndex = processed?.regionIndex;
  if (!width || !height || !colours.length || !alphaMask || !regionIndex) return -1;
  const scores = new Array(colours.length).fill(0);
  const alphaValues = processed.alphaValues;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (!alphaMask[index]) continue;
      const region = regionIndex[index];
      if (region < 0 || region >= colours.length) continue;
      const touchesTransparentEdge = x === 0
        || y === 0
        || x === width - 1
        || y === height - 1
        || !alphaMask[index - 1]
        || !alphaMask[index + 1]
        || !alphaMask[index - width]
        || !alphaMask[index + width];
      if (!touchesTransparentEdge) continue;
      scores[region] += alphaValues?.[index] || 255;
    }
  }
  let bestIndex = -1;
  let bestScore = 0;
  scores.forEach((score, index) => {
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });
  return bestIndex;
}

function reorderPlaqueRasterColoursByEdge(processed) {
  mergePlaqueNearWhiteArtifacts(processed);
  const colours = processed?.colours || [];
  if (!processed || colours.length < 2) {
    if (processed && colours[0]?.hex) processed.plaqueEdgeHex = normalizeHex(colours[0].hex);
    return processed;
  }
  const edgeIndex = getPlaqueOuterEdgeColourIndex(processed);
  if (edgeIndex < 0 || edgeIndex >= colours.length) return processed;
  processed.plaqueEdgeHex = normalizeHex(colours[edgeIndex].hex);
  if (edgeIndex === 0) return processed;
  const order = [edgeIndex, ...colours.map((_, index) => index).filter((index) => index !== edgeIndex)];
  const remap = new Map(order.map((oldIndex, newIndex) => [oldIndex, newIndex]));
  processed.colours = order.map((oldIndex, newIndex) => ({
    ...colours[oldIndex],
    id: newIndex,
    original: colours[oldIndex].original ?? oldIndex,
  }));
  if (processed.regionIndex) {
    const nextRegionIndex = new Int16Array(processed.regionIndex.length);
    nextRegionIndex.fill(-1);
    for (let index = 0; index < processed.regionIndex.length; index += 1) {
      const oldRegion = processed.regionIndex[index];
      nextRegionIndex[index] = remap.has(oldRegion) ? remap.get(oldRegion) : -1;
    }
    processed.regionIndex = nextRegionIndex;
  }
  return processed;
}

function recoverPlaqueLightLayerAntialiasEdges(processed) {
  const colours = processed?.colours || [];
  if (!processed?.regionIndex || !processed.alphaMask || colours.length < 2 || !processed.artworkCanvas) return processed;
  const lightCandidates = colours
    .map((region, index) => {
      const rgb = hexToRgb(region.hex);
      return { index, rgb, luma: colourLuma(rgb), chroma: colourChroma(rgb), count: Number(region.count) || 0 };
    })
    .filter((item) => item.luma >= 214 && item.chroma <= 48)
    .sort((a, b) => b.count - a.count);
  const whiteLayer = lightCandidates[0];
  if (!whiteLayer) return processed;
  let data;
  try {
    data = processed.artworkCanvas.getContext('2d', { willReadFrequently: true })?.getImageData(0, 0, processed.width, processed.height)?.data;
  } catch (error) {
    return processed;
  }
  if (!data) return processed;
  const width = processed.width;
  const height = processed.height;
  const nextRegionIndex = new Int16Array(processed.regionIndex);
  let changed = false;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      if (!processed.alphaMask[index] || nextRegionIndex[index] === whiteLayer.index) continue;
      const offset = index * 4;
      const rgb = [data[offset], data[offset + 1], data[offset + 2]];
      const luma = colourLuma(rgb);
      const chroma = colourChroma(rgb);
      if (luma < 176 || chroma > 64) continue;
      let whiteNeighbors = 0;
      let darkNeighbors = 0;
      for (let oy = -1; oy <= 1; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          if (!ox && !oy) continue;
          const neighbor = (y + oy) * width + (x + ox);
          const neighborRegion = nextRegionIndex[neighbor];
          if (neighborRegion === whiteLayer.index) whiteNeighbors += 1;
          else if (neighborRegion >= 0) {
            const neighborRgb = hexToRgb(colours[neighborRegion]?.hex || '#000000');
            if (colourLuma(neighborRgb) < 96) darkNeighbors += 1;
          }
        }
      }
      if (whiteNeighbors < 4) continue;
      const whiteDistance = colourDistance(rgb, whiteLayer.rgb);
      const currentRegion = nextRegionIndex[index];
      const currentRgb = hexToRgb(colours[currentRegion]?.hex || '#000000');
      const currentDistance = colourDistance(rgb, currentRgb);
      const isTextAntialias = whiteNeighbors >= 4 && (darkNeighbors >= 1 || luma >= 206);
      if (isTextAntialias && whiteDistance <= currentDistance + 38) {
        nextRegionIndex[index] = whiteLayer.index;
        changed = true;
      }
    }
  }
  if (!changed) return processed;
  processed.regionIndex = nextRegionIndex;
  rebuildPlaqueRegionMasks(processed);
  return processed;
}

function rebuildPlaqueRegionMasks(processed) {
  const colours = processed?.colours || [];
  if (!processed?.regionIndex || !processed.alphaMask || !colours.length) return processed;
  const pixelCount = processed.width * processed.height;
  const masks = colours.map(() => new Uint8Array(pixelCount));
  const counts = colours.map(() => 0);
  for (let index = 0; index < pixelCount; index += 1) {
    const region = processed.regionIndex[index];
    if (!processed.alphaMask[index] || region < 0 || region >= colours.length) continue;
    masks[region][index] = 1;
    counts[region] += 1;
  }
  const minIslandPixels = Math.max(10, Math.round(pixelCount * 0.00045));
  processed.colours = colours.map((region, index) => ({
    ...region,
    count: counts[index],
    mask: masks[index],
    path: maskToSvgPath(masks[index], processed.width, processed.height, 4),
    components: countComponents(masks[index], processed.width, processed.height, minIslandPixels),
  }));
  processed.naturalColourCount = Math.max(1, processed.colours.filter((region) => region.count > 0).length);
  return processed;
}

function mergePlaqueNearWhiteArtifacts(processed) {
  const colours = processed?.colours || [];
  if (!processed || colours.length < 2 || !processed.regionIndex) return processed;
  const pixelCount = processed.width * processed.height;
  const exactCounts = new Array(colours.length).fill(0);
  let total = 0;
  for (let index = 0; index < processed.regionIndex.length; index += 1) {
    if (!processed.alphaMask?.[index]) continue;
    const region = processed.regionIndex[index];
    if (region < 0 || region >= colours.length) continue;
    exactCounts[region] += 1;
    total += 1;
  }
  if (!total) return processed;
  const colourInfo = colours.map((region, index) => {
    const rgb = hexToRgb(region.hex);
    return {
      index,
      rgb,
      count: exactCounts[index] || Number(region.count) || 0,
      ratio: (exactCounts[index] || Number(region.count) || 0) / total,
      luma: colourLuma(rgb),
      chroma: colourChroma(rgb),
      hue: colourHue(rgb),
      isWhite: isNearWhiteHex(region.hex),
      isBlack: isNearBlackHex(region.hex),
    };
  });
  const sortedByCount = [...colourInfo].sort((a, b) => b.count - a.count);
  const majorIndexes = new Set(
    sortedByCount
      .slice(0, Math.min(5, colours.length))
      .filter((item) => item.count > 0)
      .map((item) => item.index),
  );
  colourInfo.forEach((item) => {
    if (item.ratio >= 0.055 || item.isWhite || item.isBlack) majorIndexes.add(item.index);
  });
  const majorColours = colourInfo.filter((item) => majorIndexes.has(item.index) && item.count > 0);
  if (!majorColours.length) return processed;
  const aliases = new Map();
  colourInfo.forEach((item) => {
    const softLightFringe = item.luma >= 224 && item.chroma <= 72 && !item.isWhite;
    if (item.count <= 0 || (majorIndexes.has(item.index) && !softLightFringe)) return;
    let best = null;
    let bestScore = Infinity;
    majorColours.forEach((candidate) => {
      if (candidate.index === item.index) return;
      const distance = colourDistance(item.rgb, candidate.rgb);
      const lumaGap = Math.abs(item.luma - candidate.luma);
      const chromaGap = Math.abs(item.chroma - candidate.chroma);
      const hueGap = Math.min(Math.abs(item.hue - candidate.hue), 360 - Math.abs(item.hue - candidate.hue));
      let score = distance + lumaGap * 0.35 + chromaGap * 0.18;
      if (hueGap > 35 && Math.max(item.chroma, candidate.chroma) > 30) score += hueGap * 0.4;
      if (candidate.isWhite && item.luma > 205 && item.chroma < 95) score *= 0.72;
      if (candidate.isBlack && item.luma < 58) score *= 0.72;
      if (score < bestScore) {
        best = candidate;
        bestScore = score;
      }
    });
    const isTiny = item.ratio <= 0.022;
    const isSmall = item.ratio <= 0.065;
    const isLightFringe = item.luma >= 198 && item.chroma <= 105;
    const shouldMerge = (isTiny && bestScore <= 210)
      || (isSmall && bestScore <= 150)
      || (isSmall && isLightFringe && bestScore <= 185)
      || (softLightFringe && item.ratio <= 0.24 && bestScore <= 190);
    if (shouldMerge && best) aliases.set(item.index, best.index);
  });
  if (!aliases.size) return processed;
  const keep = colours.map((_, index) => !aliases.has(index));
  const oldToNew = new Map();
  let nextIndex = 0;
  keep.forEach((shouldKeep, oldIndex) => {
    if (!shouldKeep) return;
    oldToNew.set(oldIndex, nextIndex);
    nextIndex += 1;
  });
  aliases.forEach((targetIndex, oldIndex) => {
    const mappedTarget = oldToNew.get(targetIndex);
    if (mappedTarget !== undefined) oldToNew.set(oldIndex, mappedTarget);
  });
  const masks = Array.from({ length: nextIndex }, () => new Uint8Array(pixelCount));
  const counts = new Array(nextIndex).fill(0);
  const nextRegionIndex = new Int16Array(processed.regionIndex.length);
  nextRegionIndex.fill(-1);
  for (let i = 0; i < processed.regionIndex.length; i += 1) {
    if (!processed.alphaMask[i]) continue;
    const mapped = oldToNew.get(processed.regionIndex[i]);
    if (mapped === undefined) continue;
    nextRegionIndex[i] = mapped;
    masks[mapped][i] = 1;
    counts[mapped] += 1;
  }
  processed.regionIndex = nextRegionIndex;
  processed.colours = colours
    .filter((_, index) => keep[index])
    .map((region, index) => ({
      ...region,
      id: index,
      count: counts[index],
      mask: masks[index],
      path: maskToSvgPath(masks[index], processed.width, processed.height, 4),
      components: countComponents(masks[index], processed.width, processed.height, Math.max(10, Math.round((processed.width * processed.height) * 0.00045))),
    }));
  processed.naturalColourCount = Math.max(1, processed.colours.length);
  return processed;
}

function detectPlaqueFallbackPalette(data, width, height, maxColours) {
  const buckets = new Map();
  let visible = 0;
  const step = Math.max(1, Math.floor(Math.sqrt((width * height) / 180000)));
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const pixel = y * width + x;
      const offset = pixel * 4;
      const alpha = data[offset + 3];
      if (alpha < 64) continue;
      visible += 1;
      const rgb = normalizeVectorRgb([data[offset], data[offset + 1], data[offset + 2]]);
      const bucketRgb = rgb.map((value) => clamp(Math.round(value / 18) * 18, 0, 255));
      const key = bucketRgb.join(',');
      const bucket = buckets.get(key) || { rgb: [0, 0, 0], count: 0 };
      bucket.rgb[0] += rgb[0];
      bucket.rgb[1] += rgb[1];
      bucket.rgb[2] += rgb[2];
      bucket.count += 1;
      buckets.set(key, bucket);
    }
  }
  const candidates = [...buckets.values()]
    .map((bucket) => ({
      rgb: bucket.rgb.map((value) => value / Math.max(1, bucket.count)),
      count: bucket.count,
    }))
    .filter((bucket) => bucket.count >= Math.max(3, visible * 0.0025))
    .sort((a, b) => b.count - a.count);
  const seeds = [];
  candidates.forEach((candidate) => {
    if (seeds.length >= maxColours) return;
    if (seeds.some((seed) => colourDistance(seed.rgb, candidate.rgb) < 30)) return;
    seeds.push({ rgb: candidate.rgb.map(Number), count: candidate.count });
  });
  if (!seeds.length) return [{ rgb: [255, 255, 255], count: 1 }];
  let clusters = seeds;
  for (let iteration = 0; iteration < 5; iteration += 1) {
    const sums = clusters.map(() => ({ rgb: [0, 0, 0], count: 0 }));
    candidates.forEach((candidate) => {
      const index = nearestPaletteColourIndex(clusters, candidate.rgb);
      const target = sums[index];
      target.rgb[0] += candidate.rgb[0] * candidate.count;
      target.rgb[1] += candidate.rgb[1] * candidate.count;
      target.rgb[2] += candidate.rgb[2] * candidate.count;
      target.count += candidate.count;
    });
    clusters = clusters.map((cluster, index) => {
      const sum = sums[index];
      if (!sum.count) return cluster;
      return {
        rgb: sum.rgb.map((value) => value / sum.count),
        count: sum.count,
      };
    });
  }
  clusters = mergePlaqueFallbackPaletteClusters(clusters)
    .filter((cluster) => cluster.count >= Math.max(3, visible * 0.004))
    .sort((a, b) => b.count - a.count)
    .slice(0, maxColours);
  return clusters.length ? clusters.map((cluster) => ({
    rgb: cluster.rgb.map((value) => clamp(Math.round(value), 0, 255)),
    count: cluster.count,
  })) : [{ rgb: [255, 255, 255], count: 1 }];
}

function mergePlaqueFallbackPaletteClusters(clusters) {
  const output = [];
  clusters.forEach((cluster) => {
    const existing = output.find((item) => colourDistance(item.rgb, cluster.rgb) < 26);
    if (!existing) {
      output.push({ rgb: cluster.rgb.map(Number), count: cluster.count });
      return;
    }
    const nextCount = existing.count + cluster.count;
    existing.rgb = existing.rgb.map((value, index) => (
      (value * existing.count + cluster.rgb[index] * cluster.count) / nextCount
    ));
    existing.count = nextCount;
  });
  return output;
}

function storePlaqueArtworkStateFromActive() {
  Object.assign(state.plaque, {
    fileName: state.fileName,
    designName: state.designName,
    isDefaultPreview: state.isDefaultPreview,
    uploadedFile: state.uploadedFile,
    artwork: state.artwork,
    processed: state.processed,
    processingDirty: state.processingDirty,
    removeBg: state.removeBg,
    fixFloatingRegions: state.fixFloatingRegions,
    floatingSupportColour: state.floatingSupportColour,
    targetColorCount: state.targetColorCount,
    colorOverrides: [...state.colorOverrides],
    frontColoursCustomized: state.frontColoursCustomized,
    selectedColor: state.selectedColor,
    selectedColourTarget: { ...state.selectedColourTarget },
    projectId: state.projectId,
    edit: {
      crop: { ...state.edit.crop },
      cropAspect: state.edit.cropAspect,
      zoom: state.edit.zoom,
    },
    previewZoom: state.previewZoom,
    previewPan: { ...getPreviewPan() },
    dismissedPreviewAlert: state.dismissedPreviewAlert,
    rotation: { ...state.rotation },
  });
}

function activatePlaqueArtworkState() {
  const plaqueSnapshot = {
    fileName: state.plaque.fileName,
    designName: state.plaque.designName,
    isDefaultPreview: state.plaque.isDefaultPreview,
    uploadedFile: state.plaque.uploadedFile,
    artwork: state.plaque.artwork,
    processed: state.plaque.processed,
    removeBg: state.plaque.removeBg,
    fixFloatingRegions: state.plaque.fixFloatingRegions,
    floatingSupportColour: state.plaque.floatingSupportColour,
    tolerance: state.tolerance,
    targetColorCount: state.plaque.targetColorCount,
    colorOverrides: [...(state.plaque.colorOverrides || [])],
    frontColoursCustomized: state.plaque.frontColoursCustomized,
    selectedColor: state.plaque.selectedColor,
    selectedColourTarget: { ...(state.plaque.selectedColourTarget || { type: 'front', index: 0 }) },
    projectId: state.plaque.projectId,
    edit: {
      crop: { ...(state.plaque.edit?.crop || { x: 0, y: 0, w: 1, h: 1 }) },
      cropAspect: state.plaque.edit?.cropAspect || 'free',
      zoom: state.plaque.edit?.zoom || 1,
    },
    previewZoom: state.plaque.previewZoom || 1,
    previewPan: { ...(state.plaque.previewPan || { x: 0, y: 0 }) },
    dismissedPreviewAlert: state.plaque.dismissedPreviewAlert || '',
    rotation: { ...(state.plaque.rotation || getPlaqueDefaultPreviewRotation()) },
  };
  applyArtworkStateSnapshot(plaqueSnapshot);
  state.processingDirty = Boolean(state.plaque.processingDirty);
}

async function reprocessPlaqueArtwork(options = {}) {
  if (!state.plaque.artwork) return;
  let cachedProcessed = options.processedCache
    ? hydrateCachedPlaqueProcessed(clonePlaqueProcessedForCache(options.processedCache, { slimLabelledMap: false }), state.plaque.artwork)
    : null;
  let uploadCacheContext = null;
  activatePlaqueArtworkState();
  setStatus('Processing');
  els.stage.classList.add('regenerating');
  const previousColourSnapshot = state.plaque.processed?.colours?.map((region, idx) => ({
    hex: normalizeHex(region.hex),
    display: normalizeHex(state.plaque.colorOverrides?.[idx] || region.hex),
    isFloatingSupport: Boolean(region.isFloatingSupport),
  })) || null;
  if (!cachedProcessed && shouldUseUploadedPlaqueProcessedCache(options)) {
    uploadCacheContext = await getUploadedPlaqueProcessedCacheContext(state.plaque.artwork, state.plaque.uploadedFile);
    if (uploadCacheContext?.processed) {
      cachedProcessed = hydrateCachedPlaqueProcessed(uploadCacheContext.processed, state.plaque.artwork);
    }
  }
  if (!cachedProcessed) await waitFrame();
  try {
    if (cachedProcessed) {
      state.plaque.processed = shouldKeepPlaqueDeferredDebugData()
        ? cachedProcessed
        : stripPlaqueDeferredDebugData(cachedProcessed);
    } else {
      state.plaque.processed = await processPlaqueArtworkWithWorker(state.plaque.artwork, getPlaqueProcessArtworkOptions())
        || processArtwork(state.plaque.artwork, getPlaqueProcessArtworkOptions());
      if (!shouldKeepPlaqueDeferredDebugData()) {
        stripPlaqueDeferredDebugData(state.plaque.processed);
      }
      if (state.plaque.artwork?.type !== 'svg') {
        reorderPlaqueRasterColoursByEdge(state.plaque.processed);
      }
    }
    state.plaque.fastPreviewOnly = shouldUsePlaqueFastRaisedPreview(state.plaque.processed);
    state.plaque.processingDirty = false;
    activatePlaqueArtworkState();
    if (!options.preserveTargetColorCount && !state.plaque.frontColoursCustomized && state.plaque.processed.naturalColourCount) {
      state.targetColorCount = state.plaque.processed.naturalColourCount;
      state.plaque.targetColorCount = state.plaque.processed.naturalColourCount;
    }
    syncColorOverrides(previousColourSnapshot);
    state.plaque.colorOverrides = [...state.colorOverrides];
    state.plaque.colourOverrides = [...state.colorOverrides];
    state.plaque.frontColoursCustomized = state.frontColoursCustomized;
    state.plaque.processed = state.processed;
    renderPreview();
    if (options.cacheDefaultPlaqueProcessed) {
      queueDefaultPlaqueProcessedCacheWrite(options.defaultPlaqueProject, state.plaque.processed);
    }
    if (uploadCacheContext?.key) {
      queueUploadedPlaqueProcessedCacheWrite(uploadCacheContext, state.plaque.processed);
    }
    renderPlaqueDiagnostics();
    if (els.submitDesign) els.submitDesign.disabled = true;
    updateProjectControls();
    setStatus('Ready');
    if (state.wizardStep && !options.skipWizardRender) renderWizardStep();
  } finally {
    if (state.plaque.processed) finishPlaqueBuildStatus();
    requestAnimationFrame(() => els.stage.classList.remove('regenerating'));
  }
}

function shouldLoadDefaultPlaqueProject() {
  return state.productType === 'plaque'
    && !state.plaqueDefaultProjectLoading
    && !state.plaque.isExampleProject
    && !state.plaque.uploadedFile
    && !state.plaque.projectId;
}

async function loadDefaultPlaqueProject() {
  state.plaqueDefaultProjectLoading = true;
  try {
    const project = await loadJsonWithScriptFallback(
      DEFAULT_PLAQUE_PROJECT_SRC,
      DEFAULT_PLAQUE_PROJECT_SCRIPT_SRC,
      'SIGN_GUY_DEFAULT_PLAQUE_PROJECT',
      'Default 3D Plaque project',
    );
    validateSignGuyProject(project);
    const processedCache = await readDefaultPlaqueProcessedCache(project);
    await restoreSignGuyProject(getDefaultPlaqueInitialViewProject(project), {
      isExampleProject: true,
      processedCache,
    });
    setStatus('Ready');
  } catch (error) {
    console.error('Could not load default 3D Plaque project', error);
  } finally {
    state.plaqueDefaultProjectLoading = false;
  }
}

function getDefaultPlaqueInitialViewProject(project) {
  if (!project?.config) return project;
  return {
    ...project,
    config: {
      ...project.config,
      previewZoom: getPlaqueDefaultPreviewZoom(),
      previewPan: { x: 0, y: 0 },
      rotation: getPlaqueDefaultPreviewRotation(),
    },
  };
}

function getPlaqueProcessArtworkOptions() {
  if (state.plaque.artwork?.type !== 'svg') {
    return { maxSide: 2200 };
  }
  return {};
}

async function processPlaqueArtworkWithWorker(artwork, options = {}) {
  if (!canUsePlaqueProcessingWorker(artwork)) return null;
  let bitmap = null;
  let worker = null;
  try {
    bitmap = await createPlaqueProcessingBitmap(artwork);
    if (!bitmap) return null;
    setPlaqueLoadingProgress(58, 'Starting background processing');
    worker = new Worker(PLAQUE_PROCESSING_WORKER_SRC);
    const jobId = `plaque-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const result = await withTimeout(new Promise((resolve, reject) => {
      worker.onmessage = (event) => {
        const message = event.data || {};
        if (message.id && message.id !== jobId) return;
        if (message.type === 'progress') {
          setPlaqueLoadingProgress(message.percent, message.label);
          return;
        }
        if (message.type === 'result') {
          if (message.ok) resolve(message);
          else reject(Object.assign(new Error(message.error || 'Plaque worker failed.'), { code: 'plaque-worker-failed' }));
        }
      };
      worker.onerror = (error) => reject(error);
      worker.postMessage({
        id: jobId,
        type: 'processPlaqueRaster',
        bitmap,
        imageWidth: getArtworkImageWidth(artwork.image),
        imageHeight: getArtworkImageHeight(artwork.image),
        artworkType: artwork.type,
        palette: artwork.palette || null,
        crop: { ...(state.edit.crop || { x: 0, y: 0, w: 1, h: 1 }) },
        options,
        config: getPlaqueWorkerConfig(),
      }, [bitmap]);
      bitmap = null;
    }), PLAQUE_PROCESSING_WORKER_TIMEOUT_MS, 'plaque-worker-timeout');
    return hydratePlaqueWorkerProcessed(result.processed, result.artworkBitmap);
  } catch (error) {
    console.warn('3D Plaque worker processing unavailable; falling back to main-thread processing.', error);
    return null;
  } finally {
    bitmap?.close?.();
    worker?.terminate?.();
  }
}

function canUsePlaqueProcessingWorker(artwork) {
  return state.productType === 'plaque'
    && artwork?.type !== 'svg'
    && !state.plaque.fixFloatingRegions
    && typeof Worker !== 'undefined'
    && typeof OffscreenCanvas !== 'undefined'
    && typeof createImageBitmap === 'function';
}

async function createPlaqueProcessingBitmap(artwork) {
  try {
    return await createImageBitmap(artwork.image);
  } catch (imageError) {
    try {
      const response = await fetch(artwork.dataUrl);
      const blob = await response.blob();
      return createImageBitmap(blob, { imageOrientation: 'from-image' });
    } catch (blobError) {
      console.warn('Could not create a plaque worker image bitmap.', imageError, blobError);
      return null;
    }
  }
}

function getPlaqueWorkerConfig() {
  return {
    removeBg: Boolean(state.plaque.removeBg),
    fixFloatingRegions: Boolean(state.plaque.fixFloatingRegions),
    floatingSupportColour: state.plaque.floatingSupportColour || DEFAULT_FLOATING_SUPPORT_COLOUR,
    targetColorCount: clamp(Number(state.plaque.targetColorCount || state.targetColorCount) || 8, 1, 8),
    tolerance: Number(state.tolerance) || 34,
    traceQuality: normalizePlaqueTraceQuality(state.plaque.traceQuality || PLAQUE_DEFAULT_TRACE_QUALITY),
    zeroGapColourLayers: state.plaque.zeroGapColourLayers !== false,
    frontColoursCustomized: Boolean(state.plaque.frontColoursCustomized || state.frontColoursCustomized),
    includeDebugPayload: shouldKeepPlaqueDeferredDebugData(),
  };
}

function shouldKeepPlaqueDeferredDebugData() {
  return state.productType === 'plaque'
    && Boolean(state.plaque.previewDebugMode)
    && state.plaque.previewDebugMode !== 'extruded';
}

function stripPlaqueDeferredDebugData(processed) {
  if (!processed) return processed;
  (processed.colours || []).forEach((region) => {
    if (!region) return;
    delete region.removedMask;
    delete region.removedPixels;
  });
  return processed;
}

function hydratePlaqueWorkerProcessed(processed, artworkBitmap) {
  if (!processed || !artworkBitmap) return processed || null;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Number(processed.width) || artworkBitmap.width || 1);
  canvas.height = Math.max(1, Number(processed.height) || artworkBitmap.height || 1);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(artworkBitmap, 0, 0);
  artworkBitmap.close?.();
  processed.artworkCanvas = canvas;
  processed.artworkUrl = canvas.toDataURL('image/png');
  return processed;
}

function getDefaultPlaqueProcessedCacheSignature(project) {
  const source = project?.source || {};
  const config = project?.config || {};
  const plaque = config.plaque || {};
  const dataUrl = String(source.dataUrl || '');
  return [
    'default-plaque-processed',
    DEFAULT_PLAQUE_PROCESSED_CACHE_VERSION,
    source.artworkType || '',
    source.fileName || '',
    dataUrl.length,
    dataUrl.slice(0, 96),
    dataUrl.slice(-96),
    normalizePlaqueTraceQuality(plaque.traceQuality || PLAQUE_DEFAULT_TRACE_QUALITY),
    Number(config.targetColorCount) || 0,
    Number(config.tolerance) || 0,
    Boolean(config.removeBg),
    Boolean(config.fixFloatingRegions),
  ].join('|');
}

function shouldUseUploadedPlaqueProcessedCache(options = {}) {
  return options.useUploadedPlaqueProcessedCache !== false
    && state.productType === 'plaque'
    && state.plaque.artwork
    && !state.plaque.isExampleProject
    && Boolean(state.plaque.uploadedFile || state.plaque.artwork.dataUrl || state.plaque.artwork.svgText);
}

async function getUploadedPlaqueProcessedCacheContext(artwork = state.plaque.artwork, file = state.plaque.uploadedFile) {
  try {
    const fingerprint = state.plaque.uploadFingerprint || await getPlaqueArtworkFingerprint(artwork, file);
    if (!fingerprint) return null;
    state.plaque.uploadFingerprint = fingerprint;
    const signature = getUploadedPlaqueProcessedCacheSignature(artwork);
    const key = `${PLAQUE_UPLOAD_PROCESSED_CACHE_PREFIX}${fingerprint}`;
    const processed = await readPlaqueProcessedCacheRecord(key, {
      version: PLAQUE_UPLOAD_PROCESSED_CACHE_VERSION,
      signature,
    });
    return {
      key,
      fingerprint,
      signature,
      sourceName: file?.name || artwork?.name || '',
      processed,
    };
  } catch (error) {
    console.warn('Uploaded 3D Plaque cache lookup failed.', error);
    return null;
  }
}

function getUploadedPlaqueProcessedCacheSignature(artwork = state.plaque.artwork) {
  const processOptions = getPlaqueProcessArtworkOptions();
  const frontColoursCustomized = Boolean(state.plaque.frontColoursCustomized || state.frontColoursCustomized);
  return [
    'uploaded-plaque-processed',
    PLAQUE_UPLOAD_PROCESSED_CACHE_VERSION,
    artwork?.type || '',
    normalizePlaqueTraceQuality(state.plaque.traceQuality || PLAQUE_DEFAULT_TRACE_QUALITY),
    frontColoursCustomized ? (Number(state.plaque.targetColorCount || state.targetColorCount) || 0) : 'auto',
    Number(state.tolerance) || 0,
    Boolean(state.plaque.removeBg),
    Boolean(state.plaque.fixFloatingRegions),
    normalizeHex(state.plaque.floatingSupportColour || state.floatingSupportColour || DEFAULT_FLOATING_SUPPORT_COLOUR),
    stablePlaqueCacheOptionsSignature(processOptions),
  ].join('|');
}

function stablePlaqueCacheOptionsSignature(options = {}) {
  const normalized = {};
  Object.keys(options || {}).sort().forEach((key) => {
    normalized[key] = options[key];
  });
  return JSON.stringify(normalized);
}

async function getPlaqueArtworkFingerprint(artwork = state.plaque.artwork, file = state.plaque.uploadedFile) {
  if (file?.arrayBuffer) {
    try {
      const buffer = await file.arrayBuffer();
      if (buffer?.byteLength) return plaqueBytesDigest(new Uint8Array(buffer));
    } catch (error) {
      console.warn('Could not fingerprint uploaded plaque file bytes; falling back to artwork data.', error);
    }
  }
  const source = String(artwork?.svgText || artwork?.dataUrl || '');
  if (!source) return '';
  return plaqueBytesDigest(new TextEncoder().encode(`${artwork?.type || ''}|${source}`));
}

async function plaqueBytesDigest(bytes) {
  if (window.crypto?.subtle) {
    try {
      const view = bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
        ? bytes.buffer
        : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      const digest = await window.crypto.subtle.digest('SHA-256', view);
      return plaqueDigestToHex(digest);
    } catch (error) {
      console.warn('SHA-256 plaque fingerprint failed; using fallback hash.', error);
    }
  }
  return plaqueFallbackHash(bytes);
}

function plaqueDigestToHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function plaqueFallbackHash(bytes) {
  let hashA = 2166136261;
  let hashB = 0x9e3779b9;
  for (let idx = 0; idx < bytes.length; idx += 1) {
    const byte = bytes[idx];
    hashA ^= byte;
    hashA = Math.imul(hashA, 16777619) >>> 0;
    hashB ^= byte + idx;
    hashB = Math.imul(hashB, 2246822519) >>> 0;
  }
  return `fallback-${bytes.length.toString(16)}-${hashA.toString(16)}-${hashB.toString(16)}`;
}

function clonePlaqueProcessedForCache(processed, options = {}) {
  if (!processed) return null;
  const slimLabelledMap = options.slimLabelledMap !== false;
  const includeDebugData = options.includeDebugData === true;
  const plaqueLabelledMap = clonePlaqueLabelledMapForCache(processed.plaqueLabelledMap, { slim: slimLabelledMap });
  const payload = {
    ...processed,
    artworkCanvas: null,
    colours: (processed.colours || []).map((region) => clonePlaqueRegionForCache(region, { includeDebugData })),
    plaqueLabelledMap,
  };
  if (typeof structuredClone === 'function') return structuredClone(payload);
  return clonePlaqueProcessedFallback(payload);
}

function clonePlaqueLabelledMapForCache(map, options = {}) {
  if (!map) return null;
  if (options.slim !== false) {
    return {
      mode: map.mode,
      width: map.width,
      height: map.height,
      opaquePixels: map.opaquePixels,
      emptyOpaquePixels: map.emptyOpaquePixels,
      sharedBoundaryEdges: map.sharedBoundaryEdges,
      warnings: map.warnings || [],
    };
  }
  return {
    ...map,
    regions: (map.regions || []).map(({ originalRegion, ...region }) => region),
  };
}

function clonePlaqueTypedArray(value) {
  if (!value) return value;
  if (ArrayBuffer.isView(value)) return new value.constructor(value);
  if (Array.isArray(value)) return value.slice();
  return value;
}

function clonePlaqueRegionForCache(region, options = {}) {
  if (!region) return region;
  const { removedMask, removedPixels, ...baseRegion } = region;
  const next = {
    ...baseRegion,
    rgb: Array.isArray(baseRegion.rgb) ? [...baseRegion.rgb] : baseRegion.rgb,
    mask: clonePlaqueTypedArray(baseRegion.mask),
  };
  if (options.includeDebugData) {
    next.removedMask = clonePlaqueTypedArray(removedMask);
    next.removedPixels = removedPixels;
  }
  return next;
}

function clonePlaqueRegionFallback(region) {
  if (!region) return region;
  return {
    ...region,
    rgb: Array.isArray(region.rgb) ? [...region.rgb] : region.rgb,
    mask: clonePlaqueTypedArray(region.mask),
    removedMask: clonePlaqueTypedArray(region.removedMask),
  };
}

function clonePlaqueProcessedFallback(processed) {
  return {
    ...processed,
    alphaMask: clonePlaqueTypedArray(processed.alphaMask),
    alphaValues: clonePlaqueTypedArray(processed.alphaValues),
    regionIndex: clonePlaqueTypedArray(processed.regionIndex),
    colours: (processed.colours || []).map(clonePlaqueRegionFallback),
    plaqueLabelledMap: processed.plaqueLabelledMap ? {
      ...processed.plaqueLabelledMap,
      regionIndex: clonePlaqueTypedArray(processed.plaqueLabelledMap.regionIndex),
      alphaMask: clonePlaqueTypedArray(processed.plaqueLabelledMap.alphaMask),
      alphaValues: clonePlaqueTypedArray(processed.plaqueLabelledMap.alphaValues),
      regions: (processed.plaqueLabelledMap.regions || []).map(clonePlaqueRegionFallback),
    } : null,
    silhouette: Array.isArray(processed.silhouette)
      ? processed.silhouette.map((point) => Array.isArray(point) ? [...point] : point)
      : processed.silhouette,
    warnings: Array.isArray(processed.warnings)
      ? processed.warnings.map((warning) => ({ ...warning }))
      : processed.warnings,
  };
}

function hydrateCachedPlaqueProcessed(processed, artwork = state.plaque.artwork) {
  if (!processed || processed.artworkCanvas || !artwork?.image) return processed;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Number(processed.width) || artwork.image.naturalWidth || artwork.image.width || 1);
  canvas.height = Math.max(1, Number(processed.height) || artwork.image.naturalHeight || artwork.image.height || 1);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(artwork.image, 0, 0, canvas.width, canvas.height);
  processed.artworkCanvas = canvas;
  return processed;
}

function hydrateBundledPlaqueProcessedValue(value) {
  if (!value || typeof value !== 'object') return value;
  if (ArrayBuffer.isView(value)) return value;
  if (Array.isArray(value)) return value.map(hydrateBundledPlaqueProcessedValue);
  if (value.__typedArray && typeof value.data === 'string') {
    return decodeBundledTypedArray(value.__typedArray, value.data);
  }
  Object.keys(value).forEach((key) => {
    value[key] = hydrateBundledPlaqueProcessedValue(value[key]);
  });
  return value;
}

function restorePlaqueProcessedDerivedMaps(processed) {
  if (!processed) return processed;
  const width = Number(processed.width) || 0;
  const height = Number(processed.height) || 0;
  const pixelCount = width * height;
  const regionIndex = processed.regionIndex;
  if (pixelCount > 0 && regionIndex?.length === pixelCount) {
    if (!processed.alphaMask || processed.alphaMask.length !== pixelCount) {
      const alphaMask = new Uint8Array(pixelCount);
      for (let index = 0; index < pixelCount; index += 1) {
        if (regionIndex[index] >= 0) alphaMask[index] = 1;
      }
      processed.alphaMask = alphaMask;
    }
    if (!processed.alphaValues || processed.alphaValues.length !== pixelCount) {
      const alphaValues = new Uint8Array(pixelCount);
      for (let index = 0; index < pixelCount; index += 1) {
        if (processed.alphaMask[index]) alphaValues[index] = 255;
      }
      processed.alphaValues = alphaValues;
    }
    const colours = processed.colours || [];
    const needsMasks = colours.some((region) => !region?.mask || region.mask.length !== pixelCount);
    if (needsMasks) {
      const masks = colours.map(() => new Uint8Array(pixelCount));
      const counts = colours.map(() => 0);
      for (let index = 0; index < pixelCount; index += 1) {
        const region = regionIndex[index];
        if (region < 0 || region >= masks.length) continue;
        masks[region][index] = 1;
        counts[region] += 1;
      }
      colours.forEach((region, index) => {
        if (!region) return;
        region.mask = masks[index];
        if (!Number.isFinite(Number(region.count)) || region.count <= 0) region.count = counts[index];
      });
    }
  }
  return processed;
}

function decodeBundledTypedArray(type, base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  switch (type) {
    case 'Uint8Array':
      return new Uint8Array(buffer);
    case 'Uint16Array':
      return new Uint16Array(buffer);
    case 'Uint32Array':
      return new Uint32Array(buffer);
    case 'Int8Array':
      return new Int8Array(buffer);
    case 'Int16Array':
      return new Int16Array(buffer);
    case 'Int32Array':
      return new Int32Array(buffer);
    case 'Float32Array':
      return new Float32Array(buffer);
    case 'Float64Array':
      return new Float64Array(buffer);
    default:
      return bytes;
  }
}

function getBundledDefaultPlaqueProcessedCache(project) {
  const bundled = window.SIGN_GUY_DEFAULT_PLAQUE_PROCESSED;
  if (!bundled) return null;
  const record = bundled.processed ? bundled : { processed: bundled };
  const expectedSignature = getDefaultPlaqueProcessedCacheSignature(project);
  if (record.version && record.version !== DEFAULT_PLAQUE_PROCESSED_CACHE_VERSION) return null;
  if (record.signature && record.signature !== expectedSignature) return null;
  try {
    const processed = restorePlaqueProcessedDerivedMaps(hydrateBundledPlaqueProcessedValue(record.processed));
    return clonePlaqueProcessedForCache(processed, { slimLabelledMap: false });
  } catch (error) {
    console.warn('Bundled 3D Plaque cache could not be read.', error);
    return null;
  }
}

async function loadBundledDefaultPlaqueProcessedCache(project) {
  if (!window.SIGN_GUY_DEFAULT_PLAQUE_PROCESSED) {
    try {
      await loadScriptOnce(DEFAULT_PLAQUE_PROCESSED_CACHE_SCRIPT_SRC);
    } catch (error) {
      return null;
    }
  }
  return getBundledDefaultPlaqueProcessedCache(project);
}

async function readPlaqueProcessedCacheRecord(id, options = {}) {
  try {
    const db = await openProjectDb();
    if (!db.objectStoreNames.contains(PLAQUE_PROCESSED_CACHE_STORE_NAME)) return null;
    const tx = db.transaction(PLAQUE_PROCESSED_CACHE_STORE_NAME, 'readonly');
    const record = await requestResult(tx.objectStore(PLAQUE_PROCESSED_CACHE_STORE_NAME).get(id));
    await transactionDone(tx);
    if (!record) return null;
    if (options.version && record.version !== options.version) return null;
    if (options.signature && record.signature !== options.signature) return null;
    return clonePlaqueProcessedForCache(record.processed, { slimLabelledMap: false });
  } catch (error) {
    console.warn('3D Plaque processed cache was unavailable.', error);
    return null;
  }
}

async function writePlaqueProcessedCacheRecord(record) {
  if (!record?.id || !record.processed) return;
  const db = await openProjectDb();
  if (!db.objectStoreNames.contains(PLAQUE_PROCESSED_CACHE_STORE_NAME)) return;
  const tx = db.transaction(PLAQUE_PROCESSED_CACHE_STORE_NAME, 'readwrite');
  tx.objectStore(PLAQUE_PROCESSED_CACHE_STORE_NAME).put(record);
  await transactionDone(tx);
}

async function pruneUploadedPlaqueProcessedCache() {
  const db = await openProjectDb();
  if (!db.objectStoreNames.contains(PLAQUE_PROCESSED_CACHE_STORE_NAME)) return;
  const tx = db.transaction(PLAQUE_PROCESSED_CACHE_STORE_NAME, 'readwrite');
  const store = tx.objectStore(PLAQUE_PROCESSED_CACHE_STORE_NAME);
  const records = await requestResult(store.getAll());
  records
    .filter((record) => record?.kind === 'upload')
    .sort((a, b) => String(b.savedAt || '').localeCompare(String(a.savedAt || '')))
    .slice(PLAQUE_UPLOAD_PROCESSED_CACHE_LIMIT)
    .forEach((record) => store.delete(record.id));
  await transactionDone(tx);
}

async function writeUploadedPlaqueProcessedCache(context, processed) {
  if (!context?.key || !processed) return;
  await writePlaqueProcessedCacheRecord({
    id: context.key,
    kind: 'upload',
    version: PLAQUE_UPLOAD_PROCESSED_CACHE_VERSION,
    signature: context.signature,
    fingerprint: context.fingerprint,
    sourceName: context.sourceName || '',
    savedAt: new Date().toISOString(),
    processed: clonePlaqueProcessedForCache(processed),
  });
  await pruneUploadedPlaqueProcessedCache();
}

function queueUploadedPlaqueProcessedCacheWrite(context, processed) {
  if (!context?.key || !processed) return;
  setTimeout(() => {
    writeUploadedPlaqueProcessedCache(context, processed).catch((error) => {
      console.warn('Could not cache uploaded 3D Plaque processing.', error);
    });
  }, 80);
}

async function readDefaultPlaqueProcessedCache(project) {
  const bundled = await loadBundledDefaultPlaqueProcessedCache(project);
  if (bundled) return bundled;
  try {
    const db = await openProjectDb();
    if (!db.objectStoreNames.contains(PLAQUE_PROCESSED_CACHE_STORE_NAME)) return null;
    const tx = db.transaction(PLAQUE_PROCESSED_CACHE_STORE_NAME, 'readonly');
    const record = await requestResult(tx.objectStore(PLAQUE_PROCESSED_CACHE_STORE_NAME).get(DEFAULT_PLAQUE_PROCESSED_CACHE_KEY));
    await transactionDone(tx);
    if (!record) return null;
    if (record.version !== DEFAULT_PLAQUE_PROCESSED_CACHE_VERSION) return null;
    if (record.signature !== getDefaultPlaqueProcessedCacheSignature(project)) return null;
    return clonePlaqueProcessedForCache(record.processed, { slimLabelledMap: false });
  } catch (error) {
    console.warn('Default 3D Plaque cache was unavailable.', error);
    return null;
  }
}

async function writeDefaultPlaqueProcessedCache(project, processed) {
  if (!project || !processed) return;
  const db = await openProjectDb();
  if (!db.objectStoreNames.contains(PLAQUE_PROCESSED_CACHE_STORE_NAME)) return;
  const tx = db.transaction(PLAQUE_PROCESSED_CACHE_STORE_NAME, 'readwrite');
  tx.objectStore(PLAQUE_PROCESSED_CACHE_STORE_NAME).put({
    id: DEFAULT_PLAQUE_PROCESSED_CACHE_KEY,
    version: DEFAULT_PLAQUE_PROCESSED_CACHE_VERSION,
    signature: getDefaultPlaqueProcessedCacheSignature(project),
    savedAt: new Date().toISOString(),
    processed: clonePlaqueProcessedForCache(processed),
  });
  await transactionDone(tx);
}

function queueDefaultPlaqueProcessedCacheWrite(project, processed) {
  if (!project || !processed) return;
  setTimeout(() => {
    writeDefaultPlaqueProcessedCache(project, processed).catch((error) => {
      console.warn('Could not cache the default 3D Plaque payload.', error);
    });
  }, 80);
}

function openPlaqueColourPopover(index, anchor) {
  const layers = getPlaqueLayerDescriptors();
  state.selectedColourTarget = { type: 'plaque', index };
  state.plaque.selectedLayer = clamp(index, 0, Math.max(0, layers.length - 1));
  const hex = getPlaqueLayerDisplayHex(layers[index], index);
  updatePopoverInputs(hex);
  positionColourPopover(anchor);
  renderUsedColourGrid();
  setPopoverTab('used');
}

function openPlaqueBackingColourPopover(anchor) {
  state.selectedColourTarget = { type: 'plaqueBacking' };
  const hex = getPlaqueBackingHex(state.processed);
  updatePopoverInputs(hex);
  positionColourPopover(anchor);
  renderUsedColourGrid();
  setPopoverTab('used');
}

function buildPlaqueThreeModel() {
  if (!state.three || !state.processed || !window.THREE) return;
  clearThreeModel();
  syncPlaqueLayers();
  const processed = state.processed;
  const bounds = getModelBounds(processed);
  const baseThickness = clamp(Number(state.plaque.baseThickness) || PLAQUE_DEFAULT_BASE_THICKNESS, PLAQUE_BASE_THICKNESS_MIN, PLAQUE_BASE_THICKNESS_MAX);
  const group = new THREE.Group();
  group.position.y = getThreeModelYOffset(bounds);
  group.userData.bounds = bounds;
  group.userData.product = 'plaque';
  group.userData.plaqueBaseThickness = baseThickness;
  group.userData.plaqueMeshes = [];
  group.userData.frontArtworkObjects = [];

  const svgLayers = state.isDefaultPreview ? [] : getSvgPlaqueLayers();
  group.userData.hasSvgPlaqueLayers = Boolean(svgLayers.length);
  const previewMode = state.plaque.previewDebugMode || 'extruded';
  if (!state.isDefaultPreview && previewMode !== 'extruded') {
    buildPlaqueProcessedVectorPreview(group, processed, bounds, svgLayers, previewMode);
    group.userData.solidMode = `processed-${previewMode}-preview`;
  } else if (svgLayers.length) {
    const baseHex = getPlaqueBasePlateHex(processed);
    const svgBounds = getSvgArtworkBounds();
    const baseShape = makeSvgPlaqueBackingShape(svgLayers, svgBounds, bounds) || makePlaqueBaseShape(processed, bounds);
    const backing = buildPlaqueBackingSlab(group, baseShape, baseHex, baseThickness, {
      name: 'plaqueBase',
      label: 'Base plate',
      bevelSize: 0.16,
      bevelThickness: 0.12,
      bevelSegments: 4,
      curveSegments: 64,
    });
    buildSvgPlaqueLayers(group, svgLayers, bounds, backing.frontZ, backing.baseMesh);
    if (state.plaque.showVectorDebug) addPlaqueBaseDebugLines(group, baseShape, baseThickness);
    if (state.plaque.topologyDebug) addPlaqueAxisDebug(group, bounds, baseThickness);
    group.userData.solidMode = 'svg-shared-relief';
  } else {
    buildRasterPlaqueSolid(group, processed, bounds, baseThickness);
    if (!group.userData.solidMode) group.userData.solidMode = 'raster-shared-contour-relief';
  }

  addPlaqueSelectionOutline(group);
  applyPlaqueDebugMaterials(group);
  state.three.group = group;
  state.three.scene.add(group);
  state.three.floorGroup = null;
  els.stage.classList.add('three-active', 'preview-ready');
  applyRotation();
  updatePlaqueLayerHighlight();
  applyPlaqueBackingOnlyMode(group);
  renderThree();
  finishPlaqueBuildStatus();
}

function shouldUsePlaqueFastRaisedPreview(processed) {
  if (!processed || state.artwork?.type === 'svg') return false;
  const width = processed.width || 0;
  const height = processed.height || 0;
  const colourCount = processed.colours?.length || 0;
  const sourceSide = Math.max(width, height);
  const pixelLayerCost = width * height * Math.max(1, colourCount);
  return sourceSide > 1050 || colourCount >= 6 || pixelLayerCost > 3600000;
}

function limitPlaquePreviewSilhouette(points, maxPoints) {
  if (!Array.isArray(points) || points.length <= maxPoints) return points;
  const step = Math.ceil(points.length / maxPoints);
  return points.filter((_, index) => index % step === 0);
}

function buildRasterPlaqueLayers(group, processed, bounds) {
  const resources = state.three.resources;
  getPlaqueRaisedRasterRenderRegions(processed).forEach((region, index) => {
    const depth = clamp(Number(state.plaque.layerDepths[index]) || PLAQUE_DEFAULT_LAYER_DEPTH, PLAQUE_LAYER_DEPTH_MIN, PLAQUE_LAYER_DEPTH_MAX);
    const hex = getPlaqueLayerDisplayHex({ type: 'raster', hex: region.hex }, index);
    const material = makePlaqueMaterial(hex, { roughness: 0.9 });
    const layerGroup = buildRasterPlaqueContourGroup(region.mask, processed.width, processed.height, bounds, { depth, hex, index, material, cacheOwner: region.sourceRegion || region });
    if (!layerGroup.children.length) return;
    layerGroup.userData = { ...layerGroup.userData, plaqueLayer: index, depth, hex, material };
    layerGroup.renderOrder = 10 + index;
    group.add(layerGroup);
    group.userData.plaqueMeshes.push(layerGroup);
    group.userData.frontArtworkObjects = group.userData.frontArtworkObjects || [];
    group.userData.frontArtworkObjects.push(layerGroup);
    resources.push(material, ...layerGroup.userData.geometries);
    const topMesh = state.plaque.hideTopTexture ? null : makeRasterPlaqueTopSurface(processed, index, bounds, depth, hex);
    if (topMesh) {
      topMesh.userData = { plaqueLayer: index, depth };
      layerGroup.add(topMesh);
      resources.push(topMesh.geometry, topMesh.material.map, topMesh.material);
    }
  });
}

function buildPlaqueProcessedVectorPreview(group, processed, bounds, svgLayers, mode = 'vector') {
  const resources = state.three.resources;
  if (mode === 'artifacts' && !svgLayers?.length) {
    buildPlaqueRemovedArtifactPreview(group, processed, bounds);
    return;
  }
  const layers = svgLayers?.length
    ? svgLayers.map((layer, index) => ({
      index,
      hex: getPlaqueLayerDisplayHex(layer, index),
      shapes: layer.shapes.map((shape) => transformSvgShapeToPlaquePlane(shape, getSvgArtworkBounds(), bounds)),
    }))
    : getPlaqueRasterRenderRegions(processed).map((region, index) => ({
      index,
      hex: getPlaqueLayerDisplayHex({ type: 'raster', hex: region.hex }, index),
      shapes: buildRasterPlaqueShapes(region.mask, processed.width, processed.height, bounds, {
        ...getPlaqueRasterPreviewQuality(processed),
        outerOnly: false,
        cacheOwner: region,
      }),
    }));
  layers.forEach((layer, index) => {
    const material = new THREE.MeshBasicMaterial({
      color: makeThreeColour(layer.hex),
      side: THREE.DoubleSide,
      transparent: mode === 'masks' || mode === 'assignments',
      opacity: mode === 'masks' ? 0.82 : (mode === 'assignments' ? 0.9 : 1),
      depthWrite: true,
    });
    material.toneMapped = false;
    layer.shapes.forEach((shape, shapeIndex) => {
      const GeometryClass = THREE.ShapeBufferGeometry || THREE.ShapeGeometry;
      const geometry = new GeometryClass(shape, 24);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = `plaqueProcessed${mode}Layer${index}Shape${shapeIndex}`;
      mesh.position.z = index * 0.04;
      mesh.renderOrder = 30 + index;
      mesh.userData = { plaqueLayer: layer.index, plaqueBackingOnlyHidden: true };
      group.add(mesh);
      group.userData.frontArtworkObjects.push(mesh);
      resources.push(geometry);
    });
    resources.push(material);
  });
  if ((mode === 'masks' || mode === 'assignments') && processed.artworkCanvas) {
    const source = state.frontColoursCustomized ? createMappedArtworkCanvas(processed) : processed.artworkCanvas;
    const texture = new THREE.CanvasTexture(source);
    texture.encoding = THREE.sRGBEncoding;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    const geometry = new THREE.PlaneBufferGeometry(bounds.width, bounds.height);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: mode === 'assignments' ? 0.18 : 0.28,
      side: THREE.FrontSide,
      depthWrite: false,
    });
    material.toneMapped = false;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'plaqueSourceArtworkMaskComparison';
    mesh.position.z = layers.length * 0.04 + 0.08;
    mesh.renderOrder = 90;
    group.add(mesh);
    resources.push(texture, geometry, material);
  }
}

function buildPlaqueRemovedArtifactPreview(group, processed, bounds) {
  const resources = state.three.resources;
  const material = new THREE.MeshBasicMaterial({
    color: 0xff3b30,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    depthWrite: true,
  });
  material.toneMapped = false;
  let shapeCount = 0;
  (processed.colours || []).forEach((region, index) => {
    if (!region.removedMask || !region.removedPixels) return;
    const shapes = buildRasterPlaqueShapes(region.removedMask, processed.width, processed.height, bounds, {
      maxTraceSide: Math.min(900, getPlaqueRasterPreviewQuality(processed).maxTraceSide),
      minAreaRatio: 0.000002,
      maxShapes: 120,
      maxHoles: 24,
      preserveCorners: true,
      preserveLogoEdges: true,
      simplifyTolerance: 0.32,
      finalPointSpacing: 0.06,
    });
    shapes.forEach((shape, shapeIndex) => {
      const GeometryClass = THREE.ShapeBufferGeometry || THREE.ShapeGeometry;
      const geometry = new GeometryClass(shape, 16);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = `plaqueRemovedArtifactLayer${index}Shape${shapeIndex}`;
      mesh.position.z = index * 0.04;
      mesh.renderOrder = 120 + index;
      group.add(mesh);
      resources.push(geometry);
      shapeCount += 1;
    });
  });
  if (!shapeCount && processed.artworkCanvas) {
    const texture = new THREE.CanvasTexture(processed.artworkCanvas);
    texture.encoding = THREE.sRGBEncoding;
    texture.generateMipmaps = false;
    const geometry = new THREE.PlaneBufferGeometry(bounds.width, bounds.height);
    const base = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.18,
      side: THREE.FrontSide,
      depthWrite: false,
    }));
    base.name = 'plaqueNoRemovedArtifactsReference';
    group.add(base);
    resources.push(texture, geometry, base.material);
  }
  resources.push(material);
}

function buildRasterPlaqueSolid(group, processed, bounds, baseThickness) {
  buildSmoothRasterPlaqueSolid(group, processed, bounds, baseThickness);
}

function buildPlaqueBackingSlab(group, baseShape, hex, baseThickness, options = {}) {
  const resources = state.three.resources;
  const baseMaterial = makePlaqueMaterial(hex, {
    roughness: options.roughness ?? 0.88,
    colourAccurate: true,
    colourBoost: options.colourBoost ?? 0.1,
  });
  baseMaterial.side = THREE.DoubleSide;
  const baseGeometry = new THREE.ExtrudeBufferGeometry(baseShape, {
    depth: baseThickness,
    bevelEnabled: options.bevelEnabled ?? true,
    bevelSize: options.bevelSize ?? 0.2,
    bevelThickness: options.bevelThickness ?? 0.16,
    bevelSegments: options.bevelSegments ?? 5,
    curveSegments: options.curveSegments ?? 48,
  });
  baseGeometry.translate(0, 0, 0);
  baseGeometry.computeVertexNormals();
  smoothPlaqueBackingSideNormals(baseGeometry, baseThickness, 0, baseThickness, {
    sideNormalBucketSize: options.sideNormalBucketSize ?? 0.95,
    sideNormalBucketRadius: options.sideNormalBucketRadius ?? 3,
    sideNormalAngleDotMin: options.sideNormalAngleDotMin ?? 0.08,
  });
  const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
  baseMesh.name = options.name || 'plaqueUnifiedBaseSolid';
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = false;
  baseGeometry.computeBoundingBox?.();
  const backingBackZ = Number.isFinite(baseGeometry.boundingBox?.min?.z) ? baseGeometry.boundingBox.min.z : 0;
  const backingFrontZ = Number.isFinite(baseGeometry.boundingBox?.max?.z) ? baseGeometry.boundingBox.max.z : baseThickness;
  baseMesh.userData.plaqueBackingFrontZ = backingFrontZ;
  group.userData.plaqueBackingFrontZ = backingFrontZ;
  validatePlaqueMeshZRange(baseMesh, options.label || 'Plaque base plate', backingBackZ, backingFrontZ);
  const backingGroup = new THREE.Group();
  backingGroup.name = 'plaqueBackingPlateGroup';
  backingGroup.userData.isPlaqueBackingPlate = true;
  backingGroup.add(baseMesh);
  group.add(backingGroup);
  resources.push(baseGeometry, baseMaterial);
  return {
    backingGroup,
    baseMesh,
    baseGeometry,
    baseMaterial,
    frontZ: backingFrontZ,
  };
}

function buildSmoothRasterPlaqueSolid(group, processed, bounds, baseThickness) {
  const resources = state.three.resources;
  const previewQuality = getPlaqueRasterPreviewQuality(processed);
  const backingHex = getPlaqueBackingHex(processed);
  const baseShape = makePlaqueBaseShape(processed, bounds);
  const backing = buildPlaqueBackingSlab(group, baseShape, backingHex, baseThickness, {
    name: 'plaqueUnifiedBaseSolid',
    label: 'Raster base plate',
    bevelSize: 0.2,
    bevelThickness: 0.16,
    bevelSegments: 5,
    curveSegments: 48,
  });
  const baseMesh = backing.baseMesh;
  const renderRegions = getPlaqueRaisedRasterRenderRegions(processed);
  const topology = {
    topFaces: 0,
    sideFaces: 0,
    bottomFaces: 0,
    solidCells: 0,
    openEdges: 0,
    shells: 1 + renderRegions.length,
    pipeline: 'shared-raster-contour-relief',
  };
  const rasterLayerZBase = getPlaqueColourLayerBottomZ(backing.frontZ);
  renderRegions.forEach((region, index) => {
    const layerRise = clamp(Number(state.plaque.layerDepths[index]) || getDefaultPlaqueLayerDepth(index, region), PLAQUE_LAYER_DEPTH_MIN, PLAQUE_LAYER_DEPTH_MAX);
    const depth = layerRise;
    const hex = getPlaqueLayerDisplayHex({ type: 'raster', hex: region.hex }, index);
    const material = makePlaqueExtrudeMaterials(hex, { roughness: 0.86 });
    const contourOptions = getPlaqueContourClassOptions(region, index, processed, previewQuality);
    const layerGroup = buildRasterPlaqueContourGroup(region.mask, processed.width, processed.height, bounds, {
      depth,
      hex,
      index,
      material,
      zBase: rasterLayerZBase,
      cacheOwner: region.sourceRegion || region,
      ...previewQuality,
      ...contourOptions,
    });
    if (!layerGroup.children.length) return;
    layerGroup.userData = {
      ...layerGroup.userData,
      plaqueLayer: index,
      depth,
      hex,
      material,
    };
    group.add(layerGroup);
    group.userData.plaqueMeshes.push(layerGroup);
    group.userData.frontArtworkObjects = group.userData.frontArtworkObjects || [];
    group.userData.frontArtworkObjects.push(layerGroup);
    resources.push(...flattenMaterials(material), ...layerGroup.userData.geometries);
    topology.topFaces += layerGroup.userData.geometries.reduce((sum, geometry) => sum + (geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3), 0);
    validatePlaqueColourLayerGap(baseMesh, layerGroup, `Raster layer ${index}`);
    if (state.plaque.showVectorDebug) addRasterLayerDebugLines(group, layerGroup, index, depth);
  });
  group.userData.topology = topology;
  group.userData.solidMode = 'shared-contour-relief';
  if (state.plaque.topologyDebug) addPlaqueTopologyDebug(group, topology, bounds);
}

function preparePlaqueSolidField(processed, maxSide = 380) {
  const scale = Math.min(1, maxSide / Math.max(processed.width, processed.height));
  const width = Math.max(12, Math.round(processed.width * scale));
  const height = Math.max(12, Math.round(processed.height * scale));
  const cells = new Int16Array(width * height);
  cells.fill(-1);
  const samples = [
    [0.5, 0.5],
    [0.25, 0.25],
    [0.75, 0.25],
    [0.25, 0.75],
    [0.75, 0.75],
  ];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const counts = new Map();
      let opaqueHits = 0;
      samples.forEach(([offsetX, offsetY]) => {
        const sx = clamp(Math.floor(((x + offsetX) / width) * processed.width), 0, processed.width - 1);
        const sy = clamp(Math.floor(((y + offsetY) / height) * processed.height), 0, processed.height - 1);
        const sourceIndex = sy * processed.width + sx;
        if (!processed.alphaMask[sourceIndex]) return;
        opaqueHits += 1;
        const region = processed.regionIndex[sourceIndex] ?? 0;
        counts.set(region, (counts.get(region) || 0) + 1);
      });
      if (!opaqueHits) continue;
      let bestRegion = 0;
      let bestCount = -1;
      counts.forEach((count, region) => {
        if (count > bestCount) {
          bestCount = count;
          bestRegion = region;
        }
      });
      cells[y * width + x] = bestRegion;
    }
  }
  return { width, height, cells };
}

function getPlaqueSolidFieldMaxSide(processed) {
  const sourceSide = Math.max(processed?.width || 0, processed?.height || 0);
  if (sourceSide >= 1600) return 420;
  if (sourceSide >= 900) return 380;
  return 340;
}

function makePlaqueLayerTopHeights(layerCount, baseThickness) {
  const heights = [];
  let current = 0;
  for (let index = 0; index < layerCount; index += 1) {
    if (index > 0) {
      current += clamp(Number(state.plaque.layerDepths[index]) || PLAQUE_DEFAULT_LAYER_DEPTH, PLAQUE_LAYER_DEPTH_MIN, PLAQUE_LAYER_DEPTH_MAX);
    }
    heights[index] = current;
  }
  if (layerCount === 1) heights[0] = 0;
  return heights.map((height) => Math.max(0, Math.min(height, baseThickness + PLAQUE_LAYER_DEPTH_MAX * layerCount)));
}

function makePlaqueSolidMaterials(processed) {
  const materials = (processed.colours || []).map((region, index) => makePlaqueMaterial(getPlaqueLayerDisplayHex({ type: 'raster', hex: region.hex }, index), { roughness: 0.9 }));
  materials.push(makePlaqueMaterial('#202326', { roughness: 0.92 }));
  return materials;
}

function getPlaqueBackingHex(processed) {
  if (state.plaque.backingColourOverride) return normalizeHex(state.plaque.backingColourOverride);
  const uploadedBackingHex = getUploadedRasterPlaqueDefaultBackingHex(processed);
  if (uploadedBackingHex) return uploadedBackingHex;
  const colours = processed?.colours || [];
  const edgeIndex = getPlaqueOuterEdgeColourIndex(processed);
  if (edgeIndex >= 0 && colours[edgeIndex]) {
    return normalizeHex(colours[edgeIndex].hex);
  }
  if (processed?.plaqueEdgeHex) return normalizeHex(processed.plaqueEdgeHex);
  const nonWhite = colours
    .map((region, index) => ({ region, index, hex: normalizeHex(region.hex) }))
    .filter((item) => !isNearWhiteHex(item.hex))
    .sort((a, b) => (b.region.count || 0) - (a.region.count || 0));
  return nonWhite[0]?.hex || normalizeHex(colours[0]?.hex || '#f2efe7');
}

function getUploadedRasterPlaqueDefaultBackingHex(processed) {
  if (!shouldUseUploadedRasterPlaqueHierarchy(processed)) return '';
  const regions = getPlaqueRasterRenderRegions(processed);
  if (!regions?.length) return '#ffffff';
  const totalPixels = Math.max(1, regions.reduce((sum, region) => sum + (Number(region?.count) || 0), 0));
  const edgeIndex = getPlaqueOuterEdgeColourIndex(processed);
  const infos = regions.map((region, index) => {
    const hex = normalizeHex(region?.hex || '#ffffff');
    const rgb = hexToRgb(hex);
    const count = Number(region?.count) || 0;
    return {
      index,
      hex,
      chroma: colourChroma(rgb),
      count,
      share: count / totalPixels,
      isEdge: index === edgeIndex,
      isNearWhite: isNearWhiteHex(hex),
    };
  });
  const hasBackingOverride = Boolean(state.plaque.backingColourOverride);
  const backingIndex = hasBackingOverride ? -1 : getUploadedRasterBackingRegionIndex(infos);
  if (backingIndex >= 0 && regions[backingIndex]) return normalizeHex(regions[backingIndex].hex);
  const whiteRegion = infos
    .filter((info) => info.isNearWhite && info.share >= 0.035)
    .sort((a, b) => b.share - a.share)[0];
  return whiteRegion?.hex || '#ffffff';
}

function getPlaqueBasePlateHex(processed) {
  const colours = processed?.colours || [];
  if (state.productType === 'plaque' && state.plaque.artwork?.type !== 'svg') {
    return getPlaqueBackingHex(processed);
  }
  const whiteLayer = colours
    .map((region, index) => ({ region, index, hex: getPlaqueLayerDisplayHex({ type: 'raster', hex: region.hex }, index) }))
    .filter((item) => isNearWhiteHex(item.hex))
    .sort((a, b) => (b.region.count || 0) - (a.region.count || 0))[0];
  return whiteLayer?.hex || '#ffffff';
}

function addPlaqueTopologyDebug(group, topology, bounds) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(17, 17, 17, 0.86)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffc529';
  ctx.font = '700 18px sans-serif';
  ctx.fillText('Topology validation', 18, 34);
  ctx.fillStyle = '#f8f5ec';
  ctx.font = '600 15px sans-serif';
  [
    `Solid cells: ${topology.solidCells}`,
    `Top faces: ${topology.topFaces}`,
    `Side faces: ${topology.sideFaces}`,
    `Open edges: ${topology.openEdges}`,
  ].forEach((line, index) => ctx.fillText(line, 18, 65 + index * 22));
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
  });
  const geometry = new THREE.PlaneBufferGeometry(Math.min(bounds.width, 260), 80);
  const panel = new THREE.Mesh(geometry, material);
  panel.name = 'plaqueTopologyDebugPanel';
  panel.position.set(0, bounds.maxY + 50, 34);
  panel.renderOrder = 250;
  group.add(panel);
  state.three.resources.push(texture, material, geometry);
}

function addPlaqueAxisDebug(group, bounds, baseThickness) {
  const axis = new THREE.AxesHelper(Math.min(bounds.width, bounds.height) * 0.28);
  axis.name = 'plaqueAxisDebug';
  axis.position.set(bounds.minX - 22, bounds.minY - 22, baseThickness);
  group.add(axis);
  const planeMaterial = new THREE.MeshBasicMaterial({
    color: 0xffc529,
    transparent: true,
    opacity: 0.08,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  [0, baseThickness].forEach((z, index) => {
    const geometry = new THREE.PlaneBufferGeometry(bounds.width, bounds.height);
    const plane = new THREE.Mesh(geometry, planeMaterial);
    plane.name = index === 0 ? 'plaqueZ0Plane' : 'plaqueBaseTopPlane';
    plane.position.z = z;
    plane.renderOrder = 240 + index;
    group.add(plane);
    state.three.resources.push(geometry);
  });
  state.three.resources.push(planeMaterial);
}

function addPlaqueNormalsDebug(group, field, topHeights, bounds) {
  const positions = [];
  const step = Math.max(3, Math.round(Math.max(field.width, field.height) / 28));
  const normalLength = Math.max(4, Math.min(bounds.width, bounds.height) * 0.035);
  const xAt = (x) => (x / field.width - 0.5) * bounds.width;
  const yAt = (y) => (0.5 - y / field.height) * bounds.height;
  for (let y = 0; y < field.height; y += step) {
    for (let x = 0; x < field.width; x += step) {
      const region = field.cells[y * field.width + x];
      if (region < 0) continue;
      const z = topHeights[region] ?? 0;
      const px = xAt(x + 0.5);
      const py = yAt(y + 0.5);
      positions.push(px, py, z + 0.35, px, py, z + normalLength);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({
    color: 0x57d8ff,
    transparent: true,
    opacity: 0.82,
  });
  const lines = new THREE.LineSegments(geometry, material);
  lines.name = 'plaqueNormalsDebug';
  lines.renderOrder = 260;
  group.add(lines);
  state.three.resources.push(geometry, material);
}

function validatePlaqueMeshZRange(mesh, label, expectedMin, expectedMax) {
  const geometry = mesh?.geometry;
  if (!geometry?.attributes?.position) return;
  geometry.computeBoundingBox();
  const zMin = geometry.boundingBox.min.z;
  const zMax = geometry.boundingBox.max.z;
  const tolerance = 0.03;
  const ok = zMin >= expectedMin - tolerance && zMax <= expectedMax + tolerance;
  const range = {
    zMin,
    zMax,
    expectedMin,
    expectedMax,
    ok,
  };
  mesh.userData = { ...mesh.userData, zRange: range };
  const message = `[3D Plaque z-range] ${label}: zMin=${zMin.toFixed(3)} zMax=${zMax.toFixed(3)} expected=${expectedMin.toFixed(3)}..${expectedMax.toFixed(3)}`;
  if (!ok) {
    console.warn(message);
    mesh.userData.zRangeWarning = true;
    return;
  }
  if (state.plaque.topologyDebug) console.info(message);
}

function getPlaqueColourLayerBottomZ(backingFrontZ) {
  return (Number(backingFrontZ) || 0) + PLAQUE_LAYER_Z_EPSILON;
}

function validatePlaqueColourLayerGap(backingMesh, layerGroup, label, tolerance = 0.05) {
  if (!backingMesh || !layerGroup || !window.THREE) return;
  const backingBox = new THREE.Box3().setFromObject(backingMesh);
  if (!Number.isFinite(backingBox.max.z)) return;
  layerGroup.traverse((child) => {
    if (!child.isMesh) return;
    const colourLayerBox = new THREE.Box3().setFromObject(child);
    if (!Number.isFinite(colourLayerBox.min.z)) return;
    const gap = colourLayerBox.min.z - backingBox.max.z;
    child.userData.plaqueColourGap = gap;
    const message = `plaque colour gap ${label}: ${gap.toFixed(4)}`;
    if (Math.abs(gap) > tolerance) {
      console.warn(message, { gap, tolerance, layer: child.name || label });
      child.userData.plaqueColourGapWarning = true;
    } else if (state.plaque.topologyDebug) {
      console.info(message);
    }
  });
}

function validateRenderedPlaqueColourGaps(group = state.three?.group) {
  if (!group || !window.THREE) return;
  const backingGroup = group.getObjectByName?.('plaqueBackingPlateGroup');
  const backingMesh = backingGroup?.children?.find((child) => child.isMesh);
  if (!backingMesh) return;
  (group.userData?.plaqueMeshes || []).forEach((layerGroup, index) => {
    validatePlaqueColourLayerGap(backingMesh, layerGroup, `Rendered layer ${index}`);
  });
}

function applyPlaqueBackingOnlyMode(group = state.three?.group) {
  if (!group) return;
  const showArtwork = !state.plaque.showBackingOnly;
  (group.userData?.frontArtworkObjects || []).forEach((object) => {
    object.visible = showArtwork;
  });
  group.traverse((object) => {
    if (!object.userData?.plaqueBackingOnlyHidden) return;
    object.visible = showArtwork;
  });
}

function addPlaqueSawtoothHole(baseShape, bounds) {
  if (!window.THREE || !baseShape) return;
  const shapes = Array.isArray(baseShape) ? baseShape : [baseShape];
  const target = shapes.reduce((best, shape) => (Math.abs(estimateShapeArea(shape)) > Math.abs(estimateShapeArea(best)) ? shape : best), shapes[0]);
  target.holes.push(makePlaqueSawtoothPath(bounds));
}

function makePlaqueSawtoothPath(bounds) {
  const width = clamp(bounds.width * 0.16, 24, 46);
  const height = width * 0.32;
  const cx = 0;
  const cy = (bounds.minY + bounds.maxY) / 2;
  const left = cx - width / 2;
  const right = cx + width / 2;
  const top = cy + height / 2;
  const bottom = cy - height / 2;
  const toothCount = 5;
  const toothStep = width / toothCount;
  const path = new THREE.Path();
  path.moveTo(left, top);
  path.lineTo(right, top);
  path.lineTo(right, bottom + height * 0.42);
  for (let tooth = toothCount; tooth >= 0; tooth -= 1) {
    const x = left + tooth * toothStep;
    const tipX = left + (tooth - 0.5) * toothStep;
    path.lineTo(x, bottom + height * 0.42);
    if (tooth > 0) path.lineTo(tipX, bottom);
  }
  path.lineTo(left, top);
  path.closePath();
  return path;
}

function buildSvgPlaqueLayers(group, svgLayers, bounds, backingFrontZ, backingMesh = null) {
  const resources = state.three.resources;
  const svgBounds = getSvgArtworkBounds();
  svgLayers.forEach((layer, index) => {
    const depth = getPlaqueLayerDepthForIndex(index);
    const zStart = getPlaqueColourLayerBottomZ(backingFrontZ);
    const hex = getPlaqueLayerDisplayHex(layer, index);
    const material = makePlaqueExtrudeMaterials(hex, { roughness: 0.86 });
    const layerGroup = new THREE.Group();
    layerGroup.name = `plaqueSvgLayer${index}`;
    layerGroup.userData = {
      plaqueLayer: index,
      depth,
      hex,
      material,
      points: getSvgLayerOutlinePoints(layer, svgBounds, bounds),
      geometries: [],
    };
    layer.shapes.forEach((shape) => {
      const transformedShape = transformSvgShapeToPlaquePlane(shape, svgBounds, bounds);
      const geometry = makeCachedPlaqueExtrudeGeometry(transformedShape, {
        depth,
        zBase: zStart,
        bevelEnabled: false,
        curveSegments: 64,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData = { plaqueLayer: index, depth };
      mesh.castShadow = true;
      mesh.receiveShadow = false;
      validatePlaqueMeshZRange(mesh, `SVG layer ${index} ${hex}`, zStart, zStart + depth);
      layerGroup.add(mesh);
      layerGroup.userData.geometries.push(geometry);
    });
    if (!layerGroup.children.length) return;
    group.add(layerGroup);
    group.userData.plaqueMeshes.push(layerGroup);
    group.userData.frontArtworkObjects = group.userData.frontArtworkObjects || [];
    group.userData.frontArtworkObjects.push(layerGroup);
    resources.push(...flattenMaterials(material), ...layerGroup.userData.geometries);
    if (backingMesh) validatePlaqueColourLayerGap(backingMesh, layerGroup, `SVG layer ${index}`);
    if (state.plaque.showVectorDebug) addSvgLayerDebugLines(group, layer, svgBounds, bounds, index, depth);
  });
}

function makeRasterPlaqueTopSurface(processed, index, bounds, depth, hex, zOverride = null) {
  const canvas = document.createElement('canvas');
  canvas.width = processed.width;
  canvas.height = processed.height;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(processed.width, processed.height);
  const rgb = hexToRgb(hex);
  for (let i = 0; i < processed.regionIndex.length; i += 1) {
    const o = i * 4;
    if (!processed.alphaMask[i] || processed.regionIndex[i] !== index) {
      img.data[o + 3] = 0;
      continue;
    }
    img.data[o] = rgb[0];
    img.data[o + 1] = rgb[1];
    img.data[o + 2] = rgb[2];
    img.data[o + 3] = processed.alphaValues?.[i] || 255;
  }
  ctx.putImageData(img, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.encoding = THREE.sRGBEncoding;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  const geometry = new THREE.PlaneBufferGeometry(bounds.width, bounds.height);
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.02,
    roughness: 0.92,
    metalness: 0.01,
    side: THREE.FrontSide,
    depthWrite: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  const backingFrontZ = Number(state.three?.group?.userData?.plaqueBackingFrontZ) || Number(state.plaque.baseThickness) || 0;
  mesh.position.z = Number.isFinite(zOverride)
    ? zOverride
    : getPlaqueColourLayerBottomZ(backingFrontZ) + depth + 0.03;
  mesh.renderOrder = 80 + index;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeRasterPlaqueFastLayerSurface(processed, index, bounds, z, hex) {
  const maxSide = 1400;
  const scale = Math.min(1, maxSide / Math.max(processed.width, processed.height));
  const width = Math.max(16, Math.round(processed.width * scale));
  const height = Math.max(16, Math.round(processed.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const img = ctx.createImageData(width, height);
  const rgb = hexToRgb(hex);
  const layerMask = makeCleanFastLayerMask(processed, index, width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const maskIndex = y * width + x;
      const offset = (y * width + x) * 4;
      if (!layerMask[maskIndex]) {
        img.data[offset + 3] = 0;
        continue;
      }
      img.data[offset] = rgb[0];
      img.data[offset + 1] = rgb[1];
      img.data[offset + 2] = rgb[2];
      img.data[offset + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.encoding = THREE.sRGBEncoding;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  const geometry = new THREE.PlaneBufferGeometry(bounds.width, bounds.height);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.02,
    side: THREE.FrontSide,
    depthWrite: true,
  });
  material.toneMapped = false;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = z;
  mesh.renderOrder = 120 + index;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeRasterPlaqueSeamUnderpaintSurface(processed, bounds, z) {
  const width = processed?.plaqueLabelledMap?.width || processed?.width || 0;
  const height = processed?.plaqueLabelledMap?.height || processed?.height || 0;
  const regionIndex = processed?.plaqueLabelledMap?.regionIndex || processed?.regionIndex;
  const alphaMask = processed?.plaqueLabelledMap?.alphaMask || processed?.alphaMask;
  if (!width || !height || !regionIndex || !alphaMask || !bounds?.width || !bounds?.height) return null;
  const renderRegions = getPlaqueRasterRenderRegions(processed);
  const backingRegion = getPlaqueBackingRegionForUnderpaint(processed, renderRegions, regionIndex, alphaMask, width, height);
  const displayColours = renderRegions.map((region, index) => hexToRgb(getPlaqueRasterRegionDisplayHex(processed, renderRegions, index, backingRegion)));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(width, height);
  for (let index = 0; index < regionIndex.length; index += 1) {
    const offset = index * 4;
    const region = regionIndex[index];
    const rgb = displayColours[region];
    if (!alphaMask[index] || !rgb) {
      img.data[offset + 3] = 0;
      continue;
    }
    const x = index % width;
    const y = Math.floor(index / width);
    const paintRegion = choosePlaqueSeamUnderpaintRegion(regionIndex, alphaMask, width, height, x, y, region, backingRegion);
    const paintRgb = displayColours[paintRegion] || rgb;
    img.data[offset] = paintRgb[0];
    img.data[offset + 1] = paintRgb[1];
    img.data[offset + 2] = paintRgb[2];
    img.data[offset + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 10;
  texture.encoding = THREE.sRGBEncoding;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  const geometry = new THREE.PlaneBufferGeometry(bounds.width, bounds.height);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.02,
    side: THREE.FrontSide,
    depthTest: true,
    depthWrite: false,
  });
  material.toneMapped = false;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'plaqueSeamUnderpaintSurface';
  mesh.position.z = z;
  mesh.renderOrder = 8;
  mesh.userData = { plaqueSeamUnderpaint: true, plaqueBackingOnlyHidden: true };
  return mesh;
}

function getPlaqueBackingRegionForUnderpaint(processed, renderRegions, regionIndex, alphaMask, width, height) {
  const scores = new Map();
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (!alphaMask[index]) continue;
      let touchesOutside = x === 0 || y === 0 || x === width - 1 || y === height - 1;
      if (!touchesOutside) {
        touchesOutside = !alphaMask[index - 1]
          || !alphaMask[index + 1]
          || !alphaMask[index - width]
          || !alphaMask[index + width];
      }
      if (!touchesOutside) continue;
      const region = regionIndex[index];
      scores.set(region, (scores.get(region) || 0) + 1);
    }
  }
  let bestRegion = 0;
  let bestScore = -1;
  scores.forEach((score, region) => {
    if (score > bestScore) {
      bestScore = score;
      bestRegion = region;
    }
  });
  if (bestScore >= 0) return bestRegion;
  const backingHex = normalizeHex(getPlaqueBackingHex(processed));
  const matchIndex = renderRegions.findIndex((region) => normalizeHex(region.hex) === backingHex);
  return matchIndex >= 0 ? matchIndex : 0;
}

function choosePlaqueSeamUnderpaintRegion(regionIndex, alphaMask, width, height, x, y, currentRegion, backingRegion) {
  if (!Number.isFinite(backingRegion) || currentRegion !== backingRegion) return currentRegion;
  if (plaqueUnderpaintPixelTouchesTransparent(alphaMask, width, height, x, y, 2)) return currentRegion;
  const scores = new Map();
  const radius = 5;
  for (let oy = -radius; oy <= radius; oy += 1) {
    for (let ox = -radius; ox <= radius; ox += 1) {
      if (!ox && !oy) continue;
      const nx = x + ox;
      const ny = y + oy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const neighborIndex = ny * width + nx;
      if (!alphaMask[neighborIndex]) continue;
      const neighborRegion = regionIndex[neighborIndex];
      if (neighborRegion === currentRegion || neighborRegion === backingRegion) continue;
      const distance = Math.hypot(ox, oy);
      if (distance > radius) continue;
      const score = (radius + 1 - distance) ** 2;
      scores.set(neighborRegion, (scores.get(neighborRegion) || 0) + score);
    }
  }
  let bestRegion = currentRegion;
  let bestScore = 0;
  scores.forEach((score, region) => {
    if (score > bestScore) {
      bestScore = score;
      bestRegion = region;
    }
  });
  return bestScore >= 6 ? bestRegion : currentRegion;
}

function plaqueUnderpaintPixelTouchesTransparent(alphaMask, width, height, x, y, radius) {
  for (let oy = -radius; oy <= radius; oy += 1) {
    for (let ox = -radius; ox <= radius; ox += 1) {
      const nx = x + ox;
      const ny = y + oy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) return true;
      if (!alphaMask[ny * width + nx]) return true;
    }
  }
  return false;
}

function makeRasterPlaqueExactArtworkSurface(processed, bounds, maxDepth, options = {}) {
  const source = options.forceOriginal || state.isDefaultPreview || !state.frontColoursCustomized
    ? processed.artworkCanvas
    : createMappedArtworkCanvas(processed);
  if (!source) return null;
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 12;
  texture.encoding = THREE.sRGBEncoding;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  const geometry = new THREE.PlaneBufferGeometry(bounds.width, bounds.height);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.015,
    side: THREE.FrontSide,
    depthTest: true,
    depthWrite: false,
  });
  material.toneMapped = false;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'plaqueExactArtworkSurface';
  mesh.position.z = Math.max(PLAQUE_DEFAULT_LAYER_DEPTH, maxDepth) + 0.42;
  mesh.renderOrder = 180;
  return mesh;
}

function makeSvgPlaqueBackingShape(svgLayers, svgBounds, modelBounds) {
  const baseLayer = [...svgLayers]
    .filter((layer) => isNearWhiteHex(layer.hex))
    .sort((a, b) => b.area - a.area)[0] || [...svgLayers].sort((a, b) => b.area - a.area)[0];
  if (!baseLayer?.shapes?.length) return null;
  const shape = [...baseLayer.shapes]
    .sort((a, b) => Math.abs(estimateShapeArea(b)) - Math.abs(estimateShapeArea(a)))[0];
  if (!shape) return null;
  return transformSvgShapeToPlaquePlane(shape, svgBounds, modelBounds);
}

function addPlaqueBaseDebugLines(group, shape, z = 0) {
  const material = new THREE.LineBasicMaterial({
    color: 0x00d084,
    transparent: true,
    opacity: 0.82,
  });
  const shapes = Array.isArray(shape) ? shape : [shape];
  shapes.forEach((item, index) => {
    const points = item.extractPoints(32).shape || [];
    if (points.length < 2) return;
    const positions = [];
    points.forEach((point) => positions.push(point.x, point.y, z + 0.08));
    positions.push(points[0].x, points[0].y, z + 0.08);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const line = new THREE.Line(geometry, material);
    line.name = `plaqueBaseSilhouetteDebug${index}`;
    line.renderOrder = 230;
    group.add(line);
    state.three.resources.push(geometry);
  });
  state.three.resources.push(material);
}

function transformSvgShapeToPlaquePlane(shape, svgBounds, modelBounds) {
  const transformed = new THREE.Shape();
  transformed.curves = shape.curves.map((curve) => transformSvgCurveToPlaquePlane(curve, svgBounds, modelBounds));
  transformed.holes = (shape.holes || []).map((hole) => {
    const path = new THREE.Path();
    path.curves = hole.curves.map((curve) => transformSvgCurveToPlaquePlane(curve, svgBounds, modelBounds));
    return path;
  });
  return transformed;
}

function transformSvgCurveToPlaquePlane(curve, svgBounds, modelBounds) {
  const next = curve.clone ? curve.clone() : Object.assign(Object.create(Object.getPrototypeOf(curve)), curve);
  Object.keys(next).forEach((key) => {
    const value = next[key];
    if (isThreeVector2Like(value)) {
      next[key] = transformSvgPointToPlaquePlane(value, svgBounds, modelBounds);
    } else if (Array.isArray(value)) {
      next[key] = value.map((item) => (isThreeVector2Like(item) ? transformSvgPointToPlaquePlane(item, svgBounds, modelBounds) : item));
    }
  });
  return next;
}

function transformSvgPointToPlaquePlane(point, svgBounds, modelBounds) {
  const scale = Math.min(modelBounds.width / Math.max(svgBounds.width, 1), modelBounds.height / Math.max(svgBounds.height, 1));
  const cx = svgBounds.x + svgBounds.width / 2;
  const cy = svgBounds.y + svgBounds.height / 2;
  return new THREE.Vector2((point.x - cx) * scale, -(point.y - cy) * scale);
}

function makePlaqueMaterial(hex, options = {}) {
  const normalized = normalizeHex(hex);
  const rgb = hexToRgb(normalized);
  const luminance = (rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722) / 255;
  const chroma = (Math.max(...rgb) - Math.min(...rgb)) / 255;
  const colourBoost = options.colourAccurate
    ? (Number.isFinite(options.colourBoost)
      ? options.colourBoost
      : clamp((0.2 + chroma * 0.14) * (1 - luminance * 0.72), 0.02, 0.28))
    : 0;
  const material = new THREE.MeshStandardMaterial({
    color: makeThreeColour(normalized),
    roughness: options.roughness ?? 0.9,
    metalness: 0,
    emissive: makeThreeColour(options.colourAccurate ? normalized : '#000000'),
    emissiveIntensity: colourBoost,
  });
  material.userData.plaqueEmissiveHex = options.colourAccurate ? normalized : '#000000';
  material.userData.plaqueEmissiveIntensity = colourBoost;
  return material;
}

function makePlaqueExtrudeMaterials(hex, options = {}) {
  const normalized = normalizeHex(hex);
  const rgb = hexToRgb(normalized);
  const isDarkPlaqueLayer = colourLuma(rgb) <= 68 && colourChroma(rgb) <= 58;
  const capMaterial = new THREE.MeshBasicMaterial({
    color: makeThreeColour(normalized),
    side: THREE.DoubleSide,
    depthTest: true,
    depthWrite: true,
  });
  capMaterial.toneMapped = false;
  capMaterial.userData.plaqueExactCap = true;
  capMaterial.userData.plaqueHex = normalized;
  const sideHex = normalized;
  const sideMaterial = isDarkPlaqueLayer
    ? makePlaqueGlossyDarkSideMaterial(normalized)
    : makePlaqueMaterial(sideHex, {
      roughness: options.roughness ?? 0.96,
      colourAccurate: true,
      colourBoost: 0.04,
    });
  sideMaterial.userData.plaqueSourceHex = normalized;
  sideMaterial.userData.plaqueSideHex = sideHex;
  sideMaterial.side = THREE.FrontSide;
  sideMaterial.depthTest = true;
  sideMaterial.depthWrite = true;
  return [capMaterial, sideMaterial];
}

function makePlaqueGlossyDarkSideMaterial(hex) {
  const normalized = normalizeHex(hex);
  const MaterialClass = THREE.MeshPhysicalMaterial || THREE.MeshStandardMaterial;
  const material = new MaterialClass({
    color: makeThreeColour(normalized),
    roughness: 0.34,
    metalness: 0.06,
    emissive: makeThreeColour('#020405'),
    emissiveIntensity: 0.025,
  });
  if ('clearcoat' in material) material.clearcoat = 0.72;
  if ('clearcoatRoughness' in material) material.clearcoatRoughness = 0.22;
  material.userData.plaqueGlossyDarkSide = true;
  material.userData.plaqueHex = normalized;
  return material;
}

function makePlaqueBaseShape(processed, bounds) {
  const padding = clamp(Number(state.plaque.basePadding) || PLAQUE_DEFAULT_BASE_PADDING, 0, 6);
  const dieCutShape = makeDieCutPlaqueBackingShape(processed, bounds, padding);
  if (dieCutShape) return dieCutShape;
  const outerSilhouette = buildSmoothPlaqueBaseSilhouette(processed);
  const points = silhouetteToThreePoints(outerSilhouette?.length >= 3 ? outerSilhouette : processed.silhouette, bounds, 1);
  const cleanPoints = cleanPlaqueBackingPlatePoints(points, bounds);
  const paddedPoints = offsetThreePolygon(cleanPoints, padding);
  const cleanPaddedPoints = cleanPlaqueBackingPlatePoints(paddedPoints, bounds, { afterOffset: true });
  return makeThreeShape(cleanPaddedPoints);
}

function makeDieCutPlaqueBackingShape(processed, bounds, padding) {
  const contours = getDieCutPlaqueBackingContours(processed, bounds, padding);
  if (!contours?.length) return null;
  const shapes = contours
    .map((loop) => makePlaqueDieCutShapeFromNormalizedLoop(loop, bounds))
    .filter(Boolean);
  if (!shapes.length) return null;
  return shapes.length === 1 ? shapes[0] : shapes;
}

function makePlaqueDieCutShapeFromNormalizedLoop(loop, bounds) {
  if (!Array.isArray(loop) || loop.length < 8) return null;
  const points = silhouetteToThreePoints(loop, bounds, 1);
  const cleanPoints = cleanPlaqueBackingPlatePoints(points, bounds, { exactBacking: true });
  if (cleanPoints.length < 8) return null;
  const shape = new THREE.Shape();
  addSmoothClosedPlaquePath(shape, cleanPoints);
  return shape;
}

function cleanPlaqueBackingPlatePoints(points, bounds, options = {}) {
  if (!Array.isArray(points) || points.length < 8) return points?.map((point) => point.clone()) || [];
  const maxDimension = Math.max(Number(bounds?.width) || 148, Number(bounds?.height) || 148);
  const afterOffset = options.afterOffset === true;
  const exactBacking = options.exactBacking === true;
  const tolerance = exactBacking
    ? clamp(maxDimension / 1800, 0.035, 0.09)
    : afterOffset
    ? clamp(maxDimension / 920, 0.08, 0.2)
    : clamp(maxDimension / 960, 0.08, 0.18);
  let loop = points.map((point) => [point.x, point.y]);
  loop = removePlaqueBackingMicroBurrs(
    loop,
    exactBacking ? 0.76 : (afterOffset ? 1.45 : 0.95),
    exactBacking ? 0.24 : (afterOffset ? 0.5 : 0.32),
  );
  loop = simplifyClosedPlaqueLoop(loop, tolerance);
  if (afterOffset && !exactBacking) {
    loop = smoothPlaqueBackingPlateSideLoop(loop, bounds, 2);
    loop = densifyClosedPlaqueLoop(loop, clamp(maxDimension / 150, 0.78, 1.28));
  } else if (exactBacking) {
    loop = densifyClosedPlaqueLoop(loop, clamp(maxDimension / 240, 0.42, 0.78));
  }
  loop = removePlaqueBackingMicroBurrs(
    loop,
    exactBacking ? 0.86 : (afterOffset ? 1.7 : 1.1),
    exactBacking ? 0.28 : (afterOffset ? 0.58 : 0.4),
  );
  loop = removeNearDuplicatePoints(loop, Math.max(0.025, tolerance * 0.14));
  return loop.length >= 8 ? loop.map(([x, y]) => new THREE.Vector2(x, y)) : points.map((point) => point.clone());
}

function smoothPlaqueBackingPlateSideLoop(points, bounds, passes = 1) {
  if (!Array.isArray(points) || points.length < 16) return points;
  let output = points;
  for (let pass = 0; pass < passes; pass += 1) {
    output = output.map((point, index) => {
      const prev = output[(index - 1 + output.length) % output.length];
      const next = output[(index + 1) % output.length];
      const ax = prev[0] - point[0];
      const ay = prev[1] - point[1];
      const bx = next[0] - point[0];
      const by = next[1] - point[1];
      const aLen = Math.hypot(ax, ay);
      const bLen = Math.hypot(bx, by);
      if (aLen <= 0.0001 || bLen <= 0.0001) return point;
      const dot = (ax * bx + ay * by) / (aLen * bLen);
      const isIntentionalCorner = dot > -0.18;
      if (isIntentionalCorner) return point;
      return [
        point[0] * 0.56 + (prev[0] + next[0]) * 0.22,
        point[1] * 0.56 + (prev[1] + next[1]) * 0.22,
      ];
    });
  }
  return removeNearDuplicatePoints(output, clamp(Math.max(Number(bounds?.width) || 148, Number(bounds?.height) || 148) / 5200, 0.018, 0.04));
}

function densifyClosedPlaqueLoop(points, maxSegmentLength) {
  if (!Array.isArray(points) || points.length < 3 || !Number.isFinite(maxSegmentLength) || maxSegmentLength <= 0) return points;
  const output = [];
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    output.push(point);
    const distance = Math.hypot(next[0] - point[0], next[1] - point[1]);
    const steps = clamp(Math.ceil(distance / maxSegmentLength), 1, 8);
    for (let step = 1; step < steps; step += 1) {
      const t = step / steps;
      output.push([
        point[0] + (next[0] - point[0]) * t,
        point[1] + (next[1] - point[1]) * t,
      ]);
    }
  });
  return output;
}

function removePlaqueBackingMicroBurrs(points, maxEdgeLength, maxBurrHeight) {
  if (!Array.isArray(points) || points.length < 12) return points;
  let output = points;
  for (let pass = 0; pass < 3; pass += 1) {
    const nextLoop = [];
    let removed = 0;
    for (let index = 0; index < output.length; index += 1) {
      const prev = output[(index - 1 + output.length) % output.length];
      const current = output[index];
      const next = output[(index + 1) % output.length];
      const edgeA = Math.hypot(current[0] - prev[0], current[1] - prev[1]);
      const edgeB = Math.hypot(next[0] - current[0], next[1] - current[1]);
      if (edgeA <= 0.0001 || edgeB <= 0.0001) {
        removed += 1;
        continue;
      }
      const height = Math.sqrt(pointLineDistanceSq(current, prev, next));
      const dot = ((prev[0] - current[0]) * (next[0] - current[0]) + (prev[1] - current[1]) * (next[1] - current[1])) / (edgeA * edgeB);
      const isTinySharpBurr = height <= maxBurrHeight
        && edgeA <= maxEdgeLength
        && edgeB <= maxEdgeLength
        && dot > -0.62;
      if (isTinySharpBurr) {
        removed += 1;
        continue;
      }
      nextLoop.push(current);
    }
    if (!removed || nextLoop.length < 8) break;
    output = nextLoop;
  }
  return output;
}

function smoothPlaqueBackingSideNormals(geometry, depth, zMinOverride = 0, zMaxOverride = depth, options = {}) {
  const position = geometry?.attributes?.position;
  const normal = geometry?.attributes?.normal;
  if (!position || !normal || !Number.isFinite(depth) || depth <= 0) return;
  const bucketSize = clamp(Number(options.sideNormalBucketSize) || 0.62, 0.18, 1.15);
  const bucketRadius = clamp(Math.round(Number(options.sideNormalBucketRadius) || 1), 1, 3);
  const normalZLimit = clamp(Number(options.sideNormalZLimit) || 0.68, 0.2, 0.95);
  const angleDotMin = clamp(Number(options.sideNormalAngleDotMin) || 0.52, -0.2, 0.98);
  const buckets = new Map();
  const sideVertices = [];
  for (let index = 0; index < position.count; index += 1) {
    const nz = normal.getZ(index);
    if (Math.abs(nz) > normalZLimit) continue;
    const nx = normal.getX(index);
    const ny = normal.getY(index);
    const length = Math.hypot(nx, ny);
    if (length <= 0.00001) continue;
    const bx = Math.round(position.getX(index) / bucketSize);
    const by = Math.round(position.getY(index) / bucketSize);
    const item = { index, bx, by, nx: nx / length, ny: ny / length };
    sideVertices.push(item);
    const key = `${bx}:${by}`;
    const bucket = buckets.get(key) || { x: 0, y: 0, count: 0, nx: 0, ny: 0 };
    bucket.x += item.nx;
    bucket.y += item.ny;
    bucket.count += 1;
    buckets.set(key, bucket);
  }
  buckets.forEach((bucket) => {
    const length = Math.hypot(bucket.x, bucket.y);
    if (length <= 0.00001) return;
    bucket.nx = bucket.x / length;
    bucket.ny = bucket.y / length;
  });
  sideVertices.forEach((vertex) => {
    let sumX = 0;
    let sumY = 0;
    for (let oy = -bucketRadius; oy <= bucketRadius; oy += 1) {
      for (let ox = -bucketRadius; ox <= bucketRadius; ox += 1) {
        const bucket = buckets.get(`${vertex.bx + ox}:${vertex.by + oy}`);
        if (!bucket) continue;
        const dot = vertex.nx * bucket.nx + vertex.ny * bucket.ny;
        if (dot < angleDotMin) continue;
        const distance = Math.hypot(ox, oy);
        const weight = (ox === 0 && oy === 0 ? 2.4 : 1) * Math.max(0.18, dot) / (1 + distance * 0.65);
        sumX += bucket.nx * weight;
        sumY += bucket.ny * weight;
      }
    }
    const length = Math.hypot(sumX, sumY);
    if (length <= 0.00001) return;
    normal.setXYZ(vertex.index, sumX / length, sumY / length, 0);
  });
  normal.needsUpdate = true;
}

function buildSmoothPlaqueBaseSilhouette(processed, padding = 0, bounds = null) {
  if (!processed?.alphaMask || !processed.width || !processed.height) return processed?.silhouette || [];
  const paddingKey = Math.round((Number(padding) || 0) * 1000);
  const cached = processed.plaqueBaseSilhouetteCache;
  if (
    cached?.version === PLAQUE_BASE_SILHOUETTE_CACHE_VERSION
    && cached.width === processed.width
    && cached.height === processed.height
    && cached.padding === paddingKey
    && Array.isArray(cached.points)
    && cached.points.length >= 3
  ) {
    return cached.points.map((point) => [point[0], point[1]]);
  }
  const points = buildExactAlphaSilhouette(processed.alphaMask, processed.width, processed.height);
  processed.plaqueBaseSilhouetteCache = {
    version: PLAQUE_BASE_SILHOUETTE_CACHE_VERSION,
    width: processed.width,
    height: processed.height,
    padding: paddingKey,
    points: clonePlaqueContourLoop(points),
  };
  return points;
}

function getDieCutPlaqueBackingContours(processed, bounds, padding) {
  if (!processed?.width || !processed.height || !bounds?.width || !bounds?.height) return null;
  const paddingKey = Math.round((Number(padding) || 0) * 1000);
  const cached = processed.plaqueDieCutBackingCache;
  if (
    cached?.version === PLAQUE_BASE_SILHOUETTE_CACHE_VERSION
    && cached.width === processed.width
    && cached.height === processed.height
    && cached.padding === paddingKey
    && Array.isArray(cached.contours)
    && cached.contours.length
  ) {
    return cached.contours.map(clonePlaqueContourLoop);
  }

  const source = getPlaqueDieCutSourceMask(processed) || getPlaqueVisibleAlphaMask(processed);
  if (!source?.mask || !source.width || !source.height) return null;
  const traceMask = preparePlaqueTraceMask(source.mask, source.width, source.height, 1500);
  let sourceMask = traceMask.mask;
  if (!sourceMask || !traceMask.width || !traceMask.height) return null;
  const visiblePixels = countPlaqueMaskPixels(sourceMask);
  if (!visiblePixels) return null;
  if (typeof keepPrintableMaskComponents === 'function') {
    sourceMask = keepPrintableMaskComponents(sourceMask, traceMask.width, traceMask.height, Math.max(12, Math.round(visiblePixels * 0.000035)));
  }
  sourceMask = closePlaqueMask(sourceMask, traceMask.width, traceMask.height, getPlaqueTinyGapClosingRadius());
  const visibleBounds = getPlaqueMaskBounds(sourceMask, traceMask.width, traceMask.height);
  if (!visibleBounds) return null;
  const offsetPx = getPlaqueDieCutBackingOffsetPixels(padding, visibleBounds, traceMask.width, traceMask.height, bounds);
  const backingMask = dilatePlaqueMask(sourceMask, traceMask.width, traceMask.height, offsetPx);
  const contours = traceDieCutPlaqueOuterContours(backingMask, traceMask.width, traceMask.height, offsetPx);
  if (!contours.length) return null;
  processed.plaqueDieCutBackingCache = {
    version: PLAQUE_BASE_SILHOUETTE_CACHE_VERSION,
    width: processed.width,
    height: processed.height,
    padding: paddingKey,
    contours: contours.map(clonePlaqueContourLoop),
  };
  return contours;
}

function getPlaqueVisibleAlphaMask(processed) {
  const canvas = processed?.artworkCanvas;
  if (canvas?.width && canvas?.height) {
    try {
      const width = Math.max(1, Number(processed.width) || canvas.width);
      const height = Math.max(1, Number(processed.height) || canvas.height);
      const sampleCanvas = document.createElement('canvas');
      sampleCanvas.width = width;
      sampleCanvas.height = height;
      const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
      sampleCtx.clearRect(0, 0, width, height);
      sampleCtx.drawImage(canvas, 0, 0, width, height);
      const data = sampleCtx.getImageData(0, 0, width, height).data;
      const mask = new Uint8Array(width * height);
      for (let index = 0; index < mask.length; index += 1) {
        mask[index] = data[index * 4 + 3] >= 96 ? 1 : 0;
      }
      if (countPlaqueMaskPixels(mask)) return { mask, width, height };
    } catch (error) {
      // Fall back to the processed alpha mask below.
    }
  }
  if (!processed?.alphaMask || !processed.width || !processed.height) return null;
  return {
    mask: new Uint8Array(processed.alphaMask),
    width: processed.width,
    height: processed.height,
  };
}

function getPlaqueDieCutSourceMask(processed) {
  if (!processed?.alphaMask || !processed.width || !processed.height || !processed.regionIndex) return null;
  const regions = processed.colours || [];
  if (regions.length < 2) return null;
  const backingIndex = getPlaqueBackingRenderRegionIndex(processed, regions);
  if (backingIndex < 0 || backingIndex >= regions.length) return null;
  const totalVisible = countPlaqueMaskPixels(processed.alphaMask);
  if (!totalVisible) return null;
  const backingMask = regions[backingIndex]?.mask;
  let backingPixels = backingMask ? countPlaqueMaskPixels(backingMask) : 0;
  if (!backingPixels) {
    for (let index = 0; index < processed.regionIndex.length; index += 1) {
      if (processed.alphaMask[index] && processed.regionIndex[index] === backingIndex) backingPixels += 1;
    }
  }
  const backingRatio = backingPixels / totalVisible;
  if (backingRatio > 0.28) return null;
  const mask = new Uint8Array(processed.width * processed.height);
  let raisedPixels = 0;
  for (let index = 0; index < processed.regionIndex.length; index += 1) {
    if (!processed.alphaMask[index]) continue;
    const region = processed.regionIndex[index];
    if (region < 0 || region === backingIndex) continue;
    mask[index] = 1;
    raisedPixels += 1;
  }
  if (raisedPixels < Math.max(64, totalVisible * 0.18)) return null;
  return {
    mask,
    width: processed.width,
    height: processed.height,
  };
}

function getPlaqueTinyGapClosingRadius() {
  return 1;
}

function getPlaqueDieCutBackingOffsetPixels(padding, visibleBounds, width, height, bounds) {
  const logoWidth = Math.max(1, visibleBounds.maxX - visibleBounds.minX + 1);
  const paddingScale = clamp((Number(padding) || PLAQUE_DEFAULT_BASE_PADDING) / PLAQUE_DEFAULT_BASE_PADDING, 0.35, 1.85);
  const ratioRadius = logoWidth * 0.012 * paddingScale;
  const modelUnitsPerPixel = Math.max(0.0001, (Number(bounds?.width) || 148) / width);
  const modelRadius = ((Number(padding) || PLAQUE_DEFAULT_BASE_PADDING) * 0.42) / modelUnitsPerPixel;
  const radius = Math.min(ratioRadius, modelRadius);
  return clamp(Math.round(radius), 2, Math.round(Math.max(width, height) * 0.02));
}

function getPlaqueMaskBounds(mask, width, height) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    const row = y * width;
    for (let x = 0; x < width; x += 1) {
      if (!mask[row + x]) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return maxX >= minX && maxY >= minY ? { minX, minY, maxX, maxY } : null;
}

function traceDieCutPlaqueOuterContours(mask, width, height, offsetPx) {
  const minArea = width * height * 0.00008;
  return traceMaskLoops(mask, width, height)
    .map((loop) => ({ loop, area: polygonArea(loop) }))
    .filter((item) => item.area >= minArea)
    .sort((a, b) => b.area - a.area)
    .slice(0, 8)
    .map((item) => smoothDieCutPlaqueLoop(item.loop, width, height, offsetPx))
    .filter((loop) => loop.length >= 8)
    .map((loop) => loop.map(([x, y]) => [
      clamp(x / width, 0, 1),
      clamp(y / height, 0, 1),
    ]));
}

function smoothDieCutPlaqueLoop(loop, width, height, offsetPx) {
  const maxSide = Math.max(width, height);
  const tolerance = clamp(maxSide / 3200, 0.18, 0.55);
  let output = removeNearDuplicatePoints(loop, 0.01);
  output = simplifyClosedPlaqueLoop(output, tolerance);
  output = removePlaqueBackingMicroBurrs(output, Math.max(1.1, offsetPx * 0.05), Math.max(0.38, offsetPx * 0.018));
  if (typeof chaikinSmoothClosed === 'function') {
    output = chaikinSmoothClosed(output, 1);
    output = simplifyClosedPlaqueLoop(output, tolerance * 0.55);
  }
  output = removeNearDuplicatePoints(output, Math.max(0.015, tolerance * 0.18));
  return output;
}

function countPlaqueMaskPixels(mask) {
  let count = 0;
  for (let index = 0; index < mask.length; index += 1) {
    if (mask[index]) count += 1;
  }
  return count;
}

function dilatePlaqueMask(mask, width, height, radiusPx) {
  const radius = clamp(Math.round(Number(radiusPx) || 0), 0, 72);
  const output = new Uint8Array(mask);
  if (!radius) return output;
  const offsets = getPlaqueBaseDilationOffsets(radius);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (!mask[index] || !isPlaqueMaskBoundaryPixel(mask, width, height, x, y)) continue;
      offsets.forEach(([ox, oy]) => {
        const nx = x + ox;
        const ny = y + oy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) return;
        output[ny * width + nx] = 1;
      });
    }
  }
  return output;
}

function erodePlaqueMask(mask, width, height, radiusPx) {
  const radius = clamp(Math.round(Number(radiusPx) || 0), 0, 16);
  if (!radius) return new Uint8Array(mask);
  const offsets = getPlaqueBaseDilationOffsets(radius);
  const output = new Uint8Array(mask.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (!mask[index]) continue;
      let keep = true;
      for (let offsetIndex = 0; offsetIndex < offsets.length; offsetIndex += 1) {
        const [ox, oy] = offsets[offsetIndex];
        const nx = x + ox;
        const ny = y + oy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height || !mask[ny * width + nx]) {
          keep = false;
          break;
        }
      }
      if (keep) output[index] = 1;
    }
  }
  return output;
}

function closePlaqueMask(mask, width, height, radiusPx) {
  const radius = clamp(Math.round(Number(radiusPx) || 0), 0, 8);
  if (!radius) return new Uint8Array(mask);
  return erodePlaqueMask(dilatePlaqueMask(mask, width, height, radius), width, height, radius);
}

function getPlaqueBaseDilationOffsets(radius) {
  if (plaqueBaseDilationOffsetCache.has(radius)) return plaqueBaseDilationOffsetCache.get(radius);
  const offsets = [];
  const limit = radius * radius;
  for (let oy = -radius; oy <= radius; oy += 1) {
    for (let ox = -radius; ox <= radius; ox += 1) {
      if (ox * ox + oy * oy <= limit) offsets.push([ox, oy]);
    }
  }
  plaqueBaseDilationOffsetCache.set(radius, offsets);
  return offsets;
}

function isPlaqueMaskBoundaryPixel(mask, width, height, x, y) {
  if (x <= 0 || y <= 0 || x >= width - 1 || y >= height - 1) return true;
  const index = y * width + x;
  return !mask[index - 1]
    || !mask[index + 1]
    || !mask[index - width]
    || !mask[index + width];
}

function getPlaqueRasterPreviewQuality(processed) {
  const sourceSide = Math.max(processed?.width || 0, processed?.height || 0);
  const layerCount = Math.max(1, processed?.colours?.length || 1);
  const traceQuality = normalizePlaqueTraceQuality(state.plaque.traceQuality);
  if (traceQuality === 'raw') {
    return {
      maxTraceSide: Math.max(sourceSide, PLAQUE_RASTER_PREVIEW_TRACE_MAX_SIDE),
      smoothingPasses: 0,
      simplifyTolerance: 0,
      polishPasses: 0,
      finalPointSpacing: 0,
      minAreaRatio: 0.0000015,
      maxShapes: 240,
      maxHoles: 360,
      bevelSegments: 0,
      curveSegments: 4,
      bevelThickness: 0,
      bevelSize: 0,
      preserveCorners: true,
      preserveLogoEdges: true,
      exactPixelBoundaryMode: true,
      labelledMapPipeline: true,
      traceQuality,
    };
  }
  if (traceQuality === 'clean') {
    return {
      maxTraceSide: clamp(Math.max(sourceSide, PLAQUE_RASTER_PREVIEW_TRACE_MAX_SIDE), PLAQUE_RASTER_PREVIEW_TRACE_MAX_SIDE, 2200),
      smoothingPasses: 0,
      simplifyTolerance: sourceSide > 900 || layerCount > 4 ? 0.22 : 0.18,
      polishPasses: 0,
      finalPointSpacing: sourceSide > 900 || layerCount > 4 ? 0.045 : 0.035,
      minAreaRatio: 0.000018,
      maxShapes: layerCount > 5 ? 120 : 150,
      maxHoles: layerCount > 5 ? 180 : 220,
      bevelSegments: 1,
      curveSegments: 18,
      bevelThickness: 0.08,
      bevelSize: 0.035,
      preserveCorners: true,
      preserveLogoEdges: true,
      exactPixelBoundaryMode: false,
      labelledMapPipeline: true,
      traceQuality,
    };
  }
  if (state.plaque.fastPreviewOnly) {
    return {
      maxTraceSide: 1500,
      smoothingPasses: 4,
      simplifyTolerance: 1.85,
      polishPasses: 2,
      finalPointSpacing: 1.35,
      minAreaRatio: 0.00013,
      maxShapes: 48,
      maxHoles: 64,
      bevelSegments: 2,
      curveSegments: 18,
      bevelThickness: 0.12,
      bevelSize: 0.055,
    };
  }
  const sizePenalty = sourceSide > 1100 ? 80 : 0;
  const layerPenalty = Math.max(0, layerCount - 5) * 36;
  const maxTraceSide = clamp(
    PLAQUE_RASTER_PREVIEW_TRACE_MAX_SIDE - sizePenalty - layerPenalty,
    PLAQUE_RASTER_PREVIEW_TRACE_MIN_SIDE,
    PLAQUE_RASTER_PREVIEW_TRACE_MAX_SIDE,
  );
  return {
    maxTraceSide,
    smoothingPasses: 0,
    simplifyTolerance: sourceSide > 900 || layerCount > 4 ? 0.52 : 0.44,
    polishPasses: 0,
    finalPointSpacing: sourceSide > 900 || layerCount > 4 ? 0.08 : 0.065,
    minAreaRatio: 0.000082,
    maxShapes: layerCount > 5 ? 72 : 96,
    maxHoles: layerCount > 5 ? 112 : 144,
    bevelSegments: 0,
    curveSegments: 24,
    bevelThickness: 0,
    bevelSize: 0,
    preserveCorners: true,
    preserveLogoEdges: true,
    exactPixelBoundaryMode: false,
    traceQuality,
  };
}

function getPlaqueContourClassOptions(region, index, processed, baseOptions = {}) {
  const traceQuality = normalizePlaqueTraceQuality(state.plaque.traceQuality);
  if (traceQuality === 'raw') return { contourClass: 'raw-pixel', contourOverlap: 0 };
  if (region?.plaqueRole) return getUploadedRasterPlaqueContourOptions(region, baseOptions);
  const sourceIndex = Number(region?.sourceIndex);
  const originalIndex = Number.isFinite(sourceIndex) ? sourceIndex : index;
  const hex = normalizeHex(region?.hex || '#ffffff');
  const rgb = hexToRgb(hex);
  const luma = colourLuma(rgb);
  const chroma = colourChroma(rgb);
  const opaquePixels = Math.max(1, processed?.plaqueLabelledMap?.opaquePixels || 0);
  const share = Number(region?.count || 0) / opaquePixels;
  const isWhiteTextLike = luma >= 222 && chroma <= 38;
  const isDarkFaceLike = luma <= 58 && chroma <= 38;
  const isSmallInteriorDetail = share > 0 && share < 0.075 && originalIndex > 0;
  if (traceQuality !== 'raw' && (isWhiteTextLike || isSmallInteriorDetail)) {
    return {
      contourClass: isWhiteTextLike ? 'text-details' : 'small-interior-details',
      simplifyTolerance: isWhiteTextLike ? 0.045 : 0.075,
      finalPointSpacing: isWhiteTextLike ? 0.012 : 0.02,
      minAreaRatio: isWhiteTextLike ? 0.000006 : 0.00001,
      maxShapes: Math.max(Number(baseOptions.maxShapes) || 0, isWhiteTextLike ? 180 : 150),
      maxHoles: Math.max(Number(baseOptions.maxHoles) || 0, isWhiteTextLike ? 260 : 210),
      bevelThickness: isWhiteTextLike ? 0.045 : 0.06,
      bevelSize: isWhiteTextLike ? 0.018 : 0.026,
      bevelSegments: 1,
      curveSegments: 10,
      preserveTextCorners: isWhiteTextLike,
      preserveCorners: true,
      contourOverlap: isWhiteTextLike ? 0.16 : 0.2,
    };
  }
  if (traceQuality !== 'raw' && isDarkFaceLike) {
    return {
      contourClass: 'large-dark-face',
      simplifyTolerance: Math.min(Number(baseOptions.simplifyTolerance) || 0.22, 0.16),
      finalPointSpacing: Math.min(Number(baseOptions.finalPointSpacing) || 0.045, 0.03),
      bevelThickness: 0.06,
      bevelSize: 0.026,
      bevelSegments: 1,
      preserveCorners: true,
      contourOverlap: 0.38,
    };
  }
  return {
    contourClass: originalIndex === 0 ? 'outer-silhouette' : 'large-smooth-shape',
    contourOverlap: originalIndex === 0 ? 0.06 : 0.18,
  };
}

function getUploadedRasterPlaqueContourOptions(region, baseOptions = {}) {
  const role = region?.plaqueRole || 'detail';
  const hex = normalizeHex(region?.hex || '#ffffff');
  const rgb = hexToRgb(hex);
  const luma = colourLuma(rgb);
  const chroma = colourChroma(rgb);
  const isLightDetail = role === 'light-detail' || (luma >= 222 && chroma <= 42);
  if (role === 'body') {
    return {
      contourClass: 'uploaded-raster-body',
      simplifyTolerance: Math.min(Number(baseOptions.simplifyTolerance) || 0.44, 0.22),
      finalPointSpacing: Math.min(Number(baseOptions.finalPointSpacing) || 0.065, 0.04),
      minAreaRatio: 0.00005,
      bevelThickness: 0.055,
      bevelSize: 0.024,
      bevelSegments: 1,
      preserveCorners: true,
      preserveLogoEdges: true,
      contourOverlap: 0,
    };
  }
  return {
    contourClass: isLightDetail ? 'uploaded-raster-light-detail' : 'uploaded-raster-detail',
    simplifyTolerance: isLightDetail ? 0.045 : 0.075,
    finalPointSpacing: isLightDetail ? 0.014 : 0.022,
    minAreaRatio: isLightDetail ? 0.000006 : 0.00001,
    maxShapes: Math.max(Number(baseOptions.maxShapes) || 0, isLightDetail ? 180 : 150),
    maxHoles: Math.max(Number(baseOptions.maxHoles) || 0, isLightDetail ? 260 : 210),
    bevelThickness: isLightDetail ? 0.045 : 0.06,
    bevelSize: isLightDetail ? 0.018 : 0.026,
    bevelSegments: 1,
    curveSegments: 10,
    preserveTextCorners: isLightDetail,
    preserveCorners: true,
    preserveLogoEdges: true,
    contourOverlap: 0,
  };
}

function buildRasterPlaqueContourGroup(mask, width, height, bounds, options) {
  const group = new THREE.Group();
  group.name = `plaqueLayer${options.index}`;
  const zBase = Number(options.zBase) || 0;
  group.userData = {
    plaqueLayer: options.index,
    depth: options.depth,
    zBase,
    hex: options.hex,
    material: options.material,
    geometries: [],
    points: [],
  };
  const shapes = buildRasterPlaqueShapes(mask, width, height, bounds, {
    minAreaRatio: options.minAreaRatio ?? 0.000035,
    smoothingPasses: options.smoothingPasses ?? 2,
    simplifyTolerance: options.simplifyTolerance ?? 0.16,
    polishPasses: options.polishPasses ?? 1,
    finalPointSpacing: options.finalPointSpacing ?? 0.08,
    maxTraceSide: options.maxTraceSide ?? 420,
    maxShapes: options.maxShapes ?? 72,
    maxHoles: options.maxHoles ?? 96,
    preserveCorners: Boolean(options.preserveCorners),
    preserveLogoEdges: Boolean(options.preserveLogoEdges),
    exactPixelBoundaryMode: Boolean(options.exactPixelBoundaryMode),
    labelledMapPipeline: Boolean(options.labelledMapPipeline),
    traceQuality: options.traceQuality || '',
    contourClass: options.contourClass || '',
    preserveTextCorners: Boolean(options.preserveTextCorners),
    contourOverlap: Number(options.contourOverlap) || 0,
    cacheOwner: options.cacheOwner || null,
  });
  shapes.forEach((shape, shapeIndex) => {
    const geometry = makeCachedPlaqueExtrudeGeometry(shape, {
      depth: options.depth,
      zBase,
      bevelEnabled: !options.preserveCorners,
      bevelThickness: options.bevelThickness ?? 0.24,
      bevelSize: options.bevelSize ?? 0.1,
      bevelSegments: options.bevelSegments ?? 4,
      curveSegments: options.curveSegments ?? 20,
      sideNormalBucketSize: options.preserveTextCorners ? 0.34 : 0.56,
      sideNormalBucketRadius: options.preserveTextCorners ? 1 : 2,
      sideNormalAngleDotMin: options.preserveTextCorners ? 0.72 : 0.42,
      openBack: Boolean(options.openBack),
    });
    const mesh = new THREE.Mesh(geometry, options.material);
    mesh.name = `plaqueLayer${options.index}Shape${shapeIndex}`;
    mesh.userData = { plaqueLayer: options.index, depth: options.depth };
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    validatePlaqueMeshZRange(mesh, `Raster layer ${options.index} shape ${shapeIndex}`, zBase, zBase + options.depth);
    group.add(mesh);
    group.userData.geometries.push(geometry);
    if (!group.userData.points.length) group.userData.points = shape.extractPoints(18).shape || [];
  });
  return group;
}

function makeCachedPlaqueExtrudeGeometry(shape, options = {}) {
  const depth = Math.max(0.01, Number(options.depth) || PLAQUE_DEFAULT_LAYER_DEPTH);
  const zBase = Number(options.zBase) || 0;
  const templateKey = makePlaqueExtrudeTemplateKey(options);
  let templateMap = plaqueExtrudeGeometryTemplateCache.get(shape);
  if (!templateMap) {
    templateMap = new Map();
    plaqueExtrudeGeometryTemplateCache.set(shape, templateMap);
  }
  let template = templateMap.get(templateKey);
  if (!template) {
    template = new THREE.ExtrudeBufferGeometry(shape, {
      depth: 1,
      bevelEnabled: Boolean(options.bevelEnabled),
      bevelThickness: Number(options.bevelThickness) || 0,
      bevelSize: Number(options.bevelSize) || 0,
      bevelSegments: Number(options.bevelSegments) || 1,
      curveSegments: Number(options.curveSegments) || 12,
    });
    template.computeVertexNormals();
    templateMap.set(templateKey, template);
  }
  let geometry = template.clone();
  setPlaqueGeometryDepth(geometry, 0, 1, depth, zBase);
  if (options.openBack) geometry = removePlaqueRearCapFaces(geometry, zBase);
  geometry.computeVertexNormals();
  const sideNormalOptions = {
    sideNormalBucketSize: Number(options.sideNormalBucketSize) || 0.56,
    sideNormalBucketRadius: Number(options.sideNormalBucketRadius) || 2,
    sideNormalAngleDotMin: Number(options.sideNormalAngleDotMin) || 0.42,
  };
  smoothPlaqueBackingSideNormals(geometry, depth, zBase, zBase + depth, sideNormalOptions);
  geometry.userData.plaqueSideNormalOptions = sideNormalOptions;
  return geometry;
}

function removePlaqueRearCapFaces(geometry, zBase, tolerance = 0.002) {
  if (!geometry?.attributes?.position) return geometry;
  const source = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  const position = source.attributes.position;
  const uv = source.attributes.uv;
  const materialIndices = new Int16Array(position.count);
  if (Array.isArray(source.groups) && source.groups.length) {
    source.groups.forEach((group) => {
      const start = Math.max(0, Number(group.start) || 0);
      const end = Math.min(position.count, start + (Number(group.count) || 0));
      const materialIndex = Number(group.materialIndex) || 0;
      for (let vertex = start; vertex < end; vertex += 1) materialIndices[vertex] = materialIndex;
    });
  }
  const buckets = new Map();
  const getBucket = (materialIndex) => {
    if (!buckets.has(materialIndex)) buckets.set(materialIndex, { positions: [], uvs: [] });
    return buckets.get(materialIndex);
  };
  const isRearVertex = (vertex) => Math.abs(position.getZ(vertex) - zBase) <= tolerance;
  for (let vertex = 0; vertex + 2 < position.count; vertex += 3) {
    if (isRearVertex(vertex) && isRearVertex(vertex + 1) && isRearVertex(vertex + 2)) continue;
    const bucket = getBucket(materialIndices[vertex] || 0);
    for (let point = vertex; point < vertex + 3; point += 1) {
      bucket.positions.push(position.getX(point), position.getY(point), position.getZ(point));
      if (uv) bucket.uvs.push(uv.getX(point), uv.getY(point));
    }
  }
  const sortedBuckets = [...buckets.entries()].sort((a, b) => a[0] - b[0]);
  const positionLength = sortedBuckets.reduce((sum, [, bucket]) => sum + bucket.positions.length, 0);
  const uvLength = uv ? sortedBuckets.reduce((sum, [, bucket]) => sum + bucket.uvs.length, 0) : 0;
  let vertexOffset = 0;
  const next = new THREE.BufferGeometry();
  if (!positionLength) {
    source.dispose?.();
    next.dispose?.();
    return geometry;
  }
  const positions = new Float32Array(positionLength);
  const uvs = uv && uvLength ? new Float32Array(uvLength) : null;
  let positionOffset = 0;
  let uvOffset = 0;
  sortedBuckets.forEach(([materialIndex, bucket]) => {
    if (!bucket.positions.length) return;
    positions.set(bucket.positions, positionOffset);
    positionOffset += bucket.positions.length;
    if (uvs) {
      uvs.set(bucket.uvs, uvOffset);
      uvOffset += bucket.uvs.length;
    }
    const vertexCount = bucket.positions.length / 3;
    next.addGroup(vertexOffset, vertexCount, materialIndex);
    vertexOffset += vertexCount;
  });
  source.dispose?.();
  geometry.dispose?.();
  next.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if (uvs) next.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  next.computeVertexNormals();
  next.computeBoundingBox();
  next.computeBoundingSphere();
  return next;
}

function makePlaqueExtrudeTemplateKey(options = {}) {
  return [
    options.bevelEnabled ? 1 : 0,
    Number(options.bevelThickness) || 0,
    Number(options.bevelSize) || 0,
    Number(options.bevelSegments) || 0,
    Number(options.curveSegments) || 0,
  ].join(':');
}

function setPlaqueGeometryDepth(geometry, zBase, oldDepth, nextDepth, nextZBase = zBase) {
  const position = geometry?.attributes?.position;
  if (!position || !Number.isFinite(oldDepth) || oldDepth <= 0) return false;
  const array = position.array;
  const depth = Math.max(0.01, Number(nextDepth) || PLAQUE_DEFAULT_LAYER_DEPTH);
  const sourceZBase = Number(zBase) || 0;
  const targetZBase = Number(nextZBase) || 0;
  for (let vertex = 0; vertex < position.count; vertex += 1) {
    const offset = vertex * 3 + 2;
    const ratio = clamp((array[offset] - sourceZBase) / oldDepth, 0, 1);
    array[offset] = targetZBase + ratio * depth;
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals?.();
  geometry.computeBoundingBox?.();
  geometry.computeBoundingSphere?.();
  return true;
}

function buildRasterPlaqueShapes(mask, width, height, bounds, options = {}) {
  const cacheKey = makePlaqueRasterShapeCacheKey(width, height, bounds, options);
  let maskCache = plaqueRasterShapeCache.get(mask);
  if (!maskCache) {
    maskCache = new Map();
    plaqueRasterShapeCache.set(mask, maskCache);
  } else if (maskCache.has(cacheKey)) {
    return maskCache.get(cacheKey);
  }
  const cachedContourShapes = buildPlaqueShapesFromCachedContours(options.cacheOwner?.plaqueContourCache?.[cacheKey], bounds, options);
  if (cachedContourShapes) {
    maskCache.set(cacheKey, cachedContourShapes);
    return cachedContourShapes;
  }
  const traceMask = preparePlaqueTraceMask(mask, width, height, options.maxTraceSide || 420);
  const traceSourceMask = options.preserveCorners
    ? traceMask.mask
    : cleanPlaqueTraceMask(traceMask.mask, traceMask.width, traceMask.height);
  const loops = traceMaskLoops(traceSourceMask, traceMask.width, traceMask.height)
    .map((loop) => makePlaqueSmoothLoop(loop, options))
    .filter((loop) => loop.length >= 8);
  const minArea = traceMask.width * traceMask.height * (options.minAreaRatio ?? 0.00004);
  const outers = [];
  const holes = [];
  loops.forEach((loop) => {
    const area = polygonArea(loop);
    const item = {
      loop,
      area,
      absArea: Math.abs(area),
    };
    if (item.absArea < minArea) return;
    if (area >= 0) outers.push(item);
    else holes.push(item);
  });
  if (!outers.length) return [];
  outers.sort((a, b) => b.absArea - a.absArea);
  holes.sort((a, b) => b.absArea - a.absArea);
  const maxShapes = Math.max(1, Number(options.maxShapes) || 80);
  const maxHoles = Math.max(0, Number(options.maxHoles) || 96);
  const usableOuters = options.outerOnly ? outers.slice(0, 1) : outers.slice(0, maxShapes);
  const usableHoles = holes.slice(0, maxHoles);
  const contourEntry = createPlaqueContourCacheEntry(usableOuters, usableHoles, traceMask.width, traceMask.height);
  cachePlaqueContourEntry(options.cacheOwner, cacheKey, contourEntry);
  const shapes = buildPlaqueShapesFromCachedContours(contourEntry, bounds, options) || [];
  maskCache.set(cacheKey, shapes);
  return shapes;
}

function createPlaqueContourCacheEntry(outers, holes, width, height) {
  return {
    version: PLAQUE_CONTOUR_CACHE_VERSION,
    width,
    height,
    shapes: outers.map((outer) => ({
      outer: clonePlaqueContourLoop(outer.loop),
      holes: holes
        .filter((hole) => pointInPolygon(hole.loop[0], outer.loop))
        .map((hole) => clonePlaqueContourLoop(hole.loop)),
    })),
  };
}

function clonePlaqueContourLoop(loop) {
  return (loop || []).map((point) => [Number(point[0]) || 0, Number(point[1]) || 0]);
}

function cachePlaqueContourEntry(owner, cacheKey, entry) {
  if (!owner || !cacheKey || !entry?.shapes?.length) return;
  if (!owner.plaqueContourCache || typeof owner.plaqueContourCache !== 'object') owner.plaqueContourCache = {};
  owner.plaqueContourCache[cacheKey] = entry;
}

function buildPlaqueShapesFromCachedContours(entry, bounds, options = {}) {
  if (!entry || entry.version !== PLAQUE_CONTOUR_CACHE_VERSION || !Array.isArray(entry.shapes)) return null;
  const width = Number(entry.width) || 0;
  const height = Number(entry.height) || 0;
  if (!width || !height) return null;
  const shapes = entry.shapes
    .map((item) => {
      if (!Array.isArray(item?.outer) || item.outer.length < 3) return null;
      const shape = makePlaqueShapeFromLoop(item.outer, width, height, bounds, options);
      (item.holes || []).forEach((hole) => {
        if (!Array.isArray(hole) || hole.length < 3) return;
        shape.holes.push(makePlaquePathFromLoop(hole, width, height, bounds, options));
      });
      return shape;
    })
    .filter(Boolean);
  return shapes.length ? shapes : null;
}

function makePlaqueRasterShapeCacheKey(width, height, bounds, options = {}) {
  return [
    width,
    height,
    Math.round((bounds?.width || 0) * 100),
    Math.round((bounds?.height || 0) * 100),
    Number(options.maxTraceSide) || 420,
    Number(options.smoothingPasses) || 0,
    Number(options.simplifyTolerance) || 0,
    Number(options.polishPasses) || 0,
    Number(options.finalPointSpacing) || 0,
    Number(options.minAreaRatio) || 0,
    Number(options.maxShapes) || 0,
    Number(options.maxHoles) || 0,
    options.preserveCorners ? 1 : 0,
    options.preserveLogoEdges ? 1 : 0,
    options.exactPixelBoundaryMode ? 1 : 0,
    options.labelledMapPipeline ? 1 : 0,
    options.traceQuality || '',
    options.contourClass || '',
    options.preserveTextCorners ? 1 : 0,
    Number(options.contourOverlap) || 0,
    options.outerOnly ? 1 : 0,
  ].join(':');
}

function preparePlaqueTraceMask(mask, width, height, maxSide = 420) {
  const largestSide = Math.max(width, height);
  if (!mask || largestSide <= maxSide) return { mask, width, height };
  const scale = maxSide / largestSide;
  const nextWidth = Math.max(16, Math.round(width * scale));
  const nextHeight = Math.max(16, Math.round(height * scale));
  const targetMask = new Uint8Array(nextWidth * nextHeight);
  const sampleOffsets = [
    [0.5, 0.5],
    [0.25, 0.25],
    [0.75, 0.25],
    [0.25, 0.75],
    [0.75, 0.75],
  ];
  for (let y = 0; y < nextHeight; y += 1) {
    for (let x = 0; x < nextWidth; x += 1) {
      let hits = 0;
      sampleOffsets.forEach(([offsetX, offsetY]) => {
        const sourceX = clamp(Math.floor(((x + offsetX) / nextWidth) * width), 0, width - 1);
        const sourceY = clamp(Math.floor(((y + offsetY) / nextHeight) * height), 0, height - 1);
        if (mask[sourceY * width + sourceX]) hits += 1;
      });
      targetMask[y * nextWidth + x] = hits >= 2 ? 1 : 0;
    }
  }
  return { mask: targetMask, width: nextWidth, height: nextHeight };
}

function cleanPlaqueTraceMask(mask, width, height) {
  if (!mask || width < 4 || height < 4) return mask;
  const firstPass = new Uint8Array(mask.length);
  const secondPass = new Uint8Array(mask.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      let neighbors = 0;
      for (let oy = -1; oy <= 1; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          const nx = x + ox;
          const ny = y + oy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          if (mask[ny * width + nx]) neighbors += 1;
        }
      }
      firstPass[index] = mask[index] ? (neighbors >= 3 ? 1 : 0) : (neighbors >= 7 ? 1 : 0);
    }
  }
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      let neighbors = 0;
      for (let oy = -1; oy <= 1; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          const nx = x + ox;
          const ny = y + oy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          if (firstPass[ny * width + nx]) neighbors += 1;
        }
      }
      secondPass[index] = firstPass[index] ? (neighbors >= 3 ? 1 : 0) : 0;
    }
  }
  return secondPass;
}

function makePlaqueSmoothLoop(loop, options = {}) {
  const deduped = removeNearDuplicatePoints(loop, 0.01);
  if (options.preserveCorners) return makePlaqueCornerPreservingLoop(deduped, options);
  const prefiltered = removeTinyContourJitter(deduped, options.simplifyTolerance ?? 0.18);
  const smoothed = chaikinSmoothClosed(prefiltered, options.smoothingPasses ?? 2);
  const simplified = simplifyPolygon(smoothed, options.simplifyTolerance ?? 0.18);
  const polished = chaikinSmoothClosed(simplified, options.polishPasses ?? 1);
  return removeNearDuplicatePoints(polished, options.finalPointSpacing ?? 0.08);
}

function makePlaqueCornerPreservingLoop(points, options = {}) {
  if (!Array.isArray(points) || points.length < 4) return points;
  const exactPixelBoundaryMode = options.exactPixelBoundaryMode === true;
  const preserveTextCorners = options.preserveTextCorners === true;
  const deduped = exactPixelBoundaryMode
    ? removeSequentialDuplicatePlaquePoints(points)
    : removeNearDuplicatePoints(points, preserveTextCorners ? 0.004 : (options.finalPointSpacing ?? 0.06));
  if (exactPixelBoundaryMode) return deduped;
  if (deduped.length < 16) return deduped;
  if (preserveTextCorners) {
    const simplifiedText = simplifyClosedPlaqueLoop(deduped, options.simplifyTolerance ?? 0.045);
    const output = simplifiedText.length >= 8 ? simplifiedText : deduped;
    return removeNearDuplicatePoints(output, options.finalPointSpacing ?? 0.012);
  }
  const simplified = simplifyClosedPlaqueLoop(deduped, options.simplifyTolerance ?? 0.48);
  return simplified.length >= 8 ? simplified : deduped;
}

function removeSequentialDuplicatePlaquePoints(points) {
  if (!Array.isArray(points) || points.length < 2) return points || [];
  const output = [];
  points.forEach((point) => {
    const prev = output[output.length - 1];
    if (prev && Math.abs(prev[0] - point[0]) < 0.0001 && Math.abs(prev[1] - point[1]) < 0.0001) return;
    output.push(point);
  });
  if (output.length > 1) {
    const first = output[0];
    const last = output[output.length - 1];
    if (Math.abs(first[0] - last[0]) < 0.0001 && Math.abs(first[1] - last[1]) < 0.0001) output.pop();
  }
  return output.length >= 3 ? output : points;
}

function simplifyClosedPlaqueLoop(points, tolerance = 0.48) {
  if (!Array.isArray(points) || points.length < 16) return points;
  let first = 0;
  let second = 0;
  let bestDistance = -1;
  const sampleStep = Math.max(1, Math.floor(points.length / 160));
  for (let a = 0; a < points.length; a += sampleStep) {
    for (let b = a + sampleStep; b < points.length; b += sampleStep) {
      const distance = (points[a][0] - points[b][0]) ** 2 + (points[a][1] - points[b][1]) ** 2;
      if (distance > bestDistance) {
        bestDistance = distance;
        first = a;
        second = b;
      }
    }
  }
  if (first === second) return points;
  const arcA = collectClosedPlaqueArc(points, first, second);
  const arcB = collectClosedPlaqueArc(points, second, first);
  const simplifiedA = simplifyPolygon(arcA, tolerance);
  const simplifiedB = simplifyPolygon(arcB, tolerance);
  const merged = simplifiedA.slice(0, -1).concat(simplifiedB.slice(0, -1));
  return merged.length >= 8 ? removeNearDuplicatePoints(merged, 0.01) : points;
}

function collectClosedPlaqueArc(points, start, end) {
  const output = [];
  for (let index = start, guard = 0; guard <= points.length; guard += 1) {
    output.push(points[index]);
    if (index === end) break;
    index = (index + 1) % points.length;
  }
  return output;
}

function makePlaqueShapeFromLoop(loop, width, height, bounds, options = {}) {
  const rawPoints = loop.map(([x, y]) => plaqueMaskPointToModel(x, y, width, height, bounds));
  const overlap = clamp(Number(options.contourOverlap) || 0, 0, 0.45);
  const points = overlap > 0 ? offsetThreePolygon(rawPoints, overlap) : rawPoints;
  const shape = new THREE.Shape();
  if (!points.length) return shape;
  addPlaqueClosedPath(shape, points, options);
  return shape;
}

function makePlaquePathFromLoop(loop, width, height, bounds, options = {}) {
  const points = loop.map(([x, y]) => plaqueMaskPointToModel(x, y, width, height, bounds));
  const path = new THREE.Path();
  if (!points.length) return path;
  addPlaqueClosedPath(path, points, options);
  return path;
}

function addPlaqueClosedPath(path, points, options = {}) {
  if (options.preserveCorners) {
    addCrispClosedPlaquePath(path, points);
    return;
  }
  addSmoothClosedPlaquePath(path, points);
}

function addCrispClosedPlaquePath(path, points) {
  if (!points.length) return;
  path.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => path.lineTo(point.x, point.y));
  path.closePath();
}

function addSmoothClosedPlaquePath(path, points) {
  if (points.length < 3) {
    path.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => path.lineTo(point.x, point.y));
    path.closePath();
    return;
  }
  const start = midpointVector2(points[points.length - 1], points[0]);
  path.moveTo(start.x, start.y);
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const mid = midpointVector2(current, next);
    path.quadraticCurveTo(current.x, current.y, mid.x, mid.y);
  }
  path.closePath();
}

function plaqueMaskPointToModel(x, y, width, height, bounds) {
  return new THREE.Vector2((x / width - 0.5) * bounds.width, (0.5 - y / height) * bounds.height);
}

function buildPlaqueLayerRunGroup(mask, width, height, bounds, options) {
  const group = new THREE.Group();
  group.name = `plaqueLayer${options.index}`;
  const zBase = Number.isFinite(Number(options.zBase))
    ? Number(options.zBase)
    : getPlaqueColourLayerBottomZ(Number(state.three?.group?.userData?.plaqueBackingFrontZ) || Number(state.plaque.baseThickness) || 0);
  group.userData = {
    plaqueLayer: options.index,
    depth: options.depth,
    zBase,
    hex: options.hex,
    geometries: [],
  };
  const step = Math.max(4, Math.round(Math.max(width, height) / 110));
  const z = zBase + options.depth / 2;
  for (let y = 0; y < height; y += step) {
    let x = 0;
    while (x < width) {
      while (x < width && !blockHasPixel(mask, width, height, x, y, step)) x += step;
      const start = x;
      while (x < width && blockHasPixel(mask, width, height, x, y, step)) x += step;
      if (x <= start) continue;
      const runWidthPx = x - start;
      const boxWidth = Math.max(0.45, (runWidthPx / width) * bounds.width);
      const boxHeight = Math.max(0.45, (Math.min(step, height - y) / height) * bounds.height);
      const centerX = ((start + runWidthPx / 2) / width - 0.5) * bounds.width;
      const centerY = (0.5 - (y + Math.min(step, height - y) / 2) / height) * bounds.height;
      const geometry = new THREE.BoxBufferGeometry(boxWidth, boxHeight, options.depth);
      geometry.computeVertexNormals();
      const mesh = new THREE.Mesh(geometry, options.material);
      mesh.position.set(centerX, centerY, z);
      mesh.userData = {
        plaqueLayer: options.index,
        depth: options.depth,
      };
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      group.userData.geometries.push(geometry);
    }
  }
  return group;
}

function addPlaqueSelectionOutline(group) {
  if (group.userData?.hasSvgPlaqueLayers) return;
  const selected = clamp(Number(state.plaque.selectedLayer) || 0, 0, Math.max(0, (state.processed?.colours?.length || 1) - 1));
  const mesh = group.userData.plaqueMeshes?.find((item) => item.userData.plaqueLayer === selected);
  if (!mesh?.userData?.points?.length) return;
  const points = mesh.userData.points;
  const depth = Number(mesh.userData.depth) || PLAQUE_DEFAULT_LAYER_DEPTH;
  const zBase = Number.isFinite(Number(mesh.userData.zBase))
    ? Number(mesh.userData.zBase)
    : getPlaqueColourLayerBottomZ(Number(group.userData?.plaqueBackingFrontZ) || Number(group.userData?.plaqueBaseThickness) || 0);
  const topZ = zBase + depth + 0.18;
  const positions = [];
  points.forEach((point) => positions.push(point.x, point.y, topZ));
  positions.push(points[0].x, points[0].y, topZ);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({
    color: 0xffc529,
    transparent: true,
    opacity: 0.96,
    linewidth: 2,
  });
  const line = new THREE.Line(geometry, material);
  line.name = 'plaqueSelectionOutline';
  line.renderOrder = 200;
  line.userData.plaqueBackingOnlyHidden = true;
  group.add(line);
  state.three.resources.push(geometry, material);
}

function updatePlaqueLayerHighlight() {
  const meshes = state.three?.group?.userData?.plaqueMeshes || [];
  meshes.forEach((layerGroup) => {
    const selected = layerGroup.userData.plaqueLayer === state.plaque.selectedLayer;
    const shouldScale = selected;
    layerGroup.scale.set(shouldScale ? 1.008 : 1, shouldScale ? 1.008 : 1, 1);
    const materials = flattenMaterials(layerGroup.material || layerGroup.userData.material);
    materials.forEach((material, materialIndex) => {
      if (!material?.emissive) return;
      const layerByMaterial = layerGroup.userData.layerByMaterialIndex;
      const materialLayer = Array.isArray(layerByMaterial) ? layerByMaterial[materialIndex] : layerGroup.userData.plaqueLayer;
      const materialSelected = materialLayer === state.plaque.selectedLayer;
      const baseEmissive = material.userData?.plaqueEmissiveHex || '#000000';
      const baseIntensity = Number(material.userData?.plaqueEmissiveIntensity) || 0;
      if (material.userData?.plaqueSourceHex || material.userData?.plaqueGlossyDarkSide) {
        material.emissive.copy(makeThreeColour(baseEmissive));
        material.emissiveIntensity = baseIntensity;
        material.needsUpdate = true;
        return;
      }
      material.emissive.copy(makeThreeColour(materialSelected ? '#ffc529' : baseEmissive));
      material.emissiveIntensity = materialSelected ? Math.max(baseIntensity, 0.08) : baseIntensity;
    });
  });
}

function applyPlaqueDebugMaterials(group = state.three?.group) {
  if (!group) return;
  const meshes = group.userData?.plaqueMeshes || [];
  meshes.forEach((item) => {
    const targets = item.isMesh ? [item] : item.children || [];
    targets.forEach((mesh) => {
      const materials = flattenMaterials(mesh.material || item.userData?.material);
      materials.forEach((material) => {
      if (!material) return;
      material.wireframe = Boolean(state.plaque.wireframe);
      material.transparent = Boolean(state.plaque.showShells);
      material.opacity = state.plaque.showShells ? 0.72 : 1;
      material.needsUpdate = true;
      });
    });
  });
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
    if (region >= 0 && masks[region]) {
      masks[region][index] = 1;
    } else {
      emptyOpaquePixels += 1;
    }
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
    originalRegion: region,
  }));
  const warnings = [];
  if (emptyOpaquePixels > 0) {
    warnings.push({
      level: 'error',
      text: `${emptyOpaquePixels} opaque pixels were not assigned to a plaque colour layer.`,
    });
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

function assignPlaqueRasterPixelsToFinalColours(regionIndex, alphaMask, alphaValues, data, main, width, height) {
  if (!regionIndex || !alphaMask || !alphaValues || !data || !main?.length) return;
  const zeroGap = state.plaque.zeroGapColourLayers !== false;
  for (let i = 0; i < regionIndex.length; i += 1) {
    if (!alphaMask[i]) continue;
    const offset = i * 4;
    const match = nearestPlaqueColourMatch(main, [
      data[offset],
      data[offset + 1],
      data[offset + 2],
    ]);
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
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return -1;
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
    return {
      rgb,
      luma: colourLuma(rgb),
      chroma: colourChroma(rgb),
      isYellow: rgb[0] > 180 && rgb[1] > 140 && rgb[2] < 90,
    };
  });
  const next = new Int16Array(regionIndex);
  let changed = 0;
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
        const beatsCurrent = count > bestCount || (count === bestCount && distance + 8 < currentDistance);
        if (beatsCurrent) {
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
        changed += 1;
      }
    }
  }
  if (!changed) return;
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
        const cardinals = [
          index - 1,
          index + 1,
          index - width,
          index + width,
        ];
        cardinals.forEach((neighborIndex) => {
          if (!alphaMask[neighborIndex]) return;
          const region = regionIndex[neighborIndex];
          if (region < 0) return;
          if (region === current) same4 += 1;
          else different4 += 1;
          counts.set(region, (counts.get(region) || 0) + 2);
        });
        [
          index - width - 1,
          index - width + 1,
          index + width - 1,
          index + width + 1,
        ].forEach((neighborIndex) => {
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
      const neighbors = [
        x > 0 ? index - 1 : -1,
        x + 1 < width ? index + 1 : -1,
        y > 0 ? index - width : -1,
        y + 1 < height ? index + width : -1,
      ];
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
    const protectRealWhiteDetails = info.isWhite && component.length > tinyPixels;
    if (protectRealWhiteDetails) continue;
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
  let changed = 0;
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
      if (!textEdgeContamination && !skinEdgeContamination && !isolatedGreyInLogoColour) continue;
      next[index] = replacement;
      changed += 1;
    }
  }
  if (!changed) return;
  for (let i = 0; i < regionIndex.length; i += 1) regionIndex[i] = next[i];
}

function cleanPlaqueRasterRegionMasks(regions, regionIndex, alphaMask, width, height, options = {}) {
  if (!regions?.length || !regionIndex || !alphaMask || !width || !height) return;
  const totalPixels = width * height;
  const exactPixelBoundaryMode = normalizePlaqueTraceQuality(state.plaque.traceQuality) !== 'smooth' && state.plaque.exactPixelBoundaryMode !== false;
  regions.forEach((region, regionId) => {
    if (!region?.mask) return;
    const minPixels = exactPixelBoundaryMode
      ? Math.max(3, Math.round(totalPixels * 0.000002))
      : Math.max(7, Math.round(totalPixels * (regionId === 0 ? 0.000018 : 0.000012)));
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
      const neighbors = [
        x > 0 ? current - 1 : -1,
        x < width - 1 ? current + 1 : -1,
        y > 0 ? current - width : -1,
        y < height - 1 ? current + width : -1,
      ];
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
    const nearest = keyColours.reduce((best, item) => Math.min(best, colourDistance(rgb, item.rgb)), Infinity);
    const distinctEnough = nearest > (isCriticalNeutral ? 42 : 58);
    if ((share >= 0.018 || isCriticalNeutral) && distinctEnough) keyColours.push(cluster);
  });
  return clamp(keyColours.length || Math.min(usable.length, 5), 1, 5);
}

function shouldBuildPlaquePreview() {
  return Boolean(state.processed);
}

function schedulePlaqueBuild(delay = 60) {
  if (!shouldBuildPlaquePreview() || state.productType !== 'plaque') return;
  if (state.plaque.buildTimer) clearTimeout(state.plaque.buildTimer);
  const token = (Number(state.plaque.buildToken) || 0) + 1;
  state.plaque.buildToken = token;
  if (!state.isDefaultPreview) {
    els.stage.classList.add('regenerating');
    setPlaqueLoadingProgress(72, 'Building raised layers');
  }
  state.plaque.buildTimer = window.setTimeout(() => {
    state.plaque.buildTimer = null;
    if (state.productType !== 'plaque' || state.plaque.buildToken !== token) return;
    renderPreview();
    requestAnimationFrame(() => {
      if (state.productType === 'plaque' && state.plaque.buildToken === token) {
        finishPlaqueBuildStatus();
      }
    });
  }, delay);
}

function setPlaqueLoadingProgress(percent, label = 'Preparing 3D Plaque') {
  if (!els.submitNote) return;
  const value = Math.round(clamp(Number(percent) || 0, 0, 100));
  els.submitNote.classList.remove('checkout-fallback-note');
  els.submitNote.classList.add('plaque-progress-note');
  els.submitNote.style.setProperty('--plaque-progress', `${value}%`);
  els.submitNote.innerHTML = `
    <span class="plaque-progress-head">
      <span class="plaque-progress-label">${escapeHtml(label)}</span>
      <span class="plaque-progress-percent">${value}%</span>
    </span>
    <span class="plaque-progress-track" aria-hidden="true">
      <span class="plaque-progress-fill"></span>
    </span>
  `;
}

function finishPlaqueBuildStatus() {
  els.stage?.classList.remove('regenerating');
  if (els.submitNote && (els.submitNote.classList.contains('plaque-progress-note') || /Loading 3D Plaque logo|Preparing 3D Plaque geometry|Building raised layers/i.test(els.submitNote.textContent || ''))) {
    els.submitNote.classList.remove('plaque-progress-note');
    els.submitNote.style.removeProperty('--plaque-progress');
    els.submitNote.textContent = '';
  }
}

function cancelPlaqueBuild() {
  if (state.plaque.buildTimer) {
    clearTimeout(state.plaque.buildTimer);
    state.plaque.buildTimer = null;
  }
  state.plaque.buildToken = (Number(state.plaque.buildToken) || 0) + 1;
  finishPlaqueBuildStatus();
}

function renderPlaqueControls() {
  syncPlaqueLayers();
  renderPlaqueBaseControl();
  renderPlaqueLayerControls();
  renderPlaqueTraceQualityControls();
  renderPlaqueDiagnostics();
}

function renderPlaqueTraceQualityControls() {
  const quality = normalizePlaqueTraceQuality(state.plaque.traceQuality);
  state.plaque.traceQuality = quality;
  state.plaque.exactPixelBoundaryMode = quality !== 'smooth';
  state.plaque.previewDebugMode = 'extruded';
  state.plaque.usePngFrontTextureFallback = false;
  els.plaqueTraceQualityButtons.forEach((button) => {
    const active = button.dataset.plaqueTraceQuality === quality;
    button.classList.toggle('active', active);
    button.setAttribute('aria-checked', active ? 'true' : 'false');
  });
}

function renderPlaqueBaseControl() {
  const value = clamp(Number(state.plaque.baseThickness) || PLAQUE_DEFAULT_BASE_THICKNESS, PLAQUE_BASE_THICKNESS_MIN, PLAQUE_BASE_THICKNESS_MAX);
  state.plaque.baseThickness = value;
  const padding = clamp(Number(state.plaque.basePadding) || PLAQUE_DEFAULT_BASE_PADDING, 0, 6);
  state.plaque.basePadding = padding;
  if (els.plaqueBaseThickness && Number(els.plaqueBaseThickness.value) !== value) {
    els.plaqueBaseThickness.value = String(value);
  }
  if (els.plaqueBasePadding && Number(els.plaqueBasePadding.value) !== padding) {
    els.plaqueBasePadding.value = String(padding);
  }
  updateRangeFill(els.plaqueBaseThickness);
  updateRangeFill(els.plaqueBasePadding);
  if (els.plaqueBaseThicknessValue) els.plaqueBaseThicknessValue.textContent = '';
  if (els.plaqueBasePaddingValue) els.plaqueBasePaddingValue.textContent = '';
  if (els.plaqueVectorDebug) els.plaqueVectorDebug.checked = Boolean(state.plaque.showVectorDebug);
  if (els.plaqueHideTopTexture) els.plaqueHideTopTexture.checked = Boolean(state.plaque.hideTopTexture);
  if (els.plaqueShowBackingOnly) els.plaqueShowBackingOnly.checked = Boolean(state.plaque.showBackingOnly);
  if (els.plaqueWireframe) els.plaqueWireframe.checked = Boolean(state.plaque.wireframe);
  if (els.plaqueNormals) els.plaqueNormals.checked = Boolean(state.plaque.normals);
  if (els.plaqueTopologyDebug) els.plaqueTopologyDebug.checked = Boolean(state.plaque.topologyDebug);
  if (els.plaqueShowShells) els.plaqueShowShells.checked = Boolean(state.plaque.showShells);
  if (els.plaqueBooleanOnly) els.plaqueBooleanOnly.checked = Boolean(state.plaque.booleanOnly);
}

function syncPlaqueLayers() {
  const layers = getPlaqueLayerDescriptors();
  const sourceIndices = getPlaqueLayerSourceIndices(layers);
  const keepDepthsLayerAligned = shouldUseUploadedRasterPlaqueHierarchy(state.processed);
  const previousSourceIndices = Array.isArray(state.plaque.layerSourceIndices)
    ? state.plaque.layerSourceIndices
    : [];
  const valuesAreAlreadyLayerAligned = sourceIndices.length === previousSourceIndices.length
    && sourceIndices.every((sourceIndex, index) => Number(previousSourceIndices[index]) === sourceIndex);
  const resetUploadedLayerState = keepDepthsLayerAligned && !valuesAreAlreadyLayerAligned && previousSourceIndices.length > 0;
  const currentDepths = Array.isArray(state.plaque.layerDepths) ? state.plaque.layerDepths : [];
  state.plaque.layerDepths = layers.map((_, index) => {
    if (resetUploadedLayerState) return getDefaultPlaqueLayerDepth(index, layers[index]);
    const sourceIndex = sourceIndices[index];
    if (!keepDepthsLayerAligned && !valuesAreAlreadyLayerAligned && Number.isFinite(sourceIndex) && sourceIndex !== index) {
      const sourceCurrent = Number(currentDepths[sourceIndex]);
      if (Number.isFinite(sourceCurrent)) return clamp(sourceCurrent, PLAQUE_LAYER_DEPTH_MIN, PLAQUE_LAYER_DEPTH_MAX);
    }
    const current = Number(currentDepths[index]);
    if (Number.isFinite(current)) return clamp(current, PLAQUE_LAYER_DEPTH_MIN, PLAQUE_LAYER_DEPTH_MAX);
    return getDefaultPlaqueLayerDepth(index, layers[index]);
  });
  const currentOverrides = Array.isArray(state.plaque.colourOverrides) ? state.plaque.colourOverrides : [];
  state.plaque.colourOverrides = layers.map((_, index) => {
    if (resetUploadedLayerState) return '';
    const sourceIndex = sourceIndices[index];
    const current = (!keepDepthsLayerAligned && !valuesAreAlreadyLayerAligned && Number.isFinite(sourceIndex) && sourceIndex !== index ? currentOverrides[sourceIndex] : '') || currentOverrides[index];
    return current ? normalizeHex(current) : '';
  });
  state.plaque.layerSourceIndices = sourceIndices;
  if (!layers.length) state.plaque.selectedLayer = 0;
  else state.plaque.selectedLayer = clamp(Number(state.plaque.selectedLayer) || 0, 0, layers.length - 1);
}

function getPlaqueLayerSourceIndices(layers) {
  return (layers || []).map((layer, index) => {
    const sourceIndex = Number(layer?.sourceIndex);
    return Number.isFinite(sourceIndex) ? sourceIndex : index;
  });
}

function renderPlaqueLayerControls() {
  const layers = getPlaqueLayerDescriptors();
  if (!layers.length) {
    if (els.plaqueLayerList) els.plaqueLayerList.innerHTML = '<p class="plate-empty">Upload artwork to detect colour layers.</p>';
    renderPlaqueVisualizerLayerTray(layers);
    return;
  }
  if (els.plaqueLayerList) {
    els.plaqueLayerList.innerHTML = renderPlaquePanelLayerMarkup(layers);
    els.plaqueLayerList.querySelectorAll('[data-plaque-depth]').forEach(updateRangeFill);
  }
  renderPlaqueVisualizerLayerTray(layers);
}

function renderPlaquePanelLayerMarkup(layers = getPlaqueLayerDescriptors()) {
  const backingHex = getPlaqueBackingHex(state.processed);
  const backingRow = `
    <article class="plaque-layer-row plaque-backing-row" data-plaque-backing-layer>
      <button class="plaque-layer-swatch" type="button" data-plaque-backing-colour style="--layer-color:${backingHex};" aria-label="Change Backing colour"></button>
      <div class="plaque-layer-meta">
        <strong>Backing colour</strong>
        <span>${escapeHtml(normalizeHex(backingHex))}</span>
      </div>
      <span class="plaque-layer-note">Base plate</span>
    </article>
  `;
  const layerRows = layers.map((layer, index) => {
    const hex = getPlaqueLayerDisplayHex(layer, index);
    const selected = index === state.plaque.selectedLayer;
    const role = `Raised layer ${index + 1}`;
    const depth = state.plaque.layerDepths[index] ?? (index === 0 ? PLAQUE_BASE_LAYER_DEPTH : PLAQUE_DEFAULT_LAYER_DEPTH);
    return `
      <article class="plaque-layer-row${selected ? ' selected' : ''}" data-plaque-layer="${index}">
        <button class="plaque-layer-swatch" type="button" data-plaque-colour="${index}" style="--layer-color:${hex};" aria-label="Change ${escapeHtml(role)} colour"></button>
        <label class="plaque-depth-control">
          <input type="range" min="${PLAQUE_LAYER_DEPTH_MIN}" max="${PLAQUE_LAYER_DEPTH_MAX}" step="0.2" value="${depth.toFixed(1)}" data-plaque-depth="${index}" aria-label="${escapeHtml(role)} extrusion depth" />
        </label>
        <button class="plaque-layer-reset" type="button" data-plaque-layer-reset="${index}" aria-label="Reset ${escapeHtml(role)} depth">Reset</button>
      </article>
    `;
  }).join('');
  return backingRow + layerRows;
}

function renderPlaqueVisualizerLayerTray(layers = getPlaqueLayerDescriptors()) {
  if (!els.plaqueVisualLayerTray || !els.plaqueVisualLayerList) return;
  const shouldShow = state.productType === 'plaque' && layers.length > 0;
  els.plaqueVisualLayerTray.hidden = !shouldShow;
  if (!shouldShow) {
    els.plaqueVisualLayerList.innerHTML = '';
    return;
  }
  const collapsed = Boolean(state.plaque.visualLayerTrayCollapsed);
  const editorOpen = !collapsed && Boolean(state.plaque.visualLayerEditorOpen);
  els.plaqueVisualLayerTray.classList.toggle('collapsed', collapsed);
  els.plaqueVisualLayerTray.classList.toggle('editing', editorOpen);
  els.plaqueVisualLayerToggle?.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  els.plaqueVisualLayerList.innerHTML = renderPlaqueVisualizerLayerMarkup(layers);
  els.plaqueVisualLayerList.querySelectorAll('[data-plaque-depth]').forEach(updateRangeFill);
  refreshMobilePlaqueSafeFrame();
}

function refreshMobilePlaqueSafeFrame() {
  if (state.productType !== 'plaque' || !isMobilePreviewViewport() || !state.three?.group) return;
  window.requestAnimationFrame(() => {
    if (state.productType !== 'plaque' || !state.three?.group) return;
    applyPreviewZoom({ render: false });
    applyPreviewPan();
    renderThree();
  });
}

function renderPlaqueVisualizerLayerMarkup(layers = getPlaqueLayerDescriptors()) {
  const selectedIndex = clamp(Number(state.plaque.selectedLayer) || 0, 0, Math.max(0, layers.length - 1));
  const raisedRows = layers.map((layer, index) => {
    const hex = getPlaqueLayerDisplayHex(layer, index);
    const selected = index === selectedIndex;
    const role = `Raised layer ${index + 1}`;
    return `
      <button class="plaque-visual-layer-chip${selected ? ' selected' : ''}" type="button" data-plaque-layer="${index}" style="--layer-color:${hex};" aria-pressed="${selected ? 'true' : 'false'}" aria-label="Adjust ${escapeHtml(role)} depth">
        <span class="plaque-visual-layer-swatch" aria-hidden="true"></span>
        <span class="plaque-visual-layer-label">${index + 1}</span>
      </button>
    `;
  }).join('');
  const selectedLayer = layers[selectedIndex];
  const selectedHex = getPlaqueLayerDisplayHex(selectedLayer, selectedIndex);
  const selectedRole = `Raised layer ${selectedIndex + 1}`;
  const selectedDepth = state.plaque.layerDepths[selectedIndex] ?? (selectedIndex === 0 ? PLAQUE_BASE_LAYER_DEPTH : PLAQUE_DEFAULT_LAYER_DEPTH);
  const editor = state.plaque.visualLayerEditorOpen ? `
    <article class="plaque-visual-layer-editor" data-plaque-layer="${selectedIndex}">
      <div class="plaque-visual-layer-editor-head">
        <span class="plaque-visual-layer-editor-swatch" style="--layer-color:${selectedHex};" aria-hidden="true"></span>
        <strong>${escapeHtml(selectedRole)}</strong>
        <button class="plaque-layer-reset plaque-visual-layer-reset" type="button" data-plaque-layer-reset="${selectedIndex}" aria-label="Reset ${escapeHtml(selectedRole)} depth">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 3-6.7"></path>
            <path d="M3 4v6h6"></path>
          </svg>
        </button>
      </div>
      <label class="plaque-depth-control plaque-visual-depth-control">
        <input type="range" min="${PLAQUE_LAYER_DEPTH_MIN}" max="${PLAQUE_LAYER_DEPTH_MAX}" step="0.2" value="${selectedDepth.toFixed(1)}" data-plaque-depth="${selectedIndex}" aria-label="${escapeHtml(selectedRole)} extrusion depth" />
      </label>
    </article>
  ` : '';
  return `
    <div class="plaque-visual-raised-grid">${raisedRows}</div>
    ${editor}
  `;
}

function syncPlaqueLayerControlState(activeIndex, depth) {
  [els.plaqueLayerList, els.plaqueVisualLayerList].forEach((container) => {
    if (!container) return;
    container.querySelectorAll('[data-plaque-layer]').forEach((row) => {
      const selected = Number(row.dataset.plaqueLayer) === state.plaque.selectedLayer;
      row.classList.toggle('selected', selected);
      if (row.matches('button')) row.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
    if (!Number.isFinite(activeIndex)) return;
    container.querySelectorAll(`[data-plaque-depth="${activeIndex}"]`).forEach((input) => {
      input.value = Number(depth).toFixed(1);
      updateRangeFill(input);
    });
  });
}

function renderPlaqueDiagnostics() {
  if (!els.plaqueWarnings || !els.plaqueComplexityScore) return;
  if (!state.processed) {
    els.plaqueWarnings.innerHTML = '<li>Upload artwork to run geometry checks.</li>';
    els.plaqueComplexityScore.textContent = 'Waiting';
    return;
  }
  const warnings = [...(state.processed.warnings || [])];
  warnings.unshift({
    level: 'ok',
    text: state.artwork?.type === 'svg'
      ? '3D Plaque preview is using a locked 2.5D SVG layer stack.'
      : (normalizePlaqueTraceQuality(state.plaque.traceQuality) === 'smooth'
        ? '3D Plaque preview is using the Smooth raster cleanup stack.'
        : (normalizePlaqueTraceQuality(state.plaque.traceQuality) === 'raw'
          ? '3D Plaque preview is using the Raw Pixel Trace labelled-map PNG stack.'
          : '3D Plaque preview is using the Clean Plaque labelled-map PNG stack.')),
  });
  if (state.artwork?.type !== 'svg' && normalizePlaqueTraceQuality(state.plaque.traceQuality) !== 'smooth' && state.processed.plaqueLabelledMap) {
    const map = state.processed.plaqueLabelledMap;
    warnings.unshift({
      level: map.emptyOpaquePixels ? 'error' : 'ok',
      text: map.emptyOpaquePixels
        ? 'Labelled trace found unassigned opaque pixels; geometry may show gaps.'
        : 'Labelled trace assigned every opaque PNG pixel to one colour layer.',
    });
  }
  if (state.artwork?.type !== 'svg') {
    warnings.unshift({ level: 'warn', text: 'For best 3D plaque quality, upload an SVG. PNGs may create rougher geometry.' });
  }
  if ((state.processed.colours || []).length > 6) {
    warnings.push({ level: 'warn', text: 'Many colours may increase filament swaps and cleanup time.' });
  }
  if ((state.processed.colours || []).some((region) => region.components > 8)) {
    warnings.push({ level: 'warn', text: 'One or more colour layers has many islands; tiny details may need simplification before printing.' });
  }
  els.plaqueWarnings.innerHTML = warnings.map((warning) => `<li class="${warning.level}">${warning.text}</li>`).join('');
  const warnCount = warnings.filter((warning) => warning.level === 'warn').length;
  const hasError = warnings.some((warning) => warning.level === 'error');
  els.plaqueComplexityScore.textContent = hasError ? 'Blocked' : warnCount ? `${warnCount} warning${warnCount > 1 ? 's' : ''}` : 'Good';
}

function getPlaqueLayerDescriptors() {
  const svgLayers = getSvgPlaqueLayers();
  if (svgLayers.length) return svgLayers;
  return getPlaqueRaisedRasterRenderRegions(state.processed).map((region, index) => ({
    type: 'raster',
    index,
    sourceIndex: region.sourceIndex ?? index,
    hex: region.hex,
    region,
  }));
}

function getPlaqueRasterRenderRegions(processed) {
  if (
    state.productType === 'plaque'
    && normalizePlaqueTraceQuality(state.plaque.traceQuality) !== 'smooth'
    && processed?.plaqueLabelledMap?.regions?.length
  ) {
    return processed.plaqueLabelledMap.regions;
  }
  return processed?.colours || [];
}

function getPlaqueBackingRenderRegionIndex(processed, regions = getPlaqueRasterRenderRegions(processed)) {
  if (!regions?.length) return -1;
  const edgeIndex = getPlaqueOuterEdgeColourIndex(processed);
  if (edgeIndex >= 0 && edgeIndex < regions.length) return edgeIndex;
  const backingHex = normalizeHex(getPlaqueBackingHex(processed));
  const matchIndex = regions.findIndex((region) => normalizeHex(region?.hex || '') === backingHex);
  if (matchIndex >= 0) return matchIndex;
  return regions.length > 1 ? 0 : -1;
}

function getPlaqueRaisedRasterRenderRegions(processed) {
  const regions = getPlaqueRasterRenderRegions(processed);
  if (!regions?.length) return [];
  const mappedRegions = regions.map((region, sourceIndex) => ({
    ...region,
    sourceIndex,
    sourceRegion: region,
  }));
  if (shouldUseUploadedRasterPlaqueHierarchy(processed)) return getUploadedRasterPlaqueHierarchy(processed, mappedRegions);
  const backingIndex = getPlaqueBackingRenderRegionIndex(processed, regions);
  if (regions.length <= 1) return [];
  return mappedRegions.filter((region) => region.sourceIndex !== backingIndex);
}

function shouldUseUploadedRasterPlaqueHierarchy(processed = state.processed || state.plaque.processed) {
  const artwork = state.artwork || state.plaque.artwork;
  const hasProcessedRasterArtwork = Boolean(
    processed?.regionIndex
    && processed?.alphaMask
    && processed?.width
    && processed?.height
    && processed?.colours?.length
  );
  return Boolean(
    state.productType === 'plaque'
    && artwork?.type !== 'svg'
    && !state.isDefaultPreview
    && !state.plaque.isDefaultPreview
    && !state.plaque.isExampleProject
    && hasProcessedRasterArtwork
  );
}

function getUploadedRasterPlaqueHierarchy(processed, regions) {
  const totalPixels = Math.max(1, regions.reduce((sum, region) => sum + (Number(region?.count) || 0), 0));
  const edgeIndex = getPlaqueOuterEdgeColourIndex(processed);
  const infos = regions.map((region, index) => {
    const hex = normalizeHex(region?.hex || '#ffffff');
    const rgb = hexToRgb(hex);
    const luma = colourLuma(rgb);
    const chroma = colourChroma(rgb);
    const count = Number(region?.count) || 0;
    return {
      index,
      region,
      hex,
      rgb,
      luma,
      chroma,
      count,
      share: count / totalPixels,
      isEdge: index === edgeIndex,
      isNearWhite: isNearWhiteHex(hex),
      isNearBlack: isNearBlackHex(hex),
    };
  });
  const backingIndex = getUploadedRasterBackingRegionIndex(infos);
  const backingHex = normalizeHex(getPlaqueBackingHex(processed));
  const candidates = infos.filter((info) => {
    if (info.count <= 0) return false;
    if (backingIndex >= 0) return info.index !== backingIndex;
    return normalizeHex(info.hex) !== backingHex;
  });
  if (!candidates.length) return [];
  const roleRank = {
    detail: 0,
    accent: 1,
    'dark-detail': 2,
    'light-detail': 3,
  };
  return candidates
    .map((info) => {
      const role = getUploadedRasterPlaqueRegionRole(info);
      return {
        ...info.region,
        sourceIndex: info.index,
        sourceRegion: info.region.sourceRegion || info.region,
        plaqueRole: role,
        plaqueRoleRank: roleRank[role] ?? 2,
      };
    })
    .sort((a, b) => {
      return (a.sourceIndex ?? 0) - (b.sourceIndex ?? 0);
    });
}

function getUploadedRasterBackingRegionIndex(infos) {
  if (!infos?.length) return -1;
  const hasLogoColour = infos.some((info) => !info.isNearWhite && info.chroma >= 42 && info.share >= 0.035);
  const lightBody = infos
    .filter((info) => (
      info.isNearWhite
      && hasLogoColour
      && (info.share >= 0.18 || (info.isEdge && info.share >= 0.08))
    ))
    .sort((a, b) => {
      const aScore = a.share * 5 + (a.isEdge ? 1.2 : 0) - a.chroma / 255;
      const bScore = b.share * 5 + (b.isEdge ? 1.2 : 0) - b.chroma / 255;
      return bScore - aScore;
    })[0];
  if (lightBody) return lightBody.index;
  const backing = infos
    .filter((info) => (
      info.isNearWhite
      && info.isEdge
      && hasLogoColour
      && info.share >= 0.5
    ))
    .sort((a, b) => b.share - a.share)[0];
  if (backing) return backing.index;
  const edgeBody = infos
    .filter((info) => info.isEdge && info.share >= 0.16)
    .sort((a, b) => b.share - a.share)[0];
  return edgeBody ? edgeBody.index : -1;
}

function getUploadedRasterPlaqueRegionRole(info) {
  if (info.isNearWhite || (info.luma >= 222 && info.chroma <= 48)) return 'light-detail';
  if (info.isNearBlack || (info.luma <= 58 && info.chroma <= 58)) return 'dark-detail';
  if (info.chroma >= 88 && info.share < 0.38) return 'accent';
  return 'detail';
}

function getPlaqueRasterRegionDisplayHex(processed, regions, sourceIndex, backingIndex = getPlaqueBackingRenderRegionIndex(processed, regions)) {
  if (sourceIndex === backingIndex) return getPlaqueBackingHex(processed);
  const raisedRegions = getPlaqueRaisedRasterRenderRegions(processed);
  const raisedIndex = raisedRegions.findIndex((region) => region.sourceIndex === sourceIndex);
  if (raisedIndex >= 0) return getPlaqueLayerDisplayHex(raisedRegions[raisedIndex], raisedIndex);
  return normalizeHex(regions?.[sourceIndex]?.hex || '#ffffff');
}

function getPlaqueLayerDisplayHex(layer, index) {
  const override = state.plaque.colourOverrides?.[index];
  if (override) return normalizeHex(override);
  return normalizeHex(layer?.hex || '#ffffff');
}

function setPlaqueLayerColour(index, hex) {
  const layers = getPlaqueLayerDescriptors();
  if (!layers.length || !layers[index]) return false;
  if (!Array.isArray(state.plaque.colourOverrides)) state.plaque.colourOverrides = [];
  const normalized = normalizeHex(hex);
  state.plaque.colourOverrides[index] = normalized;
  state.plaque.selectedLayer = clamp(index, 0, layers.length - 1);
  const updatedLive = updateRenderedPlaqueLayerColour(index, normalized);
  updatePlaqueLayerHighlight();
  if (updatedLive) renderThree();
  return updatedLive;
}

function updateRenderedPlaqueLayerColour(index, hex) {
  const layerGroup = state.three?.group?.userData?.plaqueMeshes?.find((item) => {
    if (item.userData?.plaqueLayer === index) return true;
    const layerByMaterial = item.userData?.layerByMaterialIndex;
    return Array.isArray(layerByMaterial) && layerByMaterial.some((layer) => layer === index);
  });
  if (!layerGroup) return false;
  const normalized = normalizeHex(hex);
  const layerByMaterial = layerGroup.userData?.layerByMaterialIndex;
  if (Array.isArray(layerByMaterial)) {
    const materials = flattenMaterials(layerGroup.material);
    let updatedMappedMaterial = false;
    layerByMaterial.forEach((layer, materialIndex) => {
      if (layer !== index) return;
      updatedMappedMaterial = updatePlaqueMaterialColour(materials[materialIndex], normalized) || updatedMappedMaterial;
    });
    return updatedMappedMaterial;
  }
  let updated = false;
  layerGroup.traverse((child) => {
    if (!child.isMesh) return;
    if (updatePlaqueMaterialColour(child.material, normalized)) {
      child.userData.hex = normalized;
      updated = true;
    }
  });
  if (!updated) return false;
  layerGroup.userData.hex = normalized;
  if (Array.isArray(layerGroup.userData.material)) updatePlaqueMaterialColour(layerGroup.userData.material, normalized);
  else if (layerGroup.userData.material) updatePlaqueMaterialColour(layerGroup.userData.material, normalized);
  return true;
}

function updateRenderedPlaqueBackingColour(hex) {
  const backingGroup = state.three?.group?.getObjectByName?.('plaqueBackingPlateGroup');
  if (!backingGroup) return false;
  const normalized = normalizeHex(hex);
  let updated = false;
  backingGroup.traverse((child) => {
    if (!child.isMesh) return;
    if (updatePlaqueMaterialColour(child.material, normalized)) updated = true;
  });
  if (updated) renderThree();
  return updated;
}

function updatePlaqueMaterialColour(material, hex) {
  if (Array.isArray(material)) {
    return material.reduce((updated, item) => updatePlaqueMaterialColour(item, hex) || updated, false);
  }
  if (!material || material.map || !material.color) return false;
  const normalized = normalizeHex(hex);
  material.color.set(makeThreeColour(normalized));
  if (material.emissive && material.userData?.plaqueEmissiveHex) {
    material.emissive.set(makeThreeColour(material.userData.plaqueEmissiveHex === '#000000' ? '#000000' : normalized));
  }
  material.userData.plaqueHex = normalized;
  if (material.userData.plaqueSourceHex) material.userData.plaqueSourceHex = normalized;
  if (material.userData.plaqueSideHex) material.userData.plaqueSideHex = normalized;
  material.needsUpdate = true;
  return true;
}

function updateRenderedPlaqueBaseThickness(nextThickness) {
  const group = state.three?.group;
  const oldThickness = Number(group?.userData?.plaqueBaseThickness);
  const depth = clamp(Number(nextThickness) || PLAQUE_DEFAULT_BASE_THICKNESS, PLAQUE_BASE_THICKNESS_MIN, PLAQUE_BASE_THICKNESS_MAX);
  if (!group || !Number.isFinite(oldThickness) || oldThickness <= 0 || Math.abs(depth - oldThickness) < 0.001) return Boolean(group);
  const backingGroup = group.getObjectByName?.('plaqueBackingPlateGroup');
  if (!backingGroup) return false;
  let updatedBacking = false;
  const oldBackingFrontZ = Number.isFinite(Number(group.userData?.plaqueBackingFrontZ))
    ? Number(group.userData.plaqueBackingFrontZ)
    : oldThickness;
  let nextBackingFrontZ = null;
  backingGroup.traverse((child) => {
    const geometry = child.isMesh ? child.geometry : null;
    if (!geometry || !setPlaqueGeometryDepth(geometry, 0, oldThickness, depth, 0)) return;
    smoothPlaqueBackingSideNormals(geometry, depth, 0, depth, {
      sideNormalBucketSize: 0.95,
      sideNormalBucketRadius: 3,
      sideNormalAngleDotMin: 0.08,
    });
    geometry.computeBoundingBox?.();
    const childFrontZ = Number.isFinite(geometry.boundingBox?.max?.z) ? geometry.boundingBox.max.z : depth;
    child.userData.plaqueBackingFrontZ = childFrontZ;
    nextBackingFrontZ = Number.isFinite(nextBackingFrontZ) ? Math.max(nextBackingFrontZ, childFrontZ) : childFrontZ;
    child.userData.depth = depth;
    updatedBacking = true;
  });
  if (!updatedBacking) return false;
  if (!Number.isFinite(nextBackingFrontZ)) nextBackingFrontZ = depth;
  const delta = nextBackingFrontZ - oldBackingFrontZ;
  state.plaque.baseThickness = depth;
  group.userData.plaqueBaseThickness = depth;
  group.userData.plaqueBackingFrontZ = nextBackingFrontZ;
  const layerGroups = group.userData?.plaqueMeshes || [];
  const layerGroupSet = new Set(layerGroups);
  layerGroups.forEach((layerGroup) => translatePlaqueLayerGroupZ(layerGroup, delta));
  (group.userData?.frontArtworkObjects || []).forEach((object) => {
    if (!object || layerGroupSet.has(object)) return;
    translatePlaqueObjectZ(object, delta);
  });
  updatePlaqueTextureFallbackDepth();
  updatePlaqueLayerHighlight();
  validateRenderedPlaqueColourGaps(group);
  renderThree();
  return true;
}

function translatePlaqueLayerGroupZ(layerGroup, delta) {
  if (!layerGroup || !Number.isFinite(delta) || Math.abs(delta) < 0.001) return;
  layerGroup.userData.zBase = (Number(layerGroup.userData.zBase) || 0) + delta;
  if (layerGroup.userData.fastRaisedPreview) {
    layerGroup.traverse((child) => {
      if (child.isMesh) child.position.z += delta;
    });
    return;
  }
  layerGroup.traverse((child) => {
    const geometry = child.isMesh ? child.geometry : null;
    if (!geometry) return;
    geometry.translate(0, 0, delta);
    geometry.computeBoundingBox?.();
    geometry.computeBoundingSphere?.();
  });
}

function translatePlaqueObjectZ(object, delta) {
  if (!object || !Number.isFinite(delta) || Math.abs(delta) < 0.001) return;
  object.position.z += delta;
}

function updateRenderedPlaqueLayerDepth(index, nextDepth) {
  const layerGroup = state.three?.group?.userData?.plaqueMeshes?.find((item) => item.userData?.plaqueLayer === index);
  const oldDepth = Number(layerGroup?.userData?.depth);
  if (!layerGroup || !Number.isFinite(oldDepth) || oldDepth <= 0) return false;
  if (layerGroup.userData.fastRaisedPreview) {
    const zBase = Number(layerGroup.userData.zBase) || 0;
    layerGroup.traverse((child) => {
      if (child.isMesh) {
        child.position.z = zBase + nextDepth;
        child.userData.depth = nextDepth;
      }
    });
    layerGroup.userData.depth = nextDepth;
    updatePlaqueLayerHighlight();
    renderThree();
    return true;
  }
  let zBase = Number(layerGroup.userData.zBase);
  if (!Number.isFinite(zBase)) {
    const box = new THREE.Box3().setFromObject(layerGroup);
    zBase = Number.isFinite(box.min.z) ? box.min.z : 0;
  }
  layerGroup.traverse((child) => {
    const geometry = child.isMesh ? child.geometry : null;
    if (!geometry || !setPlaqueGeometryDepth(geometry, zBase, oldDepth, nextDepth, zBase)) return;
    if (geometry.userData?.plaqueSideNormalOptions) {
      smoothPlaqueBackingSideNormals(geometry, nextDepth, zBase, zBase + nextDepth, geometry.userData.plaqueSideNormalOptions);
    }
    child.userData.depth = nextDepth;
  });
  layerGroup.userData.depth = nextDepth;
  updatePlaqueTextureFallbackDepth();
  updatePlaqueLayerHighlight();
  validateRenderedPlaqueColourGaps();
  renderThree();
  return true;
}

function updatePlaqueTextureFallbackDepth() {
  const group = state.three?.group;
  if (!group || state.plaque.usePngFrontTextureFallback !== true) return;
  const overlay = group.getObjectByName?.('plaqueExactArtworkSurface');
  if (!overlay) return;
  const backingFrontZ = Number(group.userData?.plaqueBackingFrontZ) || Number(group.userData?.plaqueBaseThickness) || 0;
  const maxDepth = (group.userData?.plaqueMeshes || []).reduce((max, layerGroup) => {
    return Math.max(max, Number(layerGroup?.userData?.depth) || 0);
  }, 0);
  overlay.position.z = getPlaqueColourLayerBottomZ(backingFrontZ) + maxDepth + 0.035;
}

function getPlaqueLayerDepthForIndex(index) {
  const current = Number(state.plaque.layerDepths[index]);
  if (Number.isFinite(current)) return clamp(current, PLAQUE_LAYER_DEPTH_MIN, PLAQUE_LAYER_DEPTH_MAX);
  return getDefaultPlaqueLayerDepth(index, getPlaqueLayerDescriptors()[index]);
}

function getDefaultPlaqueLayerDepth(index, layer) {
  if (layer?.plaqueRole) return PLAQUE_DEFAULT_LAYER_DEPTH;
  const rgb = hexToRgb(normalizeHex(layer?.hex || '#ffffff'));
  const luma = colourLuma(rgb);
  const chroma = colourChroma(rgb);
  if (luma >= 224 && chroma <= 36) return 1.7;
  if (luma <= 58) return 1;
  return 1.35;
}

function getSvgPlaqueLayers() {
  if (state.isDefaultPreview || state.artwork?.type !== 'svg' || !state.artwork.svgText || !window.THREE?.SVGLoader) return [];
  const cacheKey = `${state.artwork.name || ''}:${state.artwork.svgText.length}:${state.artwork.svgText.slice(0, 120)}`;
  if (state.plaque.svgLayerCache?.key === cacheKey) return state.plaque.svgLayerCache.layers;
  try {
    const parsed = new THREE.SVGLoader().parse(state.artwork.svgText);
    const layerMap = new Map();
    let shapeCount = 0;
    parsed.paths.forEach((path, pathIndex) => {
      const style = path.userData?.style || {};
      const fill = normalizeSvgPaint(style.fill || path.color?.getStyle?.() || '');
      if (!fill) return;
      const opacity = Number(style.fillOpacity ?? style.opacity ?? 1);
      if (opacity <= 0.02) return;
      const shapes = THREE.SVGLoader.createShapes(path);
      if (!shapes.length) return;
      shapeCount += shapes.length;
      const existing = layerMap.get(fill) || {
        type: 'svg',
        hex: fill,
        shapes: [],
        pathIndices: [],
        area: 0,
      };
      shapes.forEach((shape) => {
        existing.shapes.push(shape);
        existing.area += Math.abs(estimateShapeArea(shape));
      });
      existing.pathIndices.push(pathIndex);
      layerMap.set(fill, existing);
    });
    const layers = [...layerMap.values()]
      .sort(comparePlaqueSvgLayerStack)
      .map((layer, index) => ({ ...layer, index }));
    const rasterColourCount = state.processed?.colours?.length || 0;
    const collapsedToSingleBlackLayer = layers.length === 1 && rasterColourCount > 1 && isNearBlackHex(layers[0].hex);
    if (shapeCount > PLAQUE_SVG_LAYER_SHAPE_LIMIT || collapsedToSingleBlackLayer) {
      console.warn('Using raster plaque fallback for SVG artwork.', { shapeCount, layerCount: layers.length, rasterColourCount });
      state.plaque.svgLayerCache = { key: cacheKey, layers: [] };
      return [];
    }
    state.plaque.svgLayerCache = { key: cacheKey, layers };
    return layers;
  } catch (error) {
    console.warn('Could not parse SVG plaque layers; falling back to processed raster layers.', error);
    return [];
  }
}

function comparePlaqueSvgLayerStack(a, b) {
  const aRank = getPlaqueSvgLayerRank(a);
  const bRank = getPlaqueSvgLayerRank(b);
  if (aRank !== bRank) return aRank - bRank;
  if (aRank === 1) return b.area - a.area;
  return Math.min(...a.pathIndices) - Math.min(...b.pathIndices);
}

function getPlaqueSvgLayerRank(layer) {
  const hex = normalizeHex(layer?.hex || '#000000');
  if (isNearWhiteHex(hex)) return 0;
  const rgb = hexToRgb(hex);
  const blueDominant = rgb[2] > rgb[0] && rgb[2] >= rgb[1];
  const redDominant = rgb[0] > rgb[1] && rgb[0] > rgb[2];
  if (blueDominant) return 1;
  if (redDominant) return 2;
  return 1;
}

function selectPlaqueLayer(index, options = {}) {
  const layers = getPlaqueLayerDescriptors();
  if (!layers.length) return;
  state.plaque.selectedLayer = clamp(Number(index) || 0, 0, layers.length - 1);
  renderPlaqueLayerControls();
  updatePlaqueLayerHighlight();
  renderThree();
  if (options.openControls !== false && isMobileControlLayout()) openMobileControlSheet();
}

function setPlaqueLayerDepth(index, value, options = {}) {
  syncPlaqueLayers();
  const next = clamp(Number(value) || PLAQUE_DEFAULT_LAYER_DEPTH, PLAQUE_LAYER_DEPTH_MIN, PLAQUE_LAYER_DEPTH_MAX);
  state.plaque.layerDepths[index] = next;
  state.plaque.selectedLayer = clamp(Number(index) || 0, 0, Math.max(0, (getPlaqueLayerDescriptors().length || 1) - 1));
  const updatedLive = updateRenderedPlaqueLayerDepth(index, next);
  if (options.renderControls !== false) renderPlaqueLayerControls();
  else syncPlaqueLayerControlState(index, next);
  if (options.rebuild === true || !updatedLive) {
    const buildDelay = shouldUseUploadedRasterPlaqueHierarchy(state.processed)
      ? 30
      : (options.buildDelay ?? 220);
    schedulePlaqueBuild(buildDelay);
  }
  updateStats();
}

function resetPlaqueLayerDepth(index) {
  const next = getDefaultPlaqueLayerDepth(index, getPlaqueLayerDescriptors()[index]);
  setPlaqueLayerDepth(index, next);
}

function hasOrderablePlaqueArtwork() {
  return Boolean(!state.isDefaultPreview && state.uploadedFile && state.artwork && state.processed && !state.processingDirty);
}

async function placePlaqueOrder() {
  if (!hasOrderablePlaqueArtwork() || !state.customerEmail) {
    updateProjectControls();
    return;
  }
  setStatus('Preparing order');
  closeOnboarding();
  clearCheckoutFallback();
  state.orderInProgress = true;
  els.placeOrder.disabled = true;
  els.placeOrder.textContent = 'Placing Order...';
  els.saveProject.disabled = true;
  syncMobileCommandBar();
  try {
    queueEmailMarketingSubscription(state.customerEmail);
    activatePlaqueArtworkState();
    const project = await buildSignGuyProject();
    state.projectId = project.id;
    state.plaque.projectId = project.id;
    const localOrder = isLocalTesting();
    const screenshots = await captureSubmissionScreenshots();
    const uploadResult = localOrder
      ? { ok: true, localTesting: true, emailSent: false }
      : await uploadProjectFolder(project, {
        screenshots,
        sendOrderEmail: true,
        subject: makeOrderEmailSubject('3D Wall Plaque'),
        message: makeEmailBody('Shopify checkout order started'),
        messageHtml: makeEmailHtml('Shopify checkout order started'),
      });
    if (localOrder) downloadProjectPayload(project);
    try {
      await saveProjectRecord(project);
      await refreshProjectLog();
    } catch (storageError) {
      console.warn(storageError);
    }
    els.submitNote.textContent = localOrder
      ? `${project.name}.SignGuy downloaded for local 3D Wall Plaque checkout testing. Email is only sent from the deployed site.`
      : `${project.name} saved. Redirecting to checkout.`;
    setStatus('Checkout');
    redirectToShopifyCheckout(project, uploadResult);
  } catch (error) {
    console.error(error);
    els.submitNote.textContent = describeOrderError(error);
    setStatus('Order failed');
    state.orderInProgress = false;
    els.placeOrder.textContent = 'Place Order';
    updateProjectControls();
  }
}

function getSerializablePlaqueConfig() {
  syncPlaqueLayers();
  return {
    usage: getPlaqueUsageKey(),
    baseThickness: clamp(Number(state.plaque.baseThickness) || PLAQUE_DEFAULT_BASE_THICKNESS, PLAQUE_BASE_THICKNESS_MIN, PLAQUE_BASE_THICKNESS_MAX),
    basePadding: clamp(Number(state.plaque.basePadding) || PLAQUE_DEFAULT_BASE_PADDING, 0, 6),
    backingColourOverride: state.plaque.backingColourOverride ? normalizeHex(state.plaque.backingColourOverride) : '',
    layerDepths: [...state.plaque.layerDepths],
    colourOverrides: [...(state.plaque.colourOverrides || [])],
    selectedLayer: Number(state.plaque.selectedLayer) || 0,
    traceQuality: normalizePlaqueTraceQuality(state.plaque.traceQuality),
    zeroGapColourLayers: state.plaque.zeroGapColourLayers !== false,
    exactPixelBoundaryMode: normalizePlaqueTraceQuality(state.plaque.traceQuality) !== 'smooth',
    previewDebugMode: 'extruded',
    showVectorDebug: Boolean(state.plaque.showVectorDebug),
  };
}
