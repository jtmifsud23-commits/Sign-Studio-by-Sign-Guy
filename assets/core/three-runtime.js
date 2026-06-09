// Shared Three.js runtime. Loaded before app.js so app.js can stay focused on core studio orchestration.

function initThreeStage() {
  if (!window.THREE) return;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  if (THREE.ACESFilmicToneMapping) renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.className = 'three-canvas';
  els.stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 1, 1200);
  camera.position.set(0, 10, 430);
  camera.lookAt(0, 0, 0);

  const hemi = new THREE.HemisphereLight(0xe7edf0, 0x111312, 0.82);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xfff7e8, 0.78);
  key.position.set(-190, 260, 330);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x92a2aa, 0.62);
  rim.position.set(220, 110, -250);
  scene.add(rim);

  const floorFill = new THREE.DirectionalLight(0xffecc4, 0.34);
  floorFill.position.set(0, -140, 260);
  scene.add(floorFill);

  const floor = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(760, 440),
    new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.24 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -105, -40);
  floor.receiveShadow = true;
  scene.add(floor);

  state.three = {
    renderer,
    scene,
    camera,
    environmentLights: { hemi, key, rim, floorFill },
    floor,
    group: null,
    floorGroup: null,
    resources: [],
    resizeObserver: null,
    resizeFrame: null,
    resizeWidth: 0,
    resizeHeight: 0,
  };
  applyPreviewEnvironment();
  resizeThree();
  window.addEventListener('resize', scheduleThreeResize);
  if (window.ResizeObserver) {
    state.three.resizeObserver = new ResizeObserver(() => scheduleThreeResize());
    state.three.resizeObserver.observe(els.stage);
  }
  renderThree();
}

function scheduleThreeResize() {
  if (!state.three || state.three.resizeFrame) return;
  state.three.resizeFrame = window.requestAnimationFrame(() => {
    if (!state.three) return;
    state.three.resizeFrame = null;
    resizeThree();
  });
}

function resizeThree() {
  if (!state.three) return;
  const rect = els.stage.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  if (state.three.resizeWidth === width && state.three.resizeHeight === height) return;
  state.three.resizeWidth = width;
  state.three.resizeHeight = height;
  state.three.renderer.setSize(width, height, false);
  state.three.camera.aspect = width / height;
  applyPreviewZoom();
  updateThreeModelPosition();
  state.three.camera.updateProjectionMatrix();
  renderThree();
}

function renderThree() {
  if (!state.three) return;
  state.three.renderer.render(state.three.scene, state.three.camera);
}

function clearThreeModel() {
  if (!state.three) return;
  if (!state.three.group && !state.three.floorGroup && !state.three.resources.length) return;
  if (state.three.group) state.three.scene.remove(state.three.group);
  if (state.three.floorGroup) state.three.scene.remove(state.three.floorGroup);
  state.three.resources.forEach((resource) => {
    if (resource?.dispose) resource.dispose();
  });
  state.three.group = null;
  state.three.floorGroup = null;
  state.three.resources = [];
  renderThree();
}

function updateThreeModelPosition() {
  if (!state.three?.group) return;
  const bounds = state.three.group.userData?.bounds;
  const pan = getPreviewPan();
  state.three.group.position.x = pan.x * 0.36;
  state.three.group.position.y = getThreeModelYOffset(bounds) - pan.y * 0.36;
  if (state.three.floorGroup && bounds) {
    state.three.floorGroup.userData.floorY = state.three.group.position.y + bounds.minY;
    updateFloorEffects();
  }
}

function getThreeModelYOffset(bounds = null) {
  if (state.productType === 'plaque' && isMobilePreviewViewport() && bounds) {
    const safePlaqueOffset = getMobilePlaqueSafeModelYOffset(bounds);
    if (Number.isFinite(safePlaqueOffset)) return safePlaqueOffset;
  }
  const plaqueMobileLift = state.productType === 'plaque' && isMobilePreviewViewport() ? 0 : 0;
  if (!bounds) return (isResponsiveViewport() ? -26 : 10) + plaqueMobileLift;
  const floorY = isResponsiveViewport() ? -68 : -74;
  return floorY - bounds.minY + plaqueMobileLift;
}

function getMobilePlaqueSafeFrame() {
  if (state.productType !== 'plaque' || !isMobilePreviewViewport() || !els.stage) return null;
  const stageRect = els.stage.getBoundingClientRect();
  if (!stageRect.width || !stageRect.height) return null;
  const ribbonRect = els.stage.querySelector('.stage-ribbon')?.getBoundingClientRect?.();
  const trayVisible = els.plaqueVisualLayerTray && !els.plaqueVisualLayerTray.hidden;
  const trayRect = trayVisible ? els.plaqueVisualLayerTray.getBoundingClientRect() : null;
  const commandRect = els.mobileCommandBar?.getBoundingClientRect?.();
  const margin = clamp(stageRect.height * 0.018, 10, 18);
  const top = Math.max(0, ribbonRect ? ribbonRect.bottom - stageRect.top : 0) + margin;
  const fallbackBottom = commandRect ? commandRect.top - stageRect.top : stageRect.height;
  const bottomAnchor = trayRect ? trayRect.top - stageRect.top : fallbackBottom;
  const bottom = Math.min(stageRect.height, bottomAnchor) - margin;
  if (!Number.isFinite(top) || !Number.isFinite(bottom) || bottom - top < 110) return null;
  return {
    top,
    bottom,
    height: bottom - top,
    centerY: (top + bottom) / 2,
    stageHeight: stageRect.height,
  };
}

function getMobilePlaqueCameraDistanceScale(bounds = state.three?.group?.userData?.bounds) {
  if (state.productType !== 'plaque' || !isMobilePreviewViewport() || !bounds || !state.three?.camera) return 1;
  const frame = getMobilePlaqueSafeFrame();
  if (!frame) return 1;
  const zoom = clamp(Number(state.previewZoom) || 1, MOBILE_PREVIEW_ZOOM_MIN, MOBILE_PREVIEW_ZOOM_MAX);
  const baseDistance = 430 / zoom;
  const visibleHeightWorld = 2 * baseDistance * Math.tan(THREE.Math.degToRad(state.three.camera.fov) / 2);
  const safeHeightWorld = (frame.height / frame.stageHeight) * visibleHeightWorld;
  const modelHeight = Math.max(1, Number(bounds.maxY) - Number(bounds.minY));
  const paddedModelHeight = modelHeight * 1.12;
  if (!Number.isFinite(safeHeightWorld) || safeHeightWorld <= 0) return 1;
  return clamp(paddedModelHeight / safeHeightWorld, 1, 1.75);
}

function getMobilePlaqueSafeModelYOffset(bounds) {
  const frame = getMobilePlaqueSafeFrame();
  if (!frame || !state.three?.camera || !bounds) return NaN;
  const visibleHeightWorld = 2 * state.three.camera.position.z * Math.tan(THREE.Math.degToRad(state.three.camera.fov) / 2);
  const worldPerPixel = visibleHeightWorld / frame.stageHeight;
  const desiredCenterWorldY = (frame.stageHeight / 2 - frame.centerY) * worldPerPixel;
  const modelCenterY = ((Number(bounds.minY) || 0) + (Number(bounds.maxY) || 0)) / 2;
  return desiredCenterWorldY - modelCenterY;
}

function isThreeVector2Like(value) {
  return value && Number.isFinite(value.x) && Number.isFinite(value.y) && !Number.isFinite(value.z);
}

function getThreePointBounds(points) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    minX,
    maxX,
    minY,
    maxY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

function silhouetteToThreePoints(points, bounds, scale = 1) {
  return points.map(([x, y]) => new THREE.Vector2((x - 0.5) * bounds.width * scale, (0.5 - y) * bounds.height * scale));
}

function makeThreeShape(points, options = {}) {
  const shape = new THREE.Shape();
  points.forEach((point, idx) => {
    if (idx === 0) shape.moveTo(point.x, point.y);
    else if (!options.curved) shape.lineTo(point.x, point.y);
  });
  if (options.curved && points.length > 2) shape.splineThru(points.slice(1));
  shape.closePath();
  return shape;
}

function makeThreeColour(hex) {
  const colour = new THREE.Color(normalizeHex(hex));
  if (colour.convertSRGBToLinear) colour.convertSRGBToLinear();
  return colour;
}
