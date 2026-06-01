// Hype Chain product runtime. Loaded before app.js so app.js can stay focused on core studio orchestration.

function setupHypeChainControls() {
  document.querySelectorAll('[data-hype-variant]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.hypeVariant === 'spinner' && !state.isAdmin) return;
      document.querySelectorAll('[data-hype-variant]').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      state.hype.variant = button.dataset.hypeVariant || 'classic';
      updateStats();
      scheduleHypeRender();
    });
  });
  els.hypeColourButtons.forEach((button) => {
    button.addEventListener('click', () => openHypeColourPopover(button.dataset.hypeColour, button));
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
  renderHypeColourControls();
  renderHypeVariantAccess();
  const hype = state.hype;
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
    environmentLights: { hemi, key, rim },
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
  if (state.hypeThree.cameraTween) window.cancelAnimationFrame(state.hypeThree.cameraTween);
  state.hypeThree.cameraTween = null;
  if (state.hypeThree.group) state.hypeThree.scene.remove(state.hypeThree.group);
  state.hypeThree.resources.forEach((resource) => resource?.dispose?.());
  state.hypeThree.group = null;
  state.hypeThree.pendantGroup = null;
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
}

function frameHypeCamera(options = {}) {
  if (!state.hypeThree?.camera || !window.THREE) return;
  const camera = state.hypeThree.camera;
  const target = state.hypeThree.focusTarget || new THREE.Vector3(0, HYPE_CAMERA_TARGET_Y, 0);
  const limits = getPreviewZoomLimits();
  const zoom = clamp(Number(state.previewZoom) || 1, limits.min, limits.max);
  const distance = (HYPE_CAMERA_DISTANCE * (getPreviewEnvironmentSettings().cameraScale || 1)) / zoom;
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
  const focusObject = preferredObject || (state.hype.logoDataUrl ? state.hypeThree.pendantGroup : state.hypeThree.group);
  const box = new THREE.Box3().setFromObject(focusObject || state.hypeThree.group);
  if (!Number.isFinite(box.min.x) || box.isEmpty()) {
    state.hypeThree.focusLocal = new THREE.Vector3(0, HYPE_CAMERA_TARGET_Y, 0);
    state.hypeThree.focusTarget.copy(state.hypeThree.focusLocal);
  } else {
    const center = box.getCenter(new THREE.Vector3());
    const localCenter = state.hypeThree.group.worldToLocal(center.clone());
    state.hypeThree.focusLocal = localCenter;
    state.hypeThree.focusTarget.copy(center);
  }
  applyHypeGroupRotation();
  const worldTarget = state.hypeThree.group.localToWorld(state.hypeThree.focusLocal.clone());
  state.hypeThree.focusTarget.copy(worldTarget);
  frameHypeCamera();
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
  const position = hydrateBundledPlaqueProcessedValue(entry.position);
  const normal = hydrateBundledPlaqueProcessedValue(entry.normal);
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

async function loadEmbeddedHypeStl(embeddedKey) {
  if (!embeddedKey) return '';
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
  const chainRig = new THREE.Group();
  chainRig.name = 'hypeChainAttachmentRig';
  chainRig.position.y = uploadedChainDropY;

  const linkCount = getHypeLinkCount(state.hype.chainLength, state.hype.linkCount);
  const patternMaterials = getHypePatternColours().map((hex) => makeHypeSilkMaterial(hex));
  resources.push(...patternMaterials);
  const chainLinks = buildHypeChainLoop({
    linkCount,
    linkGeometry,
    materials: patternMaterials,
  });
  chainRig.add(chainLinks.root);
  const connectorEntryLinks = makeHypeConnectorEntryLinks(linkGeometry, patternMaterials, chainLinks.count);
  chainRig.add(connectorEntryLinks);

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
  group.add(chainRig);

  const pendant = makeHypePendantMesh(pendantMaterial, resources);
  pendant.position.set(0, state.hype.logoDataUrl ? -286 : -202, 0);
  group.add(pendant);

  state.hypeThree.group = group;
  state.hypeThree.pendantGroup = pendant;
  disableHypeFrustumCulling(group);
  state.hypeThree.scene.add(group);
  updateHypeCameraFocus(state.hype.logoDataUrl ? pendant : group);
  renderHypeThree();
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

function makeHypeLogoPendantMesh(material, resources) {
  const group = new THREE.Group();
  group.name = 'uploadedLogoPendant';
  group.scale.set(2.25, 2.25, 2.25);
  const pendantSize = getHypeLogoPendantSize();
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
  } = options;
  const image = new Image();
  image.onload = () => {
    if (!state.hypeThree?.group || group.parent !== state.hypeThree.group) return;
    const silhouette = makeAlphaSilhouettePendantShape(image, pendantSize.width, pendantSize.height);
    const pendantOffsetX = -(Number(silhouette.hookAnchorX) || 0);
    const bodyGeometry = makeAlphaSilhouettePendantGeometry(silhouette.shape, depth);
    resources.push(bodyGeometry);
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.name = 'uploadedLogoPendantSolidBody';
    body.position.set(pendantOffsetX, -10, 0);
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
    face.position.set(pendantOffsetX, -10, depth / 2 + HYPE_LOGO_FRONT_OFFSET);
    face.renderOrder = 3;
    face.castShadow = true;
    face.receiveShadow = true;
    face.frustumCulled = false;
    group.add(face);

    const hook = makeHypePendantHookMesh(silhouette, bodyMaterial, resources, depth);
    if (hook) {
      group.add(hook);
      alignHypeChainRigToPendantHook(hook);
    }

    updateHypeCameraFocus(group);
    renderHypeThree();
  };
  image.src = dataUrl;
}

function makeHypePendantHookMesh(silhouette, bodyMaterial, resources, depth) {
  const hookGeometry = state.hypeThree?.stlGeometries?.hook;
  if (!window.THREE) return null;
  if (!hookGeometry) {
    console.error('Pendant Hook STL geometry is missing; not rendering placeholder geometry.');
    return null;
  }
  const usableWidth = Math.max(1, silhouette.uvBounds?.width || 120);
  const desiredWidth = clamp(usableWidth * 0.2, 27, 34);
  const geometry = hookGeometry.clone();
  geometry.computeBoundingBox();
  const size = new THREE.Vector3();
  geometry.boundingBox.getSize(size);
  const hookMaterial = bodyMaterial.clone();
  hookMaterial.polygonOffset = true;
  hookMaterial.polygonOffsetFactor = -2;
  hookMaterial.polygonOffsetUnits = -2;
  resources.push(geometry, hookMaterial);

  const xyScale = desiredWidth / Math.max(size.x, 0.001);
  const zScale = (depth * 0.5) / Math.max(size.z, 0.001);
  const hookHeight = size.y * xyScale;
  const fuseOverlap = Math.min(30, hookHeight * 0.66);
  const hookAnchorY = Number.isFinite(silhouette.hookAnchorY)
    ? silhouette.hookAnchorY
    : (Number.isFinite(silhouette.centerTopY) ? silhouette.centerTopY : silhouette.topY);
  const fusedAnchorY = getHookFusedAnchorY(silhouette, hookAnchorY, desiredWidth, fuseOverlap);
  const extraDrop = Math.max(0, hookAnchorY - fusedAnchorY);
  const bodyTopY = -10 + fusedAnchorY;

  const hookGroup = new THREE.Group();
  hookGroup.name = 'uploadedLogoPendantHookAssembly';
  hookGroup.position.z = 0;
  hookGroup.userData.extraDrop = extraDrop;
  hookGroup.userData.shortLogoChainDrop = getShortLogoChainDrop(silhouette);

  const hook = new THREE.Mesh(geometry, hookMaterial);
  hook.name = 'uploadedLogoPendantHook';
  hook.scale.set(xyScale, xyScale, zScale);
  hook.position.set(0, bodyTopY + hookHeight / 2 - fuseOverlap - 4, 0);
  hook.renderOrder = 4;
  hook.castShadow = true;
  hook.receiveShadow = true;
  hook.frustumCulled = false;
  hookGroup.add(hook);
  console.info('Pendant Hook added to uploaded-logo pendant', {
    source: hookGeometry ? 'stl' : 'fallback',
    anchorY: Number(bodyTopY.toFixed(2)),
    anchorX: Number((silhouette.hookAnchorX || 0).toFixed(2)),
    extraDrop: Number(extraDrop.toFixed(2)),
    width: Number(desiredWidth.toFixed(2)),
    height: Number(hookHeight.toFixed(2)),
    shortLogoChainDrop: Number(hookGroup.userData.shortLogoChainDrop.toFixed(2)),
    zOffset: Number(hookGroup.position.z.toFixed(2)),
  });
  return hookGroup;
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
  const hookHoleCenterY = hookBox.max.y - hookHeight * HYPE_HOOK_HOLE_CENTER_FROM_TOP;
  const linkBottomY = linkBox.min.y;
  const rigDeltaY = clamp(
    hookHoleCenterY - linkBottomY,
    -HYPE_HOOK_CHAIN_ALIGN_LIMIT,
    HYPE_HOOK_CHAIN_ALIGN_LIMIT,
  );
  const shortLogoChainDrop = clamp(Number(hookGroup.userData?.shortLogoChainDrop) || 0, 0, HYPE_SHORT_LOGO_CHAIN_DROP_MAX);
  chainRig.position.y += rigDeltaY - shortLogoChainDrop;
  chainRig.userData.hookAlignmentDeltaY = rigDeltaY;
  chainRig.userData.shortLogoChainDrop = shortLogoChainDrop;
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

function getHypePatternColours() {
  syncHypeDerivedColours();
  const colours = [state.hype.primary];
  if (state.hype.patternLength >= 2) colours.push(state.hype.secondary);
  if (state.hype.patternLength >= 3) colours.push(state.hype.tertiary);
  return colours.map((hex) => normalizeHex(hex));
}

function applyHypePendantColoursToChain() {
  const fallback = ['#d6001c', '#0057b8', '#ffc529'];
  const ranked = getRankedPendantChainColours();
  const colours = uniqueHexColours(ranked.map((item) => item.hex));
  const chainColours = [0, 1, 2].map((index) => normalizeHex(colours[index] || fallback[index]));
  state.hype.primary = chainColours[0];
  if (getHypePatternLength() >= 2) state.hype.secondary = chainColours[1];
  if (getHypePatternLength() >= 3) state.hype.tertiary = chainColours[2];
  syncHypeDerivedColours();
  applyHypeStateToControls();
  renderHypeColourControls();
}

function applyHypeStateToControls() {
  document.querySelectorAll('[data-hype-variant]').forEach((button) => {
    button.classList.toggle('active', button.dataset.hypeVariant === state.hype.variant);
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
  renderHypeColourControls();
}

function renderHypeVariantAccess() {
  document.querySelectorAll('[data-hype-variant]').forEach((button) => {
    const locked = button.dataset.hypeVariant === 'spinner' && !state.isAdmin;
    button.classList.toggle('locked', locked);
    button.setAttribute('aria-disabled', locked ? 'true' : 'false');
    if (locked) {
      button.setAttribute('aria-describedby', 'spinnerLockTooltip');
      if (state.hype.variant === 'spinner') state.hype.variant = 'classic';
    } else {
      button.removeAttribute('aria-describedby');
    }
    const lock = button.querySelector('.spinner-lock');
    if (lock) lock.hidden = !locked;
    button.classList.toggle('active', button.dataset.hypeVariant === state.hype.variant);
  });
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
  state.hype.pendantCasing = normalizeHex(state.hype.pendantCasing || state.hype.pendant || '#202326');
  applyHypePendantColoursToChain();
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
    queueEmailMarketingSubscription(state.customerEmail);
    const project = await buildHypeChainProject();
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

async function buildHypeChainProject() {
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
    id: state.projectId || makeProjectId(),
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
      ],
      details: {
        style: state.hype.variant === 'spinner' ? 'Spinner' : 'Classic',
        patternLength: getHypePatternLength(),
        chainLength: state.hype.chainLength,
        linkCount: getHypeLinkCount(state.hype.chainLength, state.hype.linkCount),
        quantity: state.hype.quantity,
      },
    },
  };
}

function getSerializableHypeConfig() {
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
    rotation: {
      x: Number(state.hype.rotation?.x) || 0,
      y: Number(state.hype.rotation?.y) || 0,
    },
  };
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
    `Chain length: ${hype.chainLength}`,
    `Quantity requested: ${hype.quantity || 1}`,
    `Render screenshots: current Hype Chain view and angled view`,
  ].join('\n');
}

function makeHypeEmailHtml(context = 'Design submission') {
  const hype = state.hype;
  const patternLength = getHypePatternLength(hype.patternLength);

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
    ],
  });
}

function makeHypePlaceholderLogoDataUrl() {
  const text = encodeURIComponent(state.hype.text || 'MVP');
  const border = normalizeHex(state.hype.primary).replace('#', '%23');
  const pendant = getHypePendantBodyColour().replace('#', '%23');
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 420'%3E%3Crect width='600' height='420' rx='52' fill='${pendant}'/%3E%3Crect x='28' y='28' width='544' height='364' rx='42' fill='none' stroke='${border}' stroke-width='28'/%3E%3Ctext x='300' y='230' text-anchor='middle' font-family='Arial,sans-serif' font-size='128' font-weight='900' fill='white'%3E${text}%3C/text%3E%3C/svg%3E`;
}
