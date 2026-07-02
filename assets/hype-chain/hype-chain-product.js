// Hype Chain product runtime. Loaded before app.js so app.js can stay focused on core studio orchestration.

const HYPE_SPINNER_BASE_SCENE_SCALE = 2.1;
const HYPE_SPINNER_PENDANT_SCALE = 0.8;
const HYPE_SPINNER_CONNECTOR_SCALE = 1.3;
const HYPE_SPINNER_CONNECTOR_STL_HOLE_X_MM = 7.45;
const HYPE_SPINNER_CONNECTOR_STL_HOLE_Y_MM = 23;
const HYPE_SPINNER_CONNECTOR_ENTRY_BLEND = 0.28;
const HYPE_SPINNER_CONNECTOR_ENTRY_FORWARD_Z = -35;
const HYPE_SPINNER_CONNECTOR_ENTRY_CLEARANCE_INSET_X = 5;
const HYPE_SPINNER_CONNECTOR_ENTRY_CLEARANCE_DROP_Y = -11;
const HYPE_SPINNER_BASE_FORWARD_DEPTH_OFFSET = 20;
const HYPE_SPINNER_FIXED_CENTER_LOGO_FORWARD_DEPTH_OFFSET = 20;
const HYPE_SPINNER_FIXED_CENTER_LOGO_VERTICAL_OFFSET = 0;
const HYPE_UPLOADED_TOP_HOOK_BASE_WIDTH = 26;
const HYPE_UPLOADED_TOP_HOOK_TUBE_RADIUS = 2.6;
const HYPE_UPLOADED_TOP_HOOK_LEG_LENGTH = 18;
const HYPE_UPLOADED_TOP_HOOK_VISIBLE_STEM = 3.2;
const HYPE_UPLOADED_TOP_HOOK_HOLE_LOCAL_RISE = 4.8;
const HYPE_UPLOADED_TOP_HOOK_MAX_CENTER_DROP = 18;
const HYPE_UPLOADED_TOP_HOOK_MAX_CENTER_DROP_RATIO = 0.16;
const HYPE_UPLOADED_LOGO_BODY_Y_OFFSET = -30;
const HYPE_EXAMPLE_LOGO_BODY_Y_OFFSET = -20;
const HYPE_UPLOADED_HOOK_ANCHOR_Y_OFFSET = -10;
const HYPE_EXAMPLE_HOOK_ANCHOR_Y_OFFSET = -30;
const HYPE_ATTACHMENT_LINK_HOLE_CONTACT_FROM_BOTTOM = 0.18;
const HYPE_PENDANT_FRAME_PADDING = 1.24;
const HYPE_PENDANT_BOTTOM_SAFE_PADDING = 0.18;
const HYPE_PENDANT_FIT_RELAX_ZOOM = 2.4;
const HYPE_SPINNER_FONT_OPTIONS = Object.freeze([
  'Adidas Half Block 2016',
  'Bebas Neue Bold',
  'Big Noodle Titling',
  'Bulletproof BB',
  'Bungee',
  'Cocogoose',
  'DIN Pro Black',
  'DIN Pro Cond Black',
  'Futura LT ExtraBold',
  'Limerick-Serial-Heavy',
  'Market Pro',
  'Modica Black',
  'Molot',
  'Montserrat Alternates Black',
  'Montserrat Black',
  'Norwester',
  'Poppins Black',
  'Raleway Black',
  'Roboto Black',
  'SF Pro Display Black',
  'Soccer League',
  'Source Serif Pro Black',
  'Spartan MB Black',
  'Stop MN',
  'Sullivan Fill',
]);
const hypeSpinnerRequestedFonts = new Set();

function setupHypeChainControls() {
  document.querySelectorAll('[data-hype-variant]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-hype-variant]').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      state.hype.variant = button.dataset.hypeVariant || 'classic';
      syncHypeSpinnerConfig();
      applyHypeStateToControls();
      updateStats();
      scheduleHypeRender();
      if (typeof refreshProjectLog === 'function') refreshProjectLog();
    });
  });
  els.hypeColourButtons.forEach((button) => {
    button.addEventListener('click', () => openHypeColourPopover(button.dataset.hypeColour, button));
  });
  document.querySelectorAll('[data-hype-spinner-colour]').forEach((button) => {
    button.addEventListener('click', () => openHypeSpinnerColourPopover(button.dataset.hypeSpinnerColour, button));
  });
  [
    [els.hypePrimaryColour, 'primary'],
    [els.hypeSecondaryColour, 'secondary'],
    [els.hypeTertiaryColour, 'tertiary'],
    [els.hypePendantColour, 'pendant'],
    [els.hypePendantText, 'text'],
    [els.hypePatternLength, 'patternLength'],
    [els.hypeChainLength, 'chainLength'],
    [els.hypeQuantity, 'quantity'],
  ].forEach(([input, key]) => {
    input?.addEventListener('input', () => {
      state.hype[key] = input.type === 'number' || input.type === 'range'
        ? Number(input.value)
        : input.value;
      if (key === 'patternLength') {
        state.hype.patternLength = getHypePatternLength(input.value);
        renderHypeColourControls();
      }
      if (key === 'chainLength') {
        state.hype.chainLength = normalizeHypeChainLength(state.hype.chainLength);
        state.hype.linkCount = getDefaultHypeLinkCount(state.hype.chainLength);
      }
      if (key === 'chainLength' || key === 'patternLength') updateStats();
      syncHypeDerivedColours();
      scheduleHypeRender(0);
    });
  });
  [
    [els.hypeSpinnerTopText, 'topText', 'text'],
    [els.hypeSpinnerBottomText, 'bottomText', 'text'],
    [els.hypeSpinnerFontFamily, 'fontFamily', 'text'],
    [els.hypeSpinnerRingColor, 'ringColor', 'color'],
    [els.hypeSpinnerTextColor, 'textColor', 'color'],
    [els.hypeSpinnerBaseColor, 'baseColor', 'color'],
    [els.hypeSpinnerRingDiameter, 'ringDiameter', 'number'],
    [els.hypeSpinnerRingThickness, 'ringThickness', 'number'],
    [els.hypeSpinnerRingClearance, 'ringClearance', 'number'],
  ].forEach(([input, key, type]) => {
    input?.addEventListener('input', () => {
      const spinner = syncHypeSpinnerConfig();
      spinner[key] = type === 'number'
        ? Number(input.value)
        : String(input.value || '');
      state.hype.spinner = normalizeHypeSpinnerConfig(spinner);
      applyHypeSpinnerStateToControls();
      scheduleHypeRender(0);
    });
  });
  els.hypeSpinnerFontButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = !els.hypeSpinnerFontMenu?.classList.contains('hidden');
    setHypeSpinnerFontMenuOpen(!isOpen);
  });
  els.hypeSpinnerFontMenu?.addEventListener('click', (event) => {
    const button = event.target?.closest?.('[data-hype-spinner-font]');
    if (!button) return;
    const spinner = syncHypeSpinnerConfig();
    spinner.fontFamily = normalizeHypeSpinnerFontFamily(button.dataset.hypeSpinnerFont);
    state.hype.spinner = normalizeHypeSpinnerConfig(spinner);
    setHypeSpinnerFontMenuOpen(false);
    applyHypeSpinnerStateToControls();
    scheduleHypeRender(0);
  });
  document.addEventListener('click', (event) => {
    if (!event.target?.closest?.('.hype-spinner-font-field')) setHypeSpinnerFontMenuOpen(false);
  });
  els.hypeSpinnerSpinPreviewToggle?.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && Number.isFinite(event.button) && event.button > 0) return;
    event.preventDefault();
    event.stopPropagation();
    startHypeSpinnerSpin();
  });
  els.hypeSpinnerSpinPreviewToggle?.addEventListener('pointerup', (event) => {
    event.stopPropagation();
  });
  els.hypeSpinnerSpinPreviewToggle?.addEventListener('touchstart', (event) => {
    event.preventDefault();
    event.stopPropagation();
    startHypeSpinnerSpin();
  }, { passive: false });
  els.hypeSpinnerSpinPreviewToggle?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    startHypeSpinnerSpin();
  });
  els.hypeLogoInput?.addEventListener('change', async () => {
    const files = cloneFileList(els.hypeLogoInput.files);
    els.hypeLogoInput.value = '';
    const file = files[0];
    if (!file) return;
    await handleFiles(files, { target: 'hype' });
  });
  setupFileButtonKeyboard(els.hypeChooseFile, els.hypeLogoInput);
  setupDropZone(els.hypeDropZone, (files) => handleFiles(files, { target: 'hype' }));
  setupHypeDrag();
}

function initializeHypeChainPreview() {
  if (state.hype.initialized) return;
  state.hype.initialized = true;
  try {
    initHypeThreeStage();
  } catch (error) {
    console.warn('Could not initialize Hype Chain WebGL preview; using CSS fallback.', error);
  }
  els.hypePreview?.classList.add('loading');
  window.setTimeout(() => {
    els.hypePreview?.classList.remove('loading');
    renderHypeChain();
  }, 260);
}

function scheduleHypeRender(delay = 120) {
  if (state.hype.renderTimer) clearTimeout(state.hype.renderTimer);
  els.hypePreview?.classList.add('loading');
  state.hype.renderTimer = window.setTimeout(() => {
    state.hype.renderTimer = null;
    renderHypeChain();
    els.hypePreview?.classList.remove('loading');
  }, delay);
}

function renderHypeChain() {
  if (!els.hypeChainRender) return;
  syncHypeDerivedColours();
  syncHypeSpinnerConfig();
  renderHypeColourControls();
  renderHypeVariantAccess();
  applyHypeSpinnerStateToControls();
  const hype = state.hype;
  els.hypeChainRender.classList.toggle('hype-spinner-mode', hype.variant === 'spinner');
  els.hypeVariantOutput.textContent = getHypeSpecLabel();
  els.hypeChainRender.style.setProperty('--hype-primary', normalizeHex(hype.primary));
  els.hypeChainRender.style.setProperty('--hype-secondary', normalizeHex(hype.secondary));
  els.hypeChainRender.style.setProperty('--hype-tertiary', normalizeHex(hype.tertiary));
  els.hypeChainRender.style.setProperty('--hype-accent', normalizeHex(hype.accent || '#ffc529'));
  els.hypeChainRender.style.setProperty('--hype-pendant', getHypePendantBodyColour());
  els.hypeChainRender.style.setProperty('--hype-border', normalizeHex(hype.border));
  updateHypeCssRotation();
  els.hypeChainRender.style.setProperty('--hype-zoom', state.productType === 'hype' ? state.previewZoom.toFixed(3) : '1');
  const previewPan = getPreviewPan();
  els.hypeChainRender.style.setProperty('--preview-pan-x', `${previewPan.x.toFixed(1)}px`);
  els.hypeChainRender.style.setProperty('--preview-pan-y', `${previewPan.y.toFixed(1)}px`);
  renderHypeLinks();
  buildHypeThreeModel();
  els.hypePendantPreview.style.borderWidth = hype.logoDataUrl ? '0px' : '10px';
  els.hypePendantPreview.style.borderRadius = hype.logoDataUrl ? '0' : '30px';
  els.hypePendantPreview.classList.toggle('has-logo', Boolean(hype.logoDataUrl));
  const hasUserUploadedHypeLogo = Boolean(hype.logoDataUrl && !hype.isExampleProject);
  if (els.hypeChooseFileText) els.hypeChooseFileText.textContent = hasUserUploadedHypeLogo ? 'Choose a different logo' : 'Upload logo';
  els.hypePendantTextPreview.textContent = '';
  els.hypePendantTextPreview.hidden = true;
  if (hype.logoDataUrl) {
    els.hypeLogoPreview.src = hype.logoDataUrl;
    els.hypeLogoPreview.hidden = false;
  } else {
    els.hypeLogoPreview.hidden = true;
  }
  renderPreviewTitle();
}

function initHypeThreeStage() {
  if (state.hypeThree || !window.THREE || !els.hypePreview) return;
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
    logarithmicDepthBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.sortObjects = true;
  renderer.outputEncoding = THREE.sRGBEncoding;
  if (THREE.ACESFilmicToneMapping) renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.domElement.className = 'hype-three-canvas';
  els.hypePreview.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, HYPE_CAMERA_NEAR, HYPE_CAMERA_FAR);
  camera.position.set(0, 18, HYPE_CAMERA_DISTANCE);
  camera.lookAt(0, HYPE_CAMERA_TARGET_Y, 0);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x151515, 0.9);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfff1d2, 0.9);
  key.position.set(-120, 190, 260);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fb5ff, 0.45);
  rim.position.set(180, 70, -210);
  scene.add(rim);
  const spinnerTextKey = new THREE.DirectionalLight(0xffffff, 0.34);
  spinnerTextKey.position.set(250, 320, 360);
  scene.add(spinnerTextKey);
  const spinnerTextRim = new THREE.DirectionalLight(0xffffff, 0.24);
  spinnerTextRim.position.set(-260, 220, 290);
  scene.add(spinnerTextRim);
  const floor = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(560, 360),
    new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.28 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -126;
  floor.position.z = -12;
  floor.receiveShadow = true;
  scene.add(floor);

  state.hypeThree = {
    renderer,
    scene,
    camera,
    environmentLights: { hemi, key, rim, spinnerTextKey, spinnerTextRim },
    group: null,
    pendantGroup: null,
    focusLocal: null,
    focusTarget: new THREE.Vector3(0, HYPE_CAMERA_TARGET_Y, 0),
    cameraTween: null,
    resources: [],
    resizeObserver: null,
    resizeFrame: null,
    resizeWidth: 0,
    resizeHeight: 0,
    stlGeometries: null,
    stlLoadPromise: null,
    spinnerStlGeometries: null,
    spinnerStlLoadPromise: null,
    spinnerRingGroup: null,
    spinnerBaseGroup: null,
    spinnerAnimationFrame: null,
    spinnerLastFrameTime: 0,
    spinnerSpinState: null,
    pendantFrame: null,
  };
  applyPreviewEnvironment();
  els.hypePreview.classList.add('hype-three-active');
  resizeHypeThree();
  if (window.ResizeObserver) {
    state.hypeThree.resizeObserver = new ResizeObserver(() => scheduleHypeThreeResize());
    state.hypeThree.resizeObserver.observe(els.hypePreview);
  }
  window.addEventListener('resize', scheduleHypeThreeResize);
}

function scheduleHypeThreeResize() {
  if (!state.hypeThree || state.hypeThree.resizeFrame) return;
  state.hypeThree.resizeFrame = window.requestAnimationFrame(() => {
    if (!state.hypeThree) return;
    state.hypeThree.resizeFrame = null;
    resizeHypeThree();
  });
}

function resizeHypeThree() {
  if (!state.hypeThree || !els.hypePreview) return;
  const rect = els.hypePreview.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  if (state.hypeThree.resizeWidth === width && state.hypeThree.resizeHeight === height) return;
  state.hypeThree.resizeWidth = width;
  state.hypeThree.resizeHeight = height;
  state.hypeThree.renderer.setSize(width, height, false);
  state.hypeThree.camera.aspect = width / height;
  state.hypeThree.camera.near = HYPE_CAMERA_NEAR;
  state.hypeThree.camera.far = HYPE_CAMERA_FAR;
  frameHypeCamera();
  state.hypeThree.camera.updateProjectionMatrix();
  renderHypeThree();
}

function clearHypeThreeModel() {
  if (!state.hypeThree) return;
  cancelHypeSpinnerSpin({ updateControls: false });
  if (state.hypeThree.cameraTween) window.cancelAnimationFrame(state.hypeThree.cameraTween);
  state.hypeThree.cameraTween = null;
  if (state.hypeThree.group) state.hypeThree.scene.remove(state.hypeThree.group);
  state.hypeThree.resources.forEach((resource) => resource?.dispose?.());
  state.hypeThree.group = null;
  state.hypeThree.pendantGroup = null;
  state.hypeThree.spinnerRingGroup = null;
  state.hypeThree.spinnerBaseGroup = null;
  state.hypeThree.pendantFrame = null;
  state.hypeThree.resources = [];
}

function renderHypeThree() {
  if (!state.hypeThree) return;
  state.hypeThree.renderer.render(state.hypeThree.scene, state.hypeThree.camera);
}

function updateHypeThreeRotation() {
  if (!state.hypeThree?.group || !window.THREE) return;
  applyHypeGroupRotation();
  frameHypeCamera();
  renderHypeThree();
}

function applyHypeGroupRotation() {
  if (!state.hypeThree?.group || !window.THREE) return;
  const group = state.hypeThree.group;
  state.hypeThree.group.rotation.order = 'YXZ';
  group.rotation.x = THREE.Math.degToRad(state.hype.rotation.x);
  group.rotation.y = THREE.Math.degToRad(state.hype.rotation.y);
  const focusLocal = state.hypeThree.focusLocal;
  if (!focusLocal) {
    const pan = getPreviewPan();
    group.position.set(pan.x * 0.42, -pan.y * 0.42, 0);
    group.updateMatrixWorld(true);
    return;
  }
  const rotatedFocus = focusLocal.clone().applyEuler(group.rotation);
  group.position.copy(focusLocal).sub(rotatedFocus);
  const pan = getPreviewPan();
  group.position.x += pan.x * 0.42;
  group.position.y -= pan.y * 0.42;
  group.updateMatrixWorld(true);
  syncHypePendantFrameWorldTargets();
}

function frameHypeCamera(options = {}) {
  if (!state.hypeThree?.camera || !window.THREE) return;
  const camera = state.hypeThree.camera;
  const pendantFrame = state.hypeThree.pendantFrame || refreshHypePendantFrameTargets();
  let target = pendantFrame?.center || state.hypeThree.focusTarget || new THREE.Vector3(0, HYPE_CAMERA_TARGET_Y, 0);
  const limits = getPreviewZoomLimits();
  const zoom = clamp(Number(state.previewZoom) || 1, limits.min, limits.max);
  if (pendantFrame?.safeTarget && zoom > 1.02) {
    const bottomBlend = clamp((zoom - 1) * 0.5, 0.08, 0.48);
    target = target.clone().lerp(pendantFrame.safeTarget, bottomBlend);
  }
  const spinnerFrameScale = state.hype?.variant === 'spinner' ? 1.18 : 1;
  const requestedDistance = (HYPE_CAMERA_DISTANCE * spinnerFrameScale * (getPreviewEnvironmentSettings().cameraScale || 1)) / zoom;
  const distance = getHypePendantZoomDistance(camera, pendantFrame, requestedDistance, zoom);
  const viewTarget = new THREE.Vector3(target.x, target.y + HYPE_CAMERA_VIEW_OFFSET_Y, target.z);
  const nextPosition = new THREE.Vector3(viewTarget.x, viewTarget.y + 36, viewTarget.z + distance);
  if (!options.smooth || typeof window.requestAnimationFrame !== 'function') {
    if (state.hypeThree.cameraTween) window.cancelAnimationFrame(state.hypeThree.cameraTween);
    state.hypeThree.cameraTween = null;
    camera.position.copy(nextPosition);
    camera.lookAt(viewTarget.x, viewTarget.y, viewTarget.z);
    state.hypeThree._cameraLookTarget = viewTarget.clone();
    return;
  }
  if (state.hypeThree.cameraTween) window.cancelAnimationFrame(state.hypeThree.cameraTween);
  const startPosition = camera.position.clone();
  const startTarget = state.hypeThree._cameraLookTarget?.clone?.() || viewTarget.clone();
  const endTarget = viewTarget.clone();
  const startedAt = performance.now();
  const duration = 180;
  const tick = (now) => {
    const t = clamp((now - startedAt) / duration, 0, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    camera.position.lerpVectors(startPosition, nextPosition, eased);
    const currentTarget = startTarget.clone().lerp(endTarget, eased);
    camera.lookAt(currentTarget.x, currentTarget.y, currentTarget.z);
    state.hypeThree._cameraLookTarget = currentTarget;
    renderHypeThree();
    if (t < 1) {
      state.hypeThree.cameraTween = window.requestAnimationFrame(tick);
    } else {
      state.hypeThree.cameraTween = null;
    }
  };
  state.hypeThree.cameraTween = window.requestAnimationFrame(tick);
}

function updateHypeCameraFocus(preferredObject = null) {
  if (!state.hypeThree?.group || !window.THREE) return;
  const focusObject = getHypePendantFocusObject(preferredObject);
  const box = new THREE.Box3().setFromObject(focusObject || state.hypeThree.group);
  if (!Number.isFinite(box.min.x) || box.isEmpty()) {
    state.hypeThree.focusLocal = new THREE.Vector3(0, HYPE_CAMERA_TARGET_Y, 0);
    state.hypeThree.focusTarget.copy(state.hypeThree.focusLocal);
    state.hypeThree.pendantFrame = null;
  } else {
    const center = box.getCenter(new THREE.Vector3());
    const pendantFrame = updateHypePendantFrameFromBox(box);
    const localCenter = pendantFrame?.centerLocal?.clone?.() || state.hypeThree.group.worldToLocal(center.clone());
    state.hypeThree.focusLocal = localCenter;
    state.hypeThree.focusTarget.copy(center);
  }
  applyHypeGroupRotation();
  frameHypeCamera();
}

function getHypePendantFocusObject(preferredObject = null) {
  if (preferredObject) return preferredObject;
  return state.hypeThree?.pendantGroup || state.hypeThree?.group || null;
}

function refreshHypePendantFrameTargets() {
  if (!state.hypeThree?.group || !window.THREE) return null;
  const focusObject = getHypePendantFocusObject();
  if (!focusObject) return state.hypeThree.pendantFrame || null;
  const box = new THREE.Box3().setFromObject(focusObject);
  if (!Number.isFinite(box.min.x) || box.isEmpty()) return state.hypeThree.pendantFrame || null;
  return updateHypePendantFrameFromBox(box);
}

function updateHypePendantFrameFromBox(box) {
  if (!state.hypeThree || !window.THREE) return null;
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const safeTarget = new THREE.Vector3(
    center.x,
    center.y - size.y * HYPE_PENDANT_BOTTOM_SAFE_PADDING,
    center.z,
  );
  const centerLocal = state.hypeThree.group?.worldToLocal(center.clone()) || null;
  const safeTargetLocal = state.hypeThree.group?.worldToLocal(safeTarget.clone()) || null;
  state.hypeThree.pendantFrame = {
    center,
    centerLocal,
    safeTarget,
    safeTargetLocal,
    size,
  };
  return state.hypeThree.pendantFrame;
}

function syncHypePendantFrameWorldTargets() {
  if (!state.hypeThree?.group || !window.THREE) return;
  const frame = state.hypeThree.pendantFrame;
  const focusLocal = state.hypeThree.focusLocal;
  if (focusLocal) {
    const center = state.hypeThree.group.localToWorld(focusLocal.clone());
    state.hypeThree.focusTarget.copy(center);
    if (frame?.center) frame.center.copy(center);
  }
  if (frame?.safeTarget && frame.safeTargetLocal) {
    frame.safeTarget.copy(state.hypeThree.group.localToWorld(frame.safeTargetLocal.clone()));
  }
}

function getHypePendantZoomDistance(camera, pendantFrame, requestedDistance, zoom) {
  const fitDistance = getHypePendantFitDistance(camera, pendantFrame);
  if (!fitDistance) return requestedDistance;
  const relaxedFitDistance = zoom > HYPE_PENDANT_FIT_RELAX_ZOOM
    ? fitDistance * (HYPE_PENDANT_FIT_RELAX_ZOOM / zoom)
    : fitDistance;
  return Math.max(requestedDistance, relaxedFitDistance);
}

function getHypePendantFitDistance(camera, pendantFrame) {
  if (!camera || !pendantFrame?.size || !window.THREE) return 0;
  const aspect = Number(camera.aspect) > 0 ? Number(camera.aspect) : 1;
  const verticalFov = THREE.Math.degToRad(camera.fov || 36);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);
  const width = Math.max(1, pendantFrame.size.x * HYPE_PENDANT_FRAME_PADDING);
  const height = Math.max(1, pendantFrame.size.y * (HYPE_PENDANT_FRAME_PADDING + HYPE_PENDANT_BOTTOM_SAFE_PADDING));
  const depth = Math.max(0, pendantFrame.size.z || 0);
  const fitByHeight = height / (2 * Math.tan(verticalFov / 2));
  const fitByWidth = width / (2 * Math.tan(horizontalFov / 2));
  return Math.max(fitByHeight, fitByWidth) + depth * 0.5 + 28;
}

function updateHypeCssRotation() {
  if (!els.hypeChainRender) return;
  els.hypeChainRender.style.setProperty('--hype-tilt-x', `${state.hype.rotation.x}deg`);
  els.hypeChainRender.style.setProperty('--hype-tilt-y', `${state.hype.rotation.y}deg`);
}

async function loadHypeStlGeometries() {
  if (!state.hypeThree || !window.THREE) return null;
  if (state.hypeThree.stlGeometries) return state.hypeThree.stlGeometries;
  if (state.hypeThree.stlLoadPromise) return state.hypeThree.stlLoadPromise;
  els.hypePreview?.classList.add('loading');
  state.hypeThree.stlLoadPromise = loadBundledHypeGeometryCache()
    .then((cached) => {
      if (cached) return cached;
      return Promise.all([
        fetchStlGeometry(HYPE_CHAIN_STL_ASSETS.link, 'link'),
        fetchStlGeometry(HYPE_CHAIN_STL_ASSETS.connector, 'connector'),
        fetchOptionalStlGeometry(HYPE_CHAIN_STL_ASSETS.hook, 'hook'),
      ]).then(([link, connector, hook]) => ({ link, connector, hook }));
    }).then(({ link, connector, hook }) => {
    state.hypeThree.stlGeometries = { link, connector, hook };
    state.hypeThree.stlLoadPromise = null;
    els.hypePreview?.classList.remove('loading');
    return state.hypeThree.stlGeometries;
  }).catch((error) => {
    state.hypeThree.stlLoadPromise = null;
    throw error;
  });
  return state.hypeThree.stlLoadPromise;
}

async function loadHypeSpinnerStlGeometries() {
  if (!state.hypeThree || !window.THREE) return null;
  if (state.hypeThree.spinnerStlGeometries) return state.hypeThree.spinnerStlGeometries;
  if (state.hypeThree.spinnerStlLoadPromise) return state.hypeThree.spinnerStlLoadPromise;
  els.hypePreview?.classList.add('loading');
  state.hypeThree.spinnerStlLoadPromise = Promise.all([
    loadBundledHypeSpinnerBaseGeometryCache().then((cachedBase) => {
      if (!cachedBase) throw new Error('Spinner base geometry cache is unavailable.');
      return cachedBase;
    }),
    fetchStlGeometry(HYPE_SPINNER_STL_ASSETS.outerRing, 'spinnerOuterRing'),
    fetchStlGeometry(HYPE_SPINNER_STL_ASSETS.connector, 'spinnerConnector'),
  ]).then(([base, outerRing, connector]) => {
    state.hypeThree.spinnerStlGeometries = { base, outerRing, connector };
    state.hypeThree.spinnerStlLoadPromise = null;
    els.hypePreview?.classList.remove('loading');
    return state.hypeThree.spinnerStlGeometries;
  }).catch((error) => {
    state.hypeThree.spinnerStlLoadPromise = null;
    throw error;
  });
  return state.hypeThree.spinnerStlLoadPromise;
}

async function loadBundledHypeSpinnerBaseGeometryCache() {
  if (!window.THREE) return null;
  if (!window.SIGN_GUY_HYPE_SPINNER_BASE_GEOMETRY_CACHE) {
    try {
      await loadScriptOnce(HYPE_SPINNER_BASE_GEOMETRY_CACHE_SCRIPT_SRC);
    } catch (error) {
      return null;
    }
  }
  try {
    return hydrateHypeSpinnerBaseCachedGeometry(window.SIGN_GUY_HYPE_SPINNER_BASE_GEOMETRY_CACHE);
  } catch (error) {
    console.warn('Cached Spinner base geometry could not be read.', error);
    return null;
  }
}

function hydrateHypeSpinnerBaseCachedGeometry(entry) {
  if (!entry?.position) return null;
  const quantizedPosition = hydrateHypeBundledValue(entry.position);
  const min = Array.isArray(entry.position.min) ? entry.position.min : [-1, -1, -1];
  const max = Array.isArray(entry.position.max) ? entry.position.max : [1, 1, 1];
  const range = [
    (Number(max[0]) || 0) - (Number(min[0]) || 0) || 1,
    (Number(max[1]) || 0) - (Number(min[1]) || 0) || 1,
    (Number(max[2]) || 0) - (Number(min[2]) || 0) || 1,
  ];
  const position = new Float32Array(quantizedPosition.length);
  for (let index = 0; index < quantizedPosition.length; index += 3) {
    position[index] = min[0] + (quantizedPosition[index] / 65535) * range[0];
    position[index + 1] = min[1] + (quantizedPosition[index + 1] / 65535) * range[1];
    position[index + 2] = min[2] + (quantizedPosition[index + 2] / 65535) * range[2];
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));

  const encodedNormal = entry.normal ? hydrateHypeBundledValue(entry.normal) : null;
  const triangleCount = Math.floor(position.length / 9);
  if (encodedNormal?.length === triangleCount * 3) {
    const normal = new Float32Array(position.length);
    for (let triangle = 0; triangle < triangleCount; triangle += 1) {
      const normalOffset = triangle * 3;
      const nx = encodedNormal[normalOffset] / 127;
      const ny = encodedNormal[normalOffset + 1] / 127;
      const nz = encodedNormal[normalOffset + 2] / 127;
      const vertexOffset = triangle * 9;
      for (let vertex = 0; vertex < 3; vertex += 1) {
        const offset = vertexOffset + vertex * 3;
        normal[offset] = nx;
        normal[offset + 1] = ny;
        normal[offset + 2] = nz;
      }
    }
    geometry.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
  } else {
    geometry.computeVertexNormals();
  }

  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

async function loadBundledHypeGeometryCache() {
  if (!window.THREE) return null;
  if (!window.SIGN_GUY_HYPE_CHAIN_GEOMETRY_CACHE) {
    try {
      await loadScriptOnce(HYPE_CHAIN_GEOMETRY_CACHE_SCRIPT_SRC);
    } catch (error) {
      return null;
    }
  }
  const payload = window.SIGN_GUY_HYPE_CHAIN_GEOMETRY_CACHE;
  const geometries = payload?.geometries || payload;
  if (!geometries?.link || !geometries?.connector) return null;
  try {
    return {
      link: hydrateHypeCachedGeometry(geometries.link),
      connector: hydrateHypeCachedGeometry(geometries.connector),
      hook: geometries.hook ? hydrateHypeCachedGeometry(geometries.hook) : null,
    };
  } catch (error) {
    console.warn('Cached Hype Chain geometry could not be read.', error);
    return null;
  }
}

function hydrateHypeCachedGeometry(entry) {
  const geometry = new THREE.BufferGeometry();
  const position = hydrateHypeBundledValue(entry.position);
  const normal = hydrateHypeBundledValue(entry.normal);
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  if (normal?.length === position.length) {
    geometry.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
  } else {
    geometry.computeVertexNormals();
  }
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function hydrateHypeBundledValue(value) {
  if (!value || typeof value !== 'object') return value;
  if (ArrayBuffer.isView(value)) return value;
  if (Array.isArray(value)) return value.map(hydrateHypeBundledValue);
  if (value.__typedArray && typeof value.data === 'string') {
    return decodeHypeBundledTypedArray(value.__typedArray, value.data);
  }
  Object.keys(value).forEach((key) => {
    value[key] = hydrateHypeBundledValue(value[key]);
  });
  return value;
}

function decodeHypeBundledTypedArray(type, base64) {
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

async function loadEmbeddedHypeStl(embeddedKey) {
  if (!embeddedKey) return '';
  if (embeddedKey === 'spinnerOuterRing') {
    if (!window.SIGN_GUY_HYPE_SPINNER_OUTER_RING_STL_EMBEDDED) {
      try {
        await loadScriptOnce(HYPE_SPINNER_OUTER_RING_STL_EMBEDDED_SCRIPT_SRC);
      } catch (error) {
        console.warn('Could not load embedded Spinner outer ring STL fallback.', error);
      }
    }
    if (window.SIGN_GUY_HYPE_SPINNER_OUTER_RING_STL_EMBEDDED) {
      return window.SIGN_GUY_HYPE_SPINNER_OUTER_RING_STL_EMBEDDED;
    }
  }
  if (embeddedKey === 'spinnerConnector') {
    if (!window.SIGN_GUY_HYPE_SPINNER_CONNECTOR_STL_EMBEDDED) {
      try {
        await loadScriptOnce(HYPE_SPINNER_CONNECTOR_STL_EMBEDDED_SCRIPT_SRC);
      } catch (error) {
        console.warn('Could not load embedded Spinner connector STL fallback.', error);
      }
    }
    if (window.SIGN_GUY_HYPE_SPINNER_CONNECTOR_STL_EMBEDDED) {
      return window.SIGN_GUY_HYPE_SPINNER_CONNECTOR_STL_EMBEDDED;
    }
  }
  if (!window.SIGN_GUY_HYPE_CHAIN_STL_EMBEDDED) {
    try {
      await loadScriptOnce(HYPE_CHAIN_STL_EMBEDDED_SCRIPT_SRC);
    } catch (error) {
      console.warn('Could not load embedded Hype Chain STL fallback.', error);
      return '';
    }
  }
  return window.SIGN_GUY_HYPE_CHAIN_STL_EMBEDDED?.[embeddedKey] || '';
}

function buildHypeThreeModel() {
  if (!state.hypeThree || !window.THREE) return;
  if (!state.hypeThree.stlGeometries) {
    loadHypeStlGeometries().then(() => scheduleHypeRender(0)).catch(() => {
      els.hypePreview?.classList.remove('loading');
      setStatus('Could not load Hype Chain STL files');
    });
    return;
  }
  const isSpinner = state.hype.variant === 'spinner';
  if (isSpinner && !state.hypeThree.spinnerStlGeometries) {
    loadHypeSpinnerStlGeometries().then(() => scheduleHypeRender(0)).catch(() => {
      els.hypePreview?.classList.remove('loading');
      setStatus('Could not load Spinner Hype Chain STL files');
    });
    return;
  }
  clearHypeThreeModel();
  const resources = state.hypeThree.resources;
  const group = new THREE.Group();
  group.name = 'articulatedHypeChain';
  group.rotation.order = 'YXZ';
  group.rotation.x = THREE.Math.degToRad(state.hype.rotation.x);
  group.rotation.y = THREE.Math.degToRad(state.hype.rotation.y);

  const primaryMaterial = makeHypeSilkMaterial(state.hype.primary || '#111111');
  const secondaryMaterial = makeHypeSilkMaterial(state.hype.secondary || '#ffc529');
  const connectorMaterial = makeHypeSilkMaterial(state.hype.primary || '#111111');
  const attachmentMaterial = makeHypeSilkMaterial(state.hype.primary || '#111111');
  const pendantMaterial = makeHypeSilkMaterial(getHypePendantBodyColour());
  resources.push(primaryMaterial, secondaryMaterial, connectorMaterial, attachmentMaterial, pendantMaterial);

  const linkGeometry = state.hypeThree.stlGeometries.link;
  const connectorGeometry = state.hypeThree.stlGeometries.connector;
  const uploadedChainDropY = state.hype.logoDataUrl ? HYPE_UPLOADED_CHAIN_DROP_Y : 0;
  const spinnerChainLiftY = isSpinner ? getHypeSpinnerChainRigY() : uploadedChainDropY;
  const chainRig = new THREE.Group();
  chainRig.name = 'hypeChainAttachmentRig';
  chainRig.position.y = spinnerChainLiftY;

  const linkCount = getHypeLinkCount(state.hype.chainLength, state.hype.linkCount);
  const patternMaterials = getHypePatternColours().map((hex) => makeHypeSilkMaterial(hex));
  resources.push(...patternMaterials);
  const chainLinks = buildHypeChainLoop({
    linkCount,
    linkGeometry,
    materials: patternMaterials,
  });
  chainRig.add(chainLinks.root);
  const connectorEntryLinks = isSpinner
    ? makeHypeSpinnerConnectorEntryLinks(linkGeometry, patternMaterials, chainLinks.count)
    : makeHypeConnectorEntryLinks(linkGeometry, patternMaterials, chainLinks.count);
  chainRig.add(connectorEntryLinks);

  if (!isSpinner) {
    const connector = new THREE.Mesh(connectorGeometry, connectorMaterial);
    connector.name = 'stlFusedThreeWayChainConnector';
    connector.position.set(0, -106, 0);
    connector.castShadow = true;
    connector.receiveShadow = true;
    chainRig.add(connector);

    const attachmentLink = new THREE.Mesh(linkGeometry, attachmentMaterial);
    attachmentLink.name = 'pendantAttachmentLink';
    attachmentLink.position.set(0, state.hype.logoDataUrl ? -140 : -137, state.hype.logoDataUrl ? -2 : 4);
    attachmentLink.rotation.z = Math.PI / 2;
    attachmentLink.rotation.y = THREE.Math.degToRad(68);
    attachmentLink.castShadow = true;
    attachmentLink.receiveShadow = true;
    chainRig.add(attachmentLink);
  }
  group.add(chainRig);

  const pendant = isSpinner
    ? makeHypeSpinnerPendantAssembly(pendantMaterial, connectorMaterial, resources)
    : makeHypePendantMesh(pendantMaterial, resources);
  pendant.position.set(
    0,
    isSpinner ? getHypeSpinnerPendantY() : state.hype.logoDataUrl ? -286 : -202,
    isSpinner ? getHypeSpinnerPendantZ() : 0,
  );
  group.add(pendant);

  state.hypeThree.group = group;
  state.hypeThree.pendantGroup = pendant;
  disableHypeFrustumCulling(group);
  state.hypeThree.scene.add(group);
  updateHypeCameraFocus(pendant);
  updateHypeSpinnerAnimationState();
  renderHypeThree();
  els.hypePreview?.classList.remove('loading');
}

function makeHypeSpinnerChainAttachment(material, resources) {
  const group = new THREE.Group();
  group.name = 'fixedSpinnerTwoProngChainAttachment';
  const spinner = syncHypeSpinnerConfig();
  const fixedConnectorMaterial = makeHypeSilkMaterial(spinner.ringColor);
  resources.push(fixedConnectorMaterial);
  const connectorGeometry = state.hypeThree?.spinnerStlGeometries?.connector;
  if (!connectorGeometry) {
    console.error('Exact Two Prong Chain Link Attachment STL is required for Spinner Hype Chain.');
    return group;
  }
  const geometry = connectorGeometry.clone();
  resources.push(geometry);
  const mesh = new THREE.Mesh(geometry, fixedConnectorMaterial || material);
  mesh.name = 'exactStlTwoProngChainLinkAttachment';
  const scale = getHypeSpinnerConnectorSceneScale();
  mesh.scale.set(scale, scale, scale);
  mesh.rotation.z = Math.PI;
  mesh.position.set(0, getHypeSpinnerConnectorPendantY(), getHypeSpinnerConnectorBackZ());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  group.add(mesh);
  return group;
}

function makeHypeSpinnerPendantAssembly(pendantMaterial, connectorMaterial, resources) {
  const spinner = syncHypeSpinnerConfig();
  const dims = getHypeSpinnerDimensions(spinner);
  const group = new THREE.Group();
  group.name = 'spinnerHypeChainPendantAssembly';

  const base = makeHypeSpinnerBase(dims, pendantMaterial, connectorMaterial, resources);
  group.add(base);
  state.hypeThree.spinnerBaseGroup = base;

  const innerPlate = makeHypeSpinnerInnerOpeningPlate(dims, resources);
  group.add(innerPlate);

  const ringGroup = makeHypeSpinnerOuterRing(dims, spinner, resources);
  ringGroup.name = 'rotatingOuterTextRing';
  group.add(ringGroup);
  state.hypeThree.spinnerRingGroup = ringGroup;

  const centerPendant = makeHypeSpinnerCenterPendant(dims, pendantMaterial, resources);
  centerPendant.name = 'fixedCenterLogoPendant';
  centerPendant.position.set(0, 0, dims.ringDepth / 2 + 2.2 + HYPE_SPINNER_FIXED_CENTER_LOGO_FORWARD_DEPTH_OFFSET);
  group.add(centerPendant);

  const connector = makeHypeSpinnerChainAttachment(connectorMaterial, resources);
  group.add(connector);

  return group;
}

function getHypeSpinnerDimensions(spinner = syncHypeSpinnerConfig()) {
  const sceneScale = getHypeSpinnerSceneScale();
  const ringDiameter = clamp(Number(spinner.ringDiameter) || DEFAULT_HYPE_SPINNER_CONFIG.ringDiameter, 120, 190);
  const outerRadius = (ringDiameter * sceneScale) / 2;
  const bandWidth = clamp(ringDiameter * 0.17, 21, 34) * sceneScale;
  const clearance = clamp(Number(spinner.ringClearance) || DEFAULT_HYPE_SPINNER_CONFIG.ringClearance, 0.6, 3) * sceneScale;
  const innerRadius = Math.max(42, outerRadius - bandWidth - clearance);
  return {
    outerRadius,
    innerRadius,
    bandWidth,
    ringDepth: clamp(Number(spinner.ringThickness) || DEFAULT_HYPE_SPINNER_CONFIG.ringThickness, 8, 24) * sceneScale,
    clearance,
    textRadius: outerRadius - bandWidth * 0.41,
    innerPlateRadius: innerRadius,
    spinnerBaseRadius: innerRadius,
  };
}

function getHypeSpinnerSceneScale() {
  return HYPE_SPINNER_BASE_SCENE_SCALE * HYPE_SPINNER_PENDANT_SCALE;
}

function getHypeSpinnerConnectorSceneScale() {
  return getHypeSpinnerSceneScale() * HYPE_SPINNER_CONNECTOR_SCALE;
}

function getHypeSpinnerChainRigY() {
  return 30;
}

function getHypeSpinnerPendantY() {
  return -192;
}

function getHypeSpinnerPendantZ() {
  return 40;
}

function getHypeSpinnerConnectorPendantY() {
  return 70;
}

function getHypeSpinnerConnectorBackZ() {
  return -12;
}

function getHypeSpinnerConnectorHoleOffsetY() {
  return HYPE_SPINNER_CONNECTOR_STL_HOLE_Y_MM * getHypeSpinnerConnectorSceneScale();
}

function getHypeSpinnerConnectorHoleX() {
  return HYPE_SPINNER_CONNECTOR_STL_HOLE_X_MM * getHypeSpinnerConnectorSceneScale();
}

function getHypeSpinnerConnectorTopOffsetY() {
  return 31.95 * getHypeSpinnerConnectorSceneScale();
}

function makeHypeSpinnerOuterRing(dims, spinner, resources) {
  const group = new THREE.Group();
  const material = makeHypeSilkMaterial(spinner.ringColor);
  material.roughness = 0.26;
  material.metalness = 0.28;
  resources.push(material);

  const referenceRingGeometry = state.hypeThree?.spinnerStlGeometries?.outerRing;
  if (!referenceRingGeometry) {
    throw new Error('Spinner outer ring STL geometry is required.');
  }
  const geometry = referenceRingGeometry.clone();
  resources.push(geometry);
  const ring = new THREE.Mesh(geometry, material);
  ring.name = 'stlOuterSpinnerRingBody';
  const scale = getHypeSpinnerSceneScale();
  ring.scale.set(scale, scale, scale);
  ring.castShadow = true;
  ring.receiveShadow = true;
  ring.frustumCulled = false;
  group.add(ring);

  group.add(makeHypeSpinnerRaisedTextMeshes(dims, spinner, resources));
  return group;
}

function makeHypeSpinnerRingGeometry(outerRadius, innerRadius, depth) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geometry = new THREE.ExtrudeBufferGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 1.6,
    bevelSize: 1.6,
    bevelSegments: 5,
    curveSegments: 96,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeBoundingSphere();
  geometry.computeVertexNormals();
  return geometry;
}

function makeHypeSpinnerRaisedTextMeshes(dims, spinner, resources) {
  const group = new THREE.Group();
  group.name = 'raisedCurvedSpinnerTextMeshes';
  const fontFamily = normalizeHypeSpinnerFontFamily(spinner.fontFamily);
  requestHypeSpinnerFont(fontFamily);
  const textMaterial = makeHypeSpinnerTextMaterial(spinner.textColor);
  if (Array.isArray(textMaterial)) {
    resources.push(...textMaterial);
  } else {
    resources.push(textMaterial);
  }
  const textDepth = clamp(dims.ringDepth * 0.24, 5.2, 7.4);
  const metrics = {
    height: clamp(dims.bandWidth * 1.08, 42, 64),
    width: clamp(dims.bandWidth * 0.76, 30, 48),
    stroke: clamp(dims.bandWidth * 0.16, 7.5, 12),
    depth: textDepth,
    gap: clamp(dims.bandWidth * 0.145, 7.2, 13.6),
    radius: dims.textRadius,
    z: dims.ringDepth / 2 + textDepth / 2 - 1.2,
    fontFamily,
  };
  group.add(makeHypeSpinnerTextArcMesh(spinner.topText, {
    bottomArc: false,
    centerAngle: Math.PI / 2,
    material: textMaterial,
    metrics,
    resources,
  }));
  group.add(makeHypeSpinnerTextArcMesh(spinner.bottomText, {
    bottomArc: true,
    centerAngle: -Math.PI / 2,
    material: textMaterial,
    metrics,
    resources,
  }));
  return group;
}

function makeHypeSpinnerTextArcMesh(text, options) {
  const {
    bottomArc,
    centerAngle,
    material,
    metrics,
    resources,
  } = options;
  const cleanText = sanitizeHypeSpinnerText(text, bottomArc ? DEFAULT_HYPE_SPINNER_CONFIG.bottomText : DEFAULT_HYPE_SPINNER_CONFIG.topText)
    .toUpperCase();
  const chars = Array.from(cleanText);
  const rawWidths = chars.map((char) => getHypeBlockGlyphWidth(char, metrics));
  const rawTotal = rawWidths.reduce((sum, width) => sum + width, 0) + Math.max(0, chars.length - 1) * metrics.gap;
  const maxArcLength = metrics.radius * 1.78;
  const fitScale = rawTotal > maxArcLength ? clamp(maxArcLength / rawTotal, 0.72, 1) : 1;
  const fittedMetrics = {
    ...metrics,
    height: metrics.height * fitScale,
    width: metrics.width * fitScale,
    stroke: metrics.stroke * fitScale,
    gap: metrics.gap * clamp(Math.sqrt(fitScale), 0.82, 1),
  };
  const widths = chars.map((char) => getHypeBlockGlyphWidth(char, fittedMetrics));
  const total = widths.reduce((sum, width) => sum + width, 0) + Math.max(0, chars.length - 1) * fittedMetrics.gap;
  let cursor = -total / 2;
  const group = new THREE.Group();
  group.name = bottomArc ? 'raisedBottomRingText' : 'raisedTopRingText';
  chars.forEach((char, index) => {
    const width = widths[index];
    const midpoint = cursor + width / 2;
    const angle = bottomArc
      ? centerAngle + midpoint / fittedMetrics.radius
      : centerAngle - midpoint / fittedMetrics.radius;
    const glyph = makeHypeBlockGlyphMesh(char, material, resources, fittedMetrics);
    glyph.position.set(
      Math.cos(angle) * fittedMetrics.radius,
      Math.sin(angle) * fittedMetrics.radius,
      fittedMetrics.z,
    );
    glyph.rotation.z = bottomArc ? angle + Math.PI / 2 : angle - Math.PI / 2;
    group.add(glyph);
    cursor += width + fittedMetrics.gap;
  });
  return group;
}

function getHypeBlockGlyphWidth(char, metrics) {
  if (char === ' ') return metrics.width * 0.62;
  if (char === 'I' || char === '1') return metrics.width * 0.54;
  if (char === 'M' || char === 'W') return metrics.width * 1.16;
  return metrics.width;
}

function getHypeSpinnerTextRenderColour(hex) {
  const normalized = normalizeHex(hex || '#000000');
  if (isHypeVeryDarkColour(normalized)) return '#202020';
  return normalized;
}

function isHypeVeryDarkColour(hex) {
  const normalized = normalizeHex(hex || '#000000');
  const rgb = hexToRgb(normalized);
  const max = Math.max(...rgb);
  return max <= 52;
}

function makeHypeSpinnerTextMaterial(hex) {
  const normalized = normalizeHex(hex || '#000000');
  if (isHypeVeryDarkColour(normalized)) {
    const frontMaterial = makeHypeSilkMaterial(getHypeSpinnerTextRenderColour(normalized));
    frontMaterial.roughness = 0.22;
    frontMaterial.metalness = 0.08;
    frontMaterial.envMapIntensity = 1.08;
    const sideMaterial = makeHypeSilkMaterial('#2a2a2a');
    sideMaterial.roughness = 0.2;
    sideMaterial.metalness = 0.12;
    sideMaterial.envMapIntensity = 1.28;
    return [frontMaterial, sideMaterial];
  }
  const material = makeHypeSilkMaterial(normalized);
  const textColourRgb = hexToRgb(normalized);
  const textLuma = (0.2126 * textColourRgb[0] + 0.7152 * textColourRgb[1] + 0.0722 * textColourRgb[2]) / 255;
  material.roughness = textLuma > 0.72 ? 0.28 : 0.32;
  material.metalness = textLuma > 0.72 ? 0.08 : 0.1;
  material.envMapIntensity = textLuma > 0.72 ? 0.75 : 0.68;
  return material;
}

function makeHypeBlockGlyphMesh(char, material, resources, metrics) {
  const group = new THREE.Group();
  group.name = `raisedRingGlyph-${char === ' ' ? 'space' : char}`;
  if (char === ' ') return group;
  const vectorGeometry = makeHypeVectorGlyphGeometry(char, metrics);
  if (vectorGeometry) {
    resources.push(vectorGeometry);
    const mesh = new THREE.Mesh(vectorGeometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    group.add(mesh);
    return group;
  }
  const rectangles = getHypeRasterBlockGlyphRectangles(char, metrics);
  rectangles.forEach((spec) => {
    const geometry = new THREE.BoxBufferGeometry(spec.width, spec.height, metrics.depth);
    resources.push(geometry);
    const mesh = new THREE.Mesh(geometry, Array.isArray(material) ? material[0] : material);
    mesh.position.set(spec.x, spec.y, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    group.add(mesh);
  });
  return group;
}

function makeHypeVectorGlyphGeometry(char, metrics) {
  if (typeof document === 'undefined' || !THREE?.Shape || !THREE?.ExtrudeGeometry) return null;
  const sample = sampleHypeGlyphMask(char, metrics);
  if (!sample) return null;
  const loops = traceHypeGlyphBoundaryLoops(sample.mask, sample.width, sample.height);
  const contours = loops
    .map((loop) => mapHypeGlyphLoopToScene(loop, sample.width, sample.height, metrics, char))
    .map((points) => simplifyHypeGlyphContour(smoothHypeGlyphContour(removeHypeDuplicatePoints(points)), clamp(metrics.height * 0.006, 0.18, 0.42)))
    .filter((points) => points.length >= 4 && Math.abs(getHypePolygonSignedArea(points)) > 0.5);
  const shapes = makeHypeGlyphShapes(contours);
  if (!shapes.length) return null;
  const bevelSize = clamp(metrics.height * 0.018, 0.48, 1);
  const bevelThickness = clamp(metrics.depth * 0.12, 0.42, 0.8);
  const geometry = new THREE.ExtrudeGeometry(shapes, {
    depth: metrics.depth,
    bevelEnabled: true,
    bevelThickness,
    bevelSize,
    bevelSegments: 3,
    curveSegments: 24,
    steps: 1,
  });
  geometry.translate(0, 0, -metrics.depth / 2);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function sampleHypeGlyphMask(char, metrics) {
  const canvas = document.createElement('canvas');
  const canvasWidth = 512;
  const canvasHeight = 640;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.imageSmoothingEnabled = true;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let fontSize = 540;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    ctx.font = getHypeSpinnerCanvasFont(metrics.fontFamily, fontSize);
    const measured = ctx.measureText(char);
    const measuredWidth = measured.width;
    const measuredHeight = Math.abs(measured.actualBoundingBoxAscent || fontSize * 0.72)
      + Math.abs(measured.actualBoundingBoxDescent || fontSize * 0.18);
    if (measuredWidth <= canvasWidth * 0.82 && measuredHeight <= canvasHeight * 0.82) break;
    fontSize *= 0.9;
  }
  ctx.font = getHypeSpinnerCanvasFont(metrics.fontFamily, fontSize);
  ctx.fillStyle = '#000000';
  ctx.fillText(char, canvasWidth / 2, canvasHeight / 2 + fontSize * 0.025);
  const image = ctx.getImageData(0, 0, canvasWidth, canvasHeight).data;
  let minX = canvasWidth;
  let minY = canvasHeight;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < canvasHeight; y += 1) {
    for (let x = 0; x < canvasWidth; x += 1) {
      const alpha = image[(y * canvasWidth + x) * 4 + 3];
      if (alpha <= 28) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) return null;
  const pad = 4;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(canvasWidth - 1, maxX + pad);
  maxY = Math.min(canvasHeight - 1, maxY + pad);
  const boundsWidth = maxX - minX + 1;
  const boundsHeight = maxY - minY + 1;
  const sampleHeight = 112;
  const sampleWidth = Math.max(24, Math.round(sampleHeight * (getHypeBlockGlyphWidth(char, metrics) / metrics.height) * 1.08));
  const mask = new Uint8Array(sampleWidth * sampleHeight);
  for (let row = 0; row < sampleHeight; row += 1) {
    for (let col = 0; col < sampleWidth; col += 1) {
      const x0 = Math.floor(minX + (col / sampleWidth) * boundsWidth);
      const x1 = Math.max(x0 + 1, Math.ceil(minX + ((col + 1) / sampleWidth) * boundsWidth));
      const y0 = Math.floor(minY + (row / sampleHeight) * boundsHeight);
      const y1 = Math.max(y0 + 1, Math.ceil(minY + ((row + 1) / sampleHeight) * boundsHeight));
      let coverage = 0;
      let pixels = 0;
      let maxAlpha = 0;
      for (let y = y0; y < y1; y += 1) {
        for (let x = x0; x < x1; x += 1) {
          const alpha = image[(y * canvasWidth + x) * 4 + 3];
          maxAlpha = Math.max(maxAlpha, alpha);
          coverage += alpha / 255;
          pixels += 1;
        }
      }
      coverage /= Math.max(1, pixels);
      if (coverage > 0.16 || (maxAlpha > 190 && coverage > 0.07)) {
        mask[row * sampleWidth + col] = 1;
      }
    }
  }
  return { mask, width: sampleWidth, height: sampleHeight };
}

function traceHypeGlyphBoundaryLoops(mask, width, height) {
  const edgeStarts = new Map();
  const addEdge = (x1, y1, x2, y2) => {
    const key = `${x1},${y1}`;
    const edge = { x1, y1, x2, y2, key, used: false };
    if (!edgeStarts.has(key)) edgeStarts.set(key, []);
    edgeStarts.get(key).push(edge);
  };
  const filled = (x, y) => x >= 0 && y >= 0 && x < width && y < height && mask[y * width + x];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!filled(x, y)) continue;
      if (!filled(x, y - 1)) addEdge(x, y, x + 1, y);
      if (!filled(x + 1, y)) addEdge(x + 1, y, x + 1, y + 1);
      if (!filled(x, y + 1)) addEdge(x + 1, y + 1, x, y + 1);
      if (!filled(x - 1, y)) addEdge(x, y + 1, x, y);
    }
  }
  const loops = [];
  edgeStarts.forEach((edges) => {
    edges.forEach((startEdge) => {
      if (startEdge.used) return;
      const startKey = startEdge.key;
      let edge = startEdge;
      const loop = [];
      let guard = 0;
      while (edge && !edge.used && guard < width * height * 8) {
        edge.used = true;
        loop.push([edge.x1, edge.y1]);
        const nextKey = `${edge.x2},${edge.y2}`;
        if (nextKey === startKey) {
          loop.push([edge.x2, edge.y2]);
          break;
        }
        const nextEdges = edgeStarts.get(nextKey) || [];
        edge = nextEdges.find((candidate) => !candidate.used) || null;
        guard += 1;
      }
      if (loop.length >= 4) loops.push(loop);
    });
  });
  return loops;
}

function mapHypeGlyphLoopToScene(loop, width, height, metrics, char) {
  const glyphWidth = getHypeBlockGlyphWidth(char, metrics);
  return loop.map(([x, y]) => new THREE.Vector2(
    -glyphWidth / 2 + (x / width) * glyphWidth,
    metrics.height / 2 - (y / height) * metrics.height,
  ));
}

function makeHypeGlyphShapes(contours) {
  const items = contours.map((points) => ({
    points,
    area: getHypePolygonSignedArea(points),
    absArea: Math.abs(getHypePolygonSignedArea(points)),
    center: getHypePolygonCentroid(points),
  })).sort((a, b) => b.absArea - a.absArea);
  const outers = [];
  const holes = [];
  items.forEach((item, index) => {
    const containing = items.filter((candidate, candidateIndex) => (
      candidateIndex !== index
      && candidate.absArea > item.absArea
      && isHypePointInPolygon(item.center, candidate.points)
    )).length;
    if (containing % 2 === 0) {
      outers.push({ item, holes: [] });
    } else {
      holes.push(item);
    }
  });
  holes.forEach((hole) => {
    const owner = outers
      .filter(({ item }) => item.absArea > hole.absArea && isHypePointInPolygon(hole.center, item.points))
      .sort((a, b) => a.item.absArea - b.item.absArea)[0];
    if (owner) owner.holes.push(hole);
  });
  return outers.map(({ item, holes: shapeHoles }) => {
    const outer = orientHypeGlyphContour(item.points, true);
    const shape = new THREE.Shape(outer);
    shapeHoles.forEach((hole) => {
      shape.holes.push(new THREE.Path(orientHypeGlyphContour(hole.points, false)));
    });
    return shape;
  });
}

function orientHypeGlyphContour(points, clockwise) {
  const copy = points.map((point) => point.clone());
  const isClockwise = getHypePolygonSignedArea(copy) < 0;
  if (isClockwise !== clockwise) copy.reverse();
  return copy;
}

function removeHypeDuplicatePoints(points) {
  const cleaned = [];
  points.forEach((point) => {
    const previous = cleaned[cleaned.length - 1];
    if (previous && previous.distanceTo(point) < 0.0001) return;
    cleaned.push(point);
  });
  if (cleaned.length > 1 && cleaned[0].distanceTo(cleaned[cleaned.length - 1]) < 0.0001) cleaned.pop();
  return cleaned;
}

function smoothHypeGlyphContour(points) {
  if (points.length < 8) return points;
  const smoothed = [];
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    smoothed.push(new THREE.Vector2(
      current.x * 0.82 + next.x * 0.18,
      current.y * 0.82 + next.y * 0.18,
    ));
    smoothed.push(new THREE.Vector2(
      current.x * 0.18 + next.x * 0.82,
      current.y * 0.18 + next.y * 0.82,
    ));
  }
  return smoothed;
}

function simplifyHypeGlyphContour(points, tolerance) {
  if (points.length <= 12) return points;
  const result = [];
  const squaredTolerance = tolerance * tolerance;
  for (let index = 0; index < points.length; index += 1) {
    const previous = points[(index - 1 + points.length) % points.length];
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const distance = getHypePointToSegmentDistanceSquared(current, previous, next);
    if (distance > squaredTolerance) result.push(current);
  }
  return result.length >= 4 ? result : points;
}

function getHypePointToSegmentDistanceSquared(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0) return point.distanceToSquared(start);
  const t = clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy), 0, 1);
  const x = start.x + dx * t;
  const y = start.y + dy * t;
  const px = point.x - x;
  const py = point.y - y;
  return px * px + py * py;
}

function getHypePolygonSignedArea(points) {
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }
  return area / 2;
}

function getHypePolygonCentroid(points) {
  let x = 0;
  let y = 0;
  points.forEach((point) => {
    x += point.x;
    y += point.y;
  });
  return new THREE.Vector2(x / Math.max(1, points.length), y / Math.max(1, points.length));
}

function isHypePointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    const intersects = ((a.y > point.y) !== (b.y > point.y))
      && (point.x < ((b.x - a.x) * (point.y - a.y)) / ((b.y - a.y) || 1e-9) + a.x);
    if (intersects) inside = !inside;
  }
  return inside;
}

function getHypeRasterBlockGlyphRectangles(char, metrics) {
  if (typeof document === 'undefined') return [];
  const canvas = document.createElement('canvas');
  const canvasWidth = 224;
  const canvasHeight = 272;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = getHypeSpinnerCanvasFont(metrics.fontFamily, 208);
  ctx.fillText(char, canvasWidth / 2, canvasHeight / 2 + 4);
  const image = ctx.getImageData(0, 0, canvasWidth, canvasHeight).data;
  let minX = canvasWidth;
  let minY = canvasHeight;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < canvasHeight; y += 1) {
    for (let x = 0; x < canvasWidth; x += 1) {
      const alpha = image[(y * canvasWidth + x) * 4 + 3];
      if (alpha <= 54) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) return [];

  const gridRows = 56;
  const gridCols = Math.max(22, Math.round(gridRows * (getHypeBlockGlyphWidth(char, metrics) / metrics.height) * 1.08));
  const boundsWidth = maxX - minX + 1;
  const boundsHeight = maxY - minY + 1;
  const rows = [];
  for (let row = 0; row < gridRows; row += 1) {
    const rowRuns = [];
    let runStart = -1;
    for (let col = 0; col < gridCols; col += 1) {
      const x0 = Math.floor(minX + (col / gridCols) * boundsWidth);
      const x1 = Math.ceil(minX + ((col + 1) / gridCols) * boundsWidth);
      const y0 = Math.floor(minY + (row / gridRows) * boundsHeight);
      const y1 = Math.ceil(minY + ((row + 1) / gridRows) * boundsHeight);
      let filled = false;
      for (let y = y0; y < y1 && !filled; y += 1) {
        for (let x = x0; x < x1; x += 1) {
          if (image[(y * canvasWidth + x) * 4 + 3] > 72) {
            filled = true;
            break;
          }
        }
      }
      if (filled && runStart < 0) runStart = col;
      if ((!filled || col === gridCols - 1) && runStart >= 0) {
        rowRuns.push([runStart, filled && col === gridCols - 1 ? col + 1 : col]);
        runStart = -1;
      }
    }
    rows.push(rowRuns);
  }

  const cellWidth = getHypeBlockGlyphWidth(char, metrics) / gridCols;
  const cellHeight = metrics.height / gridRows;
  const active = new Map();
  const rectangles = [];
  rows.forEach((rowRuns, row) => {
    const nextActive = new Map();
    rowRuns.forEach(([start, end]) => {
      const key = `${start}:${end}`;
      const rect = active.get(key) || { start, end, rowStart: row, rowEnd: row };
      rect.rowEnd = row;
      nextActive.set(key, rect);
    });
    active.forEach((rect, key) => {
      if (!nextActive.has(key)) rectangles.push(rect);
    });
    active.clear();
    nextActive.forEach((rect, key) => active.set(key, rect));
  });
  active.forEach((rect) => rectangles.push(rect));

  const glyphWidth = getHypeBlockGlyphWidth(char, metrics);
  return rectangles.map((rect) => {
    const width = Math.max(cellWidth * 0.72, (rect.end - rect.start) * cellWidth + cellWidth * 0.03);
    const height = Math.max(cellHeight * 0.82, (rect.rowEnd - rect.rowStart + 1) * cellHeight + cellHeight * 0.03);
    return {
      x: -glyphWidth / 2 + (rect.start + rect.end) * 0.5 * cellWidth,
      y: metrics.height / 2 - (rect.rowStart + rect.rowEnd + 1) * 0.5 * cellHeight,
      width,
      height,
    };
  });
}

function getHypeSpinnerCanvasFont(fontFamily, fontSize = 104) {
  const family = normalizeHypeSpinnerFontFamily(fontFamily);
  return `400 ${fontSize}px ${getHypeSpinnerFontStack(family)}`;
}

function getHypeSpinnerFontStack(fontFamily) {
  const family = normalizeHypeSpinnerFontFamily(fontFamily);
  if (family === 'Market Pro') return `"${family}", "Marker Felt", "Comic Sans MS", cursive`;
  return `"${family}", Impact, "Arial Black", Arial, sans-serif`;
}

function requestHypeSpinnerFont(fontFamily) {
  const family = normalizeHypeSpinnerFontFamily(fontFamily);
  if (typeof document === 'undefined' || !document.fonts?.load || hypeSpinnerRequestedFonts.has(family)) return;
  hypeSpinnerRequestedFonts.add(family);
  document.fonts.load(getHypeSpinnerCanvasFont(family)).then(() => {
    if (state?.hype?.variant === 'spinner') scheduleHypeRender(0);
  }).catch(() => {
    // The fallback font still produces printable raised text if Google Fonts is unavailable.
  });
}

function makeHypeSpinnerBase(dims, pendantMaterial, connectorMaterial, resources) {
  const group = new THREE.Group();
  group.name = 'fixedSpinnerBearingBase';
  const spinner = syncHypeSpinnerConfig();
  const baseGeometry = state.hypeThree?.spinnerStlGeometries?.base;
  if (!baseGeometry) {
    throw new Error('Spinner base STL geometry is required.');
  }
  const baseMaterial = makeHypeSilkMaterial(spinner.baseColor);
  baseMaterial.roughness = 0.3;
  baseMaterial.metalness = 0.2;
  resources.push(baseMaterial);
  const geometry = baseGeometry.clone();
  resources.push(geometry);
  const rearFill = makeHypeSpinnerDisc(dims.spinnerBaseRadius, dims.ringDepth * 0.92, baseMaterial, resources);
  rearFill.name = 'recessedSpinnerBaseFillBehindStlDetails';
  rearFill.position.z = -dims.ringDepth * 1.04;
  rearFill.renderOrder = -1;
  rearFill.frustumCulled = false;
  group.add(rearFill);
  const base = new THREE.Mesh(geometry, baseMaterial);
  base.name = 'stlSpinnerBaseBearingAssembly';
  const scale = getHypeSpinnerSceneScale();
  base.scale.set(scale, scale, scale);
  base.position.z = -dims.ringDepth * 0.74 + HYPE_SPINNER_BASE_FORWARD_DEPTH_OFFSET;
  base.castShadow = true;
  base.receiveShadow = true;
  base.frustumCulled = false;
  group.add(base);
  return group;
}

function makeHypeSpinnerInnerOpeningPlate(dims, resources) {
  const spinner = syncHypeSpinnerConfig();
  const material = makeHypeSilkMaterial(spinner.baseColor);
  material.roughness = 0.34;
  material.metalness = 0.18;
  resources.push(material);
  const depth = clamp(dims.ringDepth * 0.16, 3.4, 5.2);
  const plate = makeHypeSpinnerDisc(dims.innerPlateRadius, depth, material, resources);
  plate.name = 'recessedBlackInnerFillBehindSpinnerBase';
  plate.position.z = -dims.ringDepth * 1.18;
  plate.renderOrder = -2;
  plate.frustumCulled = false;
  return plate;
}

function makeHypeSpinnerDisc(radius, depth, material, resources) {
  const geometry = new THREE.CylinderBufferGeometry(radius, radius, depth, 96);
  geometry.rotateX(Math.PI / 2);
  geometry.computeVertexNormals();
  resources.push(geometry);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeHypeSpinnerCenterPendant(dims, material, resources) {
  if (state.hype.logoDataUrl) {
    const pendantSize = getHypeLogoPendantSize();
    const openingDiameter = dims.innerRadius * 2;
    const targetWidth = Math.max(54, openingDiameter * 1.28 - dims.clearance * 2);
    const targetHeight = Math.max(54, openingDiameter * 1.16 - dims.clearance * 2);
    const centerScale = clamp(
      Math.min(targetWidth / pendantSize.width, targetHeight / pendantSize.height),
      1.32,
      2.65,
    );
    return makeHypeLogoPendantMesh(material, resources, {
      name: 'fixedSpinnerLogoPendant',
      pendantSize,
      scale: centerScale,
      skipHook: true,
      logoYOffset: HYPE_SPINNER_FIXED_CENTER_LOGO_VERTICAL_OFFSET,
    });
  }
  return makeHypeSpinnerPlaceholderPendant(dims, material, resources);
}

function makeHypeSpinnerPlaceholderPendant(dims, material, resources) {
  const group = new THREE.Group();
  group.name = 'fixedSpinnerPlaceholderPendant';
  const width = dims.innerRadius * 1.86;
  const height = dims.innerRadius * 1.2;
  const geometry = makeFallbackHypePendantBodyGeometry(width, height, 11);
  resources.push(geometry);
  const body = new THREE.Mesh(geometry, material);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const texture = makeHypeSpinnerCenterTextTexture(state.hype.text || 'MVP');
  const faceGeometry = new THREE.PlaneBufferGeometry(width * 0.82, height * 0.56);
  const faceMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  resources.push(texture, faceGeometry, faceMaterial);
  const face = new THREE.Mesh(faceGeometry, faceMaterial);
  face.position.z = 6.2;
  face.renderOrder = 7;
  group.add(face);
  return group;
}

function makeHypeSpinnerCenterTextTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 112px Arial, sans-serif';
  ctx.fillText(String(text || 'MVP').slice(0, 12).toUpperCase(), canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.encoding = THREE.sRGBEncoding;
  texture.needsUpdate = true;
  return texture;
}

function updateHypeSpinnerAnimationState() {
  if (!state.hypeThree) return;
  if (
    state.hype.variant !== 'spinner'
    || !state.hypeThree.spinnerRingGroup
  ) {
    cancelHypeSpinnerSpin();
    return;
  }
  if (state.hypeThree.spinnerSpinState?.isSpinning && !state.hypeThree.spinnerAnimationFrame) {
    cancelHypeSpinnerSpin();
    return;
  }
  applyHypeSpinnerStateToControls();
}

function startHypeSpinnerSpin() {
  if (!state.hypeThree?.spinnerRingGroup || state.hype.variant !== 'spinner') {
    applyHypeSpinnerStateToControls();
    return;
  }
  const spinState = getHypeSpinnerSpinState();
  if (spinState.isSpinning) return;
  const direction = Math.random() > 0.5 ? 1 : -1;
  Object.assign(spinState, {
    isSpinning: true,
    phase: 'accelerating',
    elapsed: 0,
    direction,
    peakAngularVelocity: randomHypeSpinnerValue(22, 34),
    accelerationDuration: randomHypeSpinnerValue(0.28, 0.44),
    coastDuration: randomHypeSpinnerValue(0.42, 0.78),
    decelerationDuration: randomHypeSpinnerValue(3.0, 4.5),
    wobbleSeed: Math.random() * Math.PI * 2,
  });
  applyHypeSpinnerStateToControls();
  startHypeSpinnerSpinLoop();
}

function startHypeSpinnerSpinLoop() {
  if (!state.hypeThree || state.hypeThree.spinnerAnimationFrame) return;
  state.hypeThree.spinnerLastFrameTime = performance.now();
  const tick = (now) => {
    if (!state.hypeThree?.spinnerRingGroup || state.hype.variant !== 'spinner') {
      stopHypeSpinnerSpinLoop();
      return;
    }
    const spinState = getHypeSpinnerSpinState();
    if (!spinState.isSpinning) {
      stopHypeSpinnerSpinLoop();
      renderHypeThree();
      return;
    }
    const deltaSeconds = Math.min(0.05, Math.max(0, (now - (state.hypeThree.spinnerLastFrameTime || now)) / 1000));
    state.hypeThree.spinnerLastFrameTime = now;
    spinState.elapsed += deltaSeconds;
    const angularVelocity = getHypeSpinnerAngularVelocity(spinState);
    if (angularVelocity <= 0) {
      finishHypeSpinnerSpin();
      renderHypeThree();
      return;
    }
    state.hypeThree.spinnerRingGroup.rotation.z += spinState.direction * angularVelocity * deltaSeconds;
    syncHypeSpinnerBaseRotation();
    renderHypeThree();
    state.hypeThree.spinnerAnimationFrame = window.requestAnimationFrame(tick);
  };
  state.hypeThree.spinnerAnimationFrame = window.requestAnimationFrame(tick);
}

function stopHypeSpinnerSpinLoop() {
  if (!state.hypeThree?.spinnerAnimationFrame) return;
  window.cancelAnimationFrame(state.hypeThree.spinnerAnimationFrame);
  state.hypeThree.spinnerAnimationFrame = null;
  state.hypeThree.spinnerLastFrameTime = 0;
}

function syncHypeSpinnerBaseRotation() {
  if (!state.hypeThree?.spinnerRingGroup || !state.hypeThree?.spinnerBaseGroup) return;
  state.hypeThree.spinnerBaseGroup.rotation.z = state.hypeThree.spinnerRingGroup.rotation.z;
}

function finishHypeSpinnerSpin() {
  cancelHypeSpinnerSpin();
}

function cancelHypeSpinnerSpin(options = {}) {
  const { updateControls = true } = options;
  if (!state.hypeThree) return;
  const spinState = getHypeSpinnerSpinState();
  spinState.isSpinning = false;
  spinState.phase = 'idle';
  spinState.elapsed = 0;
  stopHypeSpinnerSpinLoop();
  if (updateControls) applyHypeSpinnerStateToControls();
}

function resetHypeSpinnerSpinState() {
  if (!state.hypeThree) return;
  state.hypeThree.spinnerSpinState = {
    isSpinning: false,
    phase: 'idle',
    elapsed: 0,
    direction: 1,
    peakAngularVelocity: 0,
    accelerationDuration: 0.35,
    coastDuration: 0.6,
    decelerationDuration: 3.5,
    wobbleSeed: 0,
  };
  applyHypeSpinnerStateToControls();
}

function getHypeSpinnerSpinState() {
  if (!state.hypeThree) return { isSpinning: false, phase: 'idle' };
  if (!state.hypeThree.spinnerSpinState) resetHypeSpinnerSpinState();
  return state.hypeThree.spinnerSpinState;
}

function getHypeSpinnerAngularVelocity(spinState) {
  const accelerationDuration = Math.max(0.01, Number(spinState.accelerationDuration) || 0.35);
  const coastDuration = Math.max(0, Number(spinState.coastDuration) || 0.6);
  const decelerationDuration = Math.max(0.01, Number(spinState.decelerationDuration) || 3.5);
  const peakAngularVelocity = Math.max(0, Number(spinState.peakAngularVelocity) || 0);
  const elapsed = Math.max(0, Number(spinState.elapsed) || 0);
  const decelerationStart = accelerationDuration + coastDuration;
  const stopAt = decelerationStart + decelerationDuration;

  if (elapsed < accelerationDuration) {
    spinState.phase = 'accelerating';
    const t = clamp(elapsed / accelerationDuration, 0, 1);
    return peakAngularVelocity * (1 - Math.pow(1 - t, 3));
  }
  if (elapsed < decelerationStart) {
    spinState.phase = 'coasting';
    const t = clamp((elapsed - accelerationDuration) / Math.max(0.01, coastDuration), 0, 1);
    return peakAngularVelocity * (0.96 + Math.sin(t * Math.PI * 2 + (spinState.wobbleSeed || 0)) * 0.035);
  }
  if (elapsed < stopAt) {
    spinState.phase = 'decelerating';
    const t = clamp((elapsed - decelerationStart) / decelerationDuration, 0, 1);
    return peakAngularVelocity * Math.pow(1 - t, 2.15);
  }
  spinState.phase = 'idle';
  spinState.isSpinning = false;
  return 0;
}

function randomHypeSpinnerValue(min, max) {
  return min + Math.random() * (max - min);
}

function buildHypeChainLoop({ linkCount, linkGeometry, materials }) {
  const root = new THREE.Group();
  root.name = 'continuousArticulatedLinkLoop';
  const path = makeHypeChainPath();
  let leftEnd = root;
  let rightEnd = root;
  const linksOnPath = Math.max(16, linkCount + 4);
  path.arcLengthDivisions = Math.max(480, linksOnPath * 24);
  path.updateArcLengths();
  for (let i = 0; i < linksOnPath; i += 1) {
    const u = linksOnPath === 1 ? 0.5 : i / (linksOnPath - 1);
    const position = path.getPointAt(u);
    const pivot = new THREE.Group();
    pivot.name = `linkPivot${i}`;
    pivot.position.set(position.x, position.y, position.z);
    pivot.rotation.z = getHypeChainPathRotation(path, u);
    const mesh = createChainLink(linkGeometry, materials[i % materials.length], i);
    pivot.add(mesh);
    root.add(pivot);
    if (i === 0) leftEnd = pivot;
    if (i === linksOnPath - 1) rightEnd = pivot;
  }
  return { root, leftEnd, rightEnd, count: linksOnPath };
}

function makeHypeConnectorEntryLinks(linkGeometry, materials, startIndex = 0) {
  const group = new THREE.Group();
  group.name = 'connectorThreadedEntryLinks';
  const secondaryMaterial = materials[1] || materials[0];
  const path = makeHypeChainPath();
  const linksOnPath = Math.max(16, startIndex || 0);
  path.arcLengthDivisions = Math.max(480, linksOnPath * 24);
  path.updateArcLengths();
  const referenceStep = 1 / (linksOnPath - 1);
  const connectorOpenings = {
    left: new THREE.Vector3(-22, -106, 0),
    right: new THREE.Vector3(22, -106, 0),
  };
  const leftChainEnd = path.getPointAt(0);
  const rightChainEnd = path.getPointAt(1);
  const entries = [
    {
      name: 'lowerLeftConnectorEntryLink',
      position: leftChainEnd.clone().lerp(connectorOpenings.left, 0.68),
      u: referenceStep,
    },
    {
      name: 'lowerRightConnectorEntryLink',
      position: rightChainEnd.clone().lerp(connectorOpenings.right, 0.68),
      u: 1 - referenceStep,
    },
  ];
  entries.forEach((entry, offset) => {
    const pivot = new THREE.Group();
    pivot.name = `${entry.name}Pivot`;
    pivot.position.copy(entry.position);
    pivot.rotation.z = getHypeChainPathRotation(path, entry.u);
    const mesh = createChainLink(linkGeometry, secondaryMaterial, 1);
    mesh.name = entry.name;
    pivot.add(mesh);
    group.add(pivot);
  });
  return group;
}

function makeHypeSpinnerConnectorEntryLinks(linkGeometry, materials, startIndex = 0) {
  const group = new THREE.Group();
  group.name = 'spinnerConnectorThreadedEntryLinks';
  const secondaryMaterial = materials[1] || materials[0];
  const leftEntryMaterialIndex = materials.length >= 3 ? 2 : 1;
  const path = makeHypeChainPath();
  const linksOnPath = Math.max(16, startIndex || 0);
  path.arcLengthDivisions = Math.max(480, linksOnPath * 24);
  path.updateArcLengths();
  const referenceStep = 1 / (linksOnPath - 1);
  const upperLoopY = getHypeSpinnerPendantY()
    + getHypeSpinnerConnectorPendantY()
    + getHypeSpinnerConnectorTopOffsetY()
    + 8
    - getHypeSpinnerChainRigY();
  const upperLoopZ = getHypeSpinnerPendantZ()
    + getHypeSpinnerConnectorBackZ()
    + HYPE_SPINNER_CONNECTOR_ENTRY_FORWARD_Z;
  const upperLoopTargets = {
    left: new THREE.Vector3(-getHypeSpinnerConnectorHoleX() * 1.2, upperLoopY, upperLoopZ),
    right: new THREE.Vector3(getHypeSpinnerConnectorHoleX() * 1.2, upperLoopY, upperLoopZ),
  };
  const leftChainEnd = path.getPointAt(0);
  const rightChainEnd = path.getPointAt(1);
  [
    {
      name: 'spinnerLeftTransitionLink',
      position: leftChainEnd.clone()
        .lerp(upperLoopTargets.left, HYPE_SPINNER_CONNECTOR_ENTRY_BLEND)
        .add(new THREE.Vector3(HYPE_SPINNER_CONNECTOR_ENTRY_CLEARANCE_INSET_X, HYPE_SPINNER_CONNECTOR_ENTRY_CLEARANCE_DROP_Y, 0)),
      u: 0,
      materialIndex: leftEntryMaterialIndex,
      throughHole: false,
    },
    {
      name: 'spinnerRightTransitionLink',
      position: rightChainEnd.clone()
        .lerp(upperLoopTargets.right, HYPE_SPINNER_CONNECTOR_ENTRY_BLEND)
        .add(new THREE.Vector3(-HYPE_SPINNER_CONNECTOR_ENTRY_CLEARANCE_INSET_X, HYPE_SPINNER_CONNECTOR_ENTRY_CLEARANCE_DROP_Y, 0)),
      u: 1,
      materialIndex: 1,
      throughHole: false,
    },
  ].forEach((entry) => {
    const pivot = new THREE.Group();
    pivot.name = `${entry.name}Pivot`;
    pivot.position.copy(entry.position);
    pivot.rotation.z = entry.throughHole
      ? THREE.Math.degToRad(entry.side < 0 ? 14 : -14)
      : getHypeChainPathRotation(path, entry.u);
    const mesh = createChainLink(linkGeometry, materials[entry.materialIndex] || secondaryMaterial, 1);
    mesh.name = entry.name;
    if (entry.throughHole) {
      mesh.rotation.z = Math.PI / 2;
      mesh.rotation.y = THREE.Math.degToRad(entry.side < 0 ? 72 : -72);
      mesh.position.z = 3;
      mesh.renderOrder = 5;
    }
    pivot.add(mesh);
    group.add(pivot);
  });
  return group;
}

function disableHypeFrustumCulling(object) {
  object.traverse?.((child) => {
    if (child.isMesh) child.frustumCulled = false;
  });
}

function getHypeChainPathRotation(path, u) {
  const tangent = path.getTangentAt(u);
  const tangentAngle = Math.atan2(tangent.y, tangent.x);
  return tangentAngle + Math.sin(u * Math.PI * 4) * THREE.Math.degToRad(1);
}

function makeHypeChainPath() {
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(-66, -76, 4),
    new THREE.Vector3(-111, -51, 2),
    new THREE.Vector3(-143, -6, -2),
    new THREE.Vector3(-150, 92, -6),
    new THREE.Vector3(-96, 206, -9),
    new THREE.Vector3(0, 244, -10),
    new THREE.Vector3(96, 206, -9),
    new THREE.Vector3(150, 92, -6),
    new THREE.Vector3(143, -6, -2),
    new THREE.Vector3(111, -51, 2),
    new THREE.Vector3(66, -76, 4),
  ], false, 'catmullrom', 0.5);
}

function makeHypePendantMesh(material, resources) {
  if (state.hype.logoDataUrl) return makeHypeLogoPendantMesh(material, resources);
  const group = new THREE.Group();
  group.name = 'freeHangingPendant';
  const shape = new THREE.Shape();
  const w = 118;
  const h = 92;
  roundedRectShape(shape, -w / 2, -h / 2, w, h, 14);
  const hole = new THREE.Path();
  hole.absarc(0, h / 2 - 15, 10, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geometry = new THREE.ExtrudeBufferGeometry(shape, {
    depth: 14,
    bevelEnabled: true,
    bevelThickness: 2.5,
    bevelSize: 2.5,
    bevelSegments: 5,
    curveSegments: 18,
  });
  geometry.center();
  resources.push(geometry);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  const reinforcementGeometry = makeRoundedRectangleTubeGeometry(34, 24, 9, 4.2);
  resources.push(reinforcementGeometry);
  const reinforcement = new THREE.Mesh(reinforcementGeometry, material);
  reinforcement.position.set(0, h / 2 - 15, 9);
  reinforcement.castShadow = true;
  reinforcement.receiveShadow = true;
  group.add(reinforcement);
  return group;
}

function makeHypeLogoPendantMesh(material, resources, options = {}) {
  const group = new THREE.Group();
  group.name = options.name || 'uploadedLogoPendant';
  const pendantScale = Number(options.scale) || 2.25;
  group.scale.set(pendantScale, pendantScale, pendantScale);
  const pendantSize = options.pendantSize || getHypeLogoPendantSize();
  const pendantDepth = 11;
  const texture = new THREE.TextureLoader().load(state.hype.logoDataUrl, () => {
    texture.needsUpdate = true;
    renderHypeThree();
  });
  texture.encoding = THREE.sRGBEncoding;
  texture.anisotropy = Math.min(state.hypeThree?.renderer?.capabilities?.getMaxAnisotropy?.() || 4, 8);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  resources.push(texture);

  const logoMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    color: 0xffffff,
    roughness: 0.28,
    metalness: 0.16,
    transparent: true,
    alphaTest: 0.04,
    side: THREE.FrontSide,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -12,
    polygonOffsetUnits: -12,
  });
  const bodyMaterial = makeHypeSilkMaterial(getHypePendantBodyColour());
  bodyMaterial.polygonOffset = true;
  bodyMaterial.polygonOffsetFactor = 2;
  bodyMaterial.polygonOffsetUnits = 2;
  resources.push(logoMaterial, bodyMaterial);

  createHypeLogoPendantFromAlpha(state.hype.logoDataUrl, {
    bodyMaterial,
    logoMaterial,
    resources,
    group,
    pendantSize,
    depth: pendantDepth,
    skipHook: Boolean(options.skipHook),
    logoYOffset: Number.isFinite(options.logoYOffset) ? Number(options.logoYOffset) : undefined,
  });
  return group;
}

function getHypeLogoPendantSize() {
  const aspect = clamp(Number(state.hype.logoAspect) || 1, 0.35, 2.4);
  const maxWidth = 142;
  const maxHeight = 112;
  let width = maxWidth;
  let height = width / aspect;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspect;
  }
  return { width, height };
}

function getHypePendantBodyColour() {
  return normalizeHex(state.hype.pendantCasing || state.hype.pendant || '#202326');
}

function createHypeLogoPendantFromAlpha(dataUrl, options) {
  const {
    bodyMaterial,
    logoMaterial,
    resources,
    group,
    pendantSize,
    depth,
    skipHook = false,
    logoYOffset,
  } = options;
  const image = new Image();
  image.onload = () => {
    if (!isHypeObjectAttachedToCurrentModel(group)) return;
    const silhouette = makeAlphaSilhouettePendantShape(image, pendantSize.width, pendantSize.height);
    const pendantOffset = getHypeLogoPendantOffset(silhouette, { skipHook, logoYOffset });
    const bodyGeometry = makeAlphaSilhouettePendantGeometry(silhouette.shape, depth);
    resources.push(bodyGeometry);
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.name = 'uploadedLogoPendantSolidBody';
    body.position.set(pendantOffset.x, pendantOffset.y, 0);
    body.renderOrder = 1;
    body.castShadow = true;
    body.receiveShadow = true;
    body.frustumCulled = false;
    group.add(body);

    const faceGeometry = new THREE.ShapeBufferGeometry(silhouette.shape);
    applyExplicitGeometryUvs(faceGeometry, silhouette.uvBounds);
    resources.push(faceGeometry);
    const face = new THREE.Mesh(faceGeometry, logoMaterial);
    face.name = 'uploadedLogoPendantFace';
    face.position.set(pendantOffset.x, pendantOffset.y, depth / 2 + HYPE_LOGO_FRONT_OFFSET);
    face.renderOrder = 3;
    face.castShadow = true;
    face.receiveShadow = true;
    face.frustumCulled = false;
    group.add(face);

    const hook = skipHook ? null : makeHypePendantHookMesh(silhouette, bodyMaterial, resources, depth);
    if (hook) {
      group.add(hook);
      alignHypeChainRigToPendantHook(hook);
    }

    updateHypeCameraFocus(state.hypeThree?.pendantGroup || group);
    renderHypeThree();
  };
  image.src = dataUrl;
}

function getHypeLogoPendantOffset(silhouette, options = {}) {
  const { skipHook = false, logoYOffset } = options;
  if (skipHook) {
    const bounds = silhouette?.uvBounds || {};
    const centerX = (Number(bounds.minX) || 0) + (Number(bounds.width) || 0) / 2;
    const centerY = (Number(bounds.minY) || 0) + (Number(bounds.height) || 0) / 2;
    return {
      x: -centerX,
      y: -centerY + (Number.isFinite(logoYOffset) ? logoYOffset : 0),
    };
  }
  return {
    x: 0,
    y: Number.isFinite(logoYOffset) ? logoYOffset : getHypeUploadedLogoBodyYOffset(),
  };
}

function getHypeUploadedLogoBodyYOffset() {
  return state.hype.isExampleProject ? HYPE_EXAMPLE_LOGO_BODY_Y_OFFSET : HYPE_UPLOADED_LOGO_BODY_Y_OFFSET;
}

function isHypeObjectAttachedToCurrentModel(object) {
  if (!state.hypeThree?.group || !object) return false;
  let cursor = object;
  while (cursor) {
    if (cursor === state.hypeThree.group) return true;
    cursor = cursor.parent;
  }
  return false;
}

function makeHypePendantHookMesh(silhouette, bodyMaterial, resources, depth) {
  if (!window.THREE) return null;
  const usableWidth = Math.max(1, silhouette.uvBounds?.width || 120);
  const desiredWidth = clamp(usableWidth * 0.2, 27, 34);
  const geometry = makeHypeUploadedTopHookGeometry();
  geometry.computeBoundingBox();
  const size = new THREE.Vector3();
  geometry.boundingBox.getSize(size);
  const hookMaterial = bodyMaterial.clone();
  hookMaterial.polygonOffset = true;
  hookMaterial.polygonOffsetFactor = 2;
  hookMaterial.polygonOffsetUnits = 2;
  resources.push(geometry, hookMaterial);

  const xyScale = desiredWidth / Math.max(size.x, 0.001);
  const zScale = (depth * 0.5) / Math.max(size.z, 0.001);
  const hookHeight = size.y * xyScale;
  const hookAnchorY = getHypePendantTopCenterY(silhouette);
  const hookTopEdgeY = getHypeUploadedHookAnchorYOffset() + hookAnchorY;
  const hookPositionY = hookTopEdgeY
    + HYPE_UPLOADED_TOP_HOOK_VISIBLE_STEM
    - HYPE_UPLOADED_TOP_HOOK_LEG_LENGTH * xyScale;

  const hookGroup = new THREE.Group();
  hookGroup.name = 'uploadedLogoPendantHookAssembly';
  hookGroup.position.z = 0;
  hookGroup.userData.extraDrop = 0;
  hookGroup.userData.shortLogoChainDrop = getShortLogoChainDrop(silhouette);

  const hook = new THREE.Mesh(geometry, hookMaterial);
  hook.name = 'uploadedLogoPendantHook';
  hook.scale.set(xyScale, xyScale, zScale);
  hook.position.set(0, hookPositionY, -0.2);
  hook.userData.holeCenterLocalY = HYPE_UPLOADED_TOP_HOOK_LEG_LENGTH
    + HYPE_UPLOADED_TOP_HOOK_HOLE_LOCAL_RISE;
  hook.renderOrder = 0;
  hook.castShadow = true;
  hook.receiveShadow = true;
  hook.frustumCulled = false;
  hookGroup.add(hook);

  addHypeUploadedHookShoulderWelds(hookGroup, hookMaterial, resources, {
    xyScale,
    zScale,
    hookPositionY,
  });

  console.info('Pendant Hook added to uploaded-logo pendant', {
    source: 'procedural-top-loop',
    anchorY: Number(hookTopEdgeY.toFixed(2)),
    anchorX: 0,
    visibleStem: Number(HYPE_UPLOADED_TOP_HOOK_VISIBLE_STEM.toFixed(2)),
    width: Number(desiredWidth.toFixed(2)),
    height: Number(hookHeight.toFixed(2)),
    exampleProject: Boolean(state.hype.isExampleProject),
    shortLogoChainDrop: Number(hookGroup.userData.shortLogoChainDrop.toFixed(2)),
    zOffset: Number(hookGroup.position.z.toFixed(2)),
  });
  return hookGroup;
}

function getHypeUploadedHookAnchorYOffset() {
  return state.hype.isExampleProject ? HYPE_EXAMPLE_HOOK_ANCHOR_Y_OFFSET : HYPE_UPLOADED_HOOK_ANCHOR_Y_OFFSET;
}

function makeHypeUploadedTopHookGeometry() {
  const halfWidth = HYPE_UPLOADED_TOP_HOOK_BASE_WIDTH / 2;
  const archCenterY = HYPE_UPLOADED_TOP_HOOK_LEG_LENGTH;
  const points = [];
  points.push(new THREE.Vector3(-halfWidth, 0, 0));
  points.push(new THREE.Vector3(-halfWidth, archCenterY, 0));
  const arcSegments = 28;
  for (let i = 1; i <= arcSegments; i += 1) {
    const angle = Math.PI - (i / arcSegments) * Math.PI;
    points.push(new THREE.Vector3(
      Math.cos(angle) * halfWidth,
      archCenterY + Math.sin(angle) * halfWidth,
      0,
    ));
  }
  points.push(new THREE.Vector3(halfWidth, 0, 0));
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
  const geometry = new THREE.TubeBufferGeometry(curve, 72, HYPE_UPLOADED_TOP_HOOK_TUBE_RADIUS, 18, false);
  geometry.computeBoundingBox();
  const center = new THREE.Vector3();
  geometry.boundingBox.getCenter(center);
  geometry.translate(-center.x, -geometry.boundingBox.min.y, -center.z);
  geometry.computeBoundingBox();
  return geometry;
}

function addHypeUploadedHookShoulderWelds(hookGroup, material, resources, placement) {
  if (!window.THREE) return;
  const { xyScale, zScale, hookPositionY } = placement;
  const halfWidth = HYPE_UPLOADED_TOP_HOOK_BASE_WIDTH / 2;
  const shoulderY = HYPE_UPLOADED_TOP_HOOK_LEG_LENGTH;
  [-1, 1].forEach((side) => {
    const weldGeometry = new THREE.SphereBufferGeometry(
      HYPE_UPLOADED_TOP_HOOK_TUBE_RADIUS * 1.04,
      18,
      12,
    );
    resources.push(weldGeometry);
    const weld = new THREE.Mesh(weldGeometry, material);
    weld.name = side < 0 ? 'uploadedLogoPendantHookLeftShoulderWeld' : 'uploadedLogoPendantHookRightShoulderWeld';
    weld.scale.set(xyScale, xyScale, zScale);
    weld.position.set(side * halfWidth * xyScale, hookPositionY + shoulderY * xyScale, -0.2);
    weld.renderOrder = 0;
    weld.castShadow = true;
    weld.receiveShadow = true;
    weld.frustumCulled = false;
    hookGroup.add(weld);
  });
}

function getHypePendantTopCenterY(silhouette) {
  const topY = Number.isFinite(silhouette?.topY) ? silhouette.topY : NaN;
  const candidate = Number.isFinite(silhouette?.hookAnchorY)
    ? silhouette.hookAnchorY
    : (Number.isFinite(silhouette?.centerTopY) ? silhouette.centerTopY : topY);
  if (Number.isFinite(topY) && Number.isFinite(candidate)) {
    const height = Math.max(1, Number(silhouette?.uvBounds?.height) || 1);
    const maxDrop = clamp(
      height * HYPE_UPLOADED_TOP_HOOK_MAX_CENTER_DROP_RATIO,
      8,
      HYPE_UPLOADED_TOP_HOOK_MAX_CENTER_DROP,
    );
    return clamp(candidate, topY - maxDrop, topY);
  }
  if (Number.isFinite(candidate)) return candidate;
  if (Number.isFinite(topY)) return topY;
  return 0;
}

function alignHypeChainRigToPendantHook(hookGroup) {
  const chainRig = state.hypeThree?.group?.getObjectByName?.('hypeChainAttachmentRig');
  const attachmentLink = chainRig?.getObjectByName?.('pendantAttachmentLink');
  const hook = hookGroup?.getObjectByName?.('uploadedLogoPendantHook');
  if (!chainRig) return;
  chainRig.position.y = HYPE_UPLOADED_CHAIN_DROP_Y;
  if (!attachmentLink || !hook || !window.THREE) return;

  state.hypeThree.group.updateMatrixWorld(true);
  const hookBox = new THREE.Box3().setFromObject(hook);
  const linkBox = new THREE.Box3().setFromObject(attachmentLink);
  if (hookBox.isEmpty() || linkBox.isEmpty()) return;

  const hookHeight = Math.max(1, hookBox.max.y - hookBox.min.y);
  const hookHoleCenterY = getUploadedHookHoleCenterY(hook, hookBox, hookHeight);
  const linkHeight = Math.max(1, linkBox.max.y - linkBox.min.y);
  const linkContactY = linkBox.min.y + linkHeight * HYPE_ATTACHMENT_LINK_HOLE_CONTACT_FROM_BOTTOM;
  const rigDeltaY = clamp(
    hookHoleCenterY - linkContactY,
    -HYPE_HOOK_CHAIN_ALIGN_LIMIT,
    HYPE_HOOK_CHAIN_ALIGN_LIMIT,
  );
  const shortLogoChainDrop = clamp(Number(hookGroup.userData?.shortLogoChainDrop) || 0, 0, HYPE_SHORT_LOGO_CHAIN_DROP_MAX);
  chainRig.position.y += rigDeltaY - shortLogoChainDrop;
  chainRig.userData.hookAlignmentDeltaY = rigDeltaY;
  chainRig.userData.shortLogoChainDrop = shortLogoChainDrop;
}

function getUploadedHookHoleCenterY(hook, hookBox, hookHeight) {
  const holeCenterLocalY = Number(hook?.userData?.holeCenterLocalY);
  if (window.THREE && Number.isFinite(holeCenterLocalY)) {
    const holeCenter = new THREE.Vector3(0, holeCenterLocalY, 0);
    hook.localToWorld(holeCenter);
    return holeCenter.y;
  }
  return hookBox.max.y - hookHeight * HYPE_HOOK_HOLE_CENTER_FROM_TOP;
}

function makeHypePendantColourLayers(silhouette, resources) {
  const layers = [];
  const regionGroups = Array.isArray(state.hype.pendantRegionShapes) ? state.hype.pendantRegionShapes : [];
  if (!regionGroups.length || !window.THREE) return layers;
  const bounds = silhouette.uvBounds;
  const width = bounds.width;
  const height = bounds.height;
  regionGroups.forEach((region, regionIndex) => {
    if (!Array.isArray(region.components) || !region.components.length) return;
    const colourIndex = Number.isInteger(region.colourIndex) ? region.colourIndex : regionIndex;
    const material = new THREE.MeshStandardMaterial({
      color: normalizeHex(state.hype.pendantColours?.[colourIndex] || region.hex || '#ffffff'),
      roughness: 0.24,
      metalness: 0.1,
      side: THREE.FrontSide,
      polygonOffset: true,
      polygonOffsetFactor: -7 - regionIndex,
      polygonOffsetUnits: -7 - regionIndex,
    });
    resources.push(material);
    region.components.forEach((component) => {
      if (!Array.isArray(component) || component.length < 3) return;
      const shape = new THREE.Shape();
      component.forEach((point, index) => {
        const x = bounds.minX + (Number(point[0]) || 0) * width;
        const y = bounds.minY + (1 - (Number(point[1]) || 0)) * height;
        if (index === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      });
      shape.closePath();
      const geometry = new THREE.ShapeBufferGeometry(shape);
      resources.push(geometry);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = `uploadedLogoPendantColourLayer-${regionIndex}`;
      mesh.renderOrder = 4 + regionIndex;
      mesh.castShadow = true;
      mesh.receiveShadow = false;
      mesh.frustumCulled = false;
      layers.push(mesh);
    });
  });
  return layers;
}

function makeFallbackHypePendantBodyGeometry(width, height, depth) {
  const shape = makeFallbackHypePendantShape(width, height);
  const geometry = new THREE.ExtrudeBufferGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 1.8,
    bevelSize: 1.8,
    bevelSegments: 4,
    curveSegments: 10,
  });
  geometry.center();
  geometry.computeBoundingSphere();
  geometry.computeVertexNormals();
  return geometry;
}

function makeFallbackHypePendantShape(width, height) {
  const shape = new THREE.Shape();
  roundedRectShape(shape, -width / 2, -height / 2, width, height, 16);
  return shape;
}

function makeHypeLogoPendantBail(topY, material, resources) {
  if (!window.THREE || !Number.isFinite(topY)) return null;
  const group = new THREE.Group();
  group.name = 'uploadedLogoPendantBail';
  const ringGeometry = new THREE.TorusBufferGeometry(7.2, 1.8, 14, 40);
  ringGeometry.rotateX(Math.PI / 2);
  resources.push(ringGeometry);
  const ring = new THREE.Mesh(ringGeometry, material);
  ring.position.set(0, topY + 4.2, 9.4);
  ring.castShadow = true;
  ring.receiveShadow = true;
  ring.frustumCulled = false;
  group.add(ring);
  return group;
}

function makeHypeSilkMaterial(hex) {
  return new THREE.MeshStandardMaterial({
    color: makeThreeColour(hex),
    roughness: 0.32,
    metalness: 0.24,
    envMapIntensity: 0.55,
  });
}

function renderHypeLinks() {
  if (!els.hypeChainOval) return;
  const hype = state.hype;
  const linkCount = getHypeLinkCount(hype.chainLength, hype.linkCount);
  const colours = getHypePatternColours();
  const sideCount = Math.max(7, Math.floor((linkCount + 4) / 2));
  const links = [];
  for (let side = 0; side < 2; side += 1) {
    const isLeft = side === 0;
    for (let i = 0; i < sideCount; i += 1) {
      const t = sideCount === 1 ? 0 : i / (sideCount - 1);
      const curve = Math.sin(t * Math.PI);
      const xOuter = isLeft ? 29 : 71;
      const xInner = isLeft ? 45 : 55;
      const x = xOuter + (xInner - xOuter) * t + (isLeft ? -1 : 1) * curve * 2;
      const y = 0 + t * 78 + Math.sin(t * Math.PI * 0.76) * 12;
      const lean = (isLeft ? -1 : 1) * (28 - t * 16);
      const twist = ((i % 3) - 1) * 4;
      const perpendicular = i % 2 === 1;
      const colour = colours[(i + (isLeft ? 0 : 1)) % colours.length];
      const z = 18 + (perpendicular ? 34 : 4) + (sideCount - i) * 0.75;
      links.push(`<span class="hype-link ${perpendicular ? 'perpendicular' : 'face'} ${isLeft ? 'left' : 'right'}" style="--x:${x.toFixed(2)}%;--y:${y.toFixed(2)}%;--rot:${(lean + twist).toFixed(2)}deg;--link-color:${colour};--link-z:${z.toFixed(2)}px;--link-order:${i};"></span>`);
    }
  }
  els.hypeChainOval.innerHTML = links.join('');
}

function getHypeSpecLabel() {
  const variant = state.hype.variant === 'spinner' ? 'Spinner' : 'Classic';
  return `${variant} - ${normalizeHypeChainLength(state.hype.chainLength)}`;
}

function renderHypeColourControls() {
  syncHypeDerivedColours();
  const patternLength = getHypePatternLength();
  const hasLogoPendant = Boolean(state.hype.logoDataUrl);
  const labels = {
    primary: 'Primary',
    secondary: 'Secondary',
    tertiary: 'Tertiary',
    pendant: 'Pendant',
    pendantCasing: 'Pendant casing',
  };
  const visibleKeys = new Set(['primary']);
  if (patternLength >= 2) visibleKeys.add('secondary');
  if (patternLength >= 3) visibleKeys.add('tertiary');
  els.hypeColourButtons.forEach((button) => {
    const key = button.dataset.hypeColour;
    const visible = key === 'pendant' ? hasLogoPendant : visibleKeys.has(key);
    button.hidden = !visible;
    button.style.display = visible ? '' : 'none';
    const hex = normalizeHex(state.hype[key] || '#ffffff');
    const dot = button.querySelector('i');
    const label = button.querySelector('span');
    if (dot) dot.style.background = hex;
    if (label) label.textContent = labels[key] || key;
    button.setAttribute('aria-label', `${labels[key] || key} colour ${hex}`);
  });
  els.hypePendantColourSection?.classList.toggle('hidden', !hasLogoPendant);
  if (els.hypePendantColourRow) {
    if (!hasLogoPendant) {
      els.hypePendantColourRow.innerHTML = '';
    } else {
      const colours = getHypePendantColours();
      const casingHex = getHypePendantBodyColour();
      const casingButton = `
        <button class="hype-colour-chip hype-casing-colour-chip" type="button" data-hype-pendant-casing aria-label="Pendant backing sides and hook colour ${casingHex}" title="Pendant backing, sides, and hook">
          <i data-pendant-casing-colour="${casingHex}" style="background:${casingHex}"></i>
        </button>
      `;
      const logoButtons = colours.length
        ? colours.map((hex, index) => {
          const label = getHypePendantColourLabel(index);
          return `
            <button class="hype-colour-chip" type="button" data-hype-pendant-colour="${index}" aria-label="Pendant colour ${label} ${hex}">
              <i data-pendant-colour="${hex}" style="background:${hex}"></i>
            </button>
          `;
        }).join('')
        : '<span class="used-empty">Upload logo colours will appear here.</span>';
      els.hypePendantColourRow.innerHTML = casingButton + logoButtons;
      els.hypePendantColourRow.querySelector('[data-hype-pendant-casing]')?.addEventListener('click', (event) => {
        openHypeColourPopover('pendantCasing', event.currentTarget);
        setPopoverTab('used');
      });
      els.hypePendantColourRow.querySelectorAll('[data-hype-pendant-colour]').forEach((button) => {
        button.addEventListener('click', () => openHypePendantColourPopover(Number(button.dataset.hypePendantColour), button));
      });
    }
  }
}

function getDefaultHypeLinkCount(chainLength) {
  return normalizeHypeChainLength(chainLength) === 'Youth' ? 25 : 27;
}

function normalizeHypeLinkCount(value) {
  return clamp(Math.round(Number(value) || 27), 25, 27);
}

function getHypeLinkCount(chainLength, explicitCount) {
  return normalizeHypeLinkCount(explicitCount || getDefaultHypeLinkCount(chainLength));
}

function normalizeHypeChainLength(chainLength) {
  if (chainLength === 'Short' || chainLength === 'Children' || chainLength === 'Youth') return 'Youth';
  return 'Adult';
}

function getHypePatternLength(value = state.hype.patternLength) {
  return clamp(Math.round(Number(value) || 2), 1, 3);
}

function syncHypeDerivedColours() {
  state.hype.patternLength = getHypePatternLength();
  state.hype.primary = normalizeHex(state.hype.primary || '#111111');
  state.hype.secondary = normalizeHex(state.hype.secondary || '#ffc529');
  state.hype.tertiary = normalizeHex(state.hype.tertiary || '#ffffff');
  state.hype.pendant = normalizeHex(state.hype.pendant || '#202326');
  state.hype.pendantCasing = normalizeHex(state.hype.pendantCasing || state.hype.pendant || '#202326');
  state.hype.pendantSourceColours = (state.hype.pendantSourceColours || []).map((hex) => normalizeHex(hex));
  state.hype.pendantColours = (state.hype.pendantColours || []).map((hex) => normalizeHex(hex));
  state.hype.pendantColourLabels = Array.isArray(state.hype.pendantColourLabels) ? state.hype.pendantColourLabels : [];
  state.hype.accent = state.hype.primary;
  state.hype.border = state.hype.primary;
  state.hype.chainLength = normalizeHypeChainLength(state.hype.chainLength);
  state.hype.linkCount = getDefaultHypeLinkCount(state.hype.chainLength);
  syncHypeSpinnerConfig();
}

function syncHypeSpinnerConfig() {
  state.hype.spinner = normalizeHypeSpinnerConfig(state.hype.spinner);
  return state.hype.spinner;
}

function normalizeHypeSpinnerConfig(value = {}) {
  const defaults = DEFAULT_HYPE_SPINNER_CONFIG;
  return {
    topText: sanitizeHypeSpinnerText(value.topText, defaults.topText),
    bottomText: sanitizeHypeSpinnerText(value.bottomText, defaults.bottomText),
    ringColor: normalizeHex(value.ringColor || defaults.ringColor),
    textColor: normalizeHex(value.textColor || defaults.textColor),
    baseColor: normalizeHex(value.baseColor || defaults.baseColor),
    fontFamily: normalizeHypeSpinnerFontFamily(value.fontFamily || defaults.fontFamily),
    ringDiameter: defaults.ringDiameter,
    ringThickness: defaults.ringThickness,
    ringClearance: defaults.ringClearance,
  };
}

function sanitizeHypeSpinnerText(value, fallback) {
  const text = String(value || '').replace(/\s+/g, ' ').trim().slice(0, 18);
  return text || fallback;
}

function normalizeHypeSpinnerFontFamily(value) {
  const font = String(value || '').trim();
  return HYPE_SPINNER_FONT_OPTIONS.includes(font) ? font : DEFAULT_HYPE_SPINNER_CONFIG.fontFamily;
}

function getHypePendantColours() {
  const sourceColours = state.hype.pendantSourceColours || [];
  if (!sourceColours.length) return [];
  if (!Array.isArray(state.hype.pendantColours)) state.hype.pendantColours = [];
  state.hype.pendantColours = sourceColours.map((sourceHex, index) => normalizeHex(state.hype.pendantColours[index] || sourceHex));
  return state.hype.pendantColours;
}

function getHypePendantColourLabel(index) {
  return state.hype.pendantColourLabels?.[index] || String(index + 1);
}

function getHypePendantFrontEdgeColour(processed = state.processed) {
  if (!processed?.alphaMask || !processed?.regionIndex || !processed?.colours?.length) return '';
  const width = Number(processed.width) || 0;
  const height = Number(processed.height) || 0;
  if (width <= 0 || height <= 0) return '';
  const counts = new Map();
  const visible = (x, y) => x >= 0 && y >= 0 && x < width && y < height && processed.alphaMask[y * width + x];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (!processed.alphaMask[index]) continue;
      if (
        visible(x - 1, y)
        && visible(x + 1, y)
        && visible(x, y - 1)
        && visible(x, y + 1)
      ) {
        continue;
      }
      const colourIndex = processed.regionIndex[index];
      const region = processed.colours[colourIndex];
      if (!region || region.isFloatingSupport) continue;
      const hex = normalizeHex(getDisplayColour(colourIndex, region.hex));
      counts.set(hex, (counts.get(hex) || 0) + 1);
    }
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return ranked.length ? normalizeHex(ranked[0][0]) : '';
}

function getHypePatternColours() {
  syncHypeDerivedColours();
  const colours = [state.hype.primary];
  if (state.hype.patternLength >= 2) colours.push(state.hype.secondary);
  if (state.hype.patternLength >= 3) colours.push(state.hype.tertiary);
  return colours.map((hex) => normalizeHex(hex));
}

function applyHypePendantColoursToChain() {
  const fallback = ['#d6001c', '#0057b8', '#ffc529'];
  const logoColours = getTopHypeLogoColours(3);
  const ranked = logoColours.length ? logoColours : getRankedPendantChainColours().map((item) => item.hex);
  const colours = uniqueHexColours(ranked);
  const chainColours = [0, 1, 2].map((index) => normalizeHex(
    colours[index] || colours[index % Math.max(1, colours.length)] || fallback[index],
  ));
  state.hype.primary = chainColours[0];
  state.hype.secondary = chainColours[1];
  state.hype.tertiary = chainColours[2];
  syncHypeDerivedColours();
  applyHypeStateToControls();
  renderHypeColourControls();
}

function applyHypeLogoColoursToSpinner() {
  const colours = getTopHypeLogoColours(3);
  if (!colours.length) return;
  const spinner = syncHypeSpinnerConfig();
  spinner.ringColor = normalizeHex(colours[0]);
  spinner.textColor = normalizeHex(colours[1] || getReadableSpinnerTextColourForRing(colours[0]));
  spinner.baseColor = normalizeHex(colours[2] || colours[0]);
  state.hype.spinner = normalizeHypeSpinnerConfig(spinner);
}

function getTopHypeLogoColours(limit = 3) {
  const processedColours = (state.processed?.colours || [])
    .map((region, index) => ({
      hex: normalizeHex(getDisplayColour(index, region.hex)),
      count: Number(region.count) || 0,
      index,
      isFloatingSupport: Boolean(region.isFloatingSupport),
    }))
    .filter((item) => !item.isFloatingSupport);
  const fallbackColours = (state.hype.pendantSourceColours || []).map((hex, index) => ({
    hex: normalizeHex(hex),
    count: Math.max(1, limit - index),
    index,
    isFloatingSupport: false,
  }));
  const source = processedColours.length ? processedColours : fallbackColours;
  const merged = new Map();
  source.forEach((item) => {
    const existing = merged.get(item.hex);
    if (existing) {
      existing.count += item.count;
      existing.index = Math.min(existing.index, item.index);
    } else {
      merged.set(item.hex, { ...item });
    }
  });
  return [...merged.values()]
    .sort((a, b) => (b.count - a.count) || (a.index - b.index))
    .slice(0, limit)
    .map((item) => normalizeHex(item.hex));
}

function getReadableSpinnerTextColourForRing(ringHex) {
  const [r, g, b] = hexToRgb(normalizeHex(ringHex));
  const luma = (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
  return luma > 150 ? '#000000' : '#ffffff';
}

function applyHypeStateToControls() {
  syncHypeSpinnerConfig();
  document.querySelectorAll('[data-hype-variant]').forEach((button) => {
    button.classList.toggle('active', button.dataset.hypeVariant === state.hype.variant);
  });
  document.querySelectorAll('[data-hype-variant-tab]').forEach((button) => {
    const active = state.productType === 'hype' && button.dataset.hypeVariantTab === state.hype.variant;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  renderHypeVariantAccess();
  if (els.hypePrimaryColour) els.hypePrimaryColour.value = normalizeHex(state.hype.primary);
  if (els.hypeSecondaryColour) els.hypeSecondaryColour.value = normalizeHex(state.hype.secondary);
  if (els.hypeTertiaryColour) els.hypeTertiaryColour.value = normalizeHex(state.hype.tertiary);
  if (els.hypeAccentColour) els.hypeAccentColour.value = normalizeHex(state.hype.primary);
  if (els.hypePendantColour) els.hypePendantColour.value = getHypePendantBodyColour();
  if (els.hypeBorderColour) els.hypeBorderColour.value = normalizeHex(state.hype.primary);
  if (els.hypePendantText) els.hypePendantText.value = state.hype.text;
  if (els.hypePatternLength) els.hypePatternLength.value = String(getHypePatternLength());
  if (els.hypeChainLength) els.hypeChainLength.value = state.hype.chainLength;
  if (els.hypeQuantity) els.hypeQuantity.value = String(state.hype.quantity);
  applyHypeSpinnerStateToControls();
  renderHypeColourControls();
}

function renderHypeVariantAccess() {
  document.querySelectorAll('[data-hype-variant]').forEach((button) => {
    button.classList.remove('locked');
    button.setAttribute('aria-disabled', 'false');
    button.removeAttribute('aria-describedby');
    const lock = button.querySelector('.spinner-lock');
    if (lock) lock.hidden = true;
    button.classList.toggle('active', button.dataset.hypeVariant === state.hype.variant);
  });
}

function applyHypeSpinnerStateToControls() {
  const spinner = syncHypeSpinnerConfig();
  const enabled = state.hype.variant === 'spinner';
  const spinState = state.hypeThree?.spinnerSpinState;
  const isSpinning = Boolean(spinState?.isSpinning);
  const isReady = Boolean(enabled && state.hypeThree?.spinnerRingGroup);
  const isLoading = Boolean(enabled && !isReady);
  els.hypeSpinnerSection?.classList.toggle('hidden', !enabled);
  if (els.hypeSpinnerTopText) els.hypeSpinnerTopText.value = spinner.topText;
  if (els.hypeSpinnerBottomText) els.hypeSpinnerBottomText.value = spinner.bottomText;
  if (els.hypeSpinnerFontFamily) els.hypeSpinnerFontFamily.value = spinner.fontFamily;
  updateHypeSpinnerFontPicker(spinner.fontFamily);
  if (els.hypeSpinnerRingColor) els.hypeSpinnerRingColor.value = spinner.ringColor;
  if (els.hypeSpinnerTextColor) els.hypeSpinnerTextColor.value = spinner.textColor;
  if (els.hypeSpinnerBaseColor) els.hypeSpinnerBaseColor.value = spinner.baseColor;
  document.querySelectorAll('[data-hype-spinner-colour]').forEach((button) => {
    const key = button.dataset.hypeSpinnerColour;
    const hex = normalizeHex(spinner[key] || '#ffffff');
    const label = key === 'textColor' ? 'Text' : key === 'baseColor' ? 'Base' : 'Ring';
    const swatch = button.querySelector('i');
    if (swatch) swatch.style.background = hex;
    button.setAttribute('aria-label', `${label} colour ${hex}`);
    button.title = `${label} colour ${hex}`;
  });
  if (els.hypeSpinnerRingDiameter) els.hypeSpinnerRingDiameter.value = String(spinner.ringDiameter);
  if (els.hypeSpinnerRingThickness) els.hypeSpinnerRingThickness.value = String(spinner.ringThickness);
  if (els.hypeSpinnerRingClearance) els.hypeSpinnerRingClearance.value = String(spinner.ringClearance);
  if (els.hypeSpinnerSpinPreviewToggle) {
    els.hypeSpinnerSpinPreviewToggle.classList.toggle('hidden', !enabled);
    els.hypeSpinnerSpinPreviewToggle.classList.toggle('is-spinning', isSpinning);
    els.hypeSpinnerSpinPreviewToggle.classList.toggle('is-loading', isLoading);
    els.hypeSpinnerSpinPreviewToggle.disabled = !enabled || !isReady || isSpinning;
    els.hypeSpinnerSpinPreviewToggle.setAttribute('aria-label', isLoading ? 'Spinner ring loading' : isSpinning ? 'Spinner ring is spinning' : 'Spin');
    els.hypeSpinnerSpinPreviewToggle.title = isLoading ? 'Loading...' : isSpinning ? 'Spinning...' : 'Spin';
    const label = els.hypeSpinnerSpinPreviewToggle.querySelector('.hype-spinner-spin-label');
    if (label) label.textContent = 'SPIN';
  }
  if (els.hypeSpinnerStatus) {
    els.hypeSpinnerStatus.textContent = isLoading ? 'Loading...' : isSpinning ? 'Spinning...' : 'Ready to spin';
  }
}

function updateHypeSpinnerFontPicker(fontFamily = syncHypeSpinnerConfig().fontFamily) {
  const font = normalizeHypeSpinnerFontFamily(fontFamily);
  requestHypeSpinnerFont(font);
  if (els.hypeSpinnerFontButtonText) {
    els.hypeSpinnerFontButtonText.textContent = font;
    els.hypeSpinnerFontButtonText.style.fontFamily = getHypeSpinnerFontStack(font);
  }
  els.hypeSpinnerFontMenu?.querySelectorAll('[data-hype-spinner-font]').forEach((button) => {
    const selected = button.dataset.hypeSpinnerFont === font;
    button.setAttribute('aria-selected', selected ? 'true' : 'false');
  });
}

function setHypeSpinnerFontMenuOpen(open) {
  if (!els.hypeSpinnerFontMenu || !els.hypeSpinnerFontButton) return;
  els.hypeSpinnerFontMenu.classList.toggle('hidden', !open);
  els.hypeSpinnerFontButton.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function setupHypeDrag() {
  if (!els.hypePreview || !els.hypeChainRender) return;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let activePointerId = null;
  let velocityX = 0;
  let velocityY = 0;
  const stop = () => {
    if (!dragging) return;
    dragging = false;
    activePointerId = null;
    els.hypeChainRender.classList.remove('dragging');
    velocityX = 0;
    velocityY = 0;
  };
  els.hypePreview.addEventListener('pointerdown', (event) => {
    if (state.productType !== 'hype') return;
    if (state.previewTouchGestureActive || (event.pointerType === 'touch' && event.isPrimary === false)) return;
    if (event.pointerType === 'mouse' && Number.isFinite(event.button) && event.button > 0) return;
    event.preventDefault();
    event.stopPropagation();
    dragging = true;
    activePointerId = event.pointerId;
    lastX = event.clientX;
    lastY = event.clientY;
    velocityX = 0;
    velocityY = 0;
    els.hypeChainRender.classList.add('dragging');
    try {
      els.hypePreview.setPointerCapture(event.pointerId);
    } catch {
      // Some synthetic or interrupted touch streams do not have an active pointer to capture.
    }
  });
  const move = (event) => {
    if (!dragging) return;
    if (state.previewTouchGestureActive) {
      stop();
      return;
    }
    if (activePointerId !== null && event.pointerId !== undefined && event.pointerId !== activePointerId) return;
    if (event.pointerType === 'mouse' && event.buttons && !(event.buttons & 1)) {
      stop();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    velocityX = dx * 0.42;
    velocityY = dy * 0.36;
    state.hype.rotation.y += velocityX;
    state.hype.rotation.x -= velocityY;
    updateHypeCssRotation();
    updateHypeThreeRotation();
  };
  els.hypePreview.addEventListener('pointermove', move);
  els.hypePreview.addEventListener('pointerup', stop);
  els.hypePreview.addEventListener('pointercancel', stop);
  els.hypePreview.addEventListener('lostpointercapture', stop);
  els.hypePreview.addEventListener('contextmenu', (event) => {
    if (state.productType !== 'hype') return;
    event.preventDefault();
  });
  window.addEventListener('pointerup', stop);
  window.addEventListener('pointercancel', stop);
}

async function loadDefaultHypeChainProject() {
  state.hypeDefaultProjectLoading = true;
  try {
    const project = await loadJsonWithScriptFallback(
      DEFAULT_HYPE_CHAIN_PROJECT_SRC,
      DEFAULT_HYPE_CHAIN_PROJECT_SCRIPT_SRC,
      'SIGN_GUY_DEFAULT_HYPE_CHAIN_PROJECT',
      'Default Hype Chain project',
    );
    validateSignGuyProject(project);
    restoreHypeChainProject(project, { isExampleProject: true });
    setStatus('Ready');
  } catch (error) {
    console.error('Could not load default Hype Chain project', error);
  } finally {
    state.hypeDefaultProjectLoading = false;
  }
}

function completeHypeLogoImport() {
  const sourceName = state.fileName || 'hype-chain-logo.png';
  const pendantArtwork = createHypePendantArtworkFromProcessed(state.processed);
  const dataUrl = pendantArtwork?.dataUrl || renderMappedArtworkUrl(state.processed) || state.processed?.artworkUrl || state.artwork?.dataUrl || '';
  const pendantSourceColours = (state.processed?.colours || []).map((region, index) => getDisplayColour(index, region.hex));
  const pendantColourLabels = (state.processed?.colours || []).map((region, index) => (region.isFloatingSupport ? 'S' : String(index + 1)));
  const processedWidth = Number(pendantArtwork?.width || state.processed?.width || state.artwork?.image?.naturalWidth || state.artwork?.image?.width);
  const processedHeight = Number(pendantArtwork?.height || state.processed?.height || state.artwork?.image?.naturalHeight || state.artwork?.image?.height);
  state.hype.logoFileName = sourceName;
  state.hype.logoDataUrl = dataUrl;
  state.hype.isExampleProject = false;
  state.hype.pendantBaseDataUrl = dataUrl;
  state.hype.logoAspect = processedWidth > 0 && processedHeight > 0 ? clamp(processedWidth / processedHeight, 0.35, 2.4) : 1;
  state.hype.pendantSourceColours = pendantSourceColours.map((hex) => normalizeHex(hex));
  state.hype.pendantColours = state.hype.pendantSourceColours.map((hex) => normalizeHex(hex));
  state.hype.pendantColourLabels = pendantColourLabels;
  state.hype.pendantRegionShapes = buildHypePendantRegionShapes(state.processed, pendantArtwork?.bounds);
  state.hype.pendantCasing = normalizeHex(
    getHypePendantFrontEdgeColour(state.processed)
    || state.hype.pendantSourceColours[0]
    || state.hype.pendant
    || '#202326',
  );
  applyHypePendantColoursToChain();
  applyHypeLogoColoursToSpinner();
  restoreLedUploadState();
  state.hype.rotation = getDefaultHypePreviewRotation();
  state.previewZoom = getDefaultProductPreviewZoom();
  state.previewPan = { x: 0, y: 0 };
  applyHypeStateToControls();
  selectProductType('hype');
  scheduleHypeRender(40);
  updateProjectControls();
  setStatus('Hype logo ready');
}

function createHypePendantArtworkFromProcessed(processed) {
  if (!processed?.artworkCanvas) return null;
  const source = state.frontColoursCustomized ? createMappedArtworkCanvas(processed) : processed.artworkCanvas;
  const trimmed = trimCanvasToVisibleAlpha(source, 20);
  return {
    canvas: trimmed.canvas,
    dataUrl: trimmed.canvas.toDataURL('image/png'),
    width: trimmed.canvas.width,
    height: trimmed.canvas.height,
    bounds: trimmed.bounds,
  };
}

function buildHypePendantRegionShapes(processed, bounds) {
  if (!processed?.colours?.length || !bounds) return [];
  const width = processed.width;
  const height = processed.height;
  const trim = {
    x: clamp(Math.round(bounds.x), 0, width - 1),
    y: clamp(Math.round(bounds.y), 0, height - 1),
    w: clamp(Math.round(bounds.w), 1, width),
    h: clamp(Math.round(bounds.h), 1, height),
  };
  const totalVisible = Math.max(1, trim.w * trim.h);
  const minComponentPixels = Math.max(10, Math.round(totalVisible * 0.00022));
  return processed.colours.map((region, regionIndex) => {
    const mask = new Uint8Array(trim.w * trim.h);
    for (let y = 0; y < trim.h; y += 1) {
      for (let x = 0; x < trim.w; x += 1) {
        const sourceIndex = (trim.y + y) * width + trim.x + x;
        if (processed.alphaMask?.[sourceIndex] && processed.regionIndex?.[sourceIndex] === regionIndex) {
          mask[y * trim.w + x] = 1;
        }
      }
    }
    const components = getBinaryMaskComponents(mask, trim.w, trim.h, minComponentPixels)
      .slice(0, 42)
      .map((component) => {
        const componentMask = new Uint8Array(mask.length);
        component.pixels.forEach((index) => {
          componentMask[index] = 1;
        });
        const outline = traceMaskOutline(componentMask, trim.w, trim.h);
        if (outline.length < 8) return null;
        const smoothed = smoothPolygon(outline, 1);
        const simplified = simplifyPolygon(smoothed, Math.max(0.85, Math.max(trim.w, trim.h) / 700));
        return simplified.slice(0, 140).map(([x, y]) => [
          clamp(x / trim.w, 0, 1),
          clamp(y / trim.h, 0, 1),
        ]);
      })
      .filter(Boolean);
    return {
      colourIndex: regionIndex,
      hex: normalizeHex(region.hex),
      components,
    };
  }).filter((region) => region.components.length);
}

async function rebuildHypePendantLogoDataUrl() {
  const baseUrl = state.hype.pendantBaseDataUrl || state.hype.logoDataUrl;
  const sourceColours = state.hype.pendantSourceColours || [];
  const targetColours = getHypePendantColours();
  if (!baseUrl || !sourceColours.length || !targetColours.length) {
    scheduleHypeRender(0);
    return;
  }
  const image = await loadImage(baseUrl);
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const sourceRgb = sourceColours.map((hex) => hexToRgb(hex));
  const targetRgb = targetColours.map((hex) => hexToRgb(hex));
  for (let i = 0; i < frame.data.length; i += 4) {
    if (frame.data[i + 3] < 8) continue;
    let bestIndex = 0;
    let bestDistance = Infinity;
    for (let colourIndex = 0; colourIndex < sourceRgb.length; colourIndex += 1) {
      const distance = colourDistance(
        [frame.data[i], frame.data[i + 1], frame.data[i + 2]],
        sourceRgb[colourIndex],
      );
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = colourIndex;
      }
    }
    const rgb = targetRgb[bestIndex] || targetRgb[0];
    frame.data[i] = rgb[0];
    frame.data[i + 1] = rgb[1];
    frame.data[i + 2] = rgb[2];
  }
  ctx.putImageData(frame, 0, 0);
  state.hype.logoDataUrl = canvas.toDataURL('image/png');
  scheduleHypeRender(0);
}

function openHypeColourPopover(part, anchor) {
  state.selectedColourTarget = { type: 'hype', part };
  const hex = normalizeHex(state.hype[part] || '#ffffff');
  updatePopoverInputs(hex);
  positionColourPopover(anchor);
  renderUsedColourGrid();
  setPopoverTab('preset');
}

function openHypeSpinnerColourPopover(part, anchor) {
  const spinner = syncHypeSpinnerConfig();
  state.selectedColourTarget = { type: 'hypeSpinner', part };
  const hex = normalizeHex(spinner[part] || '#ffffff');
  updatePopoverInputs(hex);
  positionColourPopover(anchor);
  renderUsedColourGrid();
  setPopoverTab('used');
}

function openHypePendantColourPopover(index, anchor) {
  const colours = getHypePendantColours();
  state.selectedColourTarget = { type: 'hypePendant', index };
  const hex = normalizeHex(colours[index] || '#ffffff');
  updatePopoverInputs(hex);
  positionColourPopover(anchor);
  renderUsedColourGrid();
  setPopoverTab('used');
}

function collectHypePendantUsedColours() {
  const colours = [];
  const add = (value) => {
    const normalized = normalizeUsedColour(value);
    if (normalized && !colours.includes(normalized)) colours.push(normalized);
  };
  add(state.hype.pendantCasing);
  add(state.hype.pendant);
  (state.hype.pendantColours || []).forEach(add);
  (state.hype.pendantSourceColours || []).forEach(add);
  getHypePendantColours().forEach(add);
  els.hypePendantColourRow?.querySelectorAll('[data-hype-pendant-casing], [data-hype-pendant-colour]').forEach((button) => {
    add(button.getAttribute('aria-label'));
    const dot = button.querySelector('i');
    add(dot?.dataset?.pendantColour);
    add(dot?.dataset?.pendantCasingColour);
    add(button.getAttribute('style'));
    add(dot?.getAttribute('style'));
    add(dot?.style.background || dot?.style.backgroundColor);
    add(dot ? window.getComputedStyle(dot).backgroundColor : '');
  });
  return colours;
}

function hasOrderableHypeLogo() {
  return Boolean(state.hype.logoDataUrl && !state.hype.isExampleProject);
}

async function saveHypeChainProjectFile() {
  setStatus('Saving');
  els.saveProject.disabled = true;
  try {
    cancelHypeSpinnerSpin();
    queueEmailMarketingSubscription(state.customerEmail);
    const project = await buildHypeChainProject({ forceNewId: true });
    state.projectId = project.id;
    if (isLocalTesting()) {
      if (state.isAdmin) downloadProjectPayload(project);
    } else {
      await uploadProjectFolder(project);
    }
    try {
      await saveProjectRecord(project);
      await refreshProjectLog();
    } catch (storageError) {
      console.warn(storageError);
    }
    els.projectNote.textContent = isLocalTesting() && !state.isAdmin ? '' : `${project.name} saved.`;
    setStatus('Saved');
    trackSignStudioEvent('save_design', {
      product_type: 'hype',
      save_destination: isLocalTesting() ? 'local' : 'server',
    });
  } catch (error) {
    console.error(error);
    els.projectNote.textContent = 'Could not save this Hype Chain design.';
    setStatus('Save failed');
  } finally {
    updateProjectControls();
  }
}

async function placeHypeChainOrder() {
  if (!hasOrderableHypeLogo() || !state.customerEmail) {
    updateProjectControls();
    return;
  }
  setStatus('Preparing order');
  closeOnboarding();
  clearCheckoutFallback();
  state.orderInProgress = true;
  els.placeOrder.disabled = true;
  els.placeOrder.textContent = 'Placing Order...';
  syncMobileCommandBar();
  try {
    queueEmailMarketingSubscription(state.customerEmail);
    const project = await buildHypeChainProject();
    const localOrder = isLocalTesting();
    const screenshots = await captureHypeSubmissionScreenshots();
    const uploadResult = localOrder
      ? { ok: true, localTesting: true, emailSent: false }
      : await uploadProjectFolder(project, {
        screenshots,
        sendOrderEmail: true,
        subject: makeOrderEmailSubject('Hype Chain'),
        message: makeHypeEmailBody('Shopify checkout order started'),
        messageHtml: makeHypeEmailHtml('Shopify checkout order started'),
      });
    if (localOrder) downloadProjectPayload(project);
    try {
      await saveProjectRecord(project);
      await refreshProjectLog();
    } catch (storageError) {
      console.warn(storageError);
    }
    els.submitNote.textContent = localOrder
      ? `${project.name}.SignGuy downloaded for local Hype Chain checkout testing. Email is only sent from the deployed site.`
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

async function buildHypeChainProject(options = {}) {
  syncHypeDerivedColours();
  let screenshotDataUrl = '';
  try {
    const screenshotBlob = await captureHypeVisualizerBlob();
    screenshotDataUrl = await blobToDataUrl(screenshotBlob);
  } catch (error) {
    console.warn('Could not capture Hype Chain preview for save; using logo fallback.', error);
    screenshotDataUrl = state.hype.logoDataUrl || makeHypePlaceholderLogoDataUrl();
  }
  const now = new Date().toISOString();
  const sourceName = state.hype.logoFileName || 'hype-chain-logo.png';
  return {
    type: 'SignGuy.HypeChainStudio',
    version: PROJECT_FILE_VERSION,
    id: options.forceNewId ? makeProjectId() : (state.projectId || makeProjectId()),
    name: `${state.hype.variant === 'spinner' ? 'Spinner' : 'Classic'} Hype Chain`,
    customerEmail: state.customerEmail,
    savedAt: now,
    source: {
      fileName: sourceName,
      artworkType: inferArtworkType(state.hype.logoDataUrl, sourceName) || 'png',
      dataUrl: state.hype.logoDataUrl || makeHypePlaceholderLogoDataUrl(),
      pathCount: 0,
      gradients: 0,
      palette: null,
      hasTransparency: true,
    },
    config: {
      productType: 'hype',
      previewZoom: state.previewZoom,
      previewPan: { ...getPreviewPan() },
      hype: getSerializableHypeConfig(),
    },
    preview: {
      screenshotDataUrl,
      colours: [
        { label: 'Primary chain', display: normalizeHex(state.hype.primary) },
        ...(getHypePatternLength() >= 2 ? [{ label: 'Secondary chain', display: normalizeHex(state.hype.secondary) }] : []),
        ...(getHypePatternLength() >= 3 ? [{ label: 'Tertiary chain', display: normalizeHex(state.hype.tertiary) }] : []),
        { label: 'Connector and attachment', display: normalizeHex(state.hype.primary) },
        { label: 'Pendant backing, sides, and hook', display: getHypePendantBodyColour() },
        ...(state.hype.variant === 'spinner' ? [
          { label: 'Spinner ring', display: syncHypeSpinnerConfig().ringColor },
          { label: 'Spinner ring text', display: syncHypeSpinnerConfig().textColor },
          { label: 'Spinner base', display: syncHypeSpinnerConfig().baseColor },
        ] : []),
      ],
      details: {
        style: state.hype.variant === 'spinner' ? 'Spinner' : 'Classic',
        patternLength: getHypePatternLength(),
        chainLength: state.hype.chainLength,
        linkCount: getHypeLinkCount(state.hype.chainLength, state.hype.linkCount),
        quantity: state.hype.quantity,
        ...(state.hype.variant === 'spinner' ? { spinner: getSerializableHypeSpinnerConfig() } : {}),
      },
    },
  };
}

function getSerializableHypeConfig() {
  const spinner = syncHypeSpinnerConfig();
  return {
    variant: state.hype.variant,
    patternLength: getHypePatternLength(),
    primary: normalizeHex(state.hype.primary),
    secondary: normalizeHex(state.hype.secondary),
    tertiary: normalizeHex(state.hype.tertiary),
    accent: normalizeHex(state.hype.accent || state.hype.primary),
    pendant: normalizeHex(state.hype.pendant),
    pendantCasing: getHypePendantBodyColour(),
    pendantColours: getHypePendantColours(),
    pendantSourceColours: (state.hype.pendantSourceColours || []).map((hex) => normalizeHex(hex)),
    pendantColourLabels: (state.hype.pendantColourLabels || []).map((label) => String(label)),
    pendantRegionShapes: sanitizeHypePendantRegionShapes(state.hype.pendantRegionShapes),
    pendantBaseDataUrl: state.hype.pendantBaseDataUrl || '',
    border: normalizeHex(state.hype.border || state.hype.primary),
    text: state.hype.text || 'MVP',
    logoDataUrl: state.hype.logoDataUrl || '',
    logoFileName: state.hype.logoFileName || '',
    logoAspect: clamp(Number(state.hype.logoAspect) || 1, 0.35, 2.4),
    chainLength: normalizeHypeChainLength(state.hype.chainLength),
    linkCount: getHypeLinkCount(state.hype.chainLength, state.hype.linkCount),
    quantity: clamp(Number(state.hype.quantity) || 1, 1, 99),
    finish: state.hype.finish || 'Matte',
    depth: Number(state.hype.depth) || 4,
    borderThickness: Number(state.hype.borderThickness) || 7,
    connector: state.hype.connector || 'Medallion',
    ribbon: state.hype.ribbon || 'Bold',
    spinner: { ...spinner },
    rotation: {
      x: Number(state.hype.rotation?.x) || 0,
      y: Number(state.hype.rotation?.y) || 0,
    },
  };
}

function getSerializableHypeSpinnerConfig() {
  return { ...syncHypeSpinnerConfig() };
}

function restoreHypeChainProject(project, options = {}) {
  const config = project.config || {};
  const hype = project.config?.hype || {};
  const isExampleProject = Boolean(options.isExampleProject);
  state.isDefaultPreview = false;
  state.projectId = project.id || makeProjectId();
  state.fileName = project.source?.fileName || 'hype-chain-logo.png';
  state.designName = project.config?.designName || project.name || '';
  if (!isExampleProject && project.customerEmail && isValidEmail(normalizeEmail(project.customerEmail))) {
    state.customerEmail = normalizeEmail(project.customerEmail);
    localStorage.setItem(EMAIL_STORAGE_KEY, state.customerEmail);
    renderSessionEmail();
    queueEmailMarketingSubscription(state.customerEmail);
  }
  state.uploadedFile = project.source?.dataUrl && !isExampleProject
    ? dataUrlToFile(project.source.dataUrl, state.fileName)
    : null;
  Object.assign(state.hype, {
    variant: hype.variant === 'spinner' ? 'spinner' : 'classic',
    patternLength: getHypePatternLength(hype.patternLength),
    primary: normalizeHex(hype.primary || '#111111'),
    secondary: normalizeHex(hype.secondary || '#ffc529'),
    tertiary: normalizeHex(hype.tertiary || '#ffffff'),
    accent: normalizeHex(hype.primary || hype.accent || '#111111'),
    pendant: normalizeHex(hype.pendant || '#202326'),
    pendantCasing: normalizeHex(hype.pendantCasing || hype.pendant || '#202326'),
    border: normalizeHex(hype.primary || hype.border || '#111111'),
    text: String(hype.text || 'MVP'),
    logoDataUrl: hype.logoDataUrl || project.source?.dataUrl || '',
    isExampleProject,
    logoFileName: project.source?.fileName || '',
    logoAspect: clamp(Number(hype.logoAspect) || 1, 0.35, 2.4),
    pendantBaseDataUrl: hype.pendantBaseDataUrl || project.source?.dataUrl || '',
    pendantSourceColours: Array.isArray(hype.pendantSourceColours) ? hype.pendantSourceColours.map((hex) => normalizeHex(hex)) : [],
    pendantColours: Array.isArray(hype.pendantColours) ? hype.pendantColours.map((hex) => normalizeHex(hex)) : [],
    pendantColourLabels: Array.isArray(hype.pendantColourLabels) ? hype.pendantColourLabels.map((label) => String(label)) : [],
    pendantRegionShapes: sanitizeHypePendantRegionShapes(hype.pendantRegionShapes),
    chainLength: normalizeHypeChainLength(hype.chainLength),
    linkCount: getHypeLinkCount(hype.chainLength, hype.linkCount),
    quantity: clamp(Number(hype.quantity) || 1, 1, 99),
    spinner: normalizeHypeSpinnerConfig(hype.spinner),
    rotation: {
      x: Number.isFinite(Number(hype.rotation?.x)) ? Number(hype.rotation.x) : getDefaultHypePreviewRotation().x,
      y: Number.isFinite(Number(hype.rotation?.y)) ? Number(hype.rotation.y) : getDefaultHypePreviewRotation().y,
    },
  });
  state.previewZoom = clamp(Number(config.previewZoom) || getDefaultProductPreviewZoom(), getPreviewZoomLimits().min, getPreviewZoomLimits().max);
  state.previewPan = clampPreviewPan(config.previewPan || { x: 0, y: 0 });
  renderUploadControl();
  renderPreviewTitle();
  applyHypeStateToControls();
  selectProductType('hype');
  renderHypeChain();
  updateProjectControls();
}

function sanitizeHypePendantRegionShapes(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 8).map((region, fallbackIndex) => ({
    colourIndex: clamp(Number(region?.colourIndex ?? fallbackIndex) || 0, 0, 7),
    hex: normalizeHex(region?.hex || '#ffffff'),
    components: Array.isArray(region?.components)
      ? region.components.slice(0, 42).map((component) => (
        Array.isArray(component)
          ? component.slice(0, 140).map((point) => [
            clamp(Number(point?.[0]) || 0, 0, 1),
            clamp(Number(point?.[1]) || 0, 0, 1),
          ])
          : []
      )).filter((component) => component.length >= 3)
      : [],
  })).filter((region) => region.components.length);
}

async function captureHypeSubmissionScreenshots() {
  const originalRotation = { ...state.hype.rotation };
  const shots = [];
  try {
    shots.push({
      label: 'Current Hype Chain view',
      blob: await captureHypeVisualizerBlob(),
      fileName: `${projectFileBaseName({ type: 'SignGuy.HypeChainStudio', source: { fileName: state.hype.logoFileName }, name: 'hype-chain' })}-current.png`,
    });
    state.hype.rotation = { x: -8, y: 26 };
    renderHypeChain();
    await waitFrame();
    shots.push({
      label: 'Angled Hype Chain view',
      blob: await captureHypeVisualizerBlob(),
      fileName: `${projectFileBaseName({ type: 'SignGuy.HypeChainStudio', source: { fileName: state.hype.logoFileName }, name: 'hype-chain' })}-angled.png`,
    });
  } finally {
    state.hype.rotation = originalRotation;
    renderHypeChain();
  }
  return shots.map((shot) => ({
    ...shot,
    file: new File([shot.blob], shot.fileName, { type: 'image/png' }),
  }));
}

async function captureHypeVisualizerBlob() {
  try {
    return await captureHypeThreeVisualizerBlob();
  } catch (error) {
    console.warn('Could not capture live Hype Chain WebGL preview; using canvas fallback.', error);
  }
  let logoImage = null;
  if (state.hype.logoDataUrl) {
    try {
      logoImage = await loadImage(state.hype.logoDataUrl);
    } catch {
      logoImage = null;
    }
  }
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1400;
    canvas.height = 950;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('The Hype Chain screenshot could not be captured.'));
      return;
    }
    const hype = state.hype;
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#252729');
    gradient.addColorStop(1, '#17191b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const floor = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.78, 10, canvas.width * 0.5, canvas.height * 0.78, canvas.width * 0.42);
    floor.addColorStop(0, 'rgba(255,255,255,0.18)');
    floor.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = floor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height * 0.48);
    ctx.rotate((hype.rotation.y || 0) * Math.PI / 180 * 0.12);
    drawHypeChainCanvas(ctx, hype, canvas.width, canvas.height, logoImage);
    ctx.restore();
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('The Hype Chain screenshot could not be captured.'));
    }, 'image/png');
  });
}

async function captureHypeThreeVisualizerBlob() {
  await ensureHypeThreePreviewReady();
  const source = state.hypeThree?.renderer?.domElement;
  if (!source || !source.width || !source.height) throw new Error('The Hype Chain 3D preview is not ready yet.');
  renderHypeThree();
  await waitFrame();
  renderHypeThree();
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('The Hype Chain screenshot could not be captured.'));
      return;
    }
    drawHypeScreenshotBackground(ctx, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('The Hype Chain screenshot could not be captured.'));
    }, 'image/png');
  });
}

async function ensureHypeThreePreviewReady() {
  if (!state.hype.initialized) initializeHypeChainPreview();
  if (!state.hypeThree) initHypeThreeStage();
  if (!state.hypeThree) throw new Error('The Hype Chain 3D preview is not available.');
  if (state.hype.renderTimer) {
    clearTimeout(state.hype.renderTimer);
    state.hype.renderTimer = null;
  }
  els.hypePreview?.classList.remove('loading');
  await loadHypeStlGeometries();
  resizeHypeThree();
  buildHypeThreeModel();
  applyHypeGroupRotation();
  frameHypeCamera();
  renderHypeThree();
  await waitFrame();
}

function drawHypeScreenshotBackground(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#252729');
  gradient.addColorStop(0.58, '#202223');
  gradient.addColorStop(1, '#17191b');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  const floor = ctx.createRadialGradient(width * 0.5, height * 0.78, 10, width * 0.5, height * 0.78, width * 0.42);
  floor.addColorStop(0, 'rgba(255,255,255,0.18)');
  floor.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = floor;
  ctx.fillRect(0, 0, width, height);
}

function drawHypeChainCanvas(ctx, hype, width, height, logoImage = null) {
  const primary = normalizeHex(hype.primary);
  const border = normalizeHex(hype.border || hype.primary);
  const pendant = normalizeHex(hype.pendantCasing || hype.pendant);
  const connectorColour = primary;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.38)';
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 28;
  const colours = [
    primary,
    ...(getHypePatternLength(hype.patternLength) >= 2 ? [normalizeHex(hype.secondary)] : []),
    ...(getHypePatternLength(hype.patternLength) >= 3 ? [normalizeHex(hype.tertiary)] : []),
  ];
  const sideCount = Math.max(7, Math.floor((getHypeLinkCount(hype.chainLength, hype.linkCount) + 4) / 2));
  for (let side = 0; side < 2; side += 1) {
    const isLeft = side === 0;
    for (let i = 0; i < sideCount; i += 1) {
      const t = sideCount === 1 ? 0 : i / (sideCount - 1);
      const curve = Math.sin(t * Math.PI);
      const xOuter = isLeft ? -width * 0.22 : width * 0.22;
      const xInner = isLeft ? -width * 0.055 : width * 0.055;
      const x = xOuter + (xInner - xOuter) * t + (isLeft ? -1 : 1) * curve * width * 0.02;
      const y = -height * 0.29 + t * height * 0.5 + Math.sin(t * Math.PI * 0.76) * height * 0.045;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((isLeft ? -0.48 : 0.48) + t * (isLeft ? 0.34 : -0.34) + (i % 2 ? Math.PI / 2 : 0));
      ctx.lineWidth = i % 2 ? 18 : 20;
      ctx.strokeStyle = colours[(i + (isLeft ? 0 : 1)) % colours.length];
      roundRect(ctx, -42, -22, 84, 44, 22);
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.shadowBlur = 18;
  ctx.fillStyle = pendant;
  ctx.strokeStyle = connectorColour;
  ctx.lineWidth = 18;
  roundRect(ctx, -104, height * 0.11, 96, 44, 22);
  ctx.stroke();
  roundRect(ctx, 8, height * 0.11, 96, 44, 22);
  ctx.stroke();
  ctx.strokeStyle = connectorColour;
  roundRect(ctx, -28, height * 0.08, 56, 96, 28);
  ctx.stroke();
  ctx.strokeStyle = connectorColour;
  roundRect(ctx, -24, height * 0.18, 48, 82, 24);
  ctx.stroke();
  ctx.fillStyle = pendant;
  ctx.strokeStyle = border;
  roundRect(ctx, -78, height * 0.2, 156, 74, 30);
  ctx.lineWidth = 14;
  ctx.stroke();
  ctx.save();
  ctx.fillStyle = '#111313';
  ctx.beginPath();
  ctx.arc(0, height * 0.23, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  const pendantW = width * 0.27;
  const pendantH = height * 0.2;
  ctx.shadowBlur = 0;
  if (logoImage) {
    const logoMaxW = pendantW * 1.08;
    const logoMaxH = pendantH * 1.08;
    const ratio = Math.min(logoMaxW / logoImage.naturalWidth, logoMaxH / logoImage.naturalHeight, 1);
    const logoW = logoImage.naturalWidth * ratio;
    const logoH = logoImage.naturalHeight * ratio;
    ctx.drawImage(logoImage, -logoW / 2, height * 0.24 + pendantH / 2 - logoH / 2, logoW, logoH);
  } else {
    roundRect(ctx, -pendantW / 2, height * 0.24, pendantW, pendantH, 34);
    ctx.fill();
    ctx.lineWidth = 14;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.max(42, width * 0.055)}px Inter, Arial, sans-serif`;
    ctx.fillText((hype.text || 'MVP').slice(0, 18), 0, height * 0.24 + pendantH / 2);
  }
  ctx.restore();
}

function makeHypeEmailBody(context = 'Design submission') {
  const hype = state.hype;
  const spinner = syncHypeSpinnerConfig();
  return [
    'Hype Chain request',
    '',
    `Context: ${context}`,
    `Customer email: ${state.customerEmail || 'Not provided'}`,
    `Style: ${hype.variant === 'spinner' ? 'Spinner' : 'Classic'}`,
    `Uploaded file: ${hype.logoFileName || 'No logo uploaded'}`,
    `Pattern length: ${getHypePatternLength(hype.patternLength)} link${getHypePatternLength(hype.patternLength) === 1 ? '' : 's'}`,
    `Primary chain colour: ${normalizeHex(hype.primary)}`,
    ...(getHypePatternLength(hype.patternLength) >= 2 ? [`Secondary chain colour: ${normalizeHex(hype.secondary)}`] : []),
    ...(getHypePatternLength(hype.patternLength) >= 3 ? [`Tertiary chain colour: ${normalizeHex(hype.tertiary)}`] : []),
    `Connector and attachment colour: ${normalizeHex(hype.primary)}`,
    `Pendant backing sides and hook colour: ${normalizeHex(hype.pendantCasing || hype.pendant)}`,
    `Pendant text: ${hype.text || 'None'}`,
    ...(hype.variant === 'spinner' ? [
      `Spinner top text: ${spinner.topText}`,
      `Spinner bottom text: ${spinner.bottomText}`,
      `Spinner ring font: ${spinner.fontFamily}`,
      `Spinner ring colour: ${spinner.ringColor}`,
      `Spinner text colour: ${spinner.textColor}`,
      `Spinner base colour: ${spinner.baseColor}`,
      `Spinner ring diameter: ${spinner.ringDiameter} mm`,
      `Spinner ring thickness: ${spinner.ringThickness} mm`,
      `Spinner ring clearance: ${spinner.ringClearance} mm`,
    ] : []),
    `Chain length: ${hype.chainLength}`,
    `Quantity requested: ${hype.quantity || 1}`,
    `Render screenshots: current Hype Chain view and angled view`,
  ].join('\n');
}

function makeHypeEmailHtml(context = 'Design submission') {
  const hype = state.hype;
  const patternLength = getHypePatternLength(hype.patternLength);
  const spinner = syncHypeSpinnerConfig();

  const chainColours = [
    { label: 'Primary chain colour', hex: hype.primary },
    ...(patternLength >= 2 ? [{ label: 'Secondary chain colour', hex: hype.secondary }] : []),
    ...(patternLength >= 3 ? [{ label: 'Tertiary chain colour', hex: hype.tertiary }] : []),
  ];

  const pendantColours = getHypePendantColours().map((hex, index) => ({
    label: `Pendant colour ${getHypePendantColourLabel(index)}`,
    hex,
  }));

  return makeOrderEmailHtml({
    title: 'Hype Chain request',
    context,
    logoTitle: 'Uploaded Hype Chain logo',
    details: [
      ['Customer email', state.customerEmail || 'Not provided'],
      ['Style', hype.variant === 'spinner' ? 'Spinner' : 'Classic'],
      ['Uploaded file', hype.logoFileName || 'No logo uploaded'],
      ...(hype.variant === 'spinner' ? [
        ['Top ring text', spinner.topText],
        ['Bottom ring text', spinner.bottomText],
        ['Ring font', spinner.fontFamily],
        ['Ring diameter', `${spinner.ringDiameter} mm`],
        ['Ring thickness', `${spinner.ringThickness} mm`],
        ['Ring clearance', `${spinner.ringClearance} mm`],
      ] : []),
      ['Pattern length', `${patternLength} link${patternLength === 1 ? '' : 's'}`],
      ['Chain length', hype.chainLength],
      ['Quantity requested', String(hype.quantity || 1)],
    ],
    colourSections: [
      {
        title: 'Chain colours',
        colours: [
          ...chainColours,
          { label: 'Connector and attachment colour', hex: hype.primary },
        ],
      },
      {
        title: 'Pendant colours',
        colours: [
          { label: 'Backing, sides, and hook colour', hex: getHypePendantBodyColour() },
          ...pendantColours,
        ],
      },
      ...(hype.variant === 'spinner' ? [{
        title: 'Spinner colours',
        colours: [
          { label: 'Ring colour', hex: spinner.ringColor },
          { label: 'Ring text colour', hex: spinner.textColor },
          { label: 'Base colour', hex: spinner.baseColor },
        ],
      }] : []),
    ],
  });
}

function makeHypePlaceholderLogoDataUrl() {
  const text = encodeURIComponent(state.hype.text || 'MVP');
  const border = normalizeHex(state.hype.primary).replace('#', '%23');
  const pendant = getHypePendantBodyColour().replace('#', '%23');
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 420'%3E%3Crect width='600' height='420' rx='52' fill='${pendant}'/%3E%3Crect x='28' y='28' width='544' height='364' rx='42' fill='none' stroke='${border}' stroke-width='28'/%3E%3Ctext x='300' y='230' text-anchor='middle' font-family='Arial,sans-serif' font-size='128' font-weight='900' fill='white'%3E${text}%3C/text%3E%3C/svg%3E`;
}
