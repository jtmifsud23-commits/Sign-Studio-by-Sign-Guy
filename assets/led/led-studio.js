// LED-only studio: world-space floor/light, transformed-vertex support, occluded bloom.
const LED_STUDIO_FLOOR_Y = -85;
const LED_STUDIO_EMITTER_COUNT = 16;

function configureLedStudioModel(group, face, artworkCanvas) {
  const resources = state.three.resources;
  const lighting = group.userData.lighting;
  const canvas = document.createElement('canvas');
  canvas.width = artworkCanvas.width;
  canvas.height = artworkCanvas.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(artworkCanvas, 0, 0);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const bins = Array.from({ length: LED_STUDIO_EMITTER_COUNT }, () => ({ x: 0, y: 0, r: 0, g: 0, b: 0, weight: 0 }));
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      const d = image.data;
      const peak = Math.max(d[i], d[i + 1], d[i + 2]) / 255;
      // Black inks are opaque; the smooth transition avoids bright antialiased black edges.
      const transmission = clamp((peak - 0.13) / 0.12, 0, 1);
      const weight = transmission * d[i + 3] / 255;
      const bin = bins[Math.min(3, Math.floor(y / canvas.height * 4)) * 4 + Math.min(3, Math.floor(x / canvas.width * 4))];
      bin.x += (x + 0.5) / canvas.width * weight;
      bin.y += (y + 0.5) / canvas.height * weight;
      bin.r += d[i] / 255 * weight; bin.g += d[i + 1] / 255 * weight; bin.b += d[i + 2] / 255 * weight;
      bin.weight += weight;
      d[i] *= transmission; d[i + 1] *= transmission; d[i + 2] *= transmission;
    }
  }
  ctx.putImageData(image, 0, 0);
  const emission = new THREE.CanvasTexture(canvas);
  emission.encoding = THREE.sRGBEncoding;
  emission.minFilter = THREE.LinearFilter;
  emission.generateMipmaps = false;
  resources.push(emission);
  face.name = 'ledDiffuserFace';
  face.material.emissiveMap = emission;
  face.material.emissive.setRGB(1, 1, 1);
  face.material.roughness = 0.92;
  face.material.metalness = 0;
  // Neutral diffuser regions transmit more light without desaturating coloured ink.
  face.material.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      float ledPeak = max(totalEmissiveRadiance.r, max(totalEmissiveRadiance.g, totalEmissiveRadiance.b));
      float ledNeutral = min(totalEmissiveRadiance.r, min(totalEmissiveRadiance.g, totalEmissiveRadiance.b)) / max(ledPeak, 0.0001);
      totalEmissiveRadiance *= mix(0.5, 1.35, ledNeutral);`);
  };
  face.material.needsUpdate = true;
  for (const material of [lighting.sideMaterial, lighting.backMaterial, lighting.frontBackerMaterial]) {
    material.emissive.setRGB(0, 0, 0);
    material.emissiveIntensity = 0;
    material.roughness = 0.88;
    material.metalness = 0;
  }
  const mask = new THREE.MeshBasicMaterial({ map: emission, side: THREE.FrontSide, alphaTest: 0.03, toneMapped: false });
  resources.push(mask);
  lighting.face = face;
  lighting.bloomMaterial = mask;
  group.traverse(mesh => {
    if (!mesh.isMesh) return;
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      // Floor haze must not dim the diffuser when the mobile camera moves farther away.
      material.fog = false;
      material.needsUpdate = true;
    }
  });
  const bounds = group.userData.bounds;
  lighting.emitters = bins.map(bin => ({
    position: new THREE.Vector3((bin.weight ? bin.x / bin.weight - 0.5 : 0) * bounds.width,
      (bin.weight ? 0.5 - bin.y / bin.weight : 0) * bounds.height, face.position.z + 0.1),
    colour: bin.weight ? new THREE.Color(bin.r / bin.weight, bin.g / bin.weight, bin.b / bin.weight).convertSRGBToLinear()
      .multiplyScalar(bin.weight / (canvas.width * canvas.height) * 16) : new THREE.Color(0, 0, 0),
  }));
  // Cache actual manufacturing vertices once; box corners would hover on irregular outlines.
  group.updateMatrixWorld(true);
  const points = [];
  const unique = new Set();
  group.children.forEach(mesh => {
    if (!mesh.isMesh || mesh.name === 'keyholeInteriorLogoPlane') return;
    const attr = mesh.geometry.attributes.position;
    for (let i = 0; i < attr.count; i++) {
      const p = new THREE.Vector3().fromBufferAttribute(attr, i).applyMatrix4(mesh.matrix);
      const key = `${p.x.toFixed(3)},${p.y.toFixed(3)},${p.z.toFixed(3)}`;
      if (!unique.has(key)) { unique.add(key); points.push(p.x, p.y, p.z); }
    }
  });
  lighting.supportVertices = new Float32Array(points);
  lighting.supportRotation = new THREE.Matrix4();
  lighting.worldNormal = new THREE.Vector3();
}

function ensureLedStudioStage() {
  const three = state.three;
  if (three.ledStudio) return three.ledStudio;
  const positions = Array.from({ length: LED_STUDIO_EMITTER_COUNT }, () => new THREE.Vector3());
  const colours = Array.from({ length: LED_STUDIO_EMITTER_COUNT }, () => new THREE.Color(0, 0, 0));
  const uniforms = { ledPositions: { value: positions }, ledColours: { value: colours }, ledNormal: { value: new THREE.Vector3(0, 0, 1) }, ledEnabled: { value: 0 } };
  const material = new THREE.MeshStandardMaterial({ color: makeThreeColour('#393b3e'), roughness: 1, metalness: 0 });
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = 'varying vec3 ledWorldPosition;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nledWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;');
    shader.fragmentShader = `varying vec3 ledWorldPosition;
      uniform vec3 ledPositions[16]; uniform vec3 ledColours[16]; uniform vec3 ledNormal; uniform float ledEnabled;\n` + shader.fragmentShader;
    // Receiver/blocker separation controls penumbra width in world units. This is
    // floor-only; contact stays tight and camera motion cannot move the filter.
    const shadowChunk = THREE.ShaderChunk.shadowmap_pars_fragment.replace(
      'float dx0 = - texelSize.x * shadowRadius;', `
      float blockerDepth = 0.0;
      float blockerCount = 0.0;
      for (int sampleIndex = 0; sampleIndex < 12; sampleIndex++) {
        float angle = float(sampleIndex) * 2.399963;
        vec2 offset = vec2(cos(angle), sin(angle)) * sqrt((float(sampleIndex) + 0.5) / 12.0) * (7.0 / 600.0);
        float depth = unpackRGBAToDepth(texture2D(shadowMap, shadowCoord.xy + offset));
        if (depth < shadowCoord.z - 0.00008) { blockerDepth += depth; blockerCount += 1.0; }
      }
      float separation = blockerCount > 0.0 ? max(0.0, shadowCoord.z - blockerDepth / blockerCount) * 999.0 : 0.0;
      shadowRadius = clamp(separation * 0.055 * shadowMapSize.x / 600.0, 0.8, shadowMapSize.x * 0.007);
      float dx0 = - texelSize.x * shadowRadius;`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <shadowmap_pars_fragment>', shadowChunk);
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      for (int i = 0; i < 16; i++) {
        vec3 ray = ledWorldPosition - ledPositions[i];
        float d2 = max(dot(ray, ray), 16.0);
        vec3 direction = ray * inversesqrt(d2);
        // Only the front hemisphere emits. The casing is entirely behind this plane.
        float emissionCosine = max(dot(ledNormal, direction), 0.0);
        float floorCosine = max(-direction.y, 0.0);
        float falloff = 520.0 / (d2 + 280.0) * exp(-sqrt(d2) / 110.0);
        totalEmissiveRadiance += ledColours[i] * ledEnabled * emissionCosine * floorCosine * falloff * 0.65;
      }`);
  };
  const floor = new THREE.Mesh(new THREE.PlaneBufferGeometry(8000, 8000), material);
  floor.name = 'ledStudioFloor';
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = LED_STUDIO_FLOOR_Y;
  floor.receiveShadow = true;
  three.scene.add(floor);
  const studio = { floor, uniforms, originalShadow: { left: -5, right: 5, top: 5, bottom: -5 }, background: new THREE.Color('#292b2e'), fog: new THREE.Fog('#292b2e', 280, 900) };
  three.ledStudio = studio;
  return studio;
}

function syncLedStudioStage() {
  const three = state.three;
  const active = state.productType === 'led';
  if (!active && !three.ledStudio) return;
  const studio = ensureLedStudioStage();
  studio.floor.visible = active;
  three.floor.visible = !active;
  three.scene.background = active ? studio.background : null;
  three.scene.fog = active ? studio.fog : null;
  const key = three.environmentLights.key;
  if (active) {
    const day = state.previewMode === 'day';
    three.renderer.toneMappingExposure = day ? 1.03 : 0.96;
    three.environmentLights.hemi.intensity = day ? 0.78 : 0.6;
    key.intensity = day ? 1.05 : 0.85;
    three.environmentLights.rim.intensity = 0.5;
    three.environmentLights.floorFill.intensity = 0.12;
    Object.assign(key.shadow.camera, { left: -300, right: 300, top: 310, bottom: -260, near: 1, far: 1000 });
    key.shadow.bias = -0.00004;
    key.shadow.normalBias = 0.06;
    key.shadow.radius = 2.4;
    three.renderer.shadowMap.type = THREE.PCFShadowMap;
    const shadowSize = isMobilePreviewViewport() ? 1024 : 2048;
    if (key.shadow.mapSize.x !== shadowSize) {
      key.shadow.mapSize.set(shadowSize, shadowSize);
      if (key.shadow.map) { key.shadow.map.dispose(); key.shadow.map = null; }
    }
  } else if (studio.wasActive) {
    Object.assign(key.shadow.camera, studio.originalShadow, { near: 0.5, far: 500 });
    key.shadow.bias = 0; key.shadow.normalBias = 0; key.shadow.radius = 1;
    three.camera.position.y = 10;
    three.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (key.shadow.mapSize.x !== 1024) {
      key.shadow.mapSize.set(1024, 1024);
      if (key.shadow.map) { key.shadow.map.dispose(); key.shadow.map = null; }
    }
  }
  key.shadow.camera.updateProjectionMatrix();
  studio.wasActive = active;
}

function getLedStudioMobileFrame() {
  if (!isMobilePreviewViewport() || !els.stage) return null;
  const rect = els.stage.getBoundingClientRect();
  const ribbon = els.stage.querySelector('.stage-ribbon')?.getBoundingClientRect();
  const tray = els.mobileCommandBar?.getBoundingClientRect();
  const trayTop = tray?.height ? tray.top - rect.top : rect.height;
  const top = (ribbon ? ribbon.bottom - rect.top : 0) + 16;
  const bottom = Math.max(top + 120, trayTop - 112);
  els.stage.style.setProperty('--led-mobile-controls-bottom', `${Math.max(16, rect.height - trayTop + 14)}px`);
  return { top, bottom, height: bottom - top, center: (top + bottom) / 2, viewportHeight: rect.height };
}

function getLedStudioCameraScale() {
  const frame = getLedStudioMobileFrame();
  if (!frame || !state.processed || !state.three) return 1;
  const bounds = getModelBounds(state.processed);
  const camera = state.three.camera;
  const visibleHeight = 2 * 430 * Math.tan(THREE.Math.degToRad(camera.fov) / 2);
  const safeWidth = Math.hypot(bounds.width, SIZE_PRESETS[state.size].depth) * 1.12;
  return Math.max(1, safeWidth / (visibleHeight * camera.aspect), bounds.height * 1.12 / (visibleHeight * frame.height / frame.viewportHeight));
}

function updateLedStudio() {
  const three = state.three;
  const group = three?.group;
  const lighting = group?.userData?.lighting;
  if (!lighting?.ledStudio || state.productType !== 'led') return;
  const studio = ensureLedStudioStage();
  const matrix = lighting.supportRotation.makeRotationFromEuler(group.rotation).elements;
  const points = lighting.supportVertices;
  let minY = Infinity;
  for (let i = 0; i < points.length; i += 3) minY = Math.min(minY, matrix[1] * points[i] + matrix[5] * points[i + 1] + matrix[9] * points[i + 2]);
  const pan = getPreviewPan();
  group.position.set(pan.x * 0.36, LED_STUDIO_FLOOR_Y - minY + 0.015, 0);
  // Vertical pan moves the view, never lifts the product away from the floor.
  const frame = getLedStudioMobileFrame();
  const bounds = group.userData.bounds;
  const worldPerPixel = frame ? 2 * three.camera.position.z * Math.tan(THREE.Math.degToRad(three.camera.fov) / 2) / frame.viewportHeight : 0;
  const frameTargetY = frame ? LED_STUDIO_FLOOR_Y - bounds.minY + (frame.center - frame.viewportHeight / 2) * worldPerPixel : 0;
  const cameraY = Math.max(LED_STUDIO_FLOOR_Y + 24, 10 + frameTargetY + pan.y * 0.36);
  three.camera.position.y = cameraY;
  three.camera.lookAt(0, cameraY - 10, 0);
  group.updateMatrixWorld(true);
  studio.uniforms.ledNormal.value.set(0, 0, 1).transformDirection(group.matrixWorld);
  lighting.emitters.forEach((emitter, i) => {
    studio.uniforms.ledPositions.value[i].copy(emitter.position).applyMatrix4(group.matrixWorld);
    studio.uniforms.ledColours.value[i].copy(emitter.colour);
  });
  studio.uniforms.ledEnabled.value = state.illuminated ? 1 : 0;
  lighting.faceMaterial.color.setRGB(state.illuminated ? 0.56 : 1, state.illuminated ? 0.56 : 1, state.illuminated ? 0.56 : 1);
  lighting.faceMaterial.emissiveIntensity = state.illuminated ? 2.1 : 0;
  // Preserve the intentional rear view through the mounting cutout, with opaque backing intact.
  lighting.keyholeInteriorMaterial.opacity = state.illuminated ? 1 : 0.54;
  lighting.keyholeInteriorMaterial.color.copy(makeThreeColour(state.illuminated ? '#ffffff' : '#343838'));
  lighting.groundClearance = group.position.y + minY - LED_STUDIO_FLOOR_Y;
}

function ensureLedBloom() {
  const three = state.three;
  const studio = ensureLedStudioStage();
  if (studio.bloom) return studio.bloom;
  const rt = () => new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true });
  const vertexShader = 'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}';
  const blur = new THREE.ShaderMaterial({ uniforms: { source: { value: null }, stepSize: { value: new THREE.Vector2() } }, vertexShader,
    fragmentShader: `varying vec2 vUv; uniform sampler2D source; uniform vec2 stepSize;
      void main(){ vec3 c=texture2D(source,vUv).rgb*.227027;
      c+=texture2D(source,vUv+stepSize*1.384615).rgb*.316216;
      c+=texture2D(source,vUv-stepSize*1.384615).rgb*.316216;
      c+=texture2D(source,vUv+stepSize*3.230769).rgb*.070270;
      c+=texture2D(source,vUv-stepSize*3.230769).rgb*.070270;
      gl_FragColor=vec4(c,1.0); }`, depthTest: false, depthWrite: false, toneMapped: false });
  const composite = new THREE.ShaderMaterial({ uniforms: { source: { value: null } }, vertexShader,
    fragmentShader: 'varying vec2 vUv; uniform sampler2D source; void main(){gl_FragColor=vec4(texture2D(source,vUv).rgb*.14,1.0);}',
    // Screen blend keeps headroom in broad whites instead of clipping them with addition.
    transparent: true, blending: THREE.CustomBlending, blendSrc: THREE.OneMinusDstColorFactor,
    blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation,
    depthTest: false, depthWrite: false, toneMapped: false });
  const quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), blur);
  const scene = new THREE.Scene(); scene.add(quad);
  studio.bloom = { a: rt(), b: rt(), blur, composite, quad, scene, camera: new THREE.Camera(), black: new THREE.MeshBasicMaterial({ color: 0, side: THREE.DoubleSide }), clear: new THREE.Color(0) };
  return studio.bloom;
}

function renderLedStudio() {
  const { renderer, scene, camera, group } = state.three;
  renderer.render(scene, camera);
  if (!state.illuminated || !group) return;
  const bloom = ensureLedBloom();
  const scale = isMobilePreviewViewport() ? 0.35 : 0.5;
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const w = Math.max(1, Math.round(size.x * scale)), h = Math.max(1, Math.round(size.y * scale));
  if (bloom.a.width !== w || bloom.a.height !== h) { bloom.a.setSize(w, h); bloom.b.setSize(w, h); }
  const saved = [];
  const oldBackground = scene.background;
  const oldFog = scene.fog;
  const shadowUpdate = renderer.shadowMap.autoUpdate;
  const clearAlpha = renderer.getClearAlpha();
  renderer.getClearColor(bloom.clear);
  const target = renderer.getRenderTarget();
  const autoClear = renderer.autoClear;
  try {
    scene.background = new THREE.Color(0); scene.fog = null;
    renderer.shadowMap.autoUpdate = false;
    scene.traverse(mesh => {
      if (!mesh.isMesh) return;
      saved.push([mesh, mesh.material]);
      if (mesh === group.userData.lighting.face) mesh.material = group.userData.lighting.bloomMaterial;
      else mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map(m => m.opacity === 0 ? m : bloom.black) : bloom.black;
    });
    renderer.setRenderTarget(bloom.a); renderer.render(scene, camera);
    bloom.quad.material = bloom.blur;
    bloom.blur.uniforms.source.value = bloom.a.texture;
    bloom.blur.uniforms.stepSize.value.set(1.35 / w, 0);
    renderer.setRenderTarget(bloom.b); renderer.render(bloom.scene, bloom.camera);
    bloom.blur.uniforms.source.value = bloom.b.texture;
    bloom.blur.uniforms.stepSize.value.set(0, 1.35 / h);
    renderer.setRenderTarget(bloom.a); renderer.render(bloom.scene, bloom.camera);
    bloom.quad.material = bloom.composite;
    bloom.composite.uniforms.source.value = bloom.a.texture;
    renderer.setRenderTarget(target); renderer.autoClear = false;
    renderer.render(bloom.scene, bloom.camera);
  } finally {
    saved.forEach(([mesh, material]) => { mesh.material = material; });
    scene.background = oldBackground; scene.fog = oldFog;
    renderer.shadowMap.autoUpdate = shadowUpdate;
    renderer.autoClear = autoClear; renderer.setRenderTarget(target);
    renderer.setClearColor(bloom.clear, clearAlpha);
  }
}
