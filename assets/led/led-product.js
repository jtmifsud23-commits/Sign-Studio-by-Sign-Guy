// Led product runtime. Loaded before app.js so app.js can stay focused on core studio orchestration.

function setLedSize(size) {
  if (!SIZE_PRESETS[size]) return;
  state.size = size;
  document.querySelectorAll('[data-size]').forEach((button) => {
    button.classList.toggle('active', button.dataset.size === size);
  });
}

function setLedUsage(usage) {
  if (!USAGE_PRESETS[usage]) return;
  state.usage = usage;
  document.querySelectorAll('[data-usage]').forEach((button) => {
    button.classList.toggle('active', button.dataset.usage === usage);
  });
}

function captureLedUploadState() {
  return captureCurrentArtworkState();
}

function restoreLedUploadState() {
  const snapshot = state.ledUploadSnapshot;
  if (!snapshot) return;
  applyArtworkStateSnapshot(snapshot);
  if (state.processed) renderPreview();
  state.ledUploadSnapshot = null;
  state.uploadTarget = 'led';
}

function shouldUseDefaultLedPreview(options = {}) {
  if (state.productType !== 'led') return false;
  if (options.force) return true;
  if (state.uploadedFile && !state.isDefaultPreview) return false;
  return !state.processed || !state.artwork || state.isDefaultPreview;
}

async function ensureDefaultLedPreview(options = {}) {
  if (!shouldUseDefaultLedPreview(options)) return Boolean(state.processed);
  if (state.defaultLedPreviewPromise) return state.defaultLedPreviewPromise;
  state.defaultLedPreviewPromise = loadDefaultPreview()
    .finally(() => {
      state.defaultLedPreviewPromise = null;
    });
  return state.defaultLedPreviewPromise;
}

async function loadDefaultLedPreviewSource() {
  const candidates = [
    {
      dataUrl: DEFAULT_PREVIEW_DATA_URL,
      label: 'full image',
      timeout: DEFAULT_PREVIEW_PRIMARY_TIMEOUT_MS,
    },
    {
      dataUrl: DEFAULT_PREVIEW_FALLBACK_DATA_URL,
      label: 'compact image',
      timeout: DEFAULT_PREVIEW_FALLBACK_TIMEOUT_MS,
      skipDecode: true,
    },
  ];
  let lastError = null;
  for (const candidate of candidates) {
    try {
      const image = await loadImage(candidate.dataUrl, {
        timeout: candidate.timeout,
        skipDecode: candidate.skipDecode,
      });
      return {
        type: 'png',
        image,
        dataUrl: candidate.dataUrl,
        source: candidate.label,
      };
    } catch (error) {
      lastError = error;
      console.warn(`Default LED preview ${candidate.label} did not load; trying fallback.`, error);
    }
  }
  const image = createDefaultLedPreviewCanvas();
  return {
    type: 'png',
    image,
    dataUrl: image.toDataURL('image/png'),
    source: lastError ? 'embedded fallback after image failure' : 'embedded fallback',
  };
}

function createEmbeddedDefaultLedPreviewSource() {
  const image = createDefaultLedPreviewCanvas();
  return {
    type: 'png',
    image,
    dataUrl: image.toDataURL('image/png'),
    source: 'embedded fallback',
  };
}

function createDefaultLedArtwork(source) {
  return {
    type: source.type || 'png',
    image: source.image,
    dataUrl: source.dataUrl,
    svgText: '',
    pathCount: 0,
    gradients: 0,
    palette: null,
    hasTransparency: true,
    name: 'Sign Guy logo example',
  };
}

function createDefaultLedPreviewCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(256, 256);
  ctx.fillStyle = '#ffc529';
  ctx.beginPath();
  ctx.arc(0, 0, 206, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c2327';
  roundRect(ctx, -172, -118, 344, 236, 46);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, -138, -82, 276, 164, 34);
  ctx.fill();
  ctx.fillStyle = '#1c2327';
  ctx.font = '900 112px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SG', 0, -14);
  ctx.fillStyle = '#c82032';
  ctx.font = '900 42px Arial, sans-serif';
  ctx.fillText('SIGN GUY', 0, 88);
  ctx.restore();
  return canvas;
}

function applyDefaultLedPreviewArtwork(artwork) {
  state.isDefaultPreview = true;
  state.uploadedFile = null;
  state.projectId = null;
  state.fileName = '';
  state.artwork = artwork;
  state.removeBg = artwork.hasTransparency ? false : true;
  els.removeBg.checked = state.removeBg;
  state.fixFloatingRegions = false;
  state.floatingSupportColour = DEFAULT_FLOATING_SUPPORT_COLOUR;
  state.targetColorCount = 8;
  state.colorOverrides = [];
  state.plaque.colourOverrides = [];
  state.plaque.backingColourOverride = '';
  state.plaque.svgLayerCache = null;
  state.plaque.fastPreviewOnly = false;
  state.frontColoursCustomized = false;
  state.selectedColor = 0;
  state.selectedColourTarget = { type: 'front', index: 0 };
  state.previewZoom = getDefaultProductPreviewZoom();
  state.previewPan = { x: 0, y: 0 };
  state.dismissedPreviewAlert = '';
  resetRotation();
  state.rotation = getDefaultProductPreviewRotation();
  initEditState(artwork);
  state.processed = processArtwork(artwork);
  if (state.processed.naturalColourCount) state.targetColorCount = state.processed.naturalColourCount;
  syncColorOverrides();
  state.led.snapshot = captureCurrentArtworkState();
  Object.assign(state.plaque, {
      artwork,
      uploadedFile: null,
      processed: state.processed,
      fileName: '',
      isDefaultPreview: true,
      isExampleProject: false,
      processingDirty: false,
      designName: '',
      projectId: null,
      usage: getPlaqueUsageKey(),
      removeBg: state.removeBg,
      fixFloatingRegions: false,
      floatingSupportColour: DEFAULT_FLOATING_SUPPORT_COLOUR,
      targetColorCount: state.targetColorCount,
      colorOverrides: [...state.colorOverrides],
      frontColoursCustomized: false,
      backingColourOverride: '',
      selectedColor: 0,
      selectedColourTarget: { type: 'front', index: 0 },
      edit: {
        crop: { ...state.edit.crop },
        cropAspect: state.edit.cropAspect,
        zoom: state.edit.zoom,
      },
      previewZoom: state.previewZoom,
      previewPan: { ...state.previewPan },
      dismissedPreviewAlert: '',
      rotation: getDefaultProductPreviewRotation(),
  });
}

function finishDefaultLedPreviewRender() {
  renderUploadControl();
  renderPreview();
  renderDiagnostics();
  if (els.submitDesign) els.submitDesign.disabled = true;
  updateProjectControls();
  setStatus('Ready');
}

function scheduleDefaultLedPreviewQualityUpgrade() {
  window.setTimeout(() => {
    upgradeDefaultLedPreviewQuality().catch((error) => {
      console.warn('Default LED preview quality upgrade skipped.', error);
    });
  }, DEFAULT_PREVIEW_QUALITY_UPGRADE_DELAY_MS);
}

async function upgradeDefaultLedPreviewQuality() {
  if (state.productType !== 'led' || !state.isDefaultPreview || state.uploadedFile) return;
  const source = await loadDefaultLedPreviewSource();
  if (source.source === 'embedded fallback') return;
  if (state.productType !== 'led' || !state.isDefaultPreview || state.uploadedFile) return;
  applyDefaultLedPreviewArtwork(createDefaultLedArtwork(source));
  finishDefaultLedPreviewRender();
}

function renderStaticDefaultLedPreview() {
  renderUploadControl();
  renderPreviewTitle();
  els.frontSvg.setAttribute('viewBox', '-260 -260 520 520');
  els.frontSvg.innerHTML = `
    <defs>
      <filter id="staticDefaultLedGlow" x="-35%" y="-35%" width="170%" height="170%">
        <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#ffc529" flood-opacity="0.36"></feDropShadow>
        <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#000000" flood-opacity="0.32"></feDropShadow>
      </filter>
    </defs>
    <g filter="url(#staticDefaultLedGlow)">
      <circle cx="0" cy="0" r="206" fill="#ffc529"></circle>
      <rect x="-172" y="-118" width="344" height="236" rx="46" fill="#1c2327"></rect>
      <rect x="-138" y="-82" width="276" height="164" rx="34" fill="#ffffff"></rect>
      <text x="0" y="22" text-anchor="middle" font-family="Arial, sans-serif" font-size="112" font-weight="900" fill="#1c2327">SG</text>
      <text x="0" y="100" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="900" fill="#c82032">SIGN GUY</text>
    </g>
  `;
  els.frontPlateColours.innerHTML = ['#ffc529', '#1c2327', '#ffffff', '#c82032']
    .map((hex, idx) => `<button class="plate-dot" type="button" style="background:${hex}" aria-label="Default front colour ${idx + 1}"></button>`)
    .join('');
  els.stage.classList.remove('three-active');
  els.stage.classList.add('preview-ready');
  applyShellColours();
  applyRotation();
  updateStats();
  updateProjectControls();
  setStatus('Ready');
}

async function loadDefaultPreview() {
  state.isDefaultPreview = true;
  state.uploadedFile = null;
  state.projectId = null;
  state.fileName = '';
  renderUploadControl();
  try {
    const project = await loadDefaultLedProject();
    state.defaultLedPreviewScreenshotDataUrl = getDefaultLedSavedPreviewDataUrl(project);
    await restoreSignGuyProject(project, { isExampleProject: true, asDefaultPreview: true });
    state.isDefaultPreview = true;
    state.uploadedFile = null;
    state.projectId = null;
    state.fileName = '';
    state.designName = '';
    state.led.snapshot = captureCurrentArtworkState();
    renderUploadControl();
    renderPreviewTitle();
    updateDefaultLedSavedPreview();
    if (els.submitDesign) els.submitDesign.disabled = true;
    updateProjectControls();
    setStatus('Ready');
    return true;
  } catch (error) {
    console.error('Could not load default LED lightbox project', error);
    state.isDefaultPreview = true;
    state.fileName = '';
    state.defaultLedPreviewScreenshotDataUrl = '';
    try {
      applyDefaultLedPreviewArtwork(createDefaultLedArtwork(createEmbeddedDefaultLedPreviewSource()));
      finishDefaultLedPreviewRender();
    } catch (fallbackError) {
      console.error(fallbackError);
      state.processed = null;
      renderStaticDefaultLedPreview();
    }
    return false;
  }
}

async function loadDefaultLedProject() {
  return loadJsonWithScriptFallback(
    DEFAULT_LED_PROJECT_SRC,
    DEFAULT_LED_PROJECT_SCRIPT_SRC,
    'SIGN_GUY_DEFAULT_LED_PROJECT',
    'Default LED lightbox project',
  );
}

function getDefaultLedSavedPreviewDataUrl(project) {
  const dataUrl = String(project?.preview?.screenshotDataUrl || '');
  return dataUrl.startsWith('data:image/') ? dataUrl : '';
}

function updateDefaultLedSavedPreview() {
  const active = state.productType === 'led'
    && state.isDefaultPreview
    && Boolean(state.defaultLedPreviewScreenshotDataUrl);
  els.stage?.classList.toggle('default-led-saved-preview', active);
  if (!els.defaultLedPreviewImage) return active;
  if (active) {
    if (els.defaultLedPreviewImage.src !== state.defaultLedPreviewScreenshotDataUrl) {
      els.defaultLedPreviewImage.src = state.defaultLedPreviewScreenshotDataUrl;
    }
    els.defaultLedPreviewImage.hidden = false;
    els.stage?.classList.add('preview-ready');
    updateDefaultLedSavedPreviewTransform();
  } else {
    els.defaultLedPreviewImage.hidden = true;
    els.defaultLedPreviewImage.removeAttribute('src');
    els.defaultLedPreviewImage.style.transform = '';
  }
  return active;
}

function updateDefaultLedSavedPreviewTransform() {
  if (!els.defaultLedPreviewImage || els.defaultLedPreviewImage.hidden) return;
  const pan = getPreviewPan();
  const zoom = clamp(Number(state.previewZoom) || 1, getPreviewZoomLimits().min, getPreviewZoomLimits().max);
  const tiltX = clamp(Number(state.rotation.x) * 0.35, -20, 20);
  const tiltY = clamp(Number(state.rotation.y) * 0.35, -28, 28);
  const spin = Number(state.rotation.z) || 0;
  els.defaultLedPreviewImage.style.transform = [
    `translate3d(${pan.x.toFixed(1)}px, ${pan.y.toFixed(1)}px, 0)`,
    `scale(${zoom.toFixed(3)})`,
    `rotateX(${tiltX.toFixed(2)}deg)`,
    `rotateY(${tiltY.toFixed(2)}deg)`,
    `rotateZ(${spin.toFixed(2)}deg)`,
  ].join(' ');
}

function buildThreeModel() {
  if (!state.three || !state.processed || !window.THREE) return;
  if (state.productType === 'plaque') {
    if (!shouldBuildPlaquePreview()) {
      renderEmptyPreview();
      return;
    }
    buildPlaqueThreeModel();
    return;
  }
  clearThreeModel();
  const processed = state.processed;
  const shellDepth = SIZE_PRESETS[state.size].depth;
  const bounds = getModelBounds(processed);
  const facePoints = prepareLedThreeOutline(silhouetteToThreePoints(processed.silhouette, bounds, 1), bounds);
  const frontBackerPoints = offsetOrScaleThreePolygon(facePoints, -0.12, -0.08);
  const bezelInnerPoints = offsetOrScaleThreePolygon(facePoints, -0.18, -0.18);
  const shellOuterPoints = offsetOrScaleThreePolygon(facePoints, 0.12, 0.06);
  const backPoints = offsetOrScaleThreePolygon(facePoints, 0.12, 0.06);
  const faceShape = makeThreeShape(facePoints);
  const frontBackerShape = makeThreeShape(frontBackerPoints);
  const sideColour = normalizeHex(state.shellColours.side);
  const backColour = normalizeHex(state.shellColours.back);
  const sideMaterialColour = liftDarkFrameColour(sideColour);
  const backMaterialColour = liftDarkFrameColour(backColour);
  const resources = state.three.resources;
  const artworkCanvas = createThreeArtworkCanvas(processed);
  const texture = new THREE.CanvasTexture(artworkCanvas);
  texture.anisotropy = 8;
  texture.encoding = THREE.sRGBEncoding;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  resources.push(texture);

  const group = new THREE.Group();
  group.position.y = getThreeModelYOffset(bounds);
  group.userData.bounds = bounds;

  const sideMaterial = new THREE.MeshStandardMaterial({
    color: makeThreeColour(sideMaterialColour),
    roughness: 0.68,
    metalness: 0.08,
    emissive: makeThreeColour('#0b0e0e'),
    emissiveIntensity: 0.12,
  });
  const backMaterial = new THREE.MeshStandardMaterial({
    color: makeThreeColour(backMaterialColour),
    roughness: 0.56,
    metalness: 0.16,
    emissive: makeThreeColour('#080a0a'),
    emissiveIntensity: 0.08,
  });
  const frontBackerMaterial = new THREE.MeshStandardMaterial({
    color: makeThreeColour(sideMaterialColour),
    roughness: 0.66,
    metalness: 0.08,
    emissive: makeThreeColour('#0b0e0e'),
    emissiveIntensity: 0.11,
  });
  const invisibleCapMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
  });
  const keyholeInteriorMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    color: makeThreeColour(state.illuminated ? '#ffffff' : '#343838'),
    side: THREE.BackSide,
    transparent: true,
    opacity: state.illuminated ? 1 : 0.54,
    alphaTest: 0.03,
    depthWrite: true,
    depthTest: true,
    toneMapped: false,
  });
  resources.push(sideMaterial, backMaterial, frontBackerMaterial, invisibleCapMaterial, keyholeInteriorMaterial);

  const shellBounds = getThreePointBounds(backPoints);
  const keyholeAnchor = getBackPlateKeyholeAnchor(processed, bounds) || { x: shellBounds.centerX, y: shellBounds.centerY };
  const keyholeBounds = {
    ...bounds,
    keyholeX: keyholeAnchor.x,
    keyholeY: keyholeAnchor.y,
  };

  const floorGroup = new THREE.Group();
  floorGroup.userData = {
    bounds,
    floorY: group.position.y + bounds.minY,
  };

  const groundGlowTexture = makeGroundGlowTexture();
  const groundGlowMaterial = new THREE.MeshBasicMaterial({
    map: groundGlowTexture,
    transparent: true,
    opacity: state.illuminated ? 0.44 : 0.02,
    depthWrite: false,
    toneMapped: false,
  });
  const groundGlowGeometry = new THREE.PlaneBufferGeometry(bounds.width * 1.42, Math.max(26, bounds.height * 0.28));
  const groundGlow = new THREE.Mesh(groundGlowGeometry, groundGlowMaterial);
  groundGlow.name = 'floorGlow';
  groundGlow.renderOrder = 0;
  floorGroup.add(groundGlow);
  resources.push(groundGlowTexture, groundGlowMaterial, groundGlowGeometry);

  const groundHaloTexture = makeGroundHaloTexture();
  const groundHaloMaterial = new THREE.MeshBasicMaterial({
    map: groundHaloTexture,
    transparent: true,
    opacity: state.illuminated ? 0.2 : 0,
    depthWrite: false,
    toneMapped: false,
  });
  const groundHaloGeometry = new THREE.PlaneBufferGeometry(bounds.width * 1.72, Math.max(34, bounds.height * 0.34));
  const groundHalo = new THREE.Mesh(groundHaloGeometry, groundHaloMaterial);
  groundHalo.name = 'floorHalo';
  groundHalo.renderOrder = 0;
  floorGroup.add(groundHalo);
  resources.push(groundHaloTexture, groundHaloMaterial, groundHaloGeometry);

  const contactShadowTexture = makeProjectedShadowTexture(processed, 0.22, 1.2);
  const contactShadowMaterial = new THREE.MeshBasicMaterial({
    map: contactShadowTexture,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
    toneMapped: false,
  });
  const contactShadowGeometry = new THREE.PlaneBufferGeometry(bounds.width * 1.08, Math.max(18, bounds.height * 0.16));
  const contactShadow = new THREE.Mesh(contactShadowGeometry, contactShadowMaterial);
  contactShadow.name = 'contactShadow';
  contactShadow.renderOrder = 0;
  floorGroup.add(contactShadow);
  resources.push(contactShadowTexture, contactShadowMaterial, contactShadowGeometry);

  const castShadowTexture = makeProjectedShadowTexture(processed, 0.28, 1.0);
  const castShadowMaterial = new THREE.MeshBasicMaterial({
    map: castShadowTexture,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
    toneMapped: false,
  });
  const castShadowGeometry = new THREE.PlaneBufferGeometry(bounds.width * 1.75, Math.max(26, bounds.height * 0.28));
  const castShadow = new THREE.Mesh(castShadowGeometry, castShadowMaterial);
  castShadow.name = 'castShadow';
  castShadow.renderOrder = 0;
  floorGroup.add(castShadow);
  resources.push(castShadowTexture, castShadowMaterial, castShadowGeometry);

  const wallOcclusionTexture = makeWallOcclusionTexture(processed);
  const wallOcclusionMaterial = new THREE.MeshBasicMaterial({
    map: wallOcclusionTexture,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
  });
  const wallOcclusionGeometry = new THREE.PlaneBufferGeometry(bounds.width * 1.42, bounds.height * 1.42);
  const wallOcclusion = new THREE.Mesh(wallOcclusionGeometry, wallOcclusionMaterial);
  wallOcclusion.name = 'wallOcclusion';
  wallOcclusion.renderOrder = -2;
  floorGroup.add(wallOcclusion);
  resources.push(wallOcclusionTexture, wallOcclusionMaterial, wallOcclusionGeometry);

  const wallHaloTexture = makeWallHaloTexture(processed);
  const wallHaloMaterial = new THREE.MeshBasicMaterial({
    map: wallHaloTexture,
    transparent: true,
    opacity: state.illuminated ? 0.16 : 0.01,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
  });
  const wallHaloGeometry = new THREE.PlaneBufferGeometry(bounds.width * 1.5, bounds.height * 1.5);
  const wallHalo = new THREE.Mesh(wallHaloGeometry, wallHaloMaterial);
  wallHalo.name = 'wallHalo';
  wallHalo.renderOrder = -1;
  floorGroup.add(wallHalo);
  resources.push(wallHaloTexture, wallHaloMaterial, wallHaloGeometry);

  state.three.floorGroup = floorGroup;
  state.three.scene.add(floorGroup);
  updateFloorEffects();

  const shellGeometry = new THREE.ExtrudeBufferGeometry(makeBackPlateShape(shellOuterPoints, keyholeBounds), {
    depth: shellDepth,
    bevelEnabled: true,
    bevelSize: 0.22,
    bevelThickness: 0.22,
    bevelSegments: 5,
    curveSegments: 18,
  });
  shellGeometry.translate(0, 0, -shellDepth);
  shellGeometry.computeVertexNormals();
  const shell = new THREE.Mesh(shellGeometry, [invisibleCapMaterial, sideMaterial]);
  shell.castShadow = true;
  shell.receiveShadow = true;
  group.add(shell);
  resources.push(shellGeometry);

  const backLipGeometry = new THREE.ExtrudeBufferGeometry(makeBackPlateShape(backPoints, keyholeBounds), {
    depth: 2.8,
    bevelEnabled: true,
    bevelSize: 0.26,
    bevelThickness: 0.26,
    bevelSegments: 5,
    curveSegments: 18,
  });
  backLipGeometry.translate(0, 0, -shellDepth - 2.8);
  const backPlate = new THREE.Mesh(backLipGeometry, backMaterial);
  backPlate.castShadow = true;
  backPlate.receiveShadow = true;
  group.add(backPlate);
  resources.push(backLipGeometry);

  const keyholeInteriorGeometry = new THREE.PlaneBufferGeometry(bounds.width, bounds.height);
  const keyholeInterior = new THREE.Mesh(keyholeInteriorGeometry, keyholeInteriorMaterial);
  keyholeInterior.position.z = 2.72;
  keyholeInterior.name = 'keyholeInteriorLogoPlane';
  group.add(keyholeInterior);
  resources.push(keyholeInteriorGeometry);

  const frontBackerGeometry = new THREE.ShapeBufferGeometry(frontBackerShape);
  const frontBacker = new THREE.Mesh(frontBackerGeometry, frontBackerMaterial);
  frontBacker.position.z = 1.45;
  frontBacker.renderOrder = 1;
  frontBacker.castShadow = true;
  frontBacker.receiveShadow = true;
  group.add(frontBacker);
  resources.push(frontBackerGeometry);

  const bezelGeometry = new THREE.ExtrudeBufferGeometry(makeThreeRingShape(shellOuterPoints, bezelInnerPoints), {
    depth: 3.2,
    bevelEnabled: true,
    bevelSize: 0.32,
    bevelThickness: 0.32,
    bevelSegments: 5,
    curveSegments: 18,
  });
  bezelGeometry.translate(0, 0, -0.35);
  bezelGeometry.computeVertexNormals();
  const bezel = new THREE.Mesh(bezelGeometry, [invisibleCapMaterial, sideMaterial]);
  bezel.castShadow = true;
  bezel.receiveShadow = true;
  bezel.renderOrder = 2;
  group.add(bezel);
  resources.push(bezelGeometry);

  const faceGeometry = new THREE.ShapeBufferGeometry(faceShape);
  applyExplicitGeometryUvs(faceGeometry, bounds);
  const faceMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    color: makeThreeColour(state.illuminated ? '#ffffff' : '#cfd4d1'),
    emissive: makeThreeColour('#fff2c8'),
    emissiveMap: texture,
    emissiveIntensity: state.illuminated ? 0.004 : 0.0015,
    roughness: 0.86,
    metalness: 0.004,
    transparent: true,
    alphaTest: 0.03,
    side: THREE.FrontSide,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const face = new THREE.Mesh(faceGeometry, faceMaterial);
  face.position.z = 3.32;
  face.renderOrder = 4;
  face.castShadow = true;
  face.receiveShadow = true;
  group.add(face);
  resources.push(faceGeometry, faceMaterial);

  const illuminatedFaceGeometry = faceGeometry.clone();
  const illuminatedFaceMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    color: 0xfff0bf,
    transparent: true,
    opacity: state.illuminated ? 0.006 : 0,
    alphaTest: 0.03,
    side: THREE.FrontSide,
    depthWrite: false,
    toneMapped: false,
    blending: THREE.AdditiveBlending,
  });
  const illuminatedFace = new THREE.Mesh(illuminatedFaceGeometry, illuminatedFaceMaterial);
  illuminatedFace.position.z = 3.39;
  illuminatedFace.renderOrder = 5;
  group.add(illuminatedFace);
  resources.push(illuminatedFaceGeometry, illuminatedFaceMaterial);

  const diffusionTexture = makeLedDiffusionTexture(bounds);
  resources.push(diffusionTexture);
  const diffusionGeometry = faceGeometry.clone();
  const diffusionMaterial = new THREE.MeshBasicMaterial({
    map: diffusionTexture,
    transparent: true,
    opacity: state.illuminated ? 0.058 : 0.014,
    side: THREE.FrontSide,
    depthWrite: false,
    toneMapped: false,
  });
  const diffusion = new THREE.Mesh(diffusionGeometry, diffusionMaterial);
  diffusion.position.z = 3.43;
  diffusion.renderOrder = 6;
  group.add(diffusion);
  resources.push(diffusionGeometry, diffusionMaterial);

  const glowGeometry = new THREE.ShapeBufferGeometry(faceShape);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffe8b0,
    transparent: true,
    opacity: state.illuminated ? 0.06 : 0.004,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.z = 3.08;
  glow.scale.set(1.02, 1.02, 1);
  glow.renderOrder = 3;
  group.add(glow);
  resources.push(glowGeometry, glowMaterial);

  const innerLight = new THREE.PointLight(0xffedbd, state.illuminated ? 0.035 : 0.004, 140);
  innerLight.position.set(0, 0, -8);
  group.add(innerLight);
  group.userData.lighting = {
    faceMaterial,
    sideMaterial,
    backMaterial,
    frontBackerMaterial,
    illuminatedFaceMaterial,
    diffusionMaterial,
    glowMaterial,
    innerLight,
    groundGlowMaterial,
    groundHaloMaterial,
    wallOcclusionMaterial,
    wallHaloMaterial,
    keyholeInteriorMaterial,
  };

  state.three.group = group;
  state.three.scene.add(group);
  applyRotation();
  renderThree();
  const activationToken = (Number(state.ledThreeFrameToken) || 0) + 1;
  state.ledThreeFrameToken = activationToken;
  requestAnimationFrame(() => activateLedThreePreviewIfReady(group, activationToken));
}

function makeLedDiffusionTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const softSpots = [
    [0.22, 0.22, 0.18, 0.09],
    [0.76, 0.28, 0.16, 0.07],
    [0.42, 0.55, 0.22, 0.08],
    [0.66, 0.72, 0.2, 0.07],
    [0.28, 0.78, 0.14, 0.06],
  ];
  softSpots.forEach(([x, y, radius, alpha]) => {
    const gradient = ctx.createRadialGradient(
      x * canvas.width,
      y * canvas.height,
      0,
      x * canvas.width,
      y * canvas.height,
      radius * canvas.width,
    );
    gradient.addColorStop(0, `rgba(0,0,0,${alpha})`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

function prepareLedThreeOutline(points, bounds) {
  if (!Array.isArray(points) || points.length < 8 || !window.THREE) return points;
  const maxDimension = Math.max(bounds?.width || 1, bounds?.height || 1);
  const tolerance = clamp(maxDimension / 1200, 0.045, 0.14);
  const raw = points.map((point) => [point.x, point.y]);
  const simplified = simplifyPolygon(raw, tolerance);
  return removeNearDuplicatePoints(simplified, tolerance * 0.22)
    .map(([x, y]) => new THREE.Vector2(x, y));
}

function offsetThreePolygon(points, offset) {
  if (!window.THREE || points.length < 3 || !offset) return points.map((point) => point.clone());
  const area = polygonArea(points.map((point) => [point.x, point.y]));
  const normalSide = area >= 0 ? 1 : -1;
  return points.map((point, idx) => {
    const prev = points[(idx - 1 + points.length) % points.length];
    const next = points[(idx + 1) % points.length];
    const edgeIn = new THREE.Vector2(point.x - prev.x, point.y - prev.y);
    const edgeOut = new THREE.Vector2(next.x - point.x, next.y - point.y);
    if (edgeIn.lengthSq() < 0.0001 || edgeOut.lengthSq() < 0.0001) return point.clone();
    edgeIn.normalize();
    edgeOut.normalize();
    const normalIn = new THREE.Vector2(edgeIn.y * normalSide, -edgeIn.x * normalSide);
    const normalOut = new THREE.Vector2(edgeOut.y * normalSide, -edgeOut.x * normalSide);
    const lineA = point.clone().add(normalIn.multiplyScalar(offset));
    const lineB = point.clone().add(normalOut.multiplyScalar(offset));
    const intersection = intersectOffsetLines(prev.clone().add(normalIn), edgeIn, lineB, edgeOut);
    if (intersection && intersection.distanceTo(point) <= Math.abs(offset) * 3.2) return intersection;
    const averaged = lineA.clone().sub(point).add(lineB.clone().sub(point));
    if (averaged.lengthSq() < 0.0001) return lineA;
    return point.clone().add(averaged.normalize().multiplyScalar(offset));
  });
}

function offsetOrScaleThreePolygon(points, offset, fallbackOffset) {
  const offsetPoints = offsetThreePolygon(points, offset);
  if (isUsableThreePolygon(offsetPoints, points)) return offsetPoints;
  return scaleThreePolygon(points, fallbackOffset);
}

function scaleThreePolygon(points, offset) {
  if (!window.THREE || points.length < 3 || !offset) return points.map((point) => point.clone());
  const bounds = getThreePointBounds(points);
  const center = new THREE.Vector2(bounds.centerX, bounds.centerY);
  const maxRadius = Math.max(...points.map((point) => point.distanceTo(center)));
  if (!Number.isFinite(maxRadius) || maxRadius <= 0.0001) return points.map((point) => point.clone());
  const scale = clamp((maxRadius + offset) / maxRadius, 0.94, 1.04);
  return points.map((point) => center.clone().add(point.clone().sub(center).multiplyScalar(scale)));
}

function isUsableThreePolygon(points, originalPoints) {
  if (!points?.length || points.length !== originalPoints?.length) return false;
  if (points.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y))) return false;
  const area = Math.abs(polygonArea(points.map((point) => [point.x, point.y])));
  const originalArea = Math.abs(polygonArea(originalPoints.map((point) => [point.x, point.y])));
  if (!area || !originalArea || area < originalArea * 0.35 || area > originalArea * 2.8) return false;
  return !hasSelfIntersectingThreePolygon(points);
}

function hasSelfIntersectingThreePolygon(points) {
  for (let i = 0; i < points.length; i += 1) {
    const a1 = points[i];
    const a2 = points[(i + 1) % points.length];
    for (let j = i + 1; j < points.length; j += 1) {
      if (Math.abs(i - j) <= 1 || i === 0 && j === points.length - 1) continue;
      const b1 = points[j];
      const b2 = points[(j + 1) % points.length];
      if (segmentsIntersect(a1, a2, b1, b2)) return true;
    }
  }
  return false;
}

function makeThreeRingShape(outerPoints, innerPoints, options = {}) {
  const shape = makeThreeShape(outerPoints, options);
  const hole = new THREE.Path();
  [...innerPoints].reverse().forEach((point, idx) => {
    if (idx === 0) hole.moveTo(point.x, point.y);
    else if (!options.curved) hole.lineTo(point.x, point.y);
  });
  if (options.curved && innerPoints.length > 2) hole.splineThru([...innerPoints].reverse().slice(1));
  hole.closePath();
  shape.holes.push(hole);
  return shape;
}

function buildLedAlphaShellShapes(processed, bounds) {
  if (!processed?.alphaMask || !processed.width || !processed.height || !window.THREE) return [];
  try {
    return buildRasterPlaqueShapes(processed.alphaMask, processed.width, processed.height, bounds, {
      minAreaRatio: 0.000028,
      smoothingPasses: 1,
      polishPasses: 0,
      simplifyTolerance: 0.11,
      finalPointSpacing: 0.04,
      maxTraceSide: 560,
      maxShapes: 96,
      maxHoles: 128,
    });
  } catch (error) {
    console.warn('Could not build alpha-accurate LED shell; using silhouette fallback.', error);
    return [];
  }
}

function makeLedBackPlateShapes(alphaShapes, fallbackPoints, keyholeBounds) {
  if (!alphaShapes.length) return makeBackPlateShape(fallbackPoints, keyholeBounds);
  const shapes = alphaShapes.slice();
  const keyholeShape = findShapeForKeyhole(shapes, keyholeBounds);
  if (keyholeShape) keyholeShape.holes.push(makeKeyholeCutoutPath(keyholeBounds));
  return shapes;
}

function createThreeArtworkCanvas(processed) {
  const source = state.frontColoursCustomized ? createMappedArtworkCanvas(processed) : processed.artworkCanvas;
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = img.data;
  solidifyLedFaceAlpha(data, processed);
  const charcoal = hexToRgb(liftDarkFrameColour('#000000'));
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 24) continue;
    const luma = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
    if (luma > 32) continue;
    const mix = 0.42;
    data[i] = Math.round(data[i] * (1 - mix) + charcoal[0] * mix);
    data[i + 1] = Math.round(data[i + 1] * (1 - mix) + charcoal[1] * mix);
    data[i + 2] = Math.round(data[i + 2] * (1 - mix) + charcoal[2] * mix);
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function solidifyLedFaceAlpha(data, processed) {
  const alphaMask = processed?.alphaMask;
  const alphaValues = processed?.alphaValues;
  if (!alphaMask || !alphaValues || alphaMask.length * 4 !== data.length) return;
  for (let i = 0; i < alphaMask.length; i += 1) {
    const offset = i * 4;
    if (!alphaMask[i] || alphaValues[i] < 28) {
      data[offset + 3] = 0;
      continue;
    }
    data[offset + 3] = alphaValues[i] >= 56 ? 255 : Math.max(data[offset + 3], 210);
  }
}

function cancelLedThreePreviewUpgrade() {
  if (state.ledThreeUpgradeTimer) {
    window.clearTimeout(state.ledThreeUpgradeTimer);
    state.ledThreeUpgradeTimer = null;
  }
  state.ledThreeFrameToken = (Number(state.ledThreeFrameToken) || 0) + 1;
}

function scheduleLedThreePreviewUpgrade(delay = LED_THREE_UPGRADE_DELAY_MS) {
  if (!state.three || state.productType !== 'led' || !state.processed) return;
  cancelLedThreePreviewUpgrade();
  const token = state.ledThreeFrameToken;
  state.ledThreeUpgradeTimer = window.setTimeout(() => {
    state.ledThreeUpgradeTimer = null;
    requestAnimationFrame(() => {
      if (state.productType !== 'led' || !state.processed || state.ledThreeFrameToken !== token) return;
      try {
        buildThreeModel();
      } catch (error) {
        handleLedThreePreviewFailure(error, 'LED 3D preview failed; keeping the SVG preview visible.');
      }
    });
  }, delay);
}

function activateLedThreePreviewIfReady(group, token) {
  if (!state.three || state.productType !== 'led' || state.three.group !== group || state.ledThreeFrameToken !== token) return;
  renderThree();
  if (hasVisibleLedThreeCanvasFrame(state.three.renderer?.domElement)) {
    els.stage.classList.add('three-active', 'preview-ready');
    return;
  }
  handleLedThreePreviewFailure(null, 'LED 3D preview rendered blank; keeping the SVG preview visible.');
}

function handleLedThreePreviewFailure(error, message) {
  if (error) console.warn(message, error);
  else console.warn(message);
  clearThreeModel();
  els.stage.classList.remove('three-active');
  els.stage.classList.add('preview-ready');
}

function hasVisibleLedThreeCanvasFrame(canvas) {
  if (!canvas || !canvas.width || !canvas.height) return false;
  try {
    if (!ledThreeSampleCanvas) ledThreeSampleCanvas = document.createElement('canvas');
    ledThreeSampleCanvas.width = LED_THREE_CANVAS_SAMPLE_SIZE;
    ledThreeSampleCanvas.height = LED_THREE_CANVAS_SAMPLE_SIZE;
    const context = ledThreeSampleCanvas.getContext('2d', { willReadFrequently: true });
    if (!context) return false;
    context.clearRect(0, 0, LED_THREE_CANVAS_SAMPLE_SIZE, LED_THREE_CANVAS_SAMPLE_SIZE);
    context.drawImage(canvas, 0, 0, LED_THREE_CANVAS_SAMPLE_SIZE, LED_THREE_CANVAS_SAMPLE_SIZE);
    const pixels = context.getImageData(0, 0, LED_THREE_CANVAS_SAMPLE_SIZE, LED_THREE_CANVAS_SAMPLE_SIZE).data;
    let visiblePixels = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const alpha = pixels[i + 3];
      const brightness = pixels[i] + pixels[i + 1] + pixels[i + 2];
      if (alpha > 10 && brightness > 24) visiblePixels += 1;
      if (visiblePixels > 16) return true;
    }
  } catch (error) {
    console.warn('Could not inspect LED 3D preview frame.', error);
  }
  return false;
}

function hasOrderableLedArtwork() {
  return Boolean(!state.isDefaultPreview && state.artwork && state.processed && !state.processingDirty);
}
