const SIZE_PRESETS = {
  small: { label: 'Small 10"', inches: 10, depth: 33 },
  large: { label: 'Large 13"', inches: 13, depth: 33 },
  xl: { label: 'XL 16"', inches: 16, depth: 33 },
};

const USAGE_PRESETS = {
  indoor: { label: 'Indoor' },
  outdoor: { label: 'Outdoor' },
};

const SHOPIFY_CHECKOUT_BASE_URL = 'https://mysignguy.ca/cart';
const CONTACT_EMAIL = 'Hey@MySignGuy.ca';
const SUBMISSION_SUBJECT = 'User submitted sign to print';
const ORDER_SUBMISSION_SUBJECT = 'User placed a lightbox order';
const HYPE_CHAIN_ORDER_SUBJECT = 'User placed a Hype Chain order';
const BUG_REPORT_SUBJECT = 'Sign Studio bug report';
const DIAGNOSTIC_REPORT_LIMIT = 30;
const DIAGNOSTIC_LIST_LIMIT = 80;
const DEFAULT_LED_PROJECT_SRC = './assets/led/default-led-lightbox.SignGuy?v=20260527-02';
const DEFAULT_LED_PROJECT_SCRIPT_SRC = './assets/led/default-led-lightbox-project.js?v=20260527-02';
const DEFAULT_PREVIEW_DATA_URL = './assets/sign-guy-head.png';
const DEFAULT_PREVIEW_FALLBACK_DATA_URL = './assets/sign-guy-head-loading.png';
const DEFAULT_PREVIEW_PRIMARY_TIMEOUT_MS = 2200;
const DEFAULT_PREVIEW_FALLBACK_TIMEOUT_MS = 5000;
const DEFAULT_PREVIEW_QUALITY_UPGRADE_DELAY_MS = 350;
const SHOPIFY_CUSTOM_LOGO_BAR_LIGHT_VARIANTS = {
  small: {
    indoor: '48516981588108',
    outdoor: '48516981620876',
  },
  large: {
    indoor: '48516981653644',
    outdoor: '48516981686412',
  },
  xl: {
    indoor: '48516981719180',
    outdoor: '48516981751948',
  },
};
const SHOPIFY_CUSTOM_3D_WALL_PLAQUE_VARIANTS = {
  small: {
    indoor: '50218609508492',
    outdoor: '50218609541260',
  },
  large: {
    indoor: '50218609574028',
    outdoor: '50218609606796',
  },
  xl: {
    indoor: '50218609639564',
    outdoor: '50218609672332',
  },
};
const SHOPIFY_HYPE_CHAIN_VARIANTS = {
  classic: window.SIGN_GUY_HYPE_CHAIN_CLASSIC_VARIANT_ID || '43897670271116',
  spinner: window.SIGN_GUY_HYPE_CHAIN_SPINNER_VARIANT_ID || '46117827117196',
};

function trackSignStudioEvent(eventName, parameters = {}) {
  return window.SignStudioAnalytics?.track?.(eventName, parameters) || false;
}

function getAnalyticsProductItem(project = null) {
  const productType = project?.type === 'SignGuy.HypeChainStudio'
    ? 'hype'
    : (project?.type === 'SignGuy.WallPlaqueStudio' ? 'plaque' : state.productType);
  const itemName = productType === 'hype'
    ? 'Hype Chain'
    : (productType === 'plaque' ? '3D Wall Plaque' : 'LED Sign');
  const itemVariant = productType === 'hype'
    ? (state.hype.variant === 'spinner' ? 'Spinner' : 'Classic')
    : `${SIZE_PRESETS[state.size]?.label || state.size} - ${productType === 'plaque'
      ? (USAGE_PRESETS[getPlaqueUsageKey()]?.label || 'Indoor')
      : (USAGE_PRESETS[state.usage]?.label || 'Indoor')}`;

  return {
    item_id: getShopifyVariantId() || `${productType}_custom`,
    item_name: itemName,
    item_category: 'Sign Studio',
    item_variant: itemVariant,
    quantity: 1,
  };
}
const HYPE_CHAIN_STL_ASSETS = {
  link: './assets/hype-chain/chain-link.stl',
  connector: './assets/hype-chain/link-connector.stl',
  hook: './assets/hype-chain/Pendant%20Hook.stl?v=20260513-02',
};
const HYPE_SPINNER_STL_ASSETS = {
  outerRing: './assets/hype-chain/spinner/outer-ring-sign-guy.stl?v=20260603-01',
  connector: './assets/hype-chain/spinner/two-prong-chain-link-attachment.stl?v=20260602-01',
};
const DEFAULT_HYPE_CHAIN_PROJECT_SRC = './assets/hype-chain/default-hype-chain.SignGuy?v=20260513-02';
const DEFAULT_PLAQUE_PROJECT_SRC = './assets/plaque/default-3d-plaque.SignGuy?v=20260525-03';
const DEFAULT_HYPE_CHAIN_PROJECT_SCRIPT_SRC = './assets/hype-chain/default-hype-chain-project.js?v=20260513-01';
const DEFAULT_PLAQUE_PROJECT_SCRIPT_SRC = './assets/plaque/default-3d-plaque-project.js?v=20260525-03';
const DEFAULT_PLAQUE_PROCESSED_CACHE_SCRIPT_SRC = './assets/plaque/default-3d-plaque-processed-cache.js?v=20260527-02';
const HYPE_CHAIN_GEOMETRY_CACHE_SCRIPT_SRC = './assets/hype-chain/hype-chain-geometry-cache.js?v=20260527-01';
const HYPE_CHAIN_STL_EMBEDDED_SCRIPT_SRC = './assets/hype-chain/hype-chain-stl-embedded.js?v=20260527-01';
const HYPE_SPINNER_BASE_GEOMETRY_CACHE_SCRIPT_SRC = './assets/hype-chain/spinner/spinner-base-geometry-cache.js?v=20260605-01';
const HYPE_SPINNER_OUTER_RING_STL_EMBEDDED_SCRIPT_SRC = './assets/hype-chain/spinner/outer-ring-sign-guy-embedded.js?v=20260603-01';
const HYPE_SPINNER_CONNECTOR_STL_EMBEDDED_SCRIPT_SRC = './assets/hype-chain/spinner/two-prong-chain-link-attachment-embedded.js?v=20260602-01';
const SVG_LOADER_SCRIPT_SRC = './assets/vendor/SVGLoader.js?v=20260518-01';
const IDLE_PRODUCT_PREFETCH_DELAY_MS = 4500;
const PROJECT_FILE_VERSION = 1;
const PROJECT_DB_NAME = 'SignGuyLightboxStudio';
const PROJECT_DB_VERSION = 3;
const PROJECT_STORE_NAME = 'projects';
const PROJECT_CUSTOMER_TYPE_INDEX = 'customerEmailType';
const PROJECT_CUSTOMER_TYPE_SAVED_AT_INDEX = 'customerEmailTypeSavedAt';
const PLAQUE_PROCESSED_CACHE_STORE_NAME = 'plaqueProcessedCache';
const PROJECT_LOG_LIMIT = 12;
const EMAIL_STORAGE_KEY = 'signGuyCustomerEmail';
const EMAIL_MARKETING_SESSION_KEY = 'signGuyEmailMarketingSubscribers';
const EMAIL_MARKETING_SOURCE = 'Sign Studio';
const ONBOARDING_STORAGE_KEY = 'signGuyOnboardingDismissed';
const ADMIN_SESSION_KEY = 'signGuyAdminMode';
const LOCAL_ADMIN_PASSWORD = '77\\r(~68dKTE';
const LOADING_MIN_VISIBLE_MS = 900;
const DEFAULT_PRODUCT_PREVIEW_ZOOM = 1;
const DEFAULT_PRODUCT_PREVIEW_ROTATION = Object.freeze({
  x: -5.232392578125,
  y: 13.203134765624998,
  z: 0,
});
const MOBILE_PREVIEW_ZOOM_MIN = 0.75;
const MOBILE_PREVIEW_ZOOM_MAX = 2.5;
const MOBILE_SHEET_SWIPE_THRESHOLD = 44;
const IMAGE_DECODE_TIMEOUT_MS = 15000;
const MAX_UPLOAD_BYTES = 28 * 1024 * 1024;
const HEIC_CONVERT_TIMEOUT_MS = 30000;
const HEIC2ANY_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/heic2any/0.0.4/heic2any.min.js';
const ORDER_SCREENSHOT_MAX_SIDE = 900;
const ORDER_SCREENSHOT_QUALITY = 0.74;
const ORDER_PROJECT_PREVIEW_MAX_SIDE = 760;
const ORDER_LOGO_MAX_SIDE = 1400;
const PLAQUE_UPLOAD_MAX_SIDE = 1200;
const PLAQUE_RASTER_PREVIEW_TRACE_MAX_SIDE = 1600;
const PLAQUE_RASTER_PREVIEW_TRACE_MIN_SIDE = 1100;
const PLAQUE_UPLOAD_READ_TIMEOUT_MS = 12000;
const DESKTOP_PREVIEW_ZOOM_MIN = 0.55;
const DESKTOP_PREVIEW_ZOOM_MAX = 2.4;
const HYPE_CAMERA_DISTANCE = 1120;
const HYPE_CAMERA_TARGET_Y = -18;
const HYPE_CAMERA_VIEW_OFFSET_Y = 52;
const HYPE_CAMERA_NEAR = 1;
const HYPE_CAMERA_FAR = 5000;
const HYPE_LOGO_FRONT_OFFSET = 0.38;
const HYPE_UPLOADED_CHAIN_DROP_Y = -22;
const HYPE_HOOK_HOLE_CENTER_FROM_TOP = 0.3;
const HYPE_HOOK_CHAIN_ALIGN_LIMIT = 46;
const HYPE_SHORT_LOGO_CHAIN_DROP_MAX = 32;
const HYPE_SHORT_LOGO_RATIO_THRESHOLD = 0.62;
const DEFAULT_HYPE_SPINNER_CONFIG = Object.freeze({
  topText: 'PLAYER OF',
  bottomText: 'THE GAME',
  ringColor: '#FFD700',
  textColor: '#000000',
  baseColor: '#111111',
  fontFamily: 'Bebas Neue Bold',
  ringDiameter: 150,
  ringThickness: 14,
  ringClearance: 1.2,
});
const DEFAULT_CROP_OUTER_MARGIN = 0.2;
const CROP_EXTEND_LIMIT = 0.75;
const FLOATING_SUPPORT_CLUSTER_ORIGINAL = -7777;
const DEFAULT_FLOATING_SUPPORT_COLOUR = '#fdfdfd';
const PLAQUE_DEFAULT_BASE_THICKNESS = 8;
const PLAQUE_BASE_THICKNESS_MIN = 4;
const PLAQUE_BASE_THICKNESS_MAX = 8;
const PLAQUE_DEFAULT_BASE_PADDING = 2.5;
const PLAQUE_DEFAULT_LAYER_DEPTH = 1.4;
const PLAQUE_BASE_LAYER_DEPTH = 1;
const PLAQUE_LAYER_DEPTH_MIN = 0.2;
const PLAQUE_LAYER_DEPTH_MAX = 8;
const PLAQUE_DEFAULT_TRACE_QUALITY = 'smooth';
const PLAQUE_SVG_LAYER_SHAPE_LIMIT = 420;
const DEFAULT_PLAQUE_PROCESSED_CACHE_VERSION = 1;
const DEFAULT_PLAQUE_PROCESSED_CACHE_KEY = 'default-sign-guy-plaque:v20260526-04';
const PLAQUE_UPLOAD_PROCESSED_CACHE_VERSION = 1;
const PLAQUE_UPLOAD_PROCESSED_CACHE_PREFIX = 'uploaded-plaque:';
const PLAQUE_UPLOAD_PROCESSED_CACHE_LIMIT = 18;
const PLAQUE_CONTOUR_CACHE_VERSION = 1;
const PLAQUE_BASE_SILHOUETTE_CACHE_VERSION = 6;
const PLAQUE_PROCESSING_WORKER_SRC = './assets/plaque/plaque-processing-worker.js?v=20260526-11';
const PLAQUE_PROCESSING_WORKER_TIMEOUT_MS = 90000;
const LED_THREE_UPGRADE_DELAY_MS = 80;
const LED_THREE_CANVAS_SAMPLE_SIZE = 48;
const plaqueRasterShapeCache = new WeakMap();
const plaqueExtrudeGeometryTemplateCache = new WeakMap();
let ledThreeSampleCanvas = null;
let projectDbPromise = null;
const loadingStartedAt = performance.now();
const emailMarketingSubmitted = new Set(readEmailMarketingSessionSet());

const CROP_PRESETS = [
  { id: '1:1', label: '1:1', ratio: 1, icon: 'ratio-1' },
  { id: '4:3', label: '4:3', ratio: 4 / 3, icon: 'ratio-43' },
  { id: '3:2', label: '3:2', ratio: 3 / 2, icon: 'ratio-32' },
  { id: '16:9', label: '16:9', ratio: 16 / 9, icon: 'ratio-169' },
  { id: 'circle', label: 'Circle', ratio: 1, icon: 'circle' },
  { id: 'free', label: 'Free', ratio: null, icon: 'ratio-1' },
];

const PRESET_COLOURS = [
  '#ffffff', '#f2e6db', '#e8c16b', '#d6d9d2', '#a6aaa4', '#807b4d', '#913827', '#f4f1eb', '#b62035',
  '#ee3e70', '#ff6080', '#fb7447', '#ff9a19', '#ffc400', '#f3ef45', '#88c43f', '#00a651', '#2f7f3b',
  '#16b8c1', '#0b86c8', '#003f8c', '#001c42', '#5148a8', '#4a2765', '#5d6674', '#dfe2e2', '#55585b', '#000000',
];

const state = {
  fileName: '',
  designName: '',
  customerEmail: '',
  isAdmin: false,
  productType: 'led',
  previewMode: 'night',
  isDefaultPreview: false,
  size: 'large',
  usage: 'indoor',
  illuminated: true,
  removeBg: true,
  fixFloatingRegions: false,
  floatingSupportColour: DEFAULT_FLOATING_SUPPORT_COLOUR,
  tolerance: 34,
  targetColorCount: 8,
  colorOverrides: [],
  frontColoursCustomized: false,
  selectedColor: 0,
  selectedColourTarget: { type: 'front', index: 0 },
  shellColours: {
    side: '#000000',
    back: '#000000',
  },
  projectId: null,
  savedProjects: [],
  projectLogCount: 0,
  projectLogHydrated: false,
  projectLogPreviewsLoaded: false,
  projectLogPreviewLoading: false,
  projectLogRefreshToken: 0,
  defaultLedPreviewPromise: null,
  defaultLedPreviewScreenshotDataUrl: '',
  ledThreeUpgradeTimer: null,
  ledThreeFrameToken: 0,
  three: null,
  hypeThree: null,
  wizardStep: null,
  uploadTarget: 'led',
  ledUploadSnapshot: null,
  edit: {
    crop: { x: 0, y: 0, w: 1, h: 1 },
    cropAspect: 'free',
    zoom: 1,
  },
  artwork: null,
  uploadedFile: null,
  processed: null,
  processingDirty: false,
  rotation: { ...DEFAULT_PRODUCT_PREVIEW_ROTATION },
  previewZoom: DEFAULT_PRODUCT_PREVIEW_ZOOM,
  previewPan: { x: 0, y: 0 },
  previewTouchGestureActive: false,
  viewportUpdateFrame: null,
  dismissedPreviewAlert: '',
  loadingReady: false,
  productSelectionMenuResolved: false,
  productSelectionMenuOpen: false,
  requiresEmailGate: false,
  studioInitialized: false,
  studioInitializing: null,
  orderInProgress: false,
  bugReportInProgress: false,
  diagnosticsFilter: 'all',
  onboardingDismissedFallback: false,
  onboardingPending: false,
  heicConverterPromise: null,
  plaqueDefaultProjectLoading: false,
  previewRenderTimer: null,
  led: {
    snapshot: null,
  },
  hype: {
    initialized: false,
    renderTimer: null,
    rotation: {
      x: DEFAULT_PRODUCT_PREVIEW_ROTATION.x,
      y: DEFAULT_PRODUCT_PREVIEW_ROTATION.y,
    },
    variant: 'classic',
    patternLength: 2,
    primary: '#111111',
    secondary: '#ffc529',
    tertiary: '#ffffff',
    accent: '#111111',
    pendant: '#202326',
    pendantCasing: '#202326',
    pendantColours: [],
    pendantSourceColours: [],
    pendantColourLabels: [],
    pendantRegionShapes: [],
    pendantBaseDataUrl: '',
    isExampleProject: false,
    logoAspect: 1,
    border: '#111111',
    text: 'MVP',
    logoDataUrl: '',
    logoFileName: '',
    chainLength: 'Adult',
    linkCount: 27,
    quantity: 1,
    finish: 'Matte',
    depth: 4,
    borderThickness: 7,
    connector: 'Medallion',
    ribbon: 'Bold',
    spinner: { ...DEFAULT_HYPE_SPINNER_CONFIG },
  },
  plaque: {
    artwork: null,
    uploadedFile: null,
    uploadFingerprint: '',
    processed: null,
    fileName: '',
    isDefaultPreview: false,
    isExampleProject: false,
    processingDirty: false,
    designName: '',
    projectId: null,
    usage: 'indoor',
    removeBg: true,
    fixFloatingRegions: false,
    floatingSupportColour: DEFAULT_FLOATING_SUPPORT_COLOUR,
    targetColorCount: 8,
    colorOverrides: [],
    frontColoursCustomized: false,
    selectedColor: 0,
    selectedColourTarget: { type: 'front', index: 0 },
    edit: {
      crop: { x: 0, y: 0, w: 1, h: 1 },
      cropAspect: 'free',
      zoom: 1,
    },
    previewZoom: DEFAULT_PRODUCT_PREVIEW_ZOOM,
    previewPan: { x: 0, y: 0 },
    dismissedPreviewAlert: '',
    rotation: { ...DEFAULT_PRODUCT_PREVIEW_ROTATION },
    baseThickness: PLAQUE_DEFAULT_BASE_THICKNESS,
    basePadding: PLAQUE_DEFAULT_BASE_PADDING,
    backingColourOverride: '',
    layerDepths: [],
    colourOverrides: [],
    layerSourceIndices: [],
    selectedLayer: 0,
    visualLayerTrayCollapsed: false,
    visualLayerEditorOpen: false,
    traceQuality: PLAQUE_DEFAULT_TRACE_QUALITY,
    zeroGapColourLayers: true,
    exactPixelBoundaryMode: PLAQUE_DEFAULT_TRACE_QUALITY !== 'smooth',
    previewDebugMode: 'extruded',
    showVectorDebug: false,
    hideTopTexture: false,
    usePngFrontTextureFallback: false,
    showBackingOnly: false,
    wireframe: false,
    normals: false,
    topologyDebug: false,
    showShells: false,
    booleanOnly: true,
    fastPreviewOnly: false,
    buildTimer: null,
    buildToken: 0,
    svgLayerCache: null,
  },
};

const els = {
  appShell: document.querySelector('.app-shell'),
  controlPanel: document.querySelector('.control-panel'),
  previewPanel: document.querySelector('.preview-panel'),
  mobileCommandBar: document.querySelector('#mobileCommandBar'),
  mobileControlSheet: document.querySelector('#mobileControlSheet'),
  mobileSheetBackdrop: document.querySelector('#mobileSheetBackdrop'),
  mobileSheetClose: document.querySelector('#mobileSheetClose'),
  mobilePlaceOrder: document.querySelector('#mobilePlaceOrder'),
  mobileSaveProject: document.querySelector('#mobileSaveProject'),
  mobileCustomize: document.querySelector('#mobileCustomize'),
  backToVisualizer: document.querySelector('#backToVisualizer'),
  mobileProductSummary: document.querySelector('#mobileProductSummary'),
  mobileSelectionSummary: document.querySelector('#mobileSelectionSummary'),
  mobileCheckoutReason: document.querySelector('#mobileCheckoutReason'),
  mobileAdvancedSection: document.querySelector('#mobileAdvancedSection'),
  mobileAdvancedHeading: document.querySelector('#mobileAdvancedHeading'),
  helpMenu: document.querySelector('#helpMenu'),
  helpMenuButton: document.querySelector('#helpMenuButton'),
  helpMenuPopover: document.querySelector('#helpMenuPopover'),
  showTipsButton: document.querySelector('#showTipsButton'),
  reportBugButton: document.querySelector('#reportBugButton'),
  diagnosticsButton: document.querySelector('#diagnosticsButton'),
  diagnosticsMenuBadge: document.querySelector('#diagnosticsMenuBadge'),
  diagnosticsOverlay: document.querySelector('#diagnosticsOverlay'),
  diagnosticsClose: document.querySelector('#diagnosticsClose'),
  diagnosticsSessionId: document.querySelector('#diagnosticsSessionId'),
  diagnosticsBuild: document.querySelector('#diagnosticsBuild'),
  diagnosticsProduct: document.querySelector('#diagnosticsProduct'),
  diagnosticsFilterButtons: [...document.querySelectorAll('[data-diagnostics-filter]')],
  diagnosticsEmpty: document.querySelector('#diagnosticsEmpty'),
  diagnosticsList: document.querySelector('#diagnosticsList'),
  diagnosticsStatus: document.querySelector('#diagnosticsStatus'),
  diagnosticsClear: document.querySelector('#diagnosticsClear'),
  diagnosticsCopy: document.querySelector('#diagnosticsCopy'),
  diagnosticsDownload: document.querySelector('#diagnosticsDownload'),
  diagnosticsReportBug: document.querySelector('#diagnosticsReportBug'),
  bugReportOverlay: document.querySelector('#bugReportOverlay'),
  bugReportForm: document.querySelector('#bugReportForm'),
  bugReportClose: document.querySelector('#bugReportClose'),
  bugReportCancel: document.querySelector('#bugReportCancel'),
  bugReportEmail: document.querySelector('#bugReportEmail'),
  bugReportMessage: document.querySelector('#bugReportMessage'),
  bugReportIncludeScreenshot: document.querySelector('#bugReportIncludeScreenshot'),
  bugReportContext: document.querySelector('#bugReportContext'),
  bugReportStatus: document.querySelector('#bugReportStatus'),
  bugReportSubmit: document.querySelector('#bugReportSubmit'),
  onboardingOverlay: document.querySelector('#onboardingOverlay'),
  onboardingDone: document.querySelector('#onboardingDone'),
  productTabs: [...document.querySelectorAll('[data-product-type]')],
  productSelectionMenu: document.querySelector('#productSelectionMenu'),
  productSelectionCards: [...document.querySelectorAll('[data-product-selection]')],
  changeProductButton: document.querySelector('#changeProductButton'),
  ledStudioSections: [...document.querySelectorAll('.led-studio-section')],
  hypeChainControls: document.querySelector('#hypeChainControls'),
  plaqueStudio: document.querySelector('#plaqueStudio'),
  plaqueChooseFile: document.querySelector('#plaqueChooseFile'),
  plaqueChooseFileText: document.querySelector('#plaqueChooseFileText'),
  plaqueUsageButtons: [...document.querySelectorAll('[data-plaque-usage]')],
  plaqueSizeOutput: document.querySelector('#plaqueSizeOutput'),
  plaqueBaseThickness: document.querySelector('#plaqueBaseThickness'),
  plaqueBaseThicknessValue: document.querySelector('#plaqueBaseThicknessValue'),
  plaqueBasePadding: document.querySelector('#plaqueBasePadding'),
  plaqueBasePaddingValue: document.querySelector('#plaqueBasePaddingValue'),
  plaqueLayerList: document.querySelector('#plaqueLayerList'),
  plaqueVisualLayerTray: document.querySelector('#plaqueVisualLayerTray'),
  plaqueVisualLayerToggle: document.querySelector('#plaqueVisualLayerToggle'),
  plaqueVisualLayerList: document.querySelector('#plaqueVisualLayerList'),
  plaqueTraceQualityButtons: [...document.querySelectorAll('[data-plaque-trace-quality]')],
  plaqueAdvancedSection: document.querySelector('#plaqueAdvancedSection'),
  plaqueAdvancedHeading: document.querySelector('#plaqueAdvancedHeading'),
  plaqueWarnings: document.querySelector('#plaqueWarnings'),
  plaqueComplexityScore: document.querySelector('#plaqueComplexityScore'),
  plaqueVectorDebug: document.querySelector('#plaqueVectorDebug'),
  plaqueHideTopTexture: document.querySelector('#plaqueHideTopTexture'),
  plaqueShowBackingOnly: document.querySelector('#plaqueShowBackingOnly'),
  plaqueWireframe: document.querySelector('#plaqueWireframe'),
  plaqueNormals: document.querySelector('#plaqueNormals'),
  plaqueTopologyDebug: document.querySelector('#plaqueTopologyDebug'),
  plaqueShowShells: document.querySelector('#plaqueShowShells'),
  plaqueBooleanOnly: document.querySelector('#plaqueBooleanOnly'),
  fileInput: document.querySelector('#fileInput'),
  chooseFile: document.querySelector('#chooseFile'),
  chooseFileText: document.querySelector('#chooseFileText'),
  dropZone: document.querySelector('#dropZone'),
  statusPill: document.querySelector('#statusPill'),
  emailGateForm: document.querySelector('#emailGateForm'),
  emailGateError: document.querySelector('#emailGateError'),
  customerEmail: document.querySelector('#customerEmail'),
  designName: document.querySelector('#designName'),
  sizeOutput: document.querySelector('#sizeOutput'),
  usageOutput: document.querySelector('#usageOutput'),
  frontPlateColours: document.querySelector('#frontPlateColours'),
  sideColourButton: document.querySelector('#sideColourButton'),
  backColourButton: document.querySelector('#backColourButton'),
  sideColourHex: document.querySelector('#sideColourHex'),
  backColourHex: document.querySelector('#backColourHex'),
  warnings: document.querySelector('#warnings'),
  previewAlert: document.querySelector('#previewAlert'),
  appLoading: document.querySelector('#appLoading'),
  appLoadingCard: document.querySelector('#appLoadingCard'),
  loadingStartButton: document.querySelector('#loadingStartButton'),
  complexityScore: document.querySelector('#complexityScore'),
  frontSvg: document.querySelector('#frontSvg'),
  defaultLedPreviewImage: document.querySelector('#defaultLedPreviewImage'),
  modelStack: document.querySelector('#modelStack'),
  stage: document.querySelector('#stage'),
  previewTitle: document.querySelector('#previewTitle'),
  previewModeButtons: [...document.querySelectorAll('[data-preview-mode]')],
  editDesignName: document.querySelector('#editDesignName'),
  sessionEmailStat: document.querySelector('#sessionEmailStat'),
  dimensionStat: document.querySelector('#dimensionStat'),
  adminLoginButton: document.querySelector('#adminLoginButton'),
  adminGate: document.querySelector('#adminGate'),
  adminGateForm: document.querySelector('#adminGateForm'),
  adminPassword: document.querySelector('#adminPassword'),
  adminGateError: document.querySelector('#adminGateError'),
  adminCancel: document.querySelector('#adminCancel'),
  depthStat: document.querySelector('#depthStat'),
  illuminateToggle: document.querySelector('#illuminateToggle'),
  lightToggleLabel: document.querySelector('#lightToggleLabel'),
  previewZoomOut: document.querySelector('#previewZoomOut'),
  previewZoomReset: document.querySelector('#previewZoomReset'),
  previewZoomIn: document.querySelector('#previewZoomIn'),
  removeBg: document.querySelector('#removeBg'),
  submitDesign: document.querySelector('#submitDesign'),
  placeOrder: document.querySelector('#placeOrder'),
  submitNote: document.querySelector('#submitNote'),
  hypePreview: document.querySelector('#hypePreview'),
  hypePreviewLoading: document.querySelector('#hypePreviewLoading'),
  hypeChainRender: document.querySelector('#hypeChainRender'),
  hypeChainOval: document.querySelector('#hypeChainOval'),
  hypeConnectorPreview: document.querySelector('#hypeConnectorPreview'),
  hypePendantPreview: document.querySelector('#hypePendantPreview'),
  hypeDropZone: document.querySelector('#hypeDropZone'),
  hypeChooseFile: document.querySelector('#hypeChooseFile'),
  hypeChooseFileText: document.querySelector('#hypeChooseFileText'),
  hypeLogoInput: document.querySelector('#hypeLogoInput'),
  hypeLogoPreview: document.querySelector('#hypeLogoPreview'),
  hypePendantTextPreview: document.querySelector('#hypePendantTextPreview'),
  hypeVariantOutput: document.querySelector('#hypeVariantOutput'),
  hypePendantColourSection: document.querySelector('#hypePendantColourSection'),
  hypePendantColourRow: document.querySelector('#hypePendantColourRow'),
  hypePrimaryColour: document.querySelector('#hypePrimaryColour'),
  hypeSecondaryColour: document.querySelector('#hypeSecondaryColour'),
  hypeTertiaryColour: document.querySelector('#hypeTertiaryColour'),
  hypeAccentColour: document.querySelector('#hypeAccentColour'),
  hypePendantColour: document.querySelector('#hypePendantColour'),
  hypeBorderColour: document.querySelector('#hypeBorderColour'),
  hypePendantText: document.querySelector('#hypePendantText'),
  hypeColourButtons: [...document.querySelectorAll('[data-hype-colour]')],
  hypeSpinnerSection: document.querySelector('#hypeSpinnerSection'),
  hypeSpinnerStatus: document.querySelector('#hypeSpinnerStatus'),
  hypeSpinnerTopText: document.querySelector('#hypeSpinnerTopText'),
  hypeSpinnerBottomText: document.querySelector('#hypeSpinnerBottomText'),
  hypeSpinnerFontFamily: document.querySelector('#hypeSpinnerFontFamily'),
  hypeSpinnerFontButton: document.querySelector('#hypeSpinnerFontButton'),
  hypeSpinnerFontButtonText: document.querySelector('#hypeSpinnerFontButtonText'),
  hypeSpinnerFontMenu: document.querySelector('#hypeSpinnerFontMenu'),
  hypeSpinnerRingColor: document.querySelector('#hypeSpinnerRingColor'),
  hypeSpinnerTextColor: document.querySelector('#hypeSpinnerTextColor'),
  hypeSpinnerBaseColor: document.querySelector('#hypeSpinnerBaseColor'),
  hypeSpinnerRingDiameter: document.querySelector('#hypeSpinnerRingDiameter'),
  hypeSpinnerRingThickness: document.querySelector('#hypeSpinnerRingThickness'),
  hypeSpinnerRingClearance: document.querySelector('#hypeSpinnerRingClearance'),
  hypeSpinnerSpinPreviewToggle: document.querySelector('#hypeSpinnerSpinPreviewToggle'),
  hypePatternLength: document.querySelector('#hypePatternLength'),
  hypeChainLength: document.querySelector('#hypeChainLength'),
  hypeQuantity: document.querySelector('#hypeQuantity'),
  projectFileInput: document.querySelector('#projectFileInput'),
  projectSection: document.querySelector('#projectSection'),
  projectSectionHeading: document.querySelector('#projectSectionHeading'),
  saveProject: document.querySelector('#saveProject'),
  openProject: document.querySelector('#openProject'),
  projectCount: document.querySelector('#projectCount'),
  projectHeadingCount: document.querySelector('#projectHeadingCount'),
  projectList: document.querySelector('#projectList'),
  projectNote: document.querySelector('#projectNote'),
  wizard: document.querySelector('#wizard'),
  wizardTitle: document.querySelector('#wizardTitle'),
  wizardClose: document.querySelector('#wizardClose'),
  wizardSide: document.querySelector('#wizardSide'),
  wizardFooter: document.querySelector('#wizardFooter'),
  wizardArtboard: document.querySelector('#wizardArtboard'),
  wizardImage: document.querySelector('#wizardImage'),
  cropBox: document.querySelector('#cropBox'),
  previewTools: document.querySelector('#previewTools'),
  zoomOut: document.querySelector('#zoomOut'),
  zoomIn: document.querySelector('#zoomIn'),
  colourPopover: document.querySelector('#colourPopover'),
  closeColourPopover: document.querySelector('#closeColourPopover'),
  presetGrid: document.querySelector('#presetGrid'),
  presetPane: document.querySelector('#presetPane'),
  usedPane: document.querySelector('#usedPane'),
  usedGrid: document.querySelector('#usedGrid'),
  customPane: document.querySelector('#customPane'),
  popoverSwatch: document.querySelector('#popoverSwatch'),
  popoverHex: document.querySelector('#popoverHex'),
  customColourInput: document.querySelector('#customColourInput'),
  rgbR: document.querySelector('#rgbR'),
  rgbG: document.querySelector('#rgbG'),
  rgbB: document.querySelector('#rgbB'),
};

const lazyScriptPromises = new Map();
let idleProductPayloadPrefetchScheduled = false;

function loadScriptOnce(src) {
  const normalizedSrc = String(src || '').trim();
  if (!normalizedSrc) return Promise.reject(new Error('Missing script source'));
  if (lazyScriptPromises.has(normalizedSrc)) return lazyScriptPromises.get(normalizedSrc);
  const existing = [...document.scripts].find((script) => script.src && script.src.endsWith(normalizedSrc.replace(/^\.\//, '')));
  if (existing?.dataset.loaded === 'true') return Promise.resolve(existing);
  const promise = new Promise((resolve, reject) => {
    const script = existing || document.createElement('script');
    script.dataset.lazyProductAsset = 'true';
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve(script);
    };
    script.onerror = () => {
      lazyScriptPromises.delete(normalizedSrc);
      reject(new Error(`Failed to load script: ${normalizedSrc}`));
    };
    if (!existing) {
      script.src = normalizedSrc;
      document.body.appendChild(script);
    }
  });
  lazyScriptPromises.set(normalizedSrc, promise);
  return promise;
}

async function loadJsonWithScriptFallback(url, scriptUrl, globalName, errorLabel) {
  if (window[globalName]) return window[globalName];
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${errorLabel} returned ${response.status}`);
    return response.json();
  } catch (fetchError) {
    await loadScriptOnce(scriptUrl);
    if (window[globalName]) return window[globalName];
    throw fetchError;
  }
}

async function ensureSvgLoader() {
  if (window.THREE?.SVGLoader) return true;
  await loadScriptOnce(SVG_LOADER_SCRIPT_SRC);
  return Boolean(window.THREE?.SVGLoader);
}

function scheduleIdleProductPayloadPrefetch() {
  if (idleProductPayloadPrefetchScheduled) return;
  idleProductPayloadPrefetchScheduled = true;
  const run = () => {
    [
      DEFAULT_HYPE_CHAIN_PROJECT_SRC,
      DEFAULT_PLAQUE_PROJECT_SRC,
    ].forEach(prefetchProductPayload);
  };
  const schedule = () => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(run, { timeout: 9000 });
      return;
    }
    window.setTimeout(run, 1200);
  };
  window.setTimeout(schedule, IDLE_PRODUCT_PREFETCH_DELAY_MS);
}

function prefetchProductPayload(src) {
  const href = String(src || '').trim();
  const existing = [...document.querySelectorAll('link[data-product-payload-prefetch]')]
    .some((link) => link.dataset.productPayloadPrefetch === href);
  if (!href || existing) return;
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = 'fetch';
  link.href = href;
  link.dataset.productPayloadPrefetch = href;
  document.head.appendChild(link);
}

boot();

async function boot() {
  setupViewportUnits();
  setupEmailGate();
  if (state.requiresEmailGate) {
    state.loadingReady = true;
    showLoadingStart();
    return;
  }
  await initializeStudioApp();
  await finishAppLoading();
}

async function initializeStudioApp() {
  if (state.studioInitialized) return;
  if (state.studioInitializing) {
    await state.studioInitializing;
    return;
  }
  state.studioInitializing = initializeStudioAppOnce();
  try {
    await state.studioInitializing;
    state.studioInitialized = true;
  } finally {
    state.studioInitializing = null;
  }
}

async function initializeStudioAppOnce() {
  setupAdminMode();
  setupMobileControlSheet();
  setupDiagnosticsConsole();
  setupBugReport();
  setupOnboarding();
  setupProductSelectionMenu();
  applyInitialProductSelectionFromUrl();
  setupProductSwitcher();
  setupPreviewModeControls();
  setupHypeChainControls();
  setupPlaqueControls();
  els.chooseFile.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    els.fileInput.click();
  });
  els.fileInput.addEventListener('change', async () => {
    const files = cloneFileList(els.fileInput.files);
    els.fileInput.value = '';
    await handleFiles(files);
  });
  els.illuminateToggle.addEventListener('change', () => {
    state.illuminated = els.illuminateToggle.checked;
    applyIllumination();
  });
  els.removeBg.addEventListener('change', () => {
    state.removeBg = els.removeBg.checked;
    reprocess();
  });
  document.querySelectorAll('[data-size]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-size]').forEach((b) => b.classList.remove('active'));
      button.classList.add('active');
      state.size = button.dataset.size;
      updateStats();
      schedulePreviewRender();
    });
  });
  document.querySelectorAll('[data-usage]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-usage]').forEach((b) => b.classList.remove('active'));
      button.classList.add('active');
      state.usage = USAGE_PRESETS[button.dataset.usage] ? button.dataset.usage : 'indoor';
      updateStats();
      updateProjectControls();
    });
  });
  els.submitDesign?.addEventListener('click', () => submitDesignRequest());
  els.placeOrder.addEventListener('click', () => placeOrderRequest());
  els.saveProject.addEventListener('click', () => saveProjectFile());
  els.openProject.addEventListener('click', () => els.projectFileInput.click());
  els.projectFileInput.addEventListener('change', () => openProjectFiles(els.projectFileInput.files));
  els.designName.addEventListener('input', () => {
    state.designName = els.designName.value;
    renderPreviewTitle();
    updateProjectControls();
  });
  els.designName.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') finishDesignNameEdit();
    if (event.key === 'Escape') finishDesignNameEdit();
  });
  els.designName.addEventListener('blur', finishDesignNameEdit);
  els.editDesignName.addEventListener('click', startDesignNameEdit);
  els.sideColourButton.addEventListener('click', () => openShellColourPopover('side', els.sideColourButton));
  els.backColourButton.addEventListener('click', () => openShellColourPopover('back', els.backColourButton));
  els.wizardClose.addEventListener('click', () => {
    if (state.uploadTarget === 'hype') restoreLedUploadState();
    closeWizard();
  });
  els.zoomOut.addEventListener('click', () => setWizardZoom(state.edit.zoom - 0.1));
  els.zoomIn.addEventListener('click', () => setWizardZoom(state.edit.zoom + 0.1));
  els.previewZoomOut.addEventListener('click', () => setPreviewZoom(state.previewZoom - 0.15));
  els.previewZoomIn.addEventListener('click', () => setPreviewZoom(state.previewZoom + 0.15));
  els.previewZoomReset.addEventListener('click', resetPreviewView);
  els.backToVisualizer?.addEventListener('click', closeMobileControlSheet);
  els.stage.addEventListener('wheel', (event) => {
    event.preventDefault();
    setPreviewZoom(state.previewZoom + (event.deltaY < 0 ? 0.12 : -0.12));
  }, { passive: false });
  els.stage.addEventListener('click', (event) => {
    if (event.target.closest('[data-open-preview-alert]')) {
      els.previewAlert.classList.add('expanded');
      return;
    }
    if (!event.target.closest('[data-close-preview-alert]')) return;
    els.previewAlert.classList.remove('expanded');
  });
  els.closeColourPopover.addEventListener('click', closeColourPopover);
  els.popoverHex.addEventListener('change', () => applySelectedColour(normalizeHex(els.popoverHex.value)));
  els.customColourInput.addEventListener('input', () => applySelectedColour(els.customColourInput.value));
  [els.rgbR, els.rgbG, els.rgbB].forEach((input) => input.addEventListener('input', () => applyRgbInputs()));
  document.querySelectorAll('[data-popover-tab]').forEach((button) => {
    button.addEventListener('click', () => setPopoverTab(button.dataset.popoverTab));
  });
  buildPresetGrid();
  setupDropZone();
  setupDragRotation();
  setupPreviewTouchGestures();
  setupPlaquePicking();
  setupProjectAccordion();
  setupMobileAdvancedAccordion();
  setupCropInteraction();
  initThreeStage();
  updateStats();
  applyIllumination();
  renderShellColourControls();
  applyHypeStateToControls();
  refreshProjectLog();
  await ensureDefaultLedPreview({ force: true });
  scheduleIdleProductPayloadPrefetch();
}

function setupEmailGate() {
  if (!els.emailGateForm || !els.customerEmail) return;
  const savedEmail = normalizeEmail(localStorage.getItem(EMAIL_STORAGE_KEY));
  if (savedEmail && isValidEmail(savedEmail)) {
    state.customerEmail = savedEmail;
    els.customerEmail.value = savedEmail;
    state.requiresEmailGate = false;
    els.emailGateForm.classList.add('hidden');
    renderSessionEmail();
    queueEmailMarketingSubscription(savedEmail);
    refreshProjectLog();
    return;
  }
  state.requiresEmailGate = true;
  els.emailGateForm.classList.remove('hidden');
  els.customerEmail.disabled = false;
  els.customerEmail.readOnly = false;
  els.appLoadingCard?.classList.add('needs-email');
  if (els.loadingStartButton) {
    els.loadingStartButton.disabled = true;
    els.loadingStartButton.textContent = 'Loading...';
  }
  focusEmailGateInput();
  els.emailGateForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = els.customerEmail.value.trim();
    if (!isValidEmail(email)) {
      els.emailGateForm.classList.add('invalid');
      els.emailGateError.textContent = 'Enter a valid email address to continue.';
      els.customerEmail.focus();
      return;
    }
    state.customerEmail = normalizeEmail(email);
    localStorage.setItem(EMAIL_STORAGE_KEY, state.customerEmail);
    trackSignStudioEvent('sign_up', { method: 'email_gate' });
    queueEmailMarketingSubscription(state.customerEmail);
    renderSessionEmail();
    if (!state.studioInitialized) {
      if (els.loadingStartButton) {
        els.loadingStartButton.disabled = true;
        els.loadingStartButton.textContent = 'Loading...';
      }
      els.emailGateError.textContent = '';
      await initializeStudioApp();
    }
    els.emailGateForm.classList.add('hidden');
    els.emailGateError.textContent = '';
    setStatus('Ready');
    refreshProjectLog();
    hideAppLoading();
  });
  els.customerEmail.addEventListener('input', () => {
    els.emailGateForm.classList.remove('invalid');
    els.emailGateError.textContent = '';
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function queueEmailMarketingSubscription(value, source = EMAIL_MARKETING_SOURCE) {
  const email = normalizeEmail(value);
  if (!isValidEmail(email) || emailMarketingSubmitted.has(email)) return;
  emailMarketingSubmitted.add(email);
  writeEmailMarketingSessionSet();
  const endpoint = getEmailMarketingSubscribeEndpoint();
  if (!endpoint) return;
  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, source }),
  }).then((response) => {
    if (!response.ok) throw new Error(`Shopify subscribe returned ${response.status}`);
  }).catch((error) => {
    console.warn('Could not add email to Shopify marketing subscribers.', error);
  });
}

function getEmailMarketingSubscribeEndpoint() {
  if (window.SIGN_GUY_SHOPIFY_SUBSCRIBE_ENDPOINT) return window.SIGN_GUY_SHOPIFY_SUBSCRIBE_ENDPOINT;
  if (!window.location.protocol.startsWith('http')) return '';
  return new URL('/api/shopify/subscribe', window.location.href).href;
}

function readEmailMarketingSessionSet() {
  try {
    return JSON.parse(sessionStorage.getItem(EMAIL_MARKETING_SESSION_KEY) || '[]')
      .map((email) => normalizeEmail(email))
      .filter((email) => isValidEmail(email));
  } catch {
    return [];
  }
}

function decodeSvgDataUrl(dataUrl) {
  const value = String(dataUrl || '');
  if (!value.startsWith('data:image/svg+xml')) return '';
  const comma = value.indexOf(',');
  if (comma < 0) return '';
  const payload = value.slice(comma + 1);
  try {
    return value.slice(0, comma).includes(';base64') ? atob(payload) : decodeURIComponent(payload);
  } catch {
    return '';
  }
}

function writeEmailMarketingSessionSet() {
  try {
    sessionStorage.setItem(EMAIL_MARKETING_SESSION_KEY, JSON.stringify([...emailMarketingSubmitted]));
  } catch {
    // Session storage is a convenience only; in-memory de-dupe still applies.
  }
}

function renderSessionEmail() {
  if (!els.sessionEmailStat) return;
  els.sessionEmailStat.textContent = state.customerEmail || 'No email';
  syncMobileCommandBar();
}

function setupAdminMode() {
  state.isAdmin = sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  renderAdminMode();
  els.adminLoginButton?.addEventListener('click', () => {
    if (state.isAdmin) {
      logoutAdmin();
      return;
    }
    openAdminGate();
  });
  els.adminCancel?.addEventListener('click', closeAdminGate);
  els.adminGateForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    await loginAdmin();
  });
  els.adminPassword?.addEventListener('input', () => {
    els.adminGate?.classList.remove('invalid');
    if (els.adminGateError) els.adminGateError.textContent = '';
  });
}

function setupViewportUnits() {
  updateViewportUnits();
  window.addEventListener('resize', scheduleViewportUnitsUpdate);
  window.visualViewport?.addEventListener('resize', scheduleViewportUnitsUpdate);
  window.visualViewport?.addEventListener('scroll', scheduleViewportUnitsUpdate);
}

function scheduleViewportUnitsUpdate() {
  if (state.viewportUpdateFrame) return;
  state.viewportUpdateFrame = window.requestAnimationFrame(() => {
    state.viewportUpdateFrame = null;
    updateViewportUnits();
  });
}

function updateViewportUnits() {
  const height = window.visualViewport?.height || window.innerHeight;
  document.documentElement.style.setProperty('--app-vh', `${height}px`);
}

function renderAdminMode() {
  if (els.adminLoginButton) {
    els.adminLoginButton.textContent = state.isAdmin ? 'Admin: Logout' : 'Login';
    els.adminLoginButton.classList.toggle('active', state.isAdmin);
  }
  renderProductAccess();
  renderHypeVariantAccess();
  renderProductSelectionAccess();
  renderArtworkDiagnostics();
  renderProjectLog();
  updateStats();
}

function setupProductSwitcher() {
  els.productTabs.forEach((button) => {
    button.addEventListener('click', () => {
      const productType = button.dataset.productType || 'led';
      if (!canAccessProduct(productType)) return;
      const hypeVariant = button.dataset.hypeVariantTab;
      if (productType === 'hype' && hypeVariant) {
        if (!canAccessHypeVariant(hypeVariant)) return;
        state.hype.variant = hypeVariant === 'spinner' ? 'spinner' : 'classic';
        if (typeof applyHypeStateToControls === 'function') applyHypeStateToControls();
      }
      state.productSelectionMenuResolved = true;
      hideProductSelectionMenu();
      selectProductType(productType);
    });
  });
  renderProductAccess();
  selectProductType(state.productType);
}

function setupProductSelectionMenu() {
  renderProductSelectionAccess();
  els.productSelectionCards.forEach((button) => {
    button.addEventListener('click', () => selectProductSelection(button.dataset.productSelection));
  });
  els.changeProductButton?.addEventListener('click', () => {
    showProductSelectionMenu({ focusFirst: true });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !state.productSelectionMenuOpen || !state.productSelectionMenuResolved) return;
    hideProductSelectionMenu();
  });
}

function applyInitialProductSelectionFromUrl() {
  const choice = readProductSelectionFromUrl();
  if (!choice) return;
  applyProductSelectionState(choice);
  state.productSelectionMenuResolved = true;
}

function readProductSelectionFromUrl() {
  let params;
  try {
    params = new URLSearchParams(window.location.search);
  } catch {
    return null;
  }
  const hash = String(window.location.hash || '').replace(/^#/, '');
  const rawProduct = [
    params.get('product'),
    params.get('productType'),
    params.get('type'),
    params.get('studio'),
    hash,
  ].find(Boolean);
  const rawVariant = [
    params.get('variant'),
    params.get('style'),
    params.get('hypeVariant'),
  ].find(Boolean);
  return normalizeProductSelectionChoice(rawProduct, rawVariant);
}

function normalizeProductSelectionChoice(product, variant = '') {
  const productText = String(product || '').trim().toLowerCase().replace(/[\s_]+/g, '-');
  const variantText = String(variant || '').trim().toLowerCase().replace(/[\s_]+/g, '-');
  const combined = `${productText}-${variantText}`;
  if (!productText && !variantText) return null;
  if (combined.includes('spinner')) return { key: 'spinner-hype', productType: 'hype', hypeVariant: 'spinner' };
  if (combined.includes('classic') || combined.includes('hype-chain') || combined.includes('hype')) {
    return { key: 'classic-hype', productType: 'hype', hypeVariant: 'classic' };
  }
  if (combined.includes('plaque') || combined.includes('wall-plaque') || combined.includes('3d')) {
    return { key: 'plaque', productType: 'plaque' };
  }
  if (combined.includes('led') || combined.includes('lightbox') || combined.includes('sign')) {
    return { key: 'led', productType: 'led' };
  }
  return null;
}

function getProductSelectionChoice(key) {
  switch (key) {
    case 'classic-hype':
      return { key, productType: 'hype', hypeVariant: 'classic' };
    case 'spinner-hype':
      return { key, productType: 'hype', hypeVariant: 'spinner' };
    case 'plaque':
      return { key, productType: 'plaque' };
    case 'led':
    default:
      return { key: 'led', productType: 'led' };
  }
}

function canAccessHypeVariant(variant) {
  const button = document.querySelector(`[data-hype-variant="${variant}"]`);
  return !button || button.getAttribute('aria-disabled') !== 'true';
}

function canSelectProductChoice(choice) {
  if (!choice || !canAccessProduct(choice.productType)) return false;
  if (choice.productType === 'hype' && choice.hypeVariant) return canAccessHypeVariant(choice.hypeVariant);
  return true;
}

function renderProductSelectionAccess() {
  els.productSelectionCards.forEach((button) => {
    const choice = getProductSelectionChoice(button.dataset.productSelection);
    const locked = !canSelectProductChoice(choice);
    const lock = button.querySelector('[data-product-selection-lock]');
    button.disabled = locked;
    button.classList.toggle('is-locked', locked);
    if (lock) {
      lock.hidden = !locked;
      lock.textContent = choice.hypeVariant === 'spinner' && !state.isAdmin ? 'Admin only' : 'Coming soon';
    }
  });
}

function selectProductSelection(key) {
  const choice = getProductSelectionChoice(key);
  if (!canSelectProductChoice(choice)) return;
  state.productSelectionMenuResolved = true;
  hideProductSelectionMenu();
  applyProductSelection(choice);
  trackSignStudioEvent('select_item', {
    ecommerce: {
      item_list_id: 'sign_studio_products',
      item_list_name: 'Sign Studio products',
      items: [getAnalyticsProductItem()],
    },
  });
}

function applyProductSelectionState(choice) {
  if (!choice) return;
  if (choice.productType === 'hype' && choice.hypeVariant) {
    state.hype.variant = choice.hypeVariant === 'spinner' ? 'spinner' : 'classic';
  }
  state.productType = canAccessProduct(choice.productType) ? choice.productType : 'led';
}

function applyProductSelection(choice) {
  applyProductSelectionState(choice);
  if (state.productType === 'hype' && typeof applyHypeStateToControls === 'function') {
    applyHypeStateToControls();
  }
  selectProductType(state.productType);
  renderProductSelectionAccess();
}

function maybeShowInitialProductSelectionMenu() {
  if (!els.productSelectionMenu || !state.studioInitialized || state.productSelectionMenuResolved) return;
  showProductSelectionMenu({ focusFirst: true });
}

function showProductSelectionMenu(options = {}) {
  if (!els.productSelectionMenu) return;
  renderProductSelectionAccess();
  state.productSelectionMenuOpen = true;
  els.productSelectionMenu.classList.remove('hidden');
  els.productSelectionMenu.removeAttribute('hidden');
  els.productSelectionMenu.setAttribute('aria-hidden', 'false');
  document.body.classList.add('product-selection-open');
  els.appShell?.setAttribute('aria-hidden', 'true');
  if (options.focusFirst) {
    window.setTimeout(() => {
      const firstCard = els.productSelectionCards.find((button) => !button.disabled);
      firstCard?.focus({ preventScroll: true });
    }, 40);
  }
}

function hideProductSelectionMenu() {
  if (!els.productSelectionMenu) return;
  state.productSelectionMenuOpen = false;
  els.productSelectionMenu.classList.add('hidden');
  els.productSelectionMenu.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('product-selection-open');
  els.appShell?.removeAttribute('aria-hidden');
}

function canAccessProduct(productType) {
  return productType === 'led' || productType === 'hype' || productType === 'plaque' || state.isAdmin;
}

function renderProductAccess() {
  els.productTabs.forEach((button) => {
    const productType = button.dataset.productType || 'led';
    const hypeVariant = button.dataset.hypeVariantTab;
    const locked = !canAccessProduct(productType)
      || (productType === 'hype' && hypeVariant && !canAccessHypeVariant(hypeVariant));
    button.setAttribute('aria-disabled', locked ? 'true' : 'false');
    button.classList.toggle('product-tab-locked', locked);
    const lock = button.querySelector('.product-lock');
    if (lock) lock.hidden = !locked;
    if (locked) {
      button.setAttribute('aria-describedby', 'productLockTooltip');
    } else {
      button.removeAttribute('aria-describedby');
    }
  });
  if (!canAccessProduct(state.productType)) selectProductType('led');
}

function selectProductType(productType, options = {}) {
  const next = canAccessProduct(productType) ? productType : 'led';
  const previous = state.productType;
  if (next !== 'led') cancelLedThreePreviewUpgrade();
  if (previous === 'led' && next !== 'led') {
    state.led.snapshot = captureCurrentArtworkState();
  }
  if (previous === 'plaque' && next !== 'plaque') {
    storePlaqueArtworkStateFromActive();
  }
  if (next === 'led' && state.led.snapshot) {
    applyArtworkStateSnapshot(state.led.snapshot);
  }
  if (next === 'plaque') {
    activatePlaqueArtworkState();
  }
  state.productType = next;
  document.body.classList.toggle('product-led', next === 'led');
  document.body.classList.toggle('product-hype', next === 'hype');
  document.body.classList.toggle('product-plaque', next === 'plaque');
  if (els.plaqueVisualLayerTray && next !== 'plaque') els.plaqueVisualLayerTray.hidden = true;
  els.productTabs.forEach((button) => {
    const hypeVariant = button.dataset.hypeVariantTab;
    const active = button.dataset.productType === next
      && (!hypeVariant || (next === 'hype' && state.hype.variant === hypeVariant));
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  els.ledStudioSections.forEach((section) => section.classList.toggle('hidden', next !== 'led'));
  els.hypeChainControls?.classList.toggle('hidden', next !== 'hype');
  els.plaqueStudio?.classList.toggle('hidden', next !== 'plaque');
  els.hypePreview?.classList.toggle('hidden', next !== 'hype');
  updateDefaultLedSavedPreview();
  if (next === 'hype') {
    renderPreviewTitle();
    updateProductCta();
    applyPreviewMode();
    updateStats();
    updateProjectControls();
    initializeHypeChainPreview();
    if (!state.hype.logoDataUrl && !state.hypeDefaultProjectLoading) {
      const requestedHypeVariant = state.hype.variant === 'spinner' ? 'spinner' : 'classic';
      loadDefaultHypeChainProject().then(() => {
        if (requestedHypeVariant !== 'spinner' || state.hype.variant === 'spinner') return;
        state.hype.variant = 'spinner';
        applyHypeStateToControls();
        renderPreviewTitle();
        renderHypeChain();
      });
    }
    renderHypeChain();
  } else if (next === 'led') {
    cancelPlaqueBuild();
    finishPlaqueBuildStatus();
    state.previewMode = 'night';
    renderPreviewTitle();
    if (state.processed) {
      renderPreview();
    } else {
      renderEmptyPreview();
      ensureDefaultLedPreview().catch((error) => {
        console.warn('Could not restore the default LED preview.', error);
      });
    }
  } else {
    renderPreviewTitle();
    renderPlaqueControls();
    if (state.plaque.artwork?.type === 'svg' && !window.THREE?.SVGLoader) {
      ensureSvgLoader()
        .then(() => schedulePlaqueBuild(0))
        .catch((error) => console.warn('Could not lazy-load SVG plaque parser.', error));
    }
    if (shouldLoadDefaultPlaqueProject()) {
      renderEmptyPreview();
      loadDefaultPlaqueProject();
    } else if (shouldBuildPlaquePreview()) {
      clearThreeModel();
      els.stage.classList.remove('three-active');
      schedulePlaqueBuild(50);
    } else {
      renderEmptyPreview();
    }
  }
  updateProductCta();
  applyPreviewMode();
  updateStats();
  updateProjectControls();
  refreshProjectLog();
}

function setupPreviewModeControls() {
  if (!els.stage || !els.previewModeButtons.length) return;
  els.previewModeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const mode = button.dataset.previewMode;
      if (!['day', 'night', 'wall'].includes(mode)) return;
      state.previewMode = mode;
      applyPreviewMode();
    });
  });
  applyPreviewMode();
}

function hasUploadedArtwork() {
  const hasLedArtwork = Boolean(!state.isDefaultPreview && (state.uploadedFile || state.processed));
  const hasHypeArtwork = Boolean(state.hype.logoDataUrl && !state.hype.isExampleProject);
  const hasPlaqueArtwork = Boolean(state.productType === 'plaque' && !state.isDefaultPreview && state.processed);
  return hasLedArtwork || hasHypeArtwork || hasPlaqueArtwork;
}

function getActiveUsageKey() {
  return state.productType === 'plaque'
    ? getPlaqueUsageKey()
    : (USAGE_PRESETS[state.usage] ? state.usage : 'indoor');
}

function getActiveUsagePreset() {
  return USAGE_PRESETS[getActiveUsageKey()] || USAGE_PRESETS.indoor;
}

function applyPreviewMode() {
  if (!els.stage) return;
  let mode = ['day', 'night', 'wall'].includes(state.previewMode) ? state.previewMode : 'night';
  if (state.productType === 'led' && mode === 'wall') mode = 'night';
  if (state.productType === 'hype' && mode === 'day') mode = 'night';
  if (state.productType === 'plaque' && mode === 'night') mode = 'day';
  state.previewMode = mode;
  els.stage.classList.remove('preview-mode-day', 'preview-mode-night', 'preview-mode-wall');
  els.stage.classList.add(`preview-mode-${mode}`);
  els.previewModeButtons?.forEach((button) => {
    const hidden = (state.productType === 'led' && button.dataset.previewMode === 'wall')
      || (state.productType === 'hype' && button.dataset.previewMode === 'day')
      || (state.productType === 'plaque' && button.dataset.previewMode === 'night');
    button.hidden = hidden;
    const active = button.dataset.previewMode === mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
    if (state.productType === 'hype') {
      if (button.dataset.previewMode === 'night') {
        button.innerHTML = getPreviewModeIcon('night');
        button.setAttribute('aria-label', 'Dark');
      }
      if (button.dataset.previewMode === 'wall') {
        button.innerHTML = getPreviewModeIcon('day');
        button.setAttribute('aria-label', 'Light');
      }
    } else {
      if (button.dataset.previewMode === 'night') {
        button.innerHTML = getPreviewModeIcon('night');
        button.setAttribute('aria-label', 'Night View');
      }
      if (button.dataset.previewMode === 'day') {
        button.innerHTML = getPreviewModeIcon('day');
        button.setAttribute('aria-label', 'Day View');
      }
    }
  });
  applyPreviewEnvironment();
}

function getPreviewModeIcon(type) {
  if (type === 'day') {
    return `
      <svg class="preview-mode-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2"></path>
        <path d="M12 20v2"></path>
        <path d="m4.93 4.93 1.41 1.41"></path>
        <path d="m17.66 17.66 1.41 1.41"></path>
        <path d="M2 12h2"></path>
        <path d="M20 12h2"></path>
        <path d="m6.34 17.66-1.41 1.41"></path>
        <path d="m19.07 4.93-1.41 1.41"></path>
      </svg>`;
  }
  return `
    <svg class="preview-mode-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 14.6A8.6 8.6 0 0 1 9.4 3 7.7 7.7 0 1 0 21 14.6Z"></path>
    </svg>`;
}

function getPreviewEnvironmentSettings() {
  const mode = ['day', 'night', 'wall'].includes(state.previewMode) ? state.previewMode : 'night';
  if (state.productType === 'hype') {
    const hypeSettings = {
      day: { exposure: 1.08, cameraScale: 1.02, hemi: 1.08, key: 0.92, rim: 0.32, floor: 0.22 },
      night: { exposure: 0.98, cameraScale: 1, hemi: 0.54, key: 1.04, rim: 0.78, floor: 0.16 },
      wall: { exposure: 1.06, cameraScale: 0.97, hemi: 0.86, key: 0.9, rim: 0.64, floor: 0.18 },
    };
    return hypeSettings[mode] || hypeSettings.night;
  }
  if (state.productType === 'plaque') {
    const plaqueSettings = {
      day: { exposure: 1.1, cameraScale: 0.96, hemi: 1.04, key: 0.96, rim: 0.48, floor: 0.3, glow: 0, wallHalo: 0, contact: 1.08, cast: 0.82, wall: 1 },
      wall: { exposure: 1.07, cameraScale: 1.02, hemi: 0.92, key: 0.88, rim: 0.62, floor: 0.24, glow: 0, wallHalo: 0, contact: 0.92, cast: 0.58, wall: 1.2 },
      night: { exposure: 1.02, cameraScale: 1, hemi: 0.76, key: 0.78, rim: 0.78, floor: 0.18, glow: 0, wallHalo: 0, contact: 1, cast: 0.86, wall: 1 },
    };
    return plaqueSettings[mode] || plaqueSettings.day;
  }
  const ledSettings = {
    day: { exposure: 1.08, cameraScale: 1.02, hemi: 1.08, key: 0.88, rim: 0.42, floor: 0.24, glow: 0.52, wallHalo: 0.42, contact: 0.82, cast: 0.58, wall: 0.72 },
    night: { exposure: 1.04, cameraScale: 1, hemi: 0.68, key: 0.72, rim: 0.82, floor: 0.18, glow: 1.38, wallHalo: 1.52, contact: 1, cast: 1.08, wall: 1 },
    wall: { exposure: 1.02, cameraScale: 1.12, hemi: 0.9, key: 0.76, rim: 0.46, floor: 0.12, glow: 0.96, wallHalo: 2.12, contact: 0.44, cast: 0.28, wall: 1.68 },
  };
  return ledSettings[mode] || ledSettings.night;
}

function applyPreviewEnvironment() {
  const settings = getPreviewEnvironmentSettings();
  if (state.three?.renderer) {
    state.three.renderer.toneMappingExposure = settings.exposure || 1.04;
    const lights = state.three.environmentLights;
    if (lights) {
      lights.hemi.intensity = settings.hemi;
      lights.key.intensity = settings.key;
      lights.rim.intensity = settings.rim;
      lights.floorFill.intensity = settings.floor;
    }
    applyPreviewZoom({ render: false });
    updateFloorEffects();
    renderThree();
  }
  if (state.hypeThree?.renderer) {
    state.hypeThree.renderer.toneMappingExposure = settings.exposure || 1.02;
    const lights = state.hypeThree.environmentLights;
    if (lights) {
      lights.hemi.intensity = settings.hemi;
      lights.key.intensity = settings.key;
      lights.rim.intensity = settings.rim;
    }
    frameHypeCamera({ smooth: true });
    renderHypeThree();
  }
}

function updateProductCta() {
  if (!els.placeOrder) return;
  els.placeOrder.textContent = state.orderInProgress ? 'Placing Order...' : 'Place Order';
  syncMobileCommandBar();
}

function setupMobileControlSheet() {
  if (!els.mobileControlSheet || !els.mobileCustomize) return;
  updateMobileControlAccessibility();
  els.mobileCustomize.addEventListener('click', () => openMobileControlSheet());
  els.mobileSheetClose?.addEventListener('click', () => closeMobileControlSheet());
  els.mobileSheetBackdrop?.addEventListener('click', () => closeMobileControlSheet());
  els.mobilePlaceOrder?.addEventListener('click', () => {
    if (!els.placeOrder?.disabled) els.placeOrder.click();
  });
  els.mobileSaveProject?.addEventListener('click', () => {
    if (!els.saveProject?.disabled) els.saveProject.click();
  });
  setupMobileControlSheetSwipeGestures();
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.body.classList.contains('mobile-controls-open')) {
      closeMobileControlSheet();
    }
  });
  [els.placeOrder, els.saveProject].forEach((button) => {
    if (!button) return;
    const observer = new MutationObserver(syncMobileCommandBar);
    observer.observe(button, { attributes: true, attributeFilter: ['disabled'], childList: true, subtree: true });
  });
  window.addEventListener('resize', updateMobileControlAccessibility);
  syncMobileCommandBar();
}

function setupMobileControlSheetSwipeGestures() {
  const sheetHeader = els.mobileControlSheet?.querySelector('.mobile-sheet-header');

  attachMobileVerticalSwipe(els.mobileCommandBar, {
    direction: 'up',
    onSwipe: () => openMobileControlSheet(),
  });

  attachMobileVerticalSwipe(sheetHeader, {
    direction: 'down',
    onSwipe: () => closeMobileControlSheet(),
  });
}

function attachMobileVerticalSwipe(element, options = {}) {
  if (!element) return;
  let gesture = null;
  let suppressClick = false;

  element.addEventListener('pointerdown', (event) => {
    if (!isMobileControlLayout() || (event.pointerType && event.pointerType !== 'touch')) return;
    gesture = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      active: false,
    };
    try {
      element.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture can fail if the touch sequence is interrupted.
    }
  });

  element.addEventListener('pointermove', (event) => {
    if (!gesture || event.pointerId !== gesture.id) return;
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx) * 1.25) {
      gesture.active = true;
      event.preventDefault();
    }
  });

  const finish = (event) => {
    if (!gesture || event.pointerId !== gesture.id) return;
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    const isVertical = Math.abs(dy) > Math.abs(dx) * 1.25;
    const swipedUp = options.direction === 'up' && dy <= -MOBILE_SHEET_SWIPE_THRESHOLD;
    const swipedDown = options.direction === 'down' && dy >= MOBILE_SHEET_SWIPE_THRESHOLD;
    if (gesture.active && isVertical && (swipedUp || swipedDown)) {
      suppressClick = true;
      options.onSwipe?.();
      window.setTimeout(() => {
        suppressClick = false;
      }, 250);
    }
    gesture = null;
  };

  element.addEventListener('pointerup', finish);
  element.addEventListener('pointercancel', () => {
    gesture = null;
  });
  element.addEventListener('lostpointercapture', () => {
    gesture = null;
  });
  element.addEventListener('click', (event) => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);
}

function isMobileControlLayout() {
  return window.matchMedia?.('(max-width: 880px)').matches;
}

function updateMobileControlAccessibility() {
  if (!els.mobileControlSheet) return;
  if (!isMobileControlLayout()) {
    document.body.classList.remove('mobile-controls-open');
    els.mobileControlSheet.removeAttribute('aria-hidden');
    els.mobileControlSheet.inert = false;
    if (els.mobileSheetBackdrop) els.mobileSheetBackdrop.hidden = true;
    els.mobileCustomize?.setAttribute('aria-expanded', 'false');
    return;
  }
  const open = document.body.classList.contains('mobile-controls-open');
  els.mobileControlSheet.setAttribute('aria-hidden', open ? 'false' : 'true');
  els.mobileControlSheet.inert = !open;
}

function openMobileControlSheet(options = {}) {
  closeOnboarding();
  document.body.classList.add('mobile-controls-open');
  els.mobileControlSheet?.setAttribute('aria-hidden', 'false');
  if (els.mobileControlSheet) els.mobileControlSheet.inert = false;
  els.mobileCustomize?.setAttribute('aria-expanded', 'true');
  if (els.mobileSheetBackdrop) els.mobileSheetBackdrop.hidden = false;
  if (options.focusProjectSection) {
    setProjectSectionExpanded(true);
    window.setTimeout(() => {
      els.projectSection?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }, 120);
  }
}

function closeMobileControlSheet() {
  document.body.classList.remove('mobile-controls-open');
  if (isMobileControlLayout()) {
    els.mobileControlSheet?.setAttribute('aria-hidden', 'true');
    if (els.mobileControlSheet) els.mobileControlSheet.inert = true;
  } else {
    els.mobileControlSheet?.removeAttribute('aria-hidden');
    if (els.mobileControlSheet) els.mobileControlSheet.inert = false;
  }
  els.mobileCustomize?.setAttribute('aria-expanded', 'false');
  if (els.mobileSheetBackdrop) els.mobileSheetBackdrop.hidden = true;
}

function setProjectSectionExpanded(expanded) {
  if (!els.projectSection || !els.projectSectionHeading) return;
  els.projectSection.classList.toggle('mobile-expanded', expanded);
  els.projectSection.classList.toggle('mobile-collapsed', !expanded);
  els.projectSectionHeading.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  if (expanded) {
    state.projectLogHydrated = false;
    if (els.projectList && state.projectLogCount > 0) {
      els.projectList.innerHTML = '<p class="project-empty">Loading saved designs...</p>';
    }
    refreshProjectLog({ forcePreviews: true });
  } else if (els.projectList) {
    els.projectList.innerHTML = '';
    state.savedProjects = (state.savedProjects || []).map(summarizeProjectRecord);
    state.projectLogHydrated = false;
    state.projectLogPreviewsLoaded = false;
  }
}

function isProjectSectionExpanded() {
  return Boolean(els.projectSection?.classList.contains('mobile-expanded'));
}

function setMobileAdvancedExpanded(expanded) {
  if (!els.mobileAdvancedSection || !els.mobileAdvancedHeading) return;
  els.mobileAdvancedSection.classList.toggle('mobile-expanded', expanded);
  els.mobileAdvancedSection.classList.toggle('mobile-collapsed', !expanded);
  els.mobileAdvancedHeading.setAttribute('aria-expanded', expanded ? 'true' : 'false');
}

function setupMobileAccordion(section, heading) {
  if (!section || !heading) return;
  section.classList.remove('mobile-expanded');
  section.classList.add('mobile-collapsed');
  heading.setAttribute('aria-expanded', 'false');
  const toggle = () => {
    const expanded = !section.classList.contains('mobile-expanded');
    section.classList.toggle('mobile-expanded', expanded);
    section.classList.toggle('mobile-collapsed', !expanded);
    heading.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  };
  heading.addEventListener('click', toggle);
  heading.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    toggle();
  });
}

function syncMobileCommandBar() {
  if (els.mobilePlaceOrder && els.placeOrder) {
    els.mobilePlaceOrder.disabled = els.placeOrder.disabled;
    els.mobilePlaceOrder.textContent = state.orderInProgress ? 'Placing Order...' : 'Place Order';
  }
  if (els.mobileSaveProject && els.saveProject) {
    els.mobileSaveProject.disabled = els.saveProject.disabled;
  }
  if (els.mobileProductSummary) {
    els.mobileProductSummary.textContent = state.productType === 'hype'
      ? 'Hype Chain'
      : (state.productType === 'plaque' ? '3D Plaque' : 'LED Sign');
  }
  if (els.mobileSelectionSummary) {
    els.mobileSelectionSummary.textContent = getMobileCheckoutSelectionLabel();
  }
  if (els.mobileCheckoutReason && els.placeOrder) {
    const reason = els.placeOrder.disabled && !state.orderInProgress ? getMobilePlaceOrderDisabledReason() : '';
    els.mobileCheckoutReason.textContent = reason;
    els.mobileCheckoutReason.hidden = !reason;
  }
}

function getMobileCheckoutSelectionLabel() {
  if (state.productType === 'hype') {
    return 'Custom pendant chain';
  }
  if (state.productType === 'plaque') {
    const layerCount = state.processed?.colours?.length || 0;
    const usage = USAGE_PRESETS[getPlaqueUsageKey()] || USAGE_PRESETS.indoor;
    return `${SIZE_PRESETS[state.size]?.label || SIZE_PRESETS.large.label} - ${usage.label} plaque${layerCount ? ` - ${layerCount} colours` : ''}`;
  }
  const preset = SIZE_PRESETS[state.size] || SIZE_PRESETS.large;
  const usage = USAGE_PRESETS[state.usage] || USAGE_PRESETS.indoor;
  return `${preset.label} - ${usage.label}`;
}

function getMobilePlaceOrderDisabledReason() {
  if (state.productType === 'hype') {
    if (!hasOrderableHypeLogo()) return 'Upload a logo first';
  } else if (state.productType === 'plaque') {
    if (!hasOrderablePlaqueArtwork()) return 'Upload a logo first';
  } else if (!hasOrderableLedArtwork()) {
    return 'Upload a logo first';
  }
  if (!state.customerEmail) return 'Enter your email first';
  return 'Finish required options';
}

function setupDiagnosticsConsole() {
  const diagnostics = getSignStudioDiagnostics();
  diagnostics.onChange(() => renderDiagnosticsConsole());
  els.diagnosticsButton?.addEventListener('click', () => openDiagnosticsConsole());
  els.diagnosticsClose?.addEventListener('click', closeDiagnosticsConsole);
  els.diagnosticsOverlay?.addEventListener('click', (event) => {
    if (event.target === els.diagnosticsOverlay) closeDiagnosticsConsole();
  });
  els.diagnosticsFilterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.diagnosticsFilter = button.dataset.diagnosticsFilter || 'all';
      renderDiagnosticsConsole();
    });
  });
  els.diagnosticsClear?.addEventListener('click', () => {
    diagnostics.clear();
    setDiagnosticsStatus('Diagnostics cleared.');
  });
  els.diagnosticsCopy?.addEventListener('click', () => copyDiagnosticsReport());
  els.diagnosticsDownload?.addEventListener('click', () => downloadDiagnosticsReport());
  els.diagnosticsReportBug?.addEventListener('click', () => {
    closeDiagnosticsConsole();
    openBugReport();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isDiagnosticsConsoleOpen()) closeDiagnosticsConsole();
  });
  if (new URLSearchParams(window.location.search).get('debug') === '1') {
    window.setTimeout(openDiagnosticsConsole, 0);
  }
  renderDiagnosticsConsole();
}

function getSignStudioDiagnostics() {
  if (window.SignStudioDiagnostics) return window.SignStudioDiagnostics;
  const entries = [];
  const subscribers = new Set();
  window.SignStudioDiagnostics = {
    entries,
    sessionId: `SS-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    add(entry) {
      entries.push({
        id: `diag-${Date.now().toString(36)}`,
        timestamp: new Date().toISOString(),
        level: entry?.level || 'info',
        source: entry?.source || 'app',
        message: String(entry?.message || 'Diagnostic event'),
        detail: entry?.detail ? String(entry.detail) : '',
      });
      subscribers.forEach((callback) => callback(entries));
    },
    clear() {
      entries.splice(0, entries.length);
      subscribers.forEach((callback) => callback(entries));
    },
    onChange(callback) {
      subscribers.add(callback);
      callback(entries);
      return () => subscribers.delete(callback);
    },
  };
  return window.SignStudioDiagnostics;
}

function isDiagnosticsConsoleOpen() {
  return Boolean(els.diagnosticsOverlay && !els.diagnosticsOverlay.classList.contains('hidden'));
}

function openDiagnosticsConsole() {
  closeHelpMenu();
  closeOnboarding();
  closeBugReport();
  closeMobileControlSheet();
  if (!els.diagnosticsOverlay) return;
  els.diagnosticsOverlay.classList.remove('hidden');
  els.diagnosticsOverlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('diagnostics-open');
  renderDiagnosticsConsole();
  window.setTimeout(() => els.diagnosticsClose?.focus({ preventScroll: true }), 0);
}

function closeDiagnosticsConsole() {
  els.diagnosticsOverlay?.classList.add('hidden');
  els.diagnosticsOverlay?.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('diagnostics-open');
}

function renderDiagnosticsConsole() {
  const diagnostics = getSignStudioDiagnostics();
  const entries = diagnostics.entries || [];
  const counts = getDiagnosticCounts(entries);
  const issueCount = counts.error + counts.warn + counts.network;
  renderDiagnosticsBadge(els.diagnosticsMenuBadge, issueCount);
  if (els.diagnosticsSessionId) els.diagnosticsSessionId.textContent = `Session ${diagnostics.sessionId || 'unknown'}`;
  if (els.diagnosticsBuild) els.diagnosticsBuild.textContent = `Build ${getDisplayedBuildNumber()}`;
  if (els.diagnosticsProduct) els.diagnosticsProduct.textContent = getBugReportProductLabel();
  els.diagnosticsFilterButtons.forEach((button) => {
    const filter = button.dataset.diagnosticsFilter || 'all';
    const active = filter === state.diagnosticsFilter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
    button.textContent = getDiagnosticFilterLabel(filter, counts);
  });
  const filtered = filterDiagnosticEntries(entries, state.diagnosticsFilter)
    .slice(-DIAGNOSTIC_LIST_LIMIT)
    .reverse();
  if (els.diagnosticsEmpty) {
    els.diagnosticsEmpty.hidden = filtered.length > 0;
    els.diagnosticsEmpty.textContent = entries.length
      ? 'No diagnostics match this filter.'
      : 'No diagnostics captured yet.';
  }
  if (els.diagnosticsList) {
    els.diagnosticsList.innerHTML = filtered.map((entry) => renderDiagnosticEntry(entry)).join('');
  }
  const updatedAt = entries.length ? formatDiagnosticsTime(entries[entries.length - 1].timestamp) : '';
  setDiagnosticsStatus(entries.length
    ? `${entries.length} event${entries.length === 1 ? '' : 's'} captured${updatedAt ? ` - last ${updatedAt}` : ''}.`
    : 'Waiting for events.');
}

function renderDiagnosticsBadge(element, count) {
  if (!element) return;
  element.hidden = count <= 0;
  element.textContent = count > 99 ? '99+' : String(count);
}

function getDiagnosticCounts(entries) {
  return entries.reduce((counts, entry) => {
    const level = normalizeDiagnosticLevel(entry.level);
    counts.all += 1;
    counts[level] = (counts[level] || 0) + 1;
    return counts;
  }, { all: 0, error: 0, warn: 0, network: 0, info: 0 });
}

function getDiagnosticFilterLabel(filter, counts) {
  if (filter === 'error') return `Errors ${counts.error || 0}`;
  if (filter === 'warn') return `Warnings ${counts.warn || 0}`;
  if (filter === 'network') return `Network ${counts.network || 0}`;
  return `All ${counts.all || 0}`;
}

function filterDiagnosticEntries(entries, filter) {
  if (filter === 'all') return entries;
  return entries.filter((entry) => normalizeDiagnosticLevel(entry.level) === filter);
}

function renderDiagnosticEntry(entry) {
  const level = normalizeDiagnosticLevel(entry.level);
  const detail = String(entry.detail || '').trim();
  return `
    <li class="diagnostics-item ${level}">
      <div class="diagnostics-item-top">
        <span class="diagnostics-level">${escapeHtml(level)}</span>
        <time datetime="${escapeHtml(entry.timestamp || '')}">${escapeHtml(formatDiagnosticsTime(entry.timestamp))}</time>
        <span>${escapeHtml(entry.source || 'app')}</span>
      </div>
      <p>${escapeHtml(entry.message || 'Diagnostic event')}</p>
      ${detail ? `<details><summary>Details</summary><pre>${escapeHtml(detail)}</pre></details>` : ''}
    </li>
  `;
}

function normalizeDiagnosticLevel(level) {
  if (level === 'warning') return 'warn';
  if (level === 'network') return 'network';
  if (level === 'error' || level === 'warn' || level === 'info') return level;
  return 'info';
}

function formatDiagnosticsTime(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function setDiagnosticsStatus(text) {
  if (els.diagnosticsStatus) els.diagnosticsStatus.textContent = text;
}

async function copyDiagnosticsReport() {
  const report = makeDiagnosticsReportText();
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable.');
    await navigator.clipboard.writeText(report);
  } catch {
    copyTextWithFallback(report);
  }
  setDiagnosticsStatus('Diagnostics report copied.');
}

function copyTextWithFallback(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

function downloadDiagnosticsReport() {
  const report = makeDiagnosticsReportText();
  const filename = `${safeFileName(getDesignName() || getBugReportProductLabel())}-diagnostics.txt`;
  downloadBlob(new Blob([report], { type: 'text/plain' }), filename, 'text/plain');
  setDiagnosticsStatus('Diagnostics report downloaded.');
}

function makeDiagnosticsReportText(limit = DIAGNOSTIC_REPORT_LIMIT) {
  const diagnostics = getSignStudioDiagnostics();
  const entries = (diagnostics.entries || []).slice(-limit).reverse();
  const lines = [
    'Sign Studio diagnostics report',
    '',
    ...getBugReportContextLines(state.customerEmail, { includeDiagnostics: false }),
    `Diagnostics session: ${diagnostics.sessionId || 'unknown'}`,
    `Captured events: ${(diagnostics.entries || []).length}`,
    '',
    'Recent events',
  ];
  if (!entries.length) {
    lines.push('No diagnostic events captured.');
    return lines.join('\n');
  }
  entries.forEach((entry, index) => {
    lines.push(`${index + 1}. [${normalizeDiagnosticLevel(entry.level).toUpperCase()}] ${entry.timestamp || ''} ${entry.source || 'app'} - ${entry.message || 'Diagnostic event'}`);
    if (entry.detail) lines.push(`   ${String(entry.detail).replace(/\s+/g, ' ').slice(0, 1200)}`);
  });
  return lines.join('\n');
}

function getDiagnosticsReportLines(limit = 12) {
  const diagnostics = getSignStudioDiagnostics();
  return (diagnostics.entries || [])
    .slice(-limit)
    .reverse()
    .map((entry) => `[${normalizeDiagnosticLevel(entry.level).toUpperCase()}] ${formatDiagnosticsTime(entry.timestamp)} ${entry.source || 'app'}: ${entry.message || 'Diagnostic event'}`);
}

function setupBugReport() {
  els.helpMenuButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleHelpMenu();
  });
  els.helpMenuPopover?.addEventListener('click', (event) => event.stopPropagation());
  document.addEventListener('click', (event) => {
    if (!els.helpMenu || els.helpMenu.contains(event.target)) return;
    closeHelpMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (isBugReportOpen()) {
      closeBugReport();
      return;
    }
    closeHelpMenu();
  });
  els.reportBugButton?.addEventListener('click', () => openBugReport());
  els.bugReportClose?.addEventListener('click', closeBugReport);
  els.bugReportCancel?.addEventListener('click', closeBugReport);
  els.bugReportOverlay?.addEventListener('click', (event) => {
    if (event.target === els.bugReportOverlay) closeBugReport();
  });
  els.bugReportForm?.addEventListener('submit', handleBugReportSubmit);
}

function toggleHelpMenu(forceOpen = null) {
  if (!els.helpMenuPopover || !els.helpMenuButton) return;
  const open = forceOpen === null ? els.helpMenuPopover.classList.contains('hidden') : Boolean(forceOpen);
  els.helpMenuPopover.classList.toggle('hidden', !open);
  els.helpMenuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function closeHelpMenu() {
  toggleHelpMenu(false);
}

function isBugReportOpen() {
  return Boolean(els.bugReportOverlay && !els.bugReportOverlay.classList.contains('hidden'));
}

function openBugReport() {
  closeHelpMenu();
  closeOnboarding();
  closeMobileControlSheet();
  if (!els.bugReportOverlay || !els.bugReportForm) return;
  els.bugReportOverlay.classList.remove('hidden');
  els.bugReportOverlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('bug-report-open');
  if (els.bugReportEmail) els.bugReportEmail.value = state.customerEmail || '';
  if (els.bugReportMessage) els.bugReportMessage.value = '';
  if (els.bugReportIncludeScreenshot) els.bugReportIncludeScreenshot.checked = true;
  renderBugReportContext();
  setBugReportStatus('');
  window.setTimeout(() => els.bugReportMessage?.focus({ preventScroll: true }), 0);
}

function closeBugReport() {
  if (state.bugReportInProgress) return;
  els.bugReportOverlay?.classList.add('hidden');
  els.bugReportOverlay?.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('bug-report-open');
}

function renderBugReportContext() {
  if (!els.bugReportContext) return;
  els.bugReportContext.textContent = getBugReportContextLines().join('\n');
}

async function handleBugReportSubmit(event) {
  event.preventDefault();
  if (!els.bugReportForm || state.bugReportInProgress) return;
  const message = String(els.bugReportMessage?.value || '').trim();
  const email = normalizeEmail(els.bugReportEmail?.value || state.customerEmail);
  if (!message) {
    setBugReportStatus('Tell us what went wrong first.', 'error');
    els.bugReportMessage?.focus();
    return;
  }
  if (email && !isValidEmail(email)) {
    setBugReportStatus('Enter a valid email address, or leave it blank.', 'error');
    els.bugReportEmail?.focus();
    return;
  }

  state.bugReportInProgress = true;
  setBugReportBusy(true);
  setBugReportStatus('Sending bug report...');

  const payload = makeBugReportPayload({ message, email });
  const screenshot = els.bugReportIncludeScreenshot?.checked
    ? await captureBugReportScreenshotSafely()
    : null;

  try {
    const endpoint = getBugReportEndpoint();
    if (!endpoint) throw new Error('Bug report endpoint is unavailable.');
    await submitBugReportToEndpoint(endpoint, payload, screenshot);
    setBugReportStatus('Bug report sent. Thank you for catching it.', 'success');
    setStatus('Bug reported');
    window.setTimeout(() => {
      state.bugReportInProgress = false;
      setBugReportBusy(false);
      closeBugReport();
    }, 1200);
    return;
  } catch (error) {
    console.warn('Could not submit bug report automatically; opening email draft.', error);
    openBugReportMailDraft(payload, screenshot);
    setBugReportStatus('Automatic bug reporting is unavailable here, so a prefilled email draft was opened instead.', 'success');
    setStatus('Bug draft');
  } finally {
    state.bugReportInProgress = false;
    setBugReportBusy(false);
  }
}

function setBugReportBusy(busy) {
  if (els.bugReportSubmit) {
    els.bugReportSubmit.disabled = busy;
    els.bugReportSubmit.textContent = busy ? 'Sending...' : 'Send report';
  }
  if (els.bugReportCancel) els.bugReportCancel.disabled = busy;
  if (els.bugReportClose) els.bugReportClose.disabled = busy;
  if (els.bugReportMessage) els.bugReportMessage.disabled = busy;
  if (els.bugReportEmail) els.bugReportEmail.disabled = busy;
  if (els.bugReportIncludeScreenshot) els.bugReportIncludeScreenshot.disabled = busy;
}

function setBugReportStatus(text, type = '') {
  if (!els.bugReportStatus) return;
  els.bugReportStatus.textContent = text;
  els.bugReportStatus.classList.toggle('is-error', type === 'error');
  els.bugReportStatus.classList.toggle('is-success', type === 'success');
}

function makeBugReportPayload({ message, email }) {
  const contextLines = getBugReportContextLines(email);
  return {
    subject: `${BUG_REPORT_SUBJECT} - ${getBugReportProductLabel()}`,
    message,
    email,
    contextLines,
    contextText: contextLines.join('\n'),
  };
}

function getBugReportProductLabel() {
  if (state.productType === 'hype') {
    return state.hype.variant === 'spinner' ? 'Spinner Hype Chain' : 'Classic Hype Chain';
  }
  if (state.productType === 'plaque') return '3D Plaque';
  return 'LED Sign';
}

function getBugReportContextLines(email = state.customerEmail, options = {}) {
  const lines = [
    `Product: ${getBugReportProductLabel()}`,
    `Project type: ${currentProjectType()}`,
    `Build: ${getDisplayedBuildNumber()}`,
    `Design name: ${getDesignName() || 'Untitled'}`,
    `Customer email: ${email || state.customerEmail || 'Not provided'}`,
    `URL: ${window.location.href}`,
    `Time: ${new Date().toISOString()}`,
    `Browser: ${navigator.userAgent}`,
    `Viewport: ${window.innerWidth} x ${window.innerHeight}`,
    `Preview mode: ${state.previewMode}`,
    `Illuminated: ${state.illuminated ? 'Yes' : 'No'}`,
  ];
  if (state.productType === 'hype') {
    lines.push(
      `Hype style: ${state.hype.variant === 'spinner' ? 'Spinner' : 'Classic'}`,
      `Chain length: ${state.hype.chainLength || 'adult'}`,
      `Pattern length: ${state.hype.patternLength || 2}`,
    );
  } else if (state.productType === 'plaque') {
    lines.push(
      `Size: ${SIZE_PRESETS[state.size]?.label || state.size}`,
      `Usage: ${(USAGE_PRESETS[getPlaqueUsageKey()] || USAGE_PRESETS.indoor).label}`,
      `Plaque colours: ${state.processed?.colours?.length || 0}`,
    );
  } else {
    lines.push(
      `Size: ${SIZE_PRESETS[state.size]?.label || state.size}`,
      `Usage: ${(USAGE_PRESETS[state.usage] || USAGE_PRESETS.indoor).label}`,
      `Detected colours: ${state.processed?.colours?.length || 0}`,
    );
  }
  if (options.includeDiagnostics !== false) {
    const diagnosticLines = getDiagnosticsReportLines(12);
    if (diagnosticLines.length) {
      lines.push('', 'Recent diagnostics:', ...diagnosticLines);
    }
  }
  return lines;
}

function getDisplayedBuildNumber() {
  return document.querySelector('.menu-build-version')?.textContent?.replace(/^Build\s+/i, '').trim() || 'unknown';
}

function getBugReportEndpoint() {
  if (window.SIGN_GUY_BUG_REPORT_ENDPOINT) return window.SIGN_GUY_BUG_REPORT_ENDPOINT;
  if (!window.location.protocol.startsWith('http')) return '';
  return new URL('/api/report-bug', window.location.href).href;
}

async function captureBugReportScreenshotSafely() {
  try {
    const blob = await captureVisualizerBlob();
    return {
      blob,
      fileName: `${safeFileName(getDesignName() || getBugReportProductLabel())}-bug-screenshot.png`,
    };
  } catch (error) {
    console.warn('Bug report screenshot unavailable.', error);
    return null;
  }
}

async function submitBugReportToEndpoint(endpoint, payload, screenshot) {
  const form = new FormData();
  form.append('subject', payload.subject);
  form.append('message', payload.message);
  form.append('context', payload.contextText);
  form.append('customerEmail', payload.email || '');
  form.append('product', getBugReportProductLabel());
  form.append('build', getDisplayedBuildNumber());
  form.append('url', window.location.href);
  if (screenshot?.blob) {
    form.append('screenshot', screenshot.blob, screenshot.fileName);
  }
  const response = await fetch(endpoint, { method: 'POST', body: form });
  if (!response.ok) {
    let detail = '';
    try {
      detail = await response.text();
    } catch {
      detail = '';
    }
    throw new Error(`Bug report endpoint returned ${response.status}${detail ? `: ${detail.slice(0, 160)}` : ''}`);
  }
}

function openBugReportMailDraft(payload, screenshot) {
  if (screenshot?.blob) downloadBlob(screenshot.blob, screenshot.fileName, 'image/png');
  const body = [
    'Bug report',
    '',
    payload.message,
    '',
    'Context',
    payload.contextText,
    '',
    screenshot?.blob ? 'A screenshot was downloaded. Please attach it to this email before sending.' : 'No screenshot was captured.',
  ].join('\n');
  openMailDraft(payload.subject, body);
}

function setupOnboarding() {
  if (!els.onboardingOverlay) return;
  els.showTipsButton?.addEventListener('click', () => {
    closeHelpMenu();
    openOnboarding({ manual: true });
  });
  els.onboardingDone?.addEventListener('click', dismissOnboarding);
  els.onboardingOverlay.addEventListener('click', (event) => {
    if (event.target === els.onboardingOverlay) dismissOnboarding();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !els.onboardingOverlay.classList.contains('hidden')) {
      dismissOnboarding();
    }
  });
  window.setTimeout(() => {
    if (!hasDismissedOnboarding()) openOnboarding({ deferIfBlocked: true });
  }, 500);
}

function hasDismissedOnboarding() {
  try {
    return localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
  } catch {
    return state.onboardingDismissedFallback;
  }
}

function openOnboarding(options = {}) {
  if (!els.onboardingOverlay) return;
  if (!options.manual && isOnboardingBlocked()) {
    if (options.deferIfBlocked) state.onboardingPending = true;
    return;
  }
  state.onboardingPending = false;
  closeMobileControlSheet();
  els.onboardingOverlay.classList.remove('hidden');
  els.onboardingOverlay.setAttribute('aria-hidden', 'false');
  window.setTimeout(() => els.onboardingDone?.focus(), 0);
}

function isOnboardingBlocked() {
  return document.body.classList.contains('wizard-open') || !els.adminGate?.classList.contains('hidden');
}

function maybeOpenPendingOnboarding() {
  if (!state.onboardingPending || hasDismissedOnboarding() || isOnboardingBlocked()) return;
  openOnboarding();
}

function closeOnboarding() {
  els.onboardingOverlay?.classList.add('hidden');
  els.onboardingOverlay?.setAttribute('aria-hidden', 'true');
}

function dismissOnboarding() {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
  } catch {
    // Local storage can be unavailable in some private or embedded contexts.
  }
  state.onboardingDismissedFallback = true;
  state.onboardingPending = false;
  closeOnboarding();
}

async function fetchOptionalStlGeometry(url, embeddedKey) {
  try {
    return await fetchStlGeometry(url, embeddedKey);
  } catch (error) {
    console.error(`Optional STL unavailable: ${url}`, error);
    return null;
  }
}

async function fetchStlGeometry(url, embeddedKey) {
  let buffer = null;
  try {
    const response = await fetch(url);
    if (response.ok) buffer = await response.arrayBuffer();
  } catch (error) {
    buffer = null;
  }
  if (!buffer) {
    const embeddedStl = await loadEmbeddedHypeStl(embeddedKey);
    if (embeddedStl) buffer = base64ToArrayBuffer(embeddedStl);
  }
  if (!buffer) throw new Error(`Failed to load STL: ${url}`);
  const geometry = parseBinaryStlGeometry(buffer);
  normalizeStlGeometry(geometry);
  geometry.computeBoundingSphere();
  geometry.computeVertexNormals();
  console.info(`Loaded Hype Chain STL: ${embeddedKey}`, {
    url,
    triangles: Math.round((geometry.getAttribute('position')?.count || 0) / 3),
  });
  return geometry;
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function parseBinaryStlGeometry(buffer) {
  const view = new DataView(buffer);
  const triangleCount = view.getUint32(80, true);
  const expectedLength = 84 + triangleCount * 50;
  if (buffer.byteLength < expectedLength) throw new Error('Invalid binary STL file');
  const positions = new Float32Array(triangleCount * 9);
  const normals = new Float32Array(triangleCount * 9);
  let positionOffset = 0;
  for (let triangle = 0; triangle < triangleCount; triangle += 1) {
    const base = 84 + triangle * 50;
    const normal = [
      view.getFloat32(base, true),
      view.getFloat32(base + 4, true),
      view.getFloat32(base + 8, true),
    ];
    for (let vertex = 0; vertex < 3; vertex += 1) {
      const vertexOffset = base + 12 + vertex * 12;
      positions[positionOffset] = view.getFloat32(vertexOffset, true);
      normals[positionOffset] = normal[0];
      positionOffset += 1;
      positions[positionOffset] = view.getFloat32(vertexOffset + 4, true);
      normals[positionOffset] = normal[1];
      positionOffset += 1;
      positions[positionOffset] = view.getFloat32(vertexOffset + 8, true);
      normals[positionOffset] = normal[2];
      positionOffset += 1;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  return geometry;
}

function normalizeStlGeometry(geometry) {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  const center = new THREE.Vector3();
  box.getCenter(center);
  geometry.translate(-center.x, -center.y, -center.z);
}

function createChainLink(linkGeometry, material, index) {
  const mesh = new THREE.Mesh(linkGeometry, material);
  mesh.name = `solidInterlockingLink${index}`;
  mesh.rotation.x = index % 2 === 0 ? 0 : Math.PI / 2;
  mesh.rotation.y = index % 2 === 0 ? THREE.Math.degToRad(2) : THREE.Math.degToRad(-2);
  mesh.position.x = index % 2 === 0 ? -2.4 : 2.4;
  mesh.position.z = index % 2 === 0 ? -2.8 : 2.8;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  return mesh;
}

function createChainLinkGeometry(width = 40, height = 24, radius = 8, tubeRadius = 4.2) {
  return makeRoundedRectangleTubeGeometry(width, height, radius, tubeRadius);
}

function createChainConnectorGeometry() {
  const horizontalLoop = createChainLinkGeometry(76, 26, 9, 4.6);
  const verticalLoop = createChainLinkGeometry(28, 58, 8, 4.6);
  verticalLoop.applyMatrix4(new THREE.Matrix4().makeTranslation(0, -4, 2));
  horizontalLoop.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, 0));
  const geometry = mergeBufferGeometriesAsOne([horizontalLoop, verticalLoop]);
  horizontalLoop.dispose();
  verticalLoop.dispose();
  geometry.computeBoundingSphere();
  geometry.computeVertexNormals();
  return geometry;
}

function getShortLogoChainDrop(silhouette) {
  const bounds = silhouette?.uvBounds;
  const width = Math.max(1, Number(bounds?.width) || 1);
  const height = Math.max(1, Number(bounds?.height) || 1);
  const ratio = height / width;
  if (ratio >= HYPE_SHORT_LOGO_RATIO_THRESHOLD) return 0;
  const range = HYPE_SHORT_LOGO_RATIO_THRESHOLD - 0.32;
  const amount = clamp((HYPE_SHORT_LOGO_RATIO_THRESHOLD - ratio) / range, 0, 1);
  return amount * HYPE_SHORT_LOGO_CHAIN_DROP_MAX;
}

function getHookFusedAnchorY(silhouette, fallbackY, hookWidth, fuseOverlap) {
  const points = Array.isArray(silhouette?.points) ? silhouette.points : [];
  if (points.length < 3) return fallbackY;
  const anchorX = Number(silhouette.hookAnchorX) || 0;
  const contactInset = clamp(hookWidth * 0.34, 9, 13);
  const leftY = getSilhouetteTopYNearX(points, anchorX - contactInset, hookWidth * 0.18);
  const rightY = getSilhouetteTopYNearX(points, anchorX + contactInset, hookWidth * 0.18);
  const requiredY = Math.min(
    Number.isFinite(leftY) ? leftY : fallbackY,
    Number.isFinite(rightY) ? rightY : fallbackY,
  ) + fuseOverlap * 0.24;
  return Math.min(fallbackY, requiredY);
}

function getSilhouetteTopYNearX(points, x, radius) {
  const nearby = points.filter(([pointX]) => Math.abs(pointX - x) <= radius);
  if (nearby.length) return Math.max(...nearby.map(([, pointY]) => pointY));
  const sorted = [...points].sort((a, b) => Math.abs(a[0] - x) - Math.abs(b[0] - x)).slice(0, 8);
  return sorted.length ? Math.max(...sorted.map(([, pointY]) => pointY)) : NaN;
}

function makeAlphaSilhouettePendantShape(image, width, height) {
  const canvas = document.createElement('canvas');
  const maxSampleSize = 520;
  const imageAspect = Math.max(0.001, image.width / Math.max(1, image.height));
  const sampleWidth = imageAspect >= 1 ? maxSampleSize : Math.max(24, Math.round(maxSampleSize * imageAspect));
  const sampleHeight = imageAspect >= 1 ? Math.max(24, Math.round(maxSampleSize / imageAspect)) : maxSampleSize;
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, sampleWidth, sampleHeight);
  ctx.drawImage(image, 0, 0, sampleWidth, sampleHeight);
  const data = ctx.getImageData(0, 0, sampleWidth, sampleHeight).data;
  const mask = new Uint8Array(sampleWidth * sampleHeight);
  for (let i = 0; i < mask.length; i += 1) {
    mask[i] = data[i * 4 + 3] > 20 ? 1 : 0;
  }
  const outline = buildExactAlphaSilhouette(mask, sampleWidth, sampleHeight);
  const points = outline.map(([x, y]) => [
    (x - 0.5) * width,
    -(y - 0.5) * height,
  ]);
  if (points.length < 12) {
    const shape = makeFallbackHypePendantShape(width, height);
    return {
      shape,
      topY: height / 2,
      centerTopY: height / 2,
      hookAnchorX: 0,
      hookAnchorY: height / 2,
      points: [],
      uvBounds: { minX: -width / 2, minY: -height / 2, width, height },
    };
  }
  const shape = new THREE.Shape();
  points.forEach(([x, y], index) => {
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();
  const pointBounds = getPointArrayBounds(points);
  const centerTopY = getCenteredSilhouetteTopY(points, pointBounds);
  const hookAnchor = getSilhouetteHookAnchor(points, pointBounds);
  return {
    shape,
    topY: pointBounds.maxY,
    centerTopY,
    hookAnchorX: hookAnchor.x,
    hookAnchorY: hookAnchor.y,
    points,
    uvBounds: {
      minX: pointBounds.minX,
      minY: pointBounds.minY,
      width: Math.max(0.0001, pointBounds.maxX - pointBounds.minX),
      height: Math.max(0.0001, pointBounds.maxY - pointBounds.minY),
    },
  };
}

function getSilhouetteHookAnchor(points, bounds) {
  if (!Array.isArray(points) || !points.length || !bounds) return { x: 0, y: 0 };
  const width = Math.max(1, bounds.maxX - bounds.minX);
  const height = Math.max(1, bounds.maxY - bounds.minY);
  const topBand = points.filter(([, y]) => y >= bounds.maxY - height * 0.34);
  const candidates = topBand.length >= 4 ? topBand : points;
  const xs = candidates.map(([x]) => x).sort((a, b) => a - b);
  const trim = Math.floor(xs.length * 0.12);
  const trimmed = xs.slice(trim, Math.max(trim + 1, xs.length - trim));
  const minX = Math.min(...trimmed);
  const maxX = Math.max(...trimmed);
  const rawX = (minX + maxX) / 2;
  const maxShift = width * 0.28;
  const x = clamp(rawX, -maxShift, maxShift);
  const anchorBand = candidates.filter(([pointX]) => Math.abs(pointX - x) <= clamp(width * 0.11, 8, 18));
  const y = anchorBand.length
    ? Math.max(...anchorBand.map(([, pointY]) => pointY))
    : getCenteredSilhouetteTopY(points, bounds);
  return { x, y };
}

function getCenteredSilhouetteTopY(points, bounds) {
  if (!Array.isArray(points) || !points.length) return bounds?.maxY || 0;
  const width = Math.max(1, (bounds?.maxX || 0) - (bounds?.minX || 0));
  const centerBand = clamp(width * 0.09, 7, 16);
  const centered = points.filter(([x]) => Math.abs(x) <= centerBand);
  if (centered.length) return Math.max(...centered.map(([, y]) => y));
  return points.reduce((best, point) => (Math.abs(point[0]) < Math.abs(best[0]) ? point : best), points[0])[1];
}

function makeAlphaSilhouettePendantGeometry(shape, depth) {
  const geometry = new THREE.ExtrudeBufferGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.35,
    bevelSize: 0.35,
    bevelSegments: 2,
    curveSegments: 6,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeBoundingSphere();
  geometry.computeVertexNormals();
  return geometry;
}

function buildExactAlphaSilhouette(mask, width, height) {
  const traced = traceMaskOutline(mask, width, height);
  if (traced.length >= 12) {
    const simplified = simplifyPolygon(traced, Math.max(0.18, Math.max(width, height) / 2400));
    return simplified.map(([x, y]) => [
      clamp(x / width, 0, 1),
      clamp(y / height, 0, 1),
    ]);
  }
  return buildSilhouette(mask, width, height);
}

function getPointArrayBounds(points) {
  return points.reduce((bounds, point) => ({
    minX: Math.min(bounds.minX, point[0]),
    maxX: Math.max(bounds.maxX, point[0]),
    minY: Math.min(bounds.minY, point[1]),
    maxY: Math.max(bounds.maxY, point[1]),
  }), {
    minX: Infinity,
    maxX: -Infinity,
    minY: Infinity,
    maxY: -Infinity,
  });
}

function applyExplicitGeometryUvs(geometry, bounds) {
  const position = geometry.attributes.position;
  const uvs = [];
  for (let i = 0; i < position.count; i += 1) {
    uvs.push(
      clamp((position.getX(i) - bounds.minX) / bounds.width, 0, 1),
      clamp((position.getY(i) - bounds.minY) / bounds.height, 0, 1),
    );
  }
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
}

function mergeBufferGeometriesAsOne(geometries) {
  const expanded = geometries.map((geometry) => (geometry.index ? geometry.toNonIndexed() : geometry.clone()));
  const attributes = ['position', 'normal', 'uv'];
  const merged = new THREE.BufferGeometry();
  attributes.forEach((name) => {
    const sourceAttributes = expanded
      .map((geometry) => geometry.getAttribute(name))
      .filter(Boolean);
    if (!sourceAttributes.length) return;
    const itemSize = sourceAttributes[0].itemSize;
    const count = sourceAttributes.reduce((total, attr) => total + attr.count * itemSize, 0);
    const array = new Float32Array(count);
    let offset = 0;
    sourceAttributes.forEach((attr) => {
      array.set(attr.array, offset);
      offset += attr.array.length;
    });
    merged.setAttribute(name, new THREE.BufferAttribute(array, itemSize));
  });
  expanded.forEach((geometry) => geometry.dispose());
  return merged;
}

function makeRoundedRectangleTubeGeometry(width, height, radius, tubeRadius) {
  const points = makeRoundedRectanglePoints(width, height, radius, 8);
  const curve = new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.5);
  return new THREE.TubeBufferGeometry(curve, 96, tubeRadius, 18, true);
}

function makeRoundedRectanglePoints(width, height, radius, segments = 8) {
  const hw = width / 2 - radius;
  const hh = height / 2 - radius;
  const corners = [
    { cx: hw, cy: hh, start: 0 },
    { cx: -hw, cy: hh, start: Math.PI / 2 },
    { cx: -hw, cy: -hh, start: Math.PI },
    { cx: hw, cy: -hh, start: Math.PI * 1.5 },
  ];
  const points = [];
  corners.forEach((corner) => {
    for (let i = 0; i <= segments; i += 1) {
      const angle = corner.start + (i / segments) * (Math.PI / 2);
      points.push(new THREE.Vector3(
        corner.cx + Math.cos(angle) * radius,
        corner.cy + Math.sin(angle) * radius,
        0,
      ));
    }
  });
  return points;
}

function roundedRectShape(shape, x, y, w, h, r) {
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
}

function getRankedPendantChainColours() {
  const processedColours = (state.processed?.colours || []).map((region, index) => ({
    hex: normalizeHex(getDisplayColour(index, region.hex)),
    count: Number(region.count) || 0,
  }));
  const fallbackColours = getHypePendantColours().map((hex) => ({ hex: normalizeHex(hex), count: 1 }));
  const combined = uniqueHexColours((processedColours.length ? processedColours : fallbackColours).map((item) => item.hex))
    .map((hex) => {
      const source = [...processedColours, ...fallbackColours].find((item) => normalizeHex(item.hex) === hex) || { count: 1 };
      const rgb = hexToRgb(hex);
      const luma = colourLuma(rgb);
      const saturation = colourChroma(rgb);
      const isNeutral = saturation < 34 || luma <= 34 || luma >= 224;
      const prominence = Math.sqrt(Math.max(1, source.count));
      const contrast = Math.abs(luma - 128);
      return {
        hex,
        isNeutral,
        score: (isNeutral ? 0 : 260) + saturation * 3.2 + prominence * 0.42 + contrast * 0.18,
        neutralScore: prominence * 0.5 + contrast * 0.35,
      };
    });
  const accents = combined
    .filter((item) => !item.isNeutral)
    .sort((a, b) => b.score - a.score);
  const neutrals = combined
    .filter((item) => item.isNeutral)
    .sort((a, b) => b.neutralScore - a.neutralScore);
  return [...accents, ...neutrals];
}

function normalizeDegrees(value) {
  return ((((Number(value) || 0) + 180) % 360) + 360) % 360 - 180;
}

function openAdminGate() {
  if (!els.adminGate || !els.adminPassword) return;
  closeOnboarding();
  els.adminGate.classList.remove('hidden', 'invalid');
  if (els.adminGateError) els.adminGateError.textContent = '';
  els.adminPassword.value = '';
  window.setTimeout(() => els.adminPassword.focus(), 0);
}

function closeAdminGate() {
  els.adminGate?.classList.add('hidden');
  maybeOpenPendingOnboarding();
}

async function loginAdmin() {
  const password = els.adminPassword?.value || '';
  if (!password.trim()) {
    showAdminLoginError('Enter the admin password.');
    return;
  }
  try {
    const ok = await verifyAdminPassword(password);
    if (!ok) {
      showAdminLoginError('Incorrect admin password.');
      return;
    }
    state.isAdmin = true;
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    closeAdminGate();
    renderAdminMode();
    setStatus('Admin mode');
  } catch (error) {
    console.error(error);
    showAdminLoginError('Admin login is unavailable.');
  }
}

function logoutAdmin() {
  state.isAdmin = false;
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  renderAdminMode();
  setStatus('Ready');
}

function showAdminLoginError(message) {
  els.adminGate?.classList.add('invalid');
  if (els.adminGateError) els.adminGateError.textContent = message;
  els.adminPassword?.focus();
}

async function verifyAdminPassword(password) {
  if (isLocalTesting()) {
    const localPassword = window.SIGN_GUY_LOCAL_ADMIN_PASSWORD || LOCAL_ADMIN_PASSWORD;
    return password === localPassword;
  }
  const endpoint = getAdminLoginEndpoint();
  if (!endpoint) return false;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  return response.ok;
}

function getAdminLoginEndpoint() {
  if (window.SIGN_GUY_ADMIN_LOGIN_ENDPOINT) return window.SIGN_GUY_ADMIN_LOGIN_ENDPOINT;
  if (!window.location.protocol.startsWith('http')) return '';
  return new URL('/api/admin-login', window.location.href).href;
}

function renderUploadControl() {
  if (!els.chooseFileText) return;
  els.chooseFileText.textContent = state.uploadedFile ? 'Choose a different logo' : 'Upload logo';
  if (els.plaqueChooseFileText) {
    els.plaqueChooseFileText.textContent = state.uploadedFile ? 'Choose a different logo' : 'Upload logo';
  }
}

function setupDropZone(zone = els.dropZone, onDrop = (files) => handleFiles(files)) {
  if (!zone) return;
  ['dragenter', 'dragover'].forEach((eventName) => {
    zone.addEventListener(eventName, (event) => {
      event.preventDefault();
      zone.classList.add('dragging');
    });
  });
  ['dragleave', 'drop'].forEach((eventName) => {
    zone.addEventListener(eventName, (event) => {
      event.preventDefault();
      zone.classList.remove('dragging');
    });
  });
  zone.addEventListener('drop', (event) => onDrop(event.dataTransfer.files));
}

function setupFileButtonKeyboard(label, input) {
  if (!label || !input) return;
  label.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    input.click();
  });
}

function cloneFileList(fileList) {
  return fileList ? [...fileList] : [];
}

function setupDragRotation() {
  let dragging = false;
  let start = null;
  els.stage.addEventListener('pointerdown', (event) => {
    if (state.previewTouchGestureActive || (event.pointerType === 'touch' && event.isPrimary === false)) return;
    if (event.target.closest('.hype-preview')) return;
    if (event.target.closest('button, label, input, .preview-alert')) return;
    event.preventDefault();
    dragging = true;
    start = { x: event.clientX, y: event.clientY, rx: state.rotation.x, ry: state.rotation.y };
    try {
      els.stage.setPointerCapture(event.pointerId);
    } catch {
      // Some synthetic or interrupted touch streams do not have an active pointer to capture.
    }
  });
  els.stage.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    if (state.previewTouchGestureActive) {
      dragging = false;
      return;
    }
    event.preventDefault();
    state.rotation.x = clamp(start.rx - (event.clientY - start.y) * 0.24, -58, 58);
    state.rotation.y = start.ry + (event.clientX - start.x) * 0.42;
    applyRotation();
  });
  const stopDrag = () => {
    dragging = false;
  };
  els.stage.addEventListener('pointerup', stopDrag);
  els.stage.addEventListener('pointercancel', stopDrag);
  els.stage.addEventListener('lostpointercapture', stopDrag);
}

function setupPreviewTouchGestures() {
  if (!els.stage) return;
  let gesture = null;
  let tapStart = null;
  let lastTapAt = 0;
  const getTouches = (event) => [...event.touches].slice(0, 2);
  const getDistance = ([first, second]) => Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
  const getMidpoint = ([first, second]) => ({
    x: (first.clientX + second.clientX) / 2,
    y: (first.clientY + second.clientY) / 2,
  });
  const isPreviewGestureTarget = (target) => (
    target instanceof Element
      && !target.closest('button, label, input, select, textarea, .preview-alert, .control-panel, .mobile-command-bar')
  );
  const startGesture = (event) => {
    if (!isPreviewGestureTarget(event.target)) return;
    if (event.touches.length === 1) {
      const [touch] = getTouches(event);
      tapStart = {
        x: touch.clientX,
        y: touch.clientY,
        at: performance.now(),
      };
      return;
    }
    tapStart = null;
    if (event.touches.length < 2) return;
    const touches = getTouches(event);
    const midpoint = getMidpoint(touches);
    gesture = {
      distance: Math.max(1, getDistance(touches)),
      midpoint,
      zoom: state.previewZoom,
      pan: { ...getPreviewPan() },
    };
    state.previewTouchGestureActive = true;
    event.preventDefault();
  };
  els.stage.addEventListener('touchstart', startGesture, { passive: false });
  els.stage.addEventListener('touchmove', (event) => {
    if (!gesture || event.touches.length < 2) return;
    const touches = getTouches(event);
    const midpoint = getMidpoint(touches);
    const distance = Math.max(1, getDistance(touches));
    const nextZoom = gesture.zoom * (distance / gesture.distance);
    const nextPan = {
      x: gesture.pan.x + midpoint.x - gesture.midpoint.x,
      y: gesture.pan.y + midpoint.y - gesture.midpoint.y,
    };
    event.preventDefault();
    setPreviewZoom(nextZoom, { render: false });
    setPreviewPan(nextPan.x, nextPan.y, { render: true });
  }, { passive: false });
  const stopGesture = () => {
    if (!gesture && !state.previewTouchGestureActive) return;
    gesture = null;
    window.setTimeout(() => {
      state.previewTouchGestureActive = false;
    }, 60);
  };
  els.stage.addEventListener('touchend', (event) => {
    if (!gesture && tapStart && event.touches.length === 0 && event.changedTouches.length === 1) {
      const [touch] = [...event.changedTouches];
      const now = performance.now();
      const moved = Math.hypot(touch.clientX - tapStart.x, touch.clientY - tapStart.y);
      const elapsed = now - tapStart.at;
      if (moved < 18 && elapsed < 260) {
        if (now - lastTapAt < 320) {
          event.preventDefault();
          resetGesturePreviewView();
          lastTapAt = 0;
        } else {
          lastTapAt = now;
        }
      }
      tapStart = null;
    }
    if (event.touches.length < 2) stopGesture();
  });
  els.stage.addEventListener('touchcancel', () => {
    tapStart = null;
    stopGesture();
  });
}

function setupProjectAccordion() {
  if (!els.projectSection || !els.projectSectionHeading) return;
  const toggle = () => {
    setProjectSectionExpanded(!els.projectSection.classList.contains('mobile-expanded'));
  };
  els.projectSectionHeading.addEventListener('click', toggle);
  els.projectSectionHeading.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    toggle();
  });
}

function setupMobileAdvancedAccordion() {
  if (!els.mobileAdvancedSection || !els.mobileAdvancedHeading) return;
  setMobileAdvancedExpanded(false);
  const toggle = () => {
    setMobileAdvancedExpanded(!els.mobileAdvancedSection.classList.contains('mobile-expanded'));
  };
  els.mobileAdvancedHeading.addEventListener('click', toggle);
  els.mobileAdvancedHeading.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    toggle();
  });
}

async function handleFiles(fileList, options = {}) {
  const file = fileList?.[0];
  if (!file) return;
  const target = options.target === 'hype' ? 'hype' : (state.productType === 'plaque' ? 'plaque' : 'led');
  if (target === 'plaque') {
    await handlePlaqueFiles(fileList);
    return;
  }
  state.uploadTarget = target;
  state.ledUploadSnapshot = captureLedUploadState();

  const validation = validateUploadFile(file);
  if (!validation.ok) {
    if (target === 'hype') restoreLedUploadState();
    else state.ledUploadSnapshot = null;
    showUploadError(validation.message);
    return;
  }

  setUploadLoading(target);
  let uploadFile = file;
  state.isDefaultPreview = false;
  state.defaultLedPreviewScreenshotDataUrl = '';
  updateDefaultLedSavedPreview();
  state.designName = '';
  els.designName.value = '';
  state.projectId = null;
  try {
    if (validation.kind === 'heic') {
      uploadFile = await convertHeicToPngFile(file);
    }
    state.fileName = uploadFile.name;
    state.uploadedFile = uploadFile;
    renderUploadControl();
    const artworkRead = validation.kind === 'svg'
      ? readSvgArtwork(uploadFile)
      : readRasterArtwork(uploadFile);
    state.artwork = await artworkRead;
    state.removeBg = state.artwork.hasTransparency ? false : true;
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
    initEditState(state.artwork);
    await reprocess();
    if (els.submitNote) els.submitNote.textContent = '';
    openWizard('edit');
    trackSignStudioEvent('artwork_upload', {
      product_type: target === 'hype' ? 'hype_chain' : 'led_sign',
      file_type: validation.kind,
    });
    if (target === 'led') state.ledUploadSnapshot = null;
  } catch (error) {
    restoreLedUploadState();
    console.warn('Logo upload failed.', error);
    showUploadError(getUploadErrorMessage(error));
  }
}

function nearestPaletteColourIndex(palette, rgb) {
  let best = 0;
  let bestDistance = Infinity;
  palette.forEach((cluster, index) => {
    const distance = colourDistance(cluster.rgb, rgb);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  });
  return best;
}

function validateUploadFile(file) {
  if (!file) return { ok: false, message: 'No logo file was selected.' };
  const name = String(file.name || '').toLowerCase();
  const type = String(file.type || '').toLowerCase();
  const isSvg = type.includes('svg') || name.endsWith('.svg');
  const isPng = type.includes('png') || name.endsWith('.png');
  const isJpeg = type.includes('jpeg') || type.includes('jpg') || name.endsWith('.jpg') || name.endsWith('.jpeg');
  const isHeic = type.includes('heic') || type.includes('heif') || name.endsWith('.heic') || name.endsWith('.heif');

  if (!isSvg && !isPng && !isJpeg && !isHeic) {
    return { ok: false, message: 'This image format may not be supported. Please try a PNG or JPG.' };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, message: 'This image is very large. Please try a smaller PNG or JPG.' };
  }

  return { ok: true, kind: isSvg ? 'svg' : (isHeic ? 'heic' : 'raster') };
}

function setUploadLoading(target) {
  closeMobileControlSheet();
  closeOnboarding();
  setStatus('Loading logo');
  if (target === 'plaque') {
    setPlaqueLoadingProgress(8, 'Loading 3D Plaque logo');
    return;
  }
  if (els.submitNote) {
    els.submitNote.textContent = target === 'hype'
      ? 'Loading Hype Chain logo...'
      : 'Loading LED Sign logo...';
  }
}

function showUploadError(message) {
  setStatus('Upload failed');
  const safeMessage = message || 'The image could not be loaded. Please try a PNG or JPG.';
  if (els.submitNote) {
    els.submitNote.classList.remove('plaque-progress-note');
    els.submitNote.textContent = safeMessage;
  }
  setWarnings([{ level: 'error', text: safeMessage }]);
}

function getUploadErrorMessage(error) {
  if (error?.plaqueUploadStage) {
    return `The 3D Plaque upload failed while ${error.plaqueUploadStage}. Please try a smaller PNG or an SVG.`;
  }
  if (error?.code === 'plaque-upload-read-timeout') {
    return 'The 3D Plaque logo took too long to read. Try an SVG or a smaller transparent PNG.';
  }
  if (error?.code === 'image-decode-timeout') {
    return 'This image is taking too long to load. Please try a smaller PNG or JPG.';
  }
  if (error?.code === 'heic-conversion-failed') {
    return 'This HEIC image could not be converted. Please try a PNG or JPG.';
  }
  if (error?.code === 'unsupported-image-format') {
    return 'This image format may not be supported. Please try a PNG or JPG.';
  }
  return 'The image could not be loaded. Please try a PNG or JPG.';
}

async function convertHeicToPngFile(file) {
  setStatus('Converting HEIC');
  if (els.submitNote) els.submitNote.textContent = 'Converting HEIC image...';
  try {
    const heic2any = await loadHeicConverter();
    const output = await withTimeout(
      heic2any({ blob: file, toType: 'image/png', quality: 0.92 }),
      HEIC_CONVERT_TIMEOUT_MS,
      'heic-conversion-failed',
    );
    const blob = Array.isArray(output) ? output[0] : output;
    if (!blob) throw new Error('HEIC conversion returned no image data.');
    const fileName = makeConvertedHeicFileName(file.name);
    return new File([blob], fileName, { type: 'image/png' });
  } catch (error) {
    console.warn('HEIC conversion failed.', error);
    const wrapped = new Error('HEIC conversion failed.');
    wrapped.code = 'heic-conversion-failed';
    throw wrapped;
  }
}

function loadHeicConverter() {
  if (typeof window.heic2any === 'function') return Promise.resolve(window.heic2any);
  if (state.heicConverterPromise) return state.heicConverterPromise;

  state.heicConverterPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = HEIC2ANY_CDN_URL;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.referrerPolicy = 'no-referrer';
    script.onload = () => {
      if (typeof window.heic2any === 'function') {
        resolve(window.heic2any);
        return;
      }
      reject(new Error('HEIC converter loaded but was unavailable.'));
    };
    script.onerror = () => reject(new Error('Could not load HEIC converter.'));
    document.head.appendChild(script);
  }).catch((error) => {
    state.heicConverterPromise = null;
    throw error;
  });

  return state.heicConverterPromise;
}

function makeConvertedHeicFileName(fileName) {
  const cleanName = String(fileName || 'uploaded-logo').replace(/\.(heic|heif)$/i, '');
  return `${cleanName || 'uploaded-logo'}.png`;
}

function captureCurrentArtworkState() {
  return {
    fileName: state.fileName,
    designName: state.designName,
    isDefaultPreview: state.isDefaultPreview,
    uploadedFile: state.uploadedFile,
    artwork: state.artwork,
    processed: state.processed,
    removeBg: state.removeBg,
    fixFloatingRegions: state.fixFloatingRegions,
    floatingSupportColour: state.floatingSupportColour,
    tolerance: state.tolerance,
    targetColorCount: state.targetColorCount,
    colorOverrides: [...state.colorOverrides],
    frontColoursCustomized: state.frontColoursCustomized,
    selectedColor: state.selectedColor,
    selectedColourTarget: { ...state.selectedColourTarget },
    projectId: state.projectId,
    defaultLedPreviewScreenshotDataUrl: state.defaultLedPreviewScreenshotDataUrl,
    usage: getPlaqueUsageKey(),
    edit: {
      crop: { ...state.edit.crop },
      cropAspect: state.edit.cropAspect,
      zoom: state.edit.zoom,
    },
    previewZoom: state.previewZoom,
    previewPan: { ...getPreviewPan() },
    dismissedPreviewAlert: state.dismissedPreviewAlert,
    rotation: { ...state.rotation },
  };
}

function applyArtworkStateSnapshot(snapshot) {
  if (!snapshot) return;
  Object.assign(state, {
    fileName: snapshot.fileName,
    designName: snapshot.designName,
    isDefaultPreview: snapshot.isDefaultPreview,
    uploadedFile: snapshot.uploadedFile,
    artwork: snapshot.artwork,
    processed: snapshot.processed,
    removeBg: snapshot.removeBg,
    fixFloatingRegions: snapshot.fixFloatingRegions,
    floatingSupportColour: snapshot.floatingSupportColour,
    tolerance: snapshot.tolerance,
    targetColorCount: snapshot.targetColorCount,
    colorOverrides: [...snapshot.colorOverrides],
    frontColoursCustomized: snapshot.frontColoursCustomized,
    selectedColor: snapshot.selectedColor,
    selectedColourTarget: { ...snapshot.selectedColourTarget },
    projectId: snapshot.projectId,
    defaultLedPreviewScreenshotDataUrl: snapshot.defaultLedPreviewScreenshotDataUrl || '',
    edit: {
      crop: { ...snapshot.edit.crop },
      cropAspect: snapshot.edit.cropAspect,
      zoom: snapshot.edit.zoom,
    },
    previewZoom: snapshot.previewZoom,
    previewPan: { ...(snapshot.previewPan || { x: 0, y: 0 }) },
    dismissedPreviewAlert: snapshot.dismissedPreviewAlert,
    rotation: { ...snapshot.rotation },
  });
  if (els.designName) els.designName.value = state.designName;
  if (els.removeBg) els.removeBg.checked = state.removeBg;
  renderUploadControl();
}

async function readSvgArtwork(file) {
  if (state.uploadTarget === 'plaque' || state.productType === 'plaque') {
    await ensureSvgLoader().catch((error) => console.warn('Could not lazy-load SVG plaque parser.', error));
  }
  const text = await file.text();
  const parser = new DOMParser();
  const documentSvg = parser.parseFromString(text, 'image/svg+xml');
  if (documentSvg.querySelector('parsererror')) throw new Error('The SVG could not be parsed.');
  const normalizedText = normalizeSvgForImage(documentSvg);
  const gradients = documentSvg.querySelectorAll('linearGradient, radialGradient').length;
  const pathCount = documentSvg.querySelectorAll('path, polygon, polyline, rect, circle, ellipse').length;
  const palette = extractSvgPalette(documentSvg);
  const blob = new Blob([normalizedText], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  try {
    const image = await loadImage(url, { timeout: IMAGE_DECODE_TIMEOUT_MS });
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(normalizedText)}`;
    return { type: 'svg', image, dataUrl, svgText: normalizedText, pathCount, gradients, palette, hasTransparency: imageHasTransparency(image), name: file.name };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function normalizeSvgForImage(documentSvg) {
  const svg = documentSvg.documentElement;
  if (!svg) return new XMLSerializer().serializeToString(documentSvg);
  const width = parseSvgLength(svg.getAttribute('width'));
  const height = parseSvgLength(svg.getAttribute('height'));
  const viewBox = parseViewBox(svg.getAttribute('viewBox'));
  const fallbackWidth = viewBox ? Math.abs(viewBox[2]) : 1024;
  const fallbackHeight = viewBox ? Math.abs(viewBox[3]) : fallbackWidth;
  if (!width || !height) {
    svg.setAttribute('width', String(Math.max(1, Math.round(width || fallbackWidth))));
    svg.setAttribute('height', String(Math.max(1, Math.round(height || fallbackHeight))));
  }
  if (!svg.getAttribute('preserveAspectRatio')) {
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }
  return new XMLSerializer().serializeToString(documentSvg);
}

function parseSvgLength(value) {
  if (!value) return null;
  const match = String(value).trim().match(/^([0-9]*\.?[0-9]+)/);
  return match ? Number(match[1]) : null;
}

function parseViewBox(value) {
  if (!value) return null;
  const parts = String(value).trim().split(/[\s,]+/).map(Number);
  return parts.length === 4 && parts.every(Number.isFinite) ? parts : null;
}

async function readRasterArtwork(file, options = {}) {
  const decodeFile = await normalizeRasterUploadFile(file);
  if (options.quickObjectUrl) {
    const url = URL.createObjectURL(decodeFile);
    try {
      const image = await loadImage(url, { timeout: IMAGE_DECODE_TIMEOUT_MS, skipDecode: true });
      return makeRasterArtworkPayload(decodeFile, file, image, url, options);
    } catch (error) {
      URL.revokeObjectURL(url);
      console.warn('Quick PNG object URL load failed; trying standard raster fallbacks.', error);
      const { image, dataUrl } = await readOriginalRasterImage(decodeFile);
      return makeRasterArtworkPayload(decodeFile, file, image, dataUrl, options);
    }
  }
  if (options.useOriginalDataUrl) {
    const { image, dataUrl } = await readOriginalRasterImage(decodeFile);
    return makeRasterArtworkPayload(decodeFile, file, image, dataUrl, options);
  }
  const url = URL.createObjectURL(decodeFile);
  try {
    if (!options.skipBitmapVerify) await verifyImageDecodes(decodeFile, url);
    const image = await loadImage(url, { timeout: IMAGE_DECODE_TIMEOUT_MS });
    const dataUrl = await makeNormalizedRasterDataUrl(image, options);
    return makeRasterArtworkPayload(decodeFile, file, image, dataUrl, options);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function makeRasterArtworkPayload(decodeFile, originalFile, image, dataUrl, options = {}) {
  const isJpeg = String(decodeFile.type || '').includes('jpeg');
  const hasTransparency = options.skipTransparencyCheck ? !isJpeg : imageHasTransparency(image);
  return {
    type: isJpeg ? 'jpg' : 'png',
    image,
    dataUrl,
    pathCount: 0,
    gradients: 0,
    hasTransparency,
    name: originalFile.name,
  };
}

async function normalizeRasterUploadFile(file) {
  const detectedType = await detectRasterMimeType(file);
  if (!detectedType || file.type === detectedType) return file;
  try {
    return new File([file], file.name || `upload.${detectedType.includes('jpeg') ? 'jpg' : 'png'}`, {
      type: detectedType,
      lastModified: file.lastModified || Date.now(),
    });
  } catch {
    const blob = new Blob([file], { type: detectedType });
    blob.name = file.name || `upload.${detectedType.includes('jpeg') ? 'jpg' : 'png'}`;
    return blob;
  }
}

async function detectRasterMimeType(file) {
  const fallback = String(file.type || '').toLowerCase();
  try {
    const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    if (isPng) return 'image/png';
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    if (isJpeg) return 'image/jpeg';
  } catch (error) {
    console.warn('Could not inspect image file signature.', error);
  }
  if (fallback.includes('png')) return 'image/png';
  if (fallback.includes('jpeg') || fallback.includes('jpg')) return 'image/jpeg';
  const name = String(file.name || '').toLowerCase();
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  return fallback || '';
}

async function readOriginalRasterImage(file) {
  const url = URL.createObjectURL(file);
  let keepObjectUrl = false;
  try {
    try {
      const image = await loadImage(url, { timeout: IMAGE_DECODE_TIMEOUT_MS, skipDecode: true });
      keepObjectUrl = true;
      return { image, dataUrl: url, objectUrl: url };
    } catch (blobError) {
      console.warn('Blob URL image decode failed; trying data URL decode.', blobError);
    }

    const dataUrl = await fileToDataUrl(file);
    try {
      const image = await loadImage(dataUrl, { timeout: IMAGE_DECODE_TIMEOUT_MS, skipDecode: true });
      return { image, dataUrl };
    } catch (dataUrlError) {
      console.warn('Data URL image decode failed; trying ImageBitmap decode.', dataUrlError);
      const image = await makeImageFromBitmapFallback(file);
      return { image, dataUrl: await makeNormalizedRasterDataUrl(image, { maxSide: PLAQUE_UPLOAD_MAX_SIDE }) };
    }
  } finally {
    if (!keepObjectUrl) URL.revokeObjectURL(url);
  }
}

async function makeImageFromBitmapFallback(file) {
  if (!('createImageBitmap' in window)) {
    const error = new Error('The image could not be loaded.');
    error.code = 'unsupported-image-format';
    throw error;
  }
  let bitmap = null;
  try {
    bitmap = await withTimeout(
      createImageBitmap(file, { imageOrientation: 'from-image' }),
      IMAGE_DECODE_TIMEOUT_MS,
      'image-decode-timeout',
    );
    const image = bitmap;
    bitmap = null;
    return image;
  } finally {
    bitmap?.close?.();
  }
}

function getArtworkImageWidth(image) {
  return Math.max(1, Number(image?.naturalWidth || image?.width || 1));
}

function getArtworkImageHeight(image) {
  return Math.max(1, Number(image?.naturalHeight || image?.height || 1));
}

function imageHasTransparency(image) {
  const canvas = document.createElement('canvas');
  const width = Math.min(80, getArtworkImageWidth(image));
  const height = Math.min(80, getArtworkImageHeight(image));
  if (!width || !height) return false;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height).data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 250) return true;
  }
  return false;
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('The image file could not be read.'));
    reader.readAsDataURL(file);
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('The file could not be read.'));
    reader.readAsDataURL(blob);
  });
}

function fileToDataUrl(file) {
  return blobToDataUrl(file);
}

function dataUrlToFile(dataUrl, filename) {
  const blob = dataUrlToBlob(dataUrl);
  try {
    return new File([blob], filename || 'lightbox-logo', { type: blob.type || 'application/octet-stream' });
  } catch {
    blob.name = filename || 'lightbox-logo';
    return blob;
  }
}

function dataUrlToBlob(dataUrl) {
  const [header, payload = ''] = String(dataUrl).split(',');
  const mime = header.match(/^data:([^;,]+)/)?.[1] || 'application/octet-stream';
  const isBase64 = /;base64/i.test(header);
  const binary = isBase64 ? atob(payload) : decodeURIComponent(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function inferArtworkType(dataUrl, filename = '') {
  const raw = `${dataUrl} ${filename}`.toLowerCase();
  return raw.includes('image/svg') || raw.includes('.svg') ? 'svg' : 'png';
}

async function verifyImageDecodes(file, url) {
  if (!('createImageBitmap' in window)) return;
  let bitmap = null;
  try {
    bitmap = await withTimeout(
      createImageBitmap(file, { imageOrientation: 'from-image' }),
      IMAGE_DECODE_TIMEOUT_MS,
      'image-decode-timeout',
    );
    const image = bitmap;
    bitmap = null;
    return image;
  } catch (error) {
    if (error?.code === 'image-decode-timeout') throw error;
    console.warn('createImageBitmap could not decode upload.', error);
    await loadImage(url, { timeout: IMAGE_DECODE_TIMEOUT_MS, skipDecode: true });
  } finally {
    bitmap?.close?.();
  }
}

async function makeNormalizedRasterDataUrl(image, options = {}) {
  const width = getArtworkImageWidth(image);
  const height = getArtworkImageHeight(image);
  if (!width || !height) {
    const error = new Error('The image could not be decoded.');
    error.code = 'unsupported-image-format';
    throw error;
  }
  const maxSide = Number(options.maxSide) || 0;
  const scale = maxSide > 0 ? Math.min(1, maxSide / Math.max(width, height)) : 1;
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
  return canvas.toDataURL('image/png');
}

function loadImage(src, options = {}) {
  const timeout = options.timeout || IMAGE_DECODE_TIMEOUT_MS;
  return new Promise((resolve, reject) => {
    const image = new Image();
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      image.onload = null;
      image.onerror = null;
      image.src = '';
      const error = new Error('The image took too long to load.');
      error.code = 'image-decode-timeout';
      reject(error);
    }, timeout);
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      image.onload = null;
      image.onerror = null;
      callback(value);
    };
    image.onload = async () => {
      if (!options.skipDecode && image.decode) {
        try {
          await image.decode();
        } catch (error) {
          console.warn('Image.decode failed after upload image loaded; continuing with loaded image.', error);
        }
      }
      finish(resolve, image);
    };
    image.onerror = () => {
      const error = new Error('The image could not be loaded.');
      error.code = 'unsupported-image-format';
      finish(reject, error);
    };
    image.src = src;
  });
}

function withTimeout(promise, timeout, code) {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      const error = new Error('The image took too long to load.');
      error.code = code;
      reject(error);
    }, timeout);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function extractSvgPalette(documentSvg) {
  const values = [];
  documentSvg.querySelectorAll('style').forEach((node) => {
    [...(node.textContent || '').matchAll(/(?:fill|stroke)\s*:\s*([^;}\n]+)/gi)].forEach((match) => values.push(match[1]));
  });
  documentSvg.querySelectorAll('*').forEach((node) => {
    ['fill', 'stroke'].forEach((attr) => {
      const value = node.getAttribute(attr);
      if (value) values.push(value);
    });
    const style = node.getAttribute('style') || '';
    [...style.matchAll(/(?:fill|stroke)\s*:\s*([^;]+)/gi)].forEach((match) => values.push(match[1]));
  });
  const colours = [];
  values.forEach((value) => {
    const rgb = parseCssColour(value);
    if (!rgb) return;
    if (!colours.some((colour) => colourDistance(colour, rgb) < 4)) colours.push(rgb);
  });
  return colours.slice(0, 24);
}

function parseCssColour(value) {
  const raw = value.trim().toLowerCase();
  if (!raw || raw === 'none' || raw === 'transparent' || raw === 'currentcolor' || raw.startsWith('url(')) return null;
  const canvas = parseCssColour.canvas || (parseCssColour.canvas = document.createElement('canvas').getContext('2d'));
  canvas.fillStyle = '#000000';
  canvas.fillStyle = raw;
  const normalized = canvas.fillStyle;
  const hex = normalized.startsWith('#') ? normalized : null;
  if (!hex || hex === '#000000' && raw !== '#000' && raw !== '#000000' && raw !== 'black' && !raw.startsWith('rgb(0')) return null;
  if (hex.length === 7) {
    return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  }
  return null;
}

async function reprocess(options = {}) {
  if (state.productType === 'plaque') {
    await reprocessPlaqueArtwork(options);
    return;
  }
  if (!state.artwork) return;
  setStatus('Processing');
  els.stage.classList.add('regenerating');
  const previousColourSnapshot = state.processed?.colours?.map((region, idx) => ({
    hex: normalizeHex(region.hex),
    display: normalizeHex(state.colorOverrides[idx] || region.hex),
    isFloatingSupport: Boolean(region.isFloatingSupport),
  })) || null;
  await waitFrame();
  try {
    state.processed = processArtwork(state.artwork, getProcessArtworkOptions());
    state.processingDirty = false;
    if (!options.preserveTargetColorCount && !state.frontColoursCustomized && state.processed.naturalColourCount) {
      state.targetColorCount = state.processed.naturalColourCount;
    }
    syncColorOverrides(previousColourSnapshot);
    renderPreview();
    renderArtworkDiagnostics();
    if (els.submitDesign) els.submitDesign.disabled = state.isDefaultPreview || !state.uploadedFile;
    updateProjectControls();
    setStatus('Ready');
    if (state.wizardStep && !options.skipWizardRender) renderWizardStep();
  } finally {
    if (state.productType === 'plaque' && state.processed) finishPlaqueBuildStatus();
    requestAnimationFrame(() => els.stage.classList.remove('regenerating'));
  }
}

function initEditState(artwork = state.artwork) {
  state.edit = {
    crop: state.isDefaultPreview ? { x: 0, y: 0, w: 1, h: 1 } : detectDefaultCrop(artwork),
    cropAspect: 'free',
    zoom: 0.86,
  };
}

function detectDefaultCrop(artwork) {
  return getFullImageDefaultCrop(artwork);
}

function getFullImageDefaultCrop(artwork) {
  return normalizeCrop({
    x: -DEFAULT_CROP_OUTER_MARGIN,
    y: -DEFAULT_CROP_OUTER_MARGIN,
    w: 1 + DEFAULT_CROP_OUTER_MARGIN * 2,
    h: 1 + DEFAULT_CROP_OUTER_MARGIN * 2,
  });
}

function getTransparentArtworkContentBounds(data, width, height) {
  const alphaBounds = getImageDataAlphaBounds(data, width, height, 1);
  if (!alphaBounds) return null;
  const backgrounds = collectTransparentInteriorBackgroundSeeds(data, width, height, alphaBounds);
  if (!backgrounds.length) return alphaBounds;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  const threshold = 44;
  for (let y = alphaBounds.y; y < alphaBounds.y + alphaBounds.h; y += 1) {
    for (let x = alphaBounds.x; x < alphaBounds.x + alphaBounds.w; x += 1) {
      const offset = (y * width + x) * 4;
      if (data[offset + 3] < 34) continue;
      const rgb = [data[offset], data[offset + 1], data[offset + 2]];
      if (backgrounds.some((seed) => colourDistance(rgb, seed) <= threshold)) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX) return alphaBounds;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function collectTransparentInteriorBackgroundSeeds(data, width, height, bounds) {
  const samples = [];
  const edge = Math.max(2, Math.round(Math.min(bounds.w, bounds.h) * 0.035));
  const zones = [
    [bounds.x, bounds.y, bounds.x + bounds.w, bounds.y + edge],
    [bounds.x, bounds.y + bounds.h - edge, bounds.x + bounds.w, bounds.y + bounds.h],
    [bounds.x, bounds.y, bounds.x + edge, bounds.y + bounds.h],
    [bounds.x + bounds.w - edge, bounds.y, bounds.x + bounds.w, bounds.y + bounds.h],
  ];
  zones.forEach(([x0, y0, x1, y1]) => {
    for (let y = Math.max(0, y0); y < Math.min(height, y1); y += 1) {
      for (let x = Math.max(0, x0); x < Math.min(width, x1); x += 1) {
        const offset = (y * width + x) * 4;
        if (data[offset + 3] < 180) continue;
        const rgb = [data[offset], data[offset + 1], data[offset + 2]];
        if (colourLuma(rgb) < 190 || colourChroma(rgb) > 36) continue;
        samples.push(rgb);
      }
    }
  });
  if (!samples.length) return [];
  const avg = samples.reduce((sum, rgb) => {
    sum[0] += rgb[0];
    sum[1] += rgb[1];
    sum[2] += rgb[2];
    return sum;
  }, [0, 0, 0]).map((value) => value / samples.length);
  return [avg];
}

function cropFromBounds(bounds, width, height, padRatio = 0.04) {
  if (!bounds) return { x: 0, y: 0, w: 1, h: 1 };
  if (typeof padRatio === 'object' && Number(padRatio.scale) > 1) {
    const scale = Number(padRatio.scale);
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    const minPixelPad = Math.max(12, Math.round(Math.max(width, height) * 0.035));
    const desiredW = Math.min(width, bounds.w * scale + minPixelPad * 2);
    const desiredH = Math.min(height, bounds.h * scale + minPixelPad * 2);
    const minX = clamp(centerX - desiredW / 2, 0, Math.max(0, width - desiredW));
    const minY = clamp(centerY - desiredH / 2, 0, Math.max(0, height - desiredH));
    return {
      x: minX / width,
      y: minY / height,
      w: Math.max(0.08, desiredW / width),
      h: Math.max(0.08, desiredH / height),
    };
  }
  const pad = typeof padRatio === 'number'
    ? { x: padRatio, top: padRatio, bottom: padRatio }
    : {
      x: Number(padRatio.x ?? padRatio.side ?? 0.04),
      top: Number(padRatio.top ?? padRatio.y ?? 0.04),
      bottom: Number(padRatio.bottom ?? padRatio.y ?? padRatio.top ?? 0.04),
    };
  const padX = width * pad.x;
  const padTop = height * pad.top;
  const padBottom = height * pad.bottom;
  const minX = clamp(bounds.x - padX, 0, width);
  const minY = clamp(bounds.y - padTop, 0, height);
  const maxX = clamp(bounds.x + bounds.w + padX, 0, width);
  const maxY = clamp(bounds.y + bounds.h + padBottom, 0, height);
  const desiredHeight = Math.min(height, (bounds.h + padTop + padBottom));
  const adjustedMinY = maxY >= height - 1
    ? Math.max(0, height - desiredHeight)
    : minY;
  const crop = {
    x: minX / width,
    y: adjustedMinY / height,
    w: Math.max(0.08, (maxX - minX) / width),
    h: Math.max(0.08, (maxY - adjustedMinY) / height),
  };
  if (crop.x <= 0.035 && crop.x + crop.w >= 0.965) {
    crop.x = 0;
    crop.w = 1;
  }
  if (crop.y <= 0.035 && crop.y + crop.h >= 0.965) {
    crop.y = 0;
    crop.h = 1;
  }
  return crop;
}

function openWizard(step) {
  closeMobileControlSheet();
  closeOnboarding();
  state.wizardStep = step;
  document.body.classList.add('wizard-open');
  updateViewportUnits();
  els.wizard.classList.remove('hidden');
  els.wizard.setAttribute('aria-hidden', 'false');
  renderWizardStep();
}

function closeWizard() {
  state.wizardStep = null;
  closeColourPopover();
  document.body.classList.remove('wizard-open');
  els.wizard.classList.add('hidden');
  els.wizard.setAttribute('aria-hidden', 'true');
  updateProjectControls();
  maybeOpenPendingOnboarding();
}

function renderWizardStep() {
  if (!state.wizardStep || !state.artwork) return;
  closeColourPopover();
  els.wizard.dataset.step = state.wizardStep;
  if (state.wizardStep === 'edit') renderEditStep();
  if (state.wizardStep === 'vector') renderVectorStep();
  if (state.wizardStep === 'mapping') renderMappingStep();
  if (state.wizardStep === 'details') renderDetailsStep();
}

function getProcessArtworkOptions() {
  return {};
}

function renderEditStep() {
  if (isResponsiveViewport()) state.edit.cropAspect = 'free';
  els.wizardTitle.textContent = 'Edit Your Image';
  els.wizardImage.onload = () => updateCropBox();
  els.wizardImage.src = renderEditArtworkPreviewUrl(state.artwork);
  els.wizardImage.style.setProperty('--wizard-zoom', state.edit.zoom);
  els.cropBox.classList.add('visible');
  els.cropBox.classList.toggle('circle', state.edit.cropAspect === 'circle');
  els.previewTools.classList.remove('hidden');
  els.wizardSide.innerHTML = `
    <h3 class="wizard-crop-controls">Crop</h3>
    <div class="crop-presets wizard-crop-controls">
      ${CROP_PRESETS.map((preset) => `
        <button class="crop-preset ${state.edit.cropAspect === preset.id ? 'active' : ''}" type="button" data-crop-preset="${preset.id}">
          <span class="crop-icon ${preset.icon}"></span>
          <span>${preset.label}</span>
        </button>
      `).join('')}
    </div>
    <label class="switch-row">
      <span>Remove Background</span>
      <input id="wizardRemoveBg" type="checkbox" ${state.removeBg ? 'checked' : ''} />
    </label>
    <p class="wizard-helper-text">Use this if your image background is solid, white, or not transparent.</p>
    <label class="switch-row">
      <span>Fix floating regions</span>
      <input id="wizardFixFloatingRegions" type="checkbox" ${state.fixFloatingRegions ? 'checked' : ''} />
    </label>
    <p class="wizard-helper-text">Use this if your logo has separate pieces that are not connected to the main shape.</p>
  `;
  els.wizardFooter.innerHTML = `
    <button class="secondary-button" type="button" data-wizard-action="cancel">Cancel</button>
    <button class="primary-button" type="button" data-wizard-action="to-vector">Next</button>
  `;
  bindWizardButtons();
  requestAnimationFrame(centerWizardPreview);
  requestAnimationFrame(updateCropBox);
}

function renderEditArtworkPreviewUrl(artwork) {
  if (!artwork || (!state.removeBg && !state.fixFloatingRegions)) return artwork?.dataUrl || '';
  const crop = { x: 0, y: 0, w: 1, h: 1 };
  return renderEditedArtworkCanvas(artwork, crop, 900).toDataURL('image/png');
}

function renderEditedArtworkCanvas(artwork, crop, maxSide) {
  const srcW = Math.max(1, Math.round(getArtworkImageWidth(artwork.image) * crop.w));
  const srcH = Math.max(1, Math.round(getArtworkImageHeight(artwork.image) * crop.h));
  const scale = maxSide / Math.max(srcW, srcH);
  const width = Math.max(12, Math.round(srcW * scale));
  const height = Math.max(12, Math.round(srcH * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, width, height);
  drawArtworkIntoExpandedCrop(ctx, artwork, crop, scale);
  if (state.removeBg) {
    const img = ctx.getImageData(0, 0, width, height);
    removeConnectedBackgroundFromImageData(img.data, width, height);
    ctx.putImageData(img, 0, 0);
  }
  if (state.fixFloatingRegions) {
    connectFloatingRegionsOnCanvas(canvas, ctx, hexToRgb(state.floatingSupportColour || DEFAULT_FLOATING_SUPPORT_COLOUR));
  }
  return canvas;
}

function drawArtworkIntoExpandedCrop(ctx, artwork, crop, scale) {
  const imageWidth = getArtworkImageWidth(artwork.image);
  const imageHeight = getArtworkImageHeight(artwork.image);
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
    artwork.image,
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

function renderVectorStep() {
  els.wizardTitle.textContent = 'Vectorized Result';
  setWizardPreview(renderMappedArtworkUrl(state.processed) || state.processed?.artworkUrl || state.artwork.dataUrl);
  els.wizardSide.innerHTML = `
    <h3>Vectorized result</h3>
    <p>The artwork has been flattened into printable colour regions and a custom outer silhouette. If this does not look right, try again or go back to crop/background cleanup.</p>
    <div class="detail-list vector-summary-list">
      <div class="detail-row vector-summary-row"><span class="map-number">${state.processed?.colours.length || 0}</span><span>detected colours</span><strong>max 8</strong></div>
      <div class="detail-row vector-summary-row"><span class="map-number">${state.tolerance}</span><span>merge tolerance</span><strong>auto</strong></div>
    </div>
    ${renderMappingControlsMarkup()}
  `;
  els.wizardFooter.innerHTML = `
    <button class="secondary-button" type="button" data-wizard-action="to-edit">Back</button>
    <button class="secondary-button" type="button" data-wizard-action="try-vector">Try Again</button>
    <button class="primary-button" type="button" data-wizard-action="to-details">Next</button>
  `;
  bindWizardButtons();
  bindMappingControls();
}

function renderMappingStep() {
  els.wizardTitle.textContent = 'Auto Color Mapping';
  setWizardPreview(renderMappedArtworkUrl(state.processed) || state.processed?.artworkUrl || state.artwork.dataUrl);
  els.wizardSide.innerHTML = renderMappingControlsMarkup();
  els.wizardFooter.innerHTML = `
    <button class="secondary-button" type="button" data-wizard-action="to-vector">Back</button>
    <button class="primary-button" type="button" data-wizard-action="to-details">Next</button>
  `;
  bindWizardButtons();
  bindMappingControls();
}

function renderMappingControlsMarkup() {
  const colours = state.processed?.colours || [];
  const plaqueMode = state.productType === 'plaque';
  const plaqueLayers = plaqueMode ? getPlaqueLayerDescriptors() : [];
  const mappingItems = plaqueLayers.length
    ? plaqueLayers.map((layer, idx) => {
      const hex = getPlaqueLayerDisplayHex(layer, idx);
      return {
        sourceHex: hex,
        targetHex: hex,
        tokenHex: hex,
        label: `${idx + 1}`,
      };
    })
    : colours.map((region, idx) => {
      const hex = getDisplayColour(idx, region.hex);
      return {
        sourceHex: region.hex,
        targetHex: hex,
        tokenHex: hex,
        label: region.isFloatingSupport ? 'S' : `${idx + 1}`,
      };
    });
  const detectedColourCount = getCurrentDetectedColourCount(mappingItems.length || colours.length);
  if (!state.frontColoursCustomized) {
    state.targetColorCount = detectedColourCount;
    if (plaqueMode) state.plaque.targetColorCount = detectedColourCount;
  }
  return `
    <h3 class="mapping-controls-title">Color Count</h3>
    <p>Adjust the number of colours to match your filaments. You can edit colours manually in the next step.</p>
    <div class="colour-count-row">
      <input id="mapColorCount" type="range" min="1" max="8" value="${detectedColourCount}" />
      <span class="count-badge">${detectedColourCount}</span>
    </div>
    <h3>Mapping</h3>
    <div class="mapping-list">
      ${mappingItems.map((item) => {
        return `
          <div class="mapping-row">
            <span class="map-dot" style="background:${item.sourceHex}"></span>
            <span class="map-arrow">&rarr;</span>
            <span class="map-number" style="${colourTokenStyle(item.tokenHex)}">${item.label}</span>
            <span class="colour-dot" style="background:${item.targetHex}"></span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function getCurrentDetectedColourCount(fallback = 0) {
  const colours = state.processed?.colours || [];
  const count = colours.filter((region) => !region.isFloatingSupport && (region.count ?? 1) > 0).length
    || colours.length
    || fallback
    || state.targetColorCount
    || 1;
  return clamp(count, 1, 8);
}

function bindMappingControls() {
  const colorCount = document.querySelector('#mapColorCount');
  if (!colorCount) return;
  const colorCountBadge = els.wizardSide.querySelector('.count-badge');
  colorCount.addEventListener('input', () => {
    state.targetColorCount = Number(colorCount.value);
    if (state.productType === 'plaque') state.plaque.targetColorCount = state.targetColorCount;
    if (colorCountBadge) colorCountBadge.textContent = String(state.targetColorCount);
  });
  colorCount.addEventListener('change', async () => {
    state.targetColorCount = Number(colorCount.value);
    if (state.productType === 'plaque') state.plaque.targetColorCount = state.targetColorCount;
    state.colorOverrides = [];
    state.frontColoursCustomized = true;
    if (state.productType === 'plaque') {
      state.plaque.colorOverrides = [];
      state.plaque.colourOverrides = [];
      state.plaque.frontColoursCustomized = true;
    }
    await reprocess();
  });
}

function renderDetailsStep() {
  els.wizardTitle.textContent = 'Edit Color Details';
  setWizardPreview(renderMappedArtworkUrl(state.processed) || state.processed?.artworkUrl || state.artwork.dataUrl);
  const colours = state.processed?.colours || [];
  els.wizardSide.innerHTML = `
    <div class="section-heading">
      <h3>Colors Being Used</h3>
    </div>
    <div class="colour-chips">
      ${colours.map((region, idx) => {
        const hex = getDisplayColour(idx, region.hex);
        const label = region.isFloatingSupport ? 'S' : `${idx + 1}`;
        return `<button class="colour-chip ${state.selectedColor === idx ? 'active' : ''}" type="button" data-select-colour="${idx}" style="${colourTokenStyle(hex)}">${label}</button>`;
      }).join('')}
      <button class="colour-chip colour-add-chip" type="button" data-wizard-action="add-colour" aria-label="Add colour">+</button>
    </div>
    <div class="section-heading">
      <h3>Mapping</h3>
      <button class="reset-button" type="button" data-wizard-action="reset-colours">Reset</button>
    </div>
    <div class="detail-list colour-detail-list">
      ${colours.map((region, idx) => {
        const hex = getDisplayColour(idx, region.hex);
        const label = region.isFloatingSupport ? 'Support' : `${idx + 1}`;
        return `
          <button class="detail-row colour-detail-row" type="button" data-edit-colour="${idx}" style="${colourTokenStyle(hex)}" aria-label="Edit ${region.isFloatingSupport ? 'floating support colour' : `colour ${idx + 1}`}">
            <span>${label}</span>
            <strong>${hex}</strong>
          </button>
        `;
      }).join('')}
    </div>
  `;
  els.wizardFooter.innerHTML = `
    <button class="secondary-button" type="button" data-wizard-action="to-vector">Back</button>
    <button class="primary-button" type="button" data-wizard-action="confirm">Confirm</button>
  `;
  bindWizardButtons();
}

function colourTokenStyle(hex) {
  const normalized = normalizeHex(hex);
  const ink = readableTextColour(normalized);
  return `--token-color:${normalized};--token-ink:${ink};color:${ink};`;
}

function readableTextColour(hex) {
  const [r, g, b] = hexToRgb(normalizeHex(hex));
  return ((r * 299 + g * 587 + b * 114) / 1000) > 150 ? '#111111' : '#ffffff';
}

function setWizardPreview(src) {
  els.wizardImage.onload = null;
  els.wizardImage.onload = () => {
    if (state.wizardStep !== 'edit') centerWizardPreview();
  };
  els.wizardImage.src = src;
  els.wizardImage.style.setProperty('--wizard-zoom', state.edit.zoom);
  els.cropBox.classList.remove('visible', 'circle');
  els.previewTools.classList.remove('hidden');
  requestAnimationFrame(centerWizardPreview);
}

function centerWizardPreview() {
  els.wizardImage.scrollIntoView({ block: 'center', inline: 'center' });
}

function bindWizardButtons() {
  els.wizardSide.querySelectorAll('[data-crop-preset]').forEach((button) => {
    button.addEventListener('click', () => setCropPreset(button.dataset.cropPreset));
  });
  els.wizardSide.querySelector('#wizardRemoveBg')?.addEventListener('change', async (event) => {
    state.removeBg = event.target.checked;
    els.removeBg.checked = state.removeBg;
    state.edit.crop = { x: 0, y: 0, w: 1, h: 1 };
    await reprocess();
    renderEditStep();
  });
  els.wizardSide.querySelector('#wizardFixFloatingRegions')?.addEventListener('change', async (event) => {
    state.fixFloatingRegions = event.target.checked;
    state.processingDirty = true;
    renderEditStep();
  });
  [...els.wizardFooter.querySelectorAll('[data-wizard-action]'), ...els.wizardSide.querySelectorAll('[data-wizard-action]')].forEach((button) => {
    button.addEventListener('click', () => handleWizardAction(button.dataset.wizardAction));
  });
  els.wizardSide.querySelectorAll('[data-select-colour]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedColor = Number(button.dataset.selectColour);
      renderDetailsStep();
    });
  });
  els.wizardSide.querySelectorAll('[data-edit-colour]').forEach((button) => {
    button.addEventListener('click', () => openColourPopover(Number(button.dataset.editColour), button));
  });
  els.wizardSide.querySelectorAll('[data-edit-shell]').forEach((button) => {
    button.addEventListener('click', () => openShellColourPopover(button.dataset.editShell, button));
  });
}

async function handleWizardAction(action) {
  if (action === 'cancel') {
    if (state.uploadTarget === 'hype') restoreLedUploadState();
    closeWizard();
    return;
  }
  if (action === 'to-edit') {
    openWizard('edit');
    return;
  }
  if (action === 'to-vector') {
    try {
      if (!state.processed || state.processingDirty) await reprocess({ skipWizardRender: true });
      openWizard('vector');
    } catch (error) {
      console.error('Could not process artwork before vector step', error);
      setStatus('Processing failed');
      els.submitNote.textContent = error?.message ? `Processing failed: ${error.message}` : 'Processing failed. Please try again.';
    }
    return;
  }
  if (action === 'try-vector') {
    state.tolerance = clamp(state.tolerance + 8, 18, 90);
    await reprocess({ skipWizardRender: true });
    openWizard('vector');
    return;
  }
  if (action === 'to-mapping') {
    openWizard('mapping');
    return;
  }
  if (action === 'to-details') {
    openWizard('details');
    return;
  }
  if (action === 'reset-colours') {
    state.colorOverrides = [];
    state.floatingSupportColour = DEFAULT_FLOATING_SUPPORT_COLOUR;
    state.frontColoursCustomized = false;
    renderPreview();
    renderShellColourControls();
    renderDetailsStep();
    return;
  }
  if (action === 'add-colour') {
    state.targetColorCount = clamp(state.targetColorCount + 1, 1, 8);
    state.frontColoursCustomized = true;
    await reprocess({ skipWizardRender: true });
    openWizard('details');
    return;
  }
  if (action === 'confirm') {
    if (state.uploadTarget === 'hype') {
      completeHypeLogoImport();
      closeWizard();
      return;
    }
    closeWizard();
  }
}

function trimCanvasToVisibleAlpha(source, alphaThreshold = 1) {
  const ctx = source.getContext('2d', { willReadFrequently: true });
  const frame = ctx.getImageData(0, 0, source.width, source.height);
  const bounds = getImageDataAlphaBounds(frame.data, source.width, source.height, alphaThreshold);
  if (!bounds) {
    return {
      canvas: source,
      bounds: { x: 0, y: 0, w: source.width, h: source.height },
    };
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, bounds.w);
  canvas.height = Math.max(1, bounds.h);
  const nextCtx = canvas.getContext('2d', { willReadFrequently: true });
  nextCtx.clearRect(0, 0, canvas.width, canvas.height);
  nextCtx.drawImage(source, bounds.x, bounds.y, bounds.w, bounds.h, 0, 0, bounds.w, bounds.h);
  return { canvas, bounds };
}

function getBinaryMaskComponents(mask, width, height, minPixels = 1) {
  const seen = new Uint8Array(mask.length);
  const components = [];
  const stack = [];
  for (let i = 0; i < mask.length; i += 1) {
    if (!mask[i] || seen[i]) continue;
    const pixels = [];
    seen[i] = 1;
    stack.push(i);
    while (stack.length) {
      const current = stack.pop();
      pixels.push(current);
      const x = current % width;
      const y = Math.floor(current / width);
      [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ].forEach(([nx, ny]) => {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) return;
        const next = ny * width + nx;
        if (!mask[next] || seen[next]) return;
        seen[next] = 1;
        stack.push(next);
      });
    }
    if (pixels.length >= minPixels) components.push({ pixels });
  }
  return components.sort((a, b) => b.pixels.length - a.pixels.length);
}

function setCropPreset(id) {
  const preset = CROP_PRESETS.find((item) => item.id === id);
  if (!preset) return;
  state.edit.cropAspect = id;
  state.processingDirty = true;
  if (preset.ratio) {
    const imageRatio = getArtworkImageWidth(state.artwork.image) / getArtworkImageHeight(state.artwork.image);
    let w = 1;
    let h = 1;
    if (imageRatio > preset.ratio) {
      w = preset.ratio / imageRatio;
    } else {
      h = imageRatio / preset.ratio;
    }
    state.edit.crop = { x: (1 - w) / 2, y: (1 - h) / 2, w, h };
  }
  renderEditStep();
}

function setupCropInteraction() {
  let drag = null;
  els.cropBox.addEventListener('pointerdown', (event) => {
    if (state.wizardStep !== 'edit') return;
    event.preventDefault();
    const rect = getDisplayedImageRect();
    const handle = event.target.closest('.crop-handle')?.dataset.handle || 'move';
    drag = {
      handle,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      crop: { ...state.edit.crop },
      rect,
    };
    els.cropBox.setPointerCapture(event.pointerId);
  });
  const updateDrag = (event) => {
    if (!drag) return;
    const dx = (event.clientX - drag.startX) / drag.rect.width;
    const dy = (event.clientY - drag.startY) / drag.rect.height;
    let crop = { ...drag.crop };
    if (drag.handle === 'move') {
      crop.x += dx;
      crop.y += dy;
    } else {
      const min = 0.06;
      let left = drag.crop.x;
      let right = drag.crop.x + drag.crop.w;
      let top = drag.crop.y;
      let bottom = drag.crop.y + drag.crop.h;
      const minEdge = -CROP_EXTEND_LIMIT;
      const maxEdge = 1 + CROP_EXTEND_LIMIT;
      if (drag.handle.includes('e')) right = clamp(right + dx, left + min, maxEdge);
      if (drag.handle.includes('s')) bottom = clamp(bottom + dy, top + min, maxEdge);
      if (drag.handle.includes('w')) left = clamp(left + dx, minEdge, right - min);
      if (drag.handle.includes('n')) top = clamp(top + dy, minEdge, bottom - min);
      crop = { x: left, y: top, w: right - left, h: bottom - top };
      crop = enforceCropAspect(crop, drag.handle);
    }
    state.edit.crop = normalizeCrop(crop);
    state.processingDirty = true;
    updateCropBox();
  };
  const stopDrag = () => {
    drag = null;
  };
  window.addEventListener('pointermove', updateDrag);
  window.addEventListener('pointerup', stopDrag);
  window.addEventListener('pointercancel', stopDrag);
  els.cropBox.addEventListener('lostpointercapture', stopDrag);
  window.addEventListener('resize', updateCropBox);
}

function enforceCropAspect(crop, handle) {
  const preset = CROP_PRESETS.find((item) => item.id === state.edit.cropAspect);
  if (!preset?.ratio) return crop;
  const naturalRatio = getArtworkImageWidth(state.artwork.image) / getArtworkImageHeight(state.artwork.image);
  const targetH = (crop.w * naturalRatio) / preset.ratio;
  if (handle.includes('n')) crop.y += crop.h - targetH;
  crop.h = targetH;
  return crop;
}

function normalizeCrop(crop) {
  const min = 0.06;
  const max = 1 + CROP_EXTEND_LIMIT * 2;
  crop.w = clamp(crop.w, min, max);
  crop.h = clamp(crop.h, min, max);
  crop.x = clamp(crop.x, -CROP_EXTEND_LIMIT, 1 + CROP_EXTEND_LIMIT - crop.w);
  crop.y = clamp(crop.y, -CROP_EXTEND_LIMIT, 1 + CROP_EXTEND_LIMIT - crop.h);
  return crop;
}

function getDisplayedImageRect() {
  const imageRect = els.wizardImage.getBoundingClientRect();
  const boardRect = els.wizardArtboard.getBoundingClientRect();
  return {
    left: imageRect.left - boardRect.left,
    top: imageRect.top - boardRect.top,
    width: imageRect.width,
    height: imageRect.height,
  };
}

function updateCropBox() {
  if (state.wizardStep !== 'edit' || !state.artwork) return;
  const rect = getDisplayedImageRect();
  const crop = state.edit.crop;
  els.cropBox.style.left = `${rect.left + crop.x * rect.width}px`;
  els.cropBox.style.top = `${rect.top + crop.y * rect.height}px`;
  els.cropBox.style.width = `${crop.w * rect.width}px`;
  els.cropBox.style.height = `${crop.h * rect.height}px`;
}

function setWizardZoom(value) {
  state.edit.zoom = clamp(value, 0.7, 1.8);
  els.wizardImage.style.setProperty('--wizard-zoom', state.edit.zoom);
  requestAnimationFrame(updateCropBox);
}

function syncColorOverrides(previousColourSnapshot = null) {
  if (!state.processed) return;
  const previousNormalColours = Array.isArray(previousColourSnapshot)
    ? previousColourSnapshot.filter((item) => !item.isFloatingSupport)
    : null;
  const usedPrevious = new Set();
  state.colorOverrides = state.processed.colours.map((region, idx) => {
    if (region.isFloatingSupport) {
      const support = normalizeHex(state.floatingSupportColour || region.hex || DEFAULT_FLOATING_SUPPORT_COLOUR);
      state.floatingSupportColour = support;
      return support;
    }

    const sourceHex = normalizeHex(region.hex);
    if (previousNormalColours?.length) {
      let bestIndex = -1;
      let bestDistance = Infinity;
      previousNormalColours.forEach((item, previousIdx) => {
        if (usedPrevious.has(previousIdx)) return;
        const distance = colourDistance(hexToRgb(sourceHex), hexToRgb(item.hex));
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = previousIdx;
        }
      });
      if (bestIndex >= 0 && bestDistance <= 30) {
        usedPrevious.add(bestIndex);
        return normalizeHex(previousNormalColours[bestIndex].display || sourceHex);
      }
      return sourceHex;
    }

    return normalizeHex(state.colorOverrides[idx] || sourceHex);
  });
  state.selectedColor = clamp(state.selectedColor, 0, Math.max(0, state.processed.colours.length - 1));
  if (state.productType === 'plaque') {
    state.plaque.colorOverrides = [...state.colorOverrides];
    state.plaque.colourOverrides = [...state.colorOverrides];
  }
}

function getDisplayColour(index, fallback) {
  return normalizeHex(state.colorOverrides[index] || fallback || '#ffffff');
}

function renderMappedArtworkUrl(processed) {
  if (!processed?.colours.length) return processed?.artworkUrl || '';
  if (!state.frontColoursCustomized) return processed.artworkUrl || '';
  const canvas = document.createElement('canvas');
  canvas.width = processed.width;
  canvas.height = processed.height;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(processed.width, processed.height);
  const displayColours = processed.colours.map((region, idx) => hexToRgb(getDisplayColour(idx, region.hex)));
  for (let i = 0; i < processed.regionIndex.length; i += 1) {
    const region = processed.regionIndex[i];
    const o = i * 4;
    if (!processed.alphaMask[i] || region < 0 || !displayColours[region]) {
      img.data[o + 3] = 0;
      continue;
    }
    const rgb = displayColours[region];
    img.data[o] = rgb[0];
    img.data[o + 1] = rgb[1];
    img.data[o + 2] = rgb[2];
    img.data[o + 3] = processed.alphaValues?.[i] || 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL('image/png');
}

function buildPresetGrid() {
  els.presetGrid.innerHTML = PRESET_COLOURS.map((hex) => `<button type="button" data-preset-colour="${hex}" style="background:${hex}" aria-label="${hex}"></button>`).join('');
  els.presetGrid.querySelectorAll('[data-preset-colour]').forEach((button) => {
    button.addEventListener('click', () => applySelectedColour(button.dataset.presetColour));
  });
}

function openColourPopover(index, anchor) {
  openFrontColourPopover(index, anchor);
}

function openFrontColourPopover(index, anchor) {
  state.selectedColourTarget = { type: 'front', index };
  state.selectedColor = index;
  const hex = getDisplayColour(index, state.processed?.colours[index]?.hex);
  updatePopoverInputs(hex);
  positionColourPopover(anchor);
  renderUsedColourGrid();
  setPopoverTab('preset');
}

function openShellColourPopover(part, anchor) {
  state.selectedColourTarget = { type: 'shell', part };
  const hex = normalizeHex(state.shellColours[part]);
  updatePopoverInputs(hex);
  positionColourPopover(anchor);
  renderUsedColourGrid();
  setPopoverTab('preset');
}

function positionColourPopover(anchor) {
  if (isMobileControlLayout()) {
    updateViewportUnits();
    els.colourPopover.style.left = '';
    els.colourPopover.style.top = '';
    document.body.classList.add('colour-popover-open');
  } else {
    const rect = anchor.getBoundingClientRect();
    els.colourPopover.style.left = `${Math.min(window.innerWidth - 275, rect.left + 8)}px`;
    els.colourPopover.style.top = `${Math.min(window.innerHeight - 360, rect.bottom + 8)}px`;
    document.body.classList.remove('colour-popover-open');
  }

  els.colourPopover.classList.remove('hidden');
}

function closeColourPopover() {
  els.colourPopover.classList.add('hidden');
  document.body.classList.remove('colour-popover-open');
}

function setPopoverTab(tab) {
  if (tab === 'used') renderUsedColourGrid();
  document.querySelectorAll('[data-popover-tab]').forEach((button) => {
    button.classList.toggle('active', button.dataset.popoverTab === tab);
  });
  els.presetPane.classList.toggle('hidden', tab !== 'preset');
  els.usedPane?.classList.toggle('hidden', tab !== 'used');
  els.customPane.classList.toggle('hidden', tab !== 'custom');
}

function renderUsedColourGrid() {
  if (!els.usedGrid) return;
  const label = els.usedPane?.querySelector('p');
  if (state.productType === 'hype') {
    if (label) label.textContent = 'Used colours';
    const chainColours = uniqueHexColours(getHypePatternColours());
    const pendantColours = uniqueHexColours(collectHypePendantUsedColours());
    const markup = [
      renderUsedColourGroup('Hype Chain', chainColours),
      renderUsedColourGroup('Pendant', pendantColours),
    ].filter(Boolean).join('');
    els.usedGrid.innerHTML = markup || '<span class="used-empty">Choose Hype Chain colours first.</span>';
    bindUsedColourButtons();
    return;
  }
  if (state.productType === 'plaque') {
    if (label) label.textContent = '3D Plaque colours';
    const colours = getPlaqueSubmittedColourItems().map((item) => item.display);
    renderUsedColourButtons(colours, 'Upload plaque artwork first.');
    return;
  }
  if (label) label.textContent = 'Front';
  const colours = (state.processed?.colours || []).map((region, idx) => getDisplayColour(idx, region.hex));
  renderUsedColourButtons(colours, 'Upload a logo first.');
}

function renderUsedColourButtons(colours, emptyText) {
  const unique = uniqueHexColours(colours);
  els.usedGrid.innerHTML = unique.length
    ? unique.map((hex) => renderUsedColourButton(hex)).join('')
    : `<span class="used-empty">${emptyText}</span>`;
  bindUsedColourButtons();
}

function renderUsedColourGroup(label, colours) {
  const unique = uniqueHexColours(colours);
  if (!unique.length) return '';
  return `
    <span class="used-group-label">${label}</span>
    ${unique.map((hex) => renderUsedColourButton(hex)).join('')}
  `;
}

function renderUsedColourButton(hex) {
  return `<button type="button" data-used-colour="${hex}" style="background:${hex}" aria-label="${hex}"></button>`;
}

function bindUsedColourButtons() {
  els.usedGrid.querySelectorAll('[data-used-colour]').forEach((button) => {
    button.addEventListener('click', () => applySelectedColour(button.dataset.usedColour));
  });
}

function uniqueHexColours(colours) {
  return [...new Set((colours || []).map((hex) => normalizeUsedColour(hex)).filter(Boolean))];
}

function normalizeUsedColour(value) {
  const raw = String(value || '').trim();
  const hex = raw.match(/#[0-9a-f]{3,6}/i)?.[0];
  if (hex) return normalizeHex(hex);
  const rgbMatch = raw.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  if (rgbMatch) {
    return rgbToHex([
      Number(rgbMatch[1]),
      Number(rgbMatch[2]),
      Number(rgbMatch[3]),
    ]);
  }
  const normalized = normalizeHex(raw);
  if (normalized !== '#ffffff' || /^#(?:fff|ffffff)$/i.test(raw)) return normalized;
  const rgb = parseCssColour(raw);
  return rgb ? rgbToHex(rgb) : '';
}

window.SignGuyRenderUsedColourGrid = renderUsedColourGrid;

function updatePopoverInputs(hex) {
  const normalized = normalizeHex(hex);
  const rgb = hexToRgb(normalized);
  els.popoverSwatch.style.background = normalized;
  els.popoverHex.value = normalized;
  els.customColourInput.value = normalized;
  els.rgbR.value = rgb[0];
  els.rgbG.value = rgb[1];
  els.rgbB.value = rgb[2];
}

function applySelectedColour(hex) {
  const normalized = normalizeHex(hex);
  if (state.selectedColourTarget.type === 'shell') {
    state.shellColours[state.selectedColourTarget.part] = normalized;
    renderShellColourControls();
  } else if (state.selectedColourTarget.type === 'hypePendant') {
    const index = state.selectedColourTarget.index;
    const colours = getHypePendantColours();
    colours[index] = normalized;
    state.hype.pendantColours = colours;
    renderHypeColourControls();
    rebuildHypePendantLogoDataUrl().catch((error) => {
      console.error('Could not update Hype Chain pendant colours', error);
      scheduleHypeRender(0);
    });
  } else if (state.selectedColourTarget.type === 'hype') {
    state.hype[state.selectedColourTarget.part] = normalized;
    syncHypeDerivedColours();
    renderHypeColourControls();
    scheduleHypeRender(0);
  } else if (state.selectedColourTarget.type === 'hypeSpinner') {
    const spinner = typeof syncHypeSpinnerConfig === 'function'
      ? syncHypeSpinnerConfig()
      : { ...(state.hype.spinner || DEFAULT_HYPE_SPINNER_CONFIG) };
    spinner[state.selectedColourTarget.part] = normalized;
    state.hype.spinner = typeof normalizeHypeSpinnerConfig === 'function'
      ? normalizeHypeSpinnerConfig(spinner)
      : { ...spinner };
    if (typeof applyHypeSpinnerStateToControls === 'function') applyHypeSpinnerStateToControls();
    if (typeof renderHypeColourControls === 'function') renderHypeColourControls();
    if (typeof scheduleHypeRender === 'function') scheduleHypeRender(0);
  } else if (state.selectedColourTarget.type === 'plaque') {
    const index = state.selectedColourTarget.index;
    const updatedLive = setPlaqueLayerColour(index, normalized);
    renderPlaqueLayerControls();
    if (!updatedLive) schedulePlaqueBuild(20);
  } else if (state.selectedColourTarget.type === 'plaqueBacking') {
    state.plaque.backingColourOverride = normalized;
    const updatedLive = updateRenderedPlaqueBackingColour(normalized);
    renderPlaqueLayerControls();
    if (!updatedLive) schedulePlaqueBuild(20);
  } else {
    state.colorOverrides[state.selectedColor] = normalized;
    if (state.processed?.colours[state.selectedColor]?.isFloatingSupport) {
      state.floatingSupportColour = normalized;
    }
    state.frontColoursCustomized = true;
  }
  updatePopoverInputs(normalized);
  if (!['hype', 'hypePendant', 'hypeSpinner', 'plaque'].includes(state.selectedColourTarget.type)) schedulePreviewRender();
  if (state.wizardStep === 'details') renderDetailsStep();
  if (state.wizardStep === 'mapping') renderMappingStep();
  if (state.wizardStep === 'vector') renderVectorStep();
}

function applyRgbInputs() {
  const rgb = [els.rgbR, els.rgbG, els.rgbB].map((input) => clamp(Number(input.value) || 0, 0, 255));
  applySelectedColour(rgbToHex(rgb));
}

function applyIllumination() {
  els.stage.classList.toggle('lights-on', state.illuminated);
  els.stage.classList.toggle('lights-off', !state.illuminated);
  if (els.lightToggleLabel) els.lightToggleLabel.textContent = state.illuminated ? 'lights on' : 'lights off';
  const lighting = state.three?.group?.userData?.lighting;
  if (lighting) {
    lighting.illuminatedFaceMaterial.opacity = state.illuminated ? 0.006 : 0;
    lighting.diffusionMaterial.opacity = state.illuminated ? 0.058 : 0.014;
    lighting.glowMaterial.opacity = state.illuminated ? 0.034 : 0.004;
    lighting.innerLight.intensity = state.illuminated ? 0.035 : 0.004;
    lighting.groundGlowMaterial.opacity = state.illuminated ? 0.38 : 0.018;
    lighting.groundHaloMaterial.opacity = state.illuminated ? 0.16 : 0;
    lighting.keyholeInteriorMaterial.opacity = state.illuminated ? 1 : 0.54;
    lighting.keyholeInteriorMaterial.color.copy(makeThreeColour(state.illuminated ? '#ffffff' : '#343838'));
    updateFloorEffects();
    applyPreviewEnvironment();
    renderThree();
  }
}

function getPreviewZoomLimits() {
  const limits = isMobilePreviewViewport()
    ? { min: MOBILE_PREVIEW_ZOOM_MIN, max: MOBILE_PREVIEW_ZOOM_MAX }
    : { min: DESKTOP_PREVIEW_ZOOM_MIN, max: DESKTOP_PREVIEW_ZOOM_MAX };
  return state.productType === 'hype' ? { ...limits, max: 5 } : limits;
}

function getDefaultProductPreviewZoom() {
  return DEFAULT_PRODUCT_PREVIEW_ZOOM;
}

function getDefaultProductPreviewRotation() {
  return { ...DEFAULT_PRODUCT_PREVIEW_ROTATION };
}

function getDefaultHypePreviewRotation() {
  return {
    x: DEFAULT_PRODUCT_PREVIEW_ROTATION.x,
    y: DEFAULT_PRODUCT_PREVIEW_ROTATION.y,
  };
}

function setPreviewZoom(value, options = {}) {
  const limits = getPreviewZoomLimits();
  state.previewZoom = clamp(Number(value) || 1, limits.min, limits.max);
  state.previewPan = clampPreviewPan(state.previewPan);
  applyPreviewZoom(options);
  if (options.render === false) return;
  renderActivePreviewFrame();
}

function applyPreviewZoom(options = {}) {
  const limits = getPreviewZoomLimits();
  const zoom = clamp(Number(state.previewZoom) || 1, limits.min, limits.max);
  state.previewZoom = zoom;
  if (els.previewZoomReset) els.previewZoomReset.textContent = isMobilePreviewViewport() ? 'Reset View' : `${Math.round(zoom * 100)}%`;
  if (state.three?.camera) {
    let cameraScale = state.productType === 'led' ? (getPreviewEnvironmentSettings().cameraScale || 1) : 1;
    if (state.productType === 'plaque' && typeof getMobilePlaqueCameraDistanceScale === 'function') {
      cameraScale *= getMobilePlaqueCameraDistanceScale();
    }
    state.three.camera.position.z = (430 * cameraScale) / zoom;
    state.three.camera.lookAt(0, 0, 0);
    state.three.camera.updateProjectionMatrix();
    updateThreeModelPosition();
  }
  if (state.hypeThree?.camera) {
    state.hypeThree.camera.near = HYPE_CAMERA_NEAR;
    state.hypeThree.camera.far = HYPE_CAMERA_FAR;
    const smooth = options.smooth ?? (state.productType === 'hype' && !state.previewTouchGestureActive);
    frameHypeCamera({ smooth });
    state.hypeThree.camera.updateProjectionMatrix();
  }
  if (els.modelStack) {
    els.modelStack.style.scale = zoom.toFixed(3);
  }
  if (els.hypeChainRender) {
    els.hypeChainRender.style.setProperty('--hype-zoom', zoom.toFixed(3));
    els.hypeChainRender.style.setProperty('--preview-pan-x', `${getPreviewPan().x.toFixed(1)}px`);
    els.hypeChainRender.style.setProperty('--preview-pan-y', `${getPreviewPan().y.toFixed(1)}px`);
  }
  updateDefaultLedSavedPreviewTransform();
}

function getPreviewPan() {
  return {
    x: Number(state.previewPan?.x) || 0,
    y: Number(state.previewPan?.y) || 0,
  };
}

function clampPreviewPan(pan = {}) {
  const rect = els.stage?.getBoundingClientRect?.();
  const zoom = Number(state.previewZoom) || 1;
  const maxX = Math.max(48, (rect?.width || 360) * 0.38 * zoom);
  const maxY = Math.max(48, (rect?.height || 360) * 0.34 * zoom);
  return {
    x: clamp(Number(pan.x) || 0, -maxX, maxX),
    y: clamp(Number(pan.y) || 0, -maxY, maxY),
  };
}

function setPreviewPan(x, y, options = {}) {
  state.previewPan = clampPreviewPan({ x, y });
  applyPreviewPan();
  if (options.render === false) return;
  renderActivePreviewFrame();
}

function applyPreviewPan() {
  state.previewPan = clampPreviewPan(state.previewPan);
  applyRotation();
  if (state.three?.group) updateThreeModelPosition();
  if (state.hypeThree?.group) applyHypeGroupRotation();
  if (els.hypeChainRender) {
    const pan = getPreviewPan();
    els.hypeChainRender.style.setProperty('--preview-pan-x', `${pan.x.toFixed(1)}px`);
    els.hypeChainRender.style.setProperty('--preview-pan-y', `${pan.y.toFixed(1)}px`);
  }
}

function resetPreviewView() {
  state.previewZoom = getDefaultProductPreviewZoom();
  state.previewPan = { x: 0, y: 0 };
  if (state.productType === 'hype') {
    state.hype.rotation = getDefaultHypePreviewRotation();
    updateHypeCssRotation();
    updateHypeThreeRotation();
  } else {
    state.rotation = getDefaultProductPreviewRotation();
  }
  applyPreviewZoom();
  applyPreviewPan();
  renderActivePreviewFrame();
}

function resetGesturePreviewView() {
  resetPreviewView();
}

function renderActivePreviewFrame() {
  if (state.productType === 'hype') renderHypeThree();
  else renderThree();
}

function isResponsiveViewport() {
  return window.matchMedia('(max-width: 880px)').matches;
}

function isMobilePreviewViewport() {
  return window.matchMedia('(max-width: 768px)').matches;
}

function isNearWhiteHex(hex) {
  const rgb = hexToRgb(normalizeHex(hex));
  return rgb[0] > 220 && rgb[1] > 220 && rgb[2] > 220;
}

function isNearBlackHex(hex) {
  const rgb = hexToRgb(normalizeHex(hex));
  return rgb[0] < 36 && rgb[1] < 36 && rgb[2] < 36;
}

function makeCleanFastLayerMask(processed, layerIndex, width, height) {
  const raw = new Uint8Array(width * height);
  const clean = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sourceX = clamp(Math.floor(((x + 0.5) / width) * processed.width), 0, processed.width - 1);
      const sourceY = clamp(Math.floor(((y + 0.5) / height) * processed.height), 0, processed.height - 1);
      let hits = 0;
      let opaqueHits = 0;
      for (let oy = -1; oy <= 1; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          const sx = clamp(sourceX + ox, 0, processed.width - 1);
          const sy = clamp(sourceY + oy, 0, processed.height - 1);
          const sourceIndex = sy * processed.width + sx;
          if (!processed.alphaMask[sourceIndex]) continue;
          opaqueHits += 1;
          if (processed.regionIndex[sourceIndex] === layerIndex) hits += 1;
        }
      }
      const centerIndex = sourceY * processed.width + sourceX;
      const centerIsLayer = processed.alphaMask[centerIndex] && processed.regionIndex[centerIndex] === layerIndex;
      raw[y * width + x] = hits >= 4 || (centerIsLayer && hits >= 2 && opaqueHits >= 3) ? 1 : 0;
    }
  }
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (!raw[index]) continue;
      let neighbors = 0;
      for (let oy = -1; oy <= 1; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          if (!ox && !oy) continue;
          const nx = x + ox;
          const ny = y + oy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          if (raw[ny * width + nx]) neighbors += 1;
        }
      }
      clean[index] = neighbors >= 2 ? 1 : 0;
    }
  }
  return clean;
}

function getSvgArtworkBounds() {
  const text = state.artwork?.svgText || '';
  const fallback = {
    x: 0,
    y: 0,
    width: state.artwork?.image ? getArtworkImageWidth(state.artwork.image) : (state.processed?.width || 1000),
    height: state.artwork?.image ? getArtworkImageHeight(state.artwork.image) : (state.processed?.height || 1000),
  };
  if (!text) return fallback;
  try {
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    const svg = doc.documentElement;
    const viewBox = parseViewBox(svg?.getAttribute('viewBox'));
    if (viewBox) return { x: viewBox[0], y: viewBox[1], width: Math.abs(viewBox[2]), height: Math.abs(viewBox[3]) };
    const width = parseSvgLength(svg?.getAttribute('width')) || fallback.width;
    const height = parseSvgLength(svg?.getAttribute('height')) || fallback.height;
    return { x: 0, y: 0, width, height };
  } catch {
    return fallback;
  }
}

function getSvgLayerOutlinePoints(layer, svgBounds, modelBounds) {
  const sourcePoints = [];
  layer.shapes.forEach((shape) => {
    const points = shape.extractPoints(18).shape || [];
    points.forEach((point) => sourcePoints.push(point));
  });
  if (!sourcePoints.length) return [];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  sourcePoints.forEach((point) => {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  });
  const scale = Math.min(modelBounds.width / Math.max(svgBounds.width, 1), modelBounds.height / Math.max(svgBounds.height, 1));
  const cx = svgBounds.x + svgBounds.width / 2;
  const cy = svgBounds.y + svgBounds.height / 2;
  return [
    new THREE.Vector2((minX - cx) * scale, -(minY - cy) * scale),
    new THREE.Vector2((maxX - cx) * scale, -(minY - cy) * scale),
    new THREE.Vector2((maxX - cx) * scale, -(maxY - cy) * scale),
    new THREE.Vector2((minX - cx) * scale, -(maxY - cy) * scale),
  ];
}

function convexHull(points) {
  const sorted = [...points]
    .map((point) => new THREE.Vector2(point.x, point.y))
    .sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  if (sorted.length <= 3) return sorted;
  const cross = (origin, a, b) => (a.x - origin.x) * (b.y - origin.y) - (a.y - origin.y) * (b.x - origin.x);
  const lower = [];
  sorted.forEach((point) => {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) lower.pop();
    lower.push(point);
  });
  const upper = [];
  [...sorted].reverse().forEach((point) => {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) upper.pop();
    upper.push(point);
  });
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

function addSvgLayerDebugLines(group, layer, svgBounds, modelBounds, index, topZ) {
  const scale = Math.min(modelBounds.width / Math.max(svgBounds.width, 1), modelBounds.height / Math.max(svgBounds.height, 1));
  const cx = svgBounds.x + svgBounds.width / 2;
  const cy = svgBounds.y + svgBounds.height / 2;
  const material = new THREE.LineBasicMaterial({
    color: 0xffc529,
    transparent: true,
    opacity: 0.62,
  });
  const z = topZ + 0.22;
  layer.shapes.forEach((shape) => {
    const points = shape.extractPoints(24).shape || [];
    if (points.length < 2) return;
    const positions = [];
    points.forEach((point) => positions.push((point.x - cx) * scale, -(point.y - cy) * scale, z));
    positions.push((points[0].x - cx) * scale, -(points[0].y - cy) * scale, z);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const line = new THREE.Line(geometry, material);
    line.name = `plaqueDebugOutline${index}`;
    line.renderOrder = 220;
    group.add(line);
    state.three.resources.push(geometry);
  });
  state.three.resources.push(material);
}

function addRasterLayerDebugLines(group, layerGroup, index, topZ) {
  const material = new THREE.LineBasicMaterial({
    color: 0xffc529,
    transparent: true,
    opacity: 0.62,
  });
  layerGroup.children.forEach((mesh) => {
    const points = mesh.geometry?.parameters?.shapes?.extractPoints?.(24)?.shape || layerGroup.userData.points || [];
    if (points.length < 2) return;
    const positions = [];
    points.forEach((point) => positions.push(point.x, point.y, topZ + 0.18));
    positions.push(points[0].x, points[0].y, topZ + 0.18);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const line = new THREE.Line(geometry, material);
    line.name = `plaqueRasterDebugOutline${index}`;
    line.renderOrder = 220;
    group.add(line);
    state.three.resources.push(geometry);
  });
  state.three.resources.push(material);
}

function flattenMaterials(material) {
  return Array.isArray(material) ? material : [material];
}

function removeTinyContourJitter(points, tolerance = 0.18) {
  if (!Array.isArray(points) || points.length < 8) return points;
  const minTriangleArea = Math.max(0.18, tolerance * 0.42);
  const minEdge = Math.max(0.7, tolerance * 0.55);
  const output = [];
  for (let index = 0; index < points.length; index += 1) {
    const prev = points[(index - 1 + points.length) % points.length];
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const edgeA = Math.hypot(current[0] - prev[0], current[1] - prev[1]);
    const edgeB = Math.hypot(next[0] - current[0], next[1] - current[1]);
    const area = Math.abs(
      (prev[0] * (current[1] - next[1])
      + current[0] * (next[1] - prev[1])
      + next[0] * (prev[1] - current[1])) / 2,
    );
    if (edgeA < minEdge && edgeB < minEdge && area < minTriangleArea) continue;
    output.push(current);
  }
  return output.length >= 4 ? output : points;
}

function midpointVector2(a, b) {
  return new THREE.Vector2((a.x + b.x) / 2, (a.y + b.y) / 2);
}

function chaikinSmoothClosed(points, passes = 2) {
  let output = points.map((point) => [point[0], point[1]]);
  for (let pass = 0; pass < passes; pass += 1) {
    if (output.length < 4) break;
    const next = [];
    for (let i = 0; i < output.length; i += 1) {
      const a = output[i];
      const b = output[(i + 1) % output.length];
      next.push([
        a[0] * 0.75 + b[0] * 0.25,
        a[1] * 0.75 + b[1] * 0.25,
      ]);
      next.push([
        a[0] * 0.25 + b[0] * 0.75,
        a[1] * 0.25 + b[1] * 0.75,
      ]);
    }
    output = next;
  }
  return output;
}

function removeNearDuplicatePoints(points, minDistance = 0.05) {
  const minSq = minDistance * minDistance;
  const output = [];
  points.forEach((point) => {
    const last = output[output.length - 1];
    if (last && ((point[0] - last[0]) ** 2 + (point[1] - last[1]) ** 2) < minSq) return;
    output.push(point);
  });
  if (output.length > 2) {
    const first = output[0];
    const last = output[output.length - 1];
    if (((first[0] - last[0]) ** 2 + (first[1] - last[1]) ** 2) < minSq) output.pop();
  }
  return output;
}

function traceMaskLoops(mask, width, height) {
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
  const loops = [];
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
      edge = chooseNextOutlineEdge(edge, edgeMap.get(nextKey) || []);
    }
    if (loop.length >= 8) loops.push(loop);
  });
  return loops;
}

function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];
    const intersect = ((yi > point[1]) !== (yj > point[1]))
      && (point[0] < ((xj - xi) * (point[1] - yi)) / ((yj - yi) || 0.000001) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function updateFloorEffects() {
  if (!state.three?.floorGroup || !window.THREE) return;
  const floorGroup = state.three.floorGroup;
  const bounds = floorGroup.userData?.bounds;
  const floorY = floorGroup.userData?.floorY;
  if (!bounds || typeof floorY !== 'number') return;
  const modelY = state.three.group?.position?.y ?? floorY - bounds.minY;

  const shellDepth = SIZE_PRESETS[state.size].depth;
  const yaw = THREE.Math.degToRad(state.rotation.y || 0);
  const pitch = THREE.Math.degToRad(state.rotation.x || 0);
  const yawSide = Math.sin(yaw);
  const sideAmount = Math.abs(yawSide);
  const topAmount = clamp(Math.abs(Math.sin(pitch)), 0, 1);
  const depthZ = -shellDepth - 24;
  const frontAmount = clamp((Math.cos(yaw) + 1) / 2, 0, 1);
  const lit = state.illuminated ? 1 : 0;
  const lighting = state.three.group?.userData?.lighting;
  const environment = getPreviewEnvironmentSettings();
  const glowMultiplier = environment.glow ?? 1;
  const wallHaloMultiplier = environment.wallHalo ?? 1;
  const contactMultiplier = environment.contact ?? 1;
  const castMultiplier = environment.cast ?? 1;
  const wallMultiplier = environment.wall ?? 1;

  if (lighting) {
    const diffuserStrength = (lit ? 0.045 + frontAmount * 0.014 + sideAmount * 0.01 : 0.014) * glowMultiplier;
    const edgeGlowStrength = (lit ? 0.024 + frontAmount * 0.01 + sideAmount * 0.01 : 0.004) * glowMultiplier;
    lighting.illuminatedFaceMaterial.opacity = lit ? 0.004 + frontAmount * 0.005 : 0;
    lighting.diffusionMaterial.opacity = clamp(diffuserStrength, 0.004, 0.09);
    lighting.glowMaterial.opacity = clamp(edgeGlowStrength, 0.002, 0.07);
    lighting.innerLight.intensity = lit ? (0.032 + sideAmount * 0.012) * glowMultiplier : 0.004;
    const faceBrightness = lit ? 0.965 + sideAmount * 0.01 : 0.74;
    lighting.faceMaterial.color.setRGB(faceBrightness, faceBrightness, faceBrightness);
    lighting.faceMaterial.emissiveIntensity = lit ? 0.003 + sideAmount * 0.004 : 0.0015;
    lighting.faceMaterial.roughness = lit ? 0.84 + sideAmount * 0.06 : 0.88;
    lighting.sideMaterial.emissiveIntensity = lit ? 0.08 + sideAmount * 0.035 : 0.018;
    lighting.frontBackerMaterial.emissiveIntensity = lit ? 0.045 + sideAmount * 0.012 : 0.006;
    lighting.backMaterial.emissiveIntensity = lit ? 0.04 : 0.008;
    lighting.wallOcclusionMaterial.opacity = clamp((0.2 + sideAmount * 0.16 + topAmount * 0.04 - lit * frontAmount * 0.035) * wallMultiplier, 0.08, 0.58);
    lighting.wallHaloMaterial.opacity = (lit ? 0.08 + frontAmount * 0.06 + sideAmount * 0.025 : 0.004) * wallHaloMultiplier;
    lighting.keyholeInteriorMaterial.opacity = lit ? 1 : 0.54;
    lighting.keyholeInteriorMaterial.color.copy(makeThreeColour(lit ? '#ffffff' : '#343838'));
  }

  if (state.three.floor) {
    state.three.floor.position.y = floorY - 1;
    state.three.floor.position.z = depthZ - 10;
  }

  const floorGlow = floorGroup.getObjectByName('floorGlow');
  if (floorGlow) {
    floorGlow.position.set(
      yawSide * bounds.width * 0.12,
      floorY - bounds.height * (0.28 + topAmount * 0.04),
      depthZ + 4,
    );
    floorGlow.rotation.z = yawSide * 0.06;
    floorGlow.scale.set(0.95 + sideAmount * 0.32, 0.86 + topAmount * 0.12, 1);
    floorGlow.material.opacity = (lit ? 0.28 + frontAmount * 0.08 : 0.01) * glowMultiplier;
  }

  const floorHalo = floorGroup.getObjectByName('floorHalo');
  if (floorHalo) {
    floorHalo.position.set(
      yawSide * bounds.width * 0.06,
      floorY - bounds.height * (0.2 + topAmount * 0.03),
      depthZ + 3,
    );
    floorHalo.rotation.z = yawSide * 0.035;
    floorHalo.scale.set(0.96 + sideAmount * 0.22, 0.72 + topAmount * 0.12, 1);
    floorHalo.material.opacity = (lit ? 0.1 + frontAmount * 0.04 : 0) * glowMultiplier;
  }

  const contactShadow = floorGroup.getObjectByName('contactShadow');
  if (contactShadow) {
    contactShadow.position.set(
      yawSide * bounds.width * 0.06,
      floorY - bounds.height * 0.015,
      depthZ + 2,
    );
    contactShadow.rotation.z = yawSide * 0.035;
    contactShadow.scale.set(0.9 + sideAmount * 0.42, 0.54 + topAmount * 0.18, 1);
    contactShadow.material.opacity = clamp((0.36 + sideAmount * 0.1) * contactMultiplier, 0.16, 0.66);
  }

  const castShadow = floorGroup.getObjectByName('castShadow');
  if (castShadow) {
    castShadow.position.set(
      -yawSide * bounds.width * (0.42 + sideAmount * 0.58),
      floorY - bounds.height * (0.055 + topAmount * 0.04),
      depthZ + 1,
    );
    castShadow.rotation.z = -yawSide * 0.08;
    castShadow.scale.set(0.9 + sideAmount * 0.78, 0.5 + topAmount * 0.32, 1);
    castShadow.material.opacity = clamp((0.14 + sideAmount * 0.2 + topAmount * 0.06) * castMultiplier, 0.04, 0.52);
  }

  const wallZ = -shellDepth - 10;
  const shadowShiftX = -yawSide * bounds.width * (0.08 + sideAmount * 0.18);
  const shadowShiftY = -bounds.height * (0.035 + topAmount * 0.03);
  const wallOcclusion = floorGroup.getObjectByName('wallOcclusion');
  if (wallOcclusion) {
    wallOcclusion.position.set(shadowShiftX, modelY + shadowShiftY, wallZ);
    wallOcclusion.rotation.z = -yawSide * 0.035;
    wallOcclusion.scale.set(1.02 + sideAmount * 0.22, 1.02 + topAmount * 0.12, 1);
    wallOcclusion.material.opacity = clamp((0.22 + sideAmount * 0.18 + topAmount * 0.04 - lit * frontAmount * 0.045) * wallMultiplier, 0.08, 0.6);
  }

  const wallHalo = floorGroup.getObjectByName('wallHalo');
  if (wallHalo) {
    wallHalo.position.set(
      shadowShiftX * 0.44,
      modelY - bounds.height * (0.015 + topAmount * 0.012),
      wallZ + 0.18,
    );
    wallHalo.rotation.z = -yawSide * 0.02;
    wallHalo.scale.set(1.04 + sideAmount * 0.16, 1.04 + topAmount * 0.08, 1);
    wallHalo.material.opacity = (lit ? 0.08 + frontAmount * 0.06 + sideAmount * 0.025 : 0.004) * wallHaloMultiplier;
  }
}

function makeGroundShadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const gradient = ctx.createRadialGradient(170, 88, 10, 220, 92, 250);
  gradient.addColorStop(0, 'rgba(0,0,0,0.72)');
  gradient.addColorStop(0.38, 'rgba(0,0,0,0.46)');
  gradient.addColorStop(0.72, 'rgba(0,0,0,0.15)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

function makeGroundGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const gradient = ctx.createRadialGradient(270, 88, 0, 270, 92, 160);
  gradient.addColorStop(0, 'rgba(255,238,188,0.48)');
  gradient.addColorStop(0.34, 'rgba(255,225,144,0.22)');
  gradient.addColorStop(0.72, 'rgba(255,221,126,0.045)');
  gradient.addColorStop(1, 'rgba(255,221,126,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

function makeGroundHaloTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const gradient = ctx.createRadialGradient(256, 100, 0, 256, 100, 170);
  gradient.addColorStop(0, 'rgba(255,232,170,0.16)');
  gradient.addColorStop(0.46, 'rgba(255,218,124,0.055)');
  gradient.addColorStop(1, 'rgba(255,218,124,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

function makeWallOcclusionTexture(processed) {
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const source = processed?.artworkCanvas;
  if (!source) {
    const fallback = ctx.createRadialGradient(360, 370, 20, 360, 370, 280);
    fallback.addColorStop(0, 'rgba(0,0,0,0.54)');
    fallback.addColorStop(0.44, 'rgba(0,0,0,0.24)');
    fallback.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fallback;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    const mask = document.createElement('canvas');
    mask.width = 520;
    mask.height = 520;
    const maskCtx = mask.getContext('2d');
    const scale = Math.min(mask.width / source.width, mask.height / source.height) * 0.84;
    const w = source.width * scale;
    const h = source.height * scale;
    maskCtx.drawImage(source, (mask.width - w) / 2, (mask.height - h) / 2, w, h);
    maskCtx.globalCompositeOperation = 'source-in';
    maskCtx.fillStyle = 'rgba(0,0,0,0.86)';
    maskCtx.fillRect(0, 0, mask.width, mask.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2 + 12);
    [
      { blur: 18, alpha: 0.36, scale: 1.02, x: 0, y: 0 },
      { blur: 32, alpha: 0.24, scale: 1.08, x: 5, y: 7 },
      { blur: 58, alpha: 0.14, scale: 1.18, x: 12, y: 14 },
    ].forEach((layer) => {
      ctx.globalAlpha = layer.alpha;
      ctx.filter = `blur(${layer.blur}px)`;
      ctx.drawImage(mask, -mask.width * layer.scale / 2 + layer.x, -mask.height * layer.scale / 2 + layer.y, mask.width * layer.scale, mask.height * layer.scale);
    });
    ctx.globalAlpha = 1;
    ctx.filter = 'none';
    ctx.restore();

    const core = ctx.createRadialGradient(360, 382, 0, 360, 382, 235);
    core.addColorStop(0, 'rgba(0,0,0,0.18)');
    core.addColorStop(0.46, 'rgba(0,0,0,0.07)');
    core.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

function makeWallHaloTexture(processed) {
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const source = state.frontColoursCustomized && processed ? createMappedArtworkCanvas(processed) : processed?.artworkCanvas;
  if (source) {
    const mask = document.createElement('canvas');
    mask.width = 520;
    mask.height = 520;
    const maskCtx = mask.getContext('2d');
    const scale = Math.min(mask.width / source.width, mask.height / source.height) * 0.86;
    const w = source.width * scale;
    const h = source.height * scale;
    maskCtx.drawImage(source, (mask.width - w) / 2, (mask.height - h) / 2, w, h);
    maskCtx.globalCompositeOperation = 'source-in';
    maskCtx.fillStyle = 'rgba(255,225,160,0.62)';
    maskCtx.fillRect(0, 0, mask.width, mask.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2 + 8);
    [
      { blur: 24, alpha: 0.34, scale: 1.05 },
      { blur: 54, alpha: 0.2, scale: 1.18 },
      { blur: 88, alpha: 0.12, scale: 1.34 },
    ].forEach((layer) => {
      ctx.globalAlpha = layer.alpha;
      ctx.filter = `blur(${layer.blur}px)`;
      ctx.drawImage(mask, -mask.width * layer.scale / 2, -mask.height * layer.scale / 2, mask.width * layer.scale, mask.height * layer.scale);
    });
    ctx.restore();
  }

  const ambient = ctx.createRadialGradient(360, 380, 0, 360, 380, 260);
  ambient.addColorStop(0, 'rgba(255,235,186,0.16)');
  ambient.addColorStop(0.44, 'rgba(255,219,142,0.055)');
  ambient.addColorStop(1, 'rgba(255,219,142,0)');
  ctx.fillStyle = ambient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

function makeProjectedShadowTexture(processed, flatten = 0.26, opacity = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 260;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const source = processed?.artworkCanvas;
  if (!source) {
    const fallback = ctx.createRadialGradient(320, 130, 0, 320, 130, 220);
    fallback.addColorStop(0, `rgba(0,0,0,${0.5 * opacity})`);
    fallback.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fallback;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    const temp = document.createElement('canvas');
    temp.width = 520;
    temp.height = 520;
    const tempCtx = temp.getContext('2d');
    const scale = Math.min(temp.width / source.width, temp.height / source.height) * 0.9;
    const w = source.width * scale;
    const h = source.height * scale;
    tempCtx.drawImage(source, (temp.width - w) / 2, (temp.height - h) / 2, w, h);
    tempCtx.globalCompositeOperation = 'source-in';
    tempCtx.fillStyle = `rgba(0,0,0,${opacity})`;
    tempCtx.fillRect(0, 0, temp.width, temp.height);

    ctx.save();
    ctx.translate(canvas.width * 0.52, canvas.height * 0.52);
    ctx.scale(1.05, flatten);
    ctx.filter = 'blur(3px)';
    ctx.drawImage(temp, -temp.width / 2, -temp.height / 2);
    ctx.filter = 'none';
    ctx.restore();
  }

  const fade = ctx.createLinearGradient(0, 0, canvas.width, 0);
  fade.addColorStop(0, 'rgba(0,0,0,0)');
  fade.addColorStop(0.16, 'rgba(0,0,0,1)');
  fade.addColorStop(0.72, 'rgba(0,0,0,0.86)');
  fade.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'source-over';

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

function makeKeyholeInteriorTexture(processed) {
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 144;
  const ctx = canvas.getContext('2d');
  const faceHex = getRepresentativeFaceColour(processed);
  const faceRgb = hexToRgb(faceHex);
  const shade = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  shade.addColorStop(0, `rgba(${Math.min(255, faceRgb[0] + 42)}, ${Math.min(255, faceRgb[1] + 42)}, ${Math.min(255, faceRgb[2] + 42)}, 1)`);
  shade.addColorStop(0.48, `rgba(${faceRgb[0]}, ${faceRgb[1]}, ${faceRgb[2]}, 1)`);
  shade.addColorStop(1, `rgba(${Math.round(faceRgb[0] * 0.38)}, ${Math.round(faceRgb[1] * 0.38)}, ${Math.round(faceRgb[2] * 0.38)}, 1)`);
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255,242,202,0.34)';
  ctx.fillRect(canvas.width * 0.54, 0, canvas.width * 0.16, canvas.height);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(0, 0, canvas.width * 0.2, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

function getRepresentativeFaceColour(processed) {
  const source = state.frontColoursCustomized && processed ? createMappedArtworkCanvas(processed) : processed?.artworkCanvas;
  if (!source) return '#d1a073';
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const buckets = new Map();
  for (let i = 0; i < data.length; i += 16) {
    const alpha = data[i + 3];
    if (alpha < 80) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    if (brightness < 40 || brightness > 242) continue;
    const key = `${Math.round(r / 32) * 32},${Math.round(g / 32) * 32},${Math.round(b / 32) * 32}`;
    const current = buckets.get(key) || { count: 0, r: 0, g: 0, b: 0 };
    current.count += 1;
    current.r += r;
    current.g += g;
    current.b += b;
    buckets.set(key, current);
  }
  const best = [...buckets.values()].sort((a, b) => b.count - a.count)[0];
  if (!best) return '#d1a073';
  return rgbToHex([best.r / best.count, best.g / best.count, best.b / best.count]);
}

function getModelBounds(processed) {
  const maxWidth = 148;
  const maxHeight = 148;
  const width = processed.aspect >= 1 ? maxWidth : maxHeight * processed.aspect;
  const height = processed.aspect >= 1 ? maxWidth / processed.aspect : maxHeight;
  return { width, height, minX: -width / 2, maxX: width / 2, minY: -height / 2, maxY: height / 2 };
}

function getBackPlateKeyholeAnchor(processed, bounds) {
  if (!processed?.alphaMask || !processed.width || !processed.height) return null;
  const width = processed.width;
  const height = processed.height;
  const mask = processed.alphaMask;
  const rowCounts = new Uint32Array(height);
  let maxRowCount = 0;
  for (let y = 0; y < height; y += 1) {
    let count = 0;
    const rowStart = y * width;
    for (let x = 0; x < width; x += 1) {
      if (mask[rowStart + x]) count += 1;
    }
    rowCounts[y] = count;
    maxRowCount = Math.max(maxRowCount, count);
  }
  if (!maxRowCount) return null;

  const threshold = Math.max(8, Math.round(maxRowCount * 0.55));
  let best = null;
  let current = null;
  for (let y = 0; y <= height; y += 1) {
    const inBand = y < height && rowCounts[y] >= threshold;
    if (inBand && !current) current = { start: y, end: y, area: 0 };
    if (inBand && current) {
      current.end = y;
      current.area += rowCounts[y];
    }
    if ((!inBand || y === height) && current) {
      if (!best || current.area > best.area) best = current;
      current = null;
    }
  }
  if (!best) return null;

  let minX = width;
  let maxX = -1;
  let pixelCount = 0;
  let yTotal = 0;
  for (let y = best.start; y <= best.end; y += 1) {
    const rowStart = y * width;
    for (let x = 0; x < width; x += 1) {
      if (!mask[rowStart + x]) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      yTotal += y;
      pixelCount += 1;
    }
  }
  if (!pixelCount || maxX < minX) return null;

  const centerX = ((minX + maxX + 1) / 2 / width - 0.5) * bounds.width;
  const centerY = (0.5 - (yTotal / pixelCount + 0.5) / height) * bounds.height;
  return { x: centerX, y: centerY };
}

function getPreviewSvgSize(aspect) {
  const width = aspect >= 1 ? 1000 : 1000 * aspect;
  const height = aspect >= 1 ? 1000 / aspect : 1000;
  return { width, height };
}

function segmentsIntersect(a1, a2, b1, b2) {
  const direction = (p, q, r) => ((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  const d1 = direction(a1, a2, b1);
  const d2 = direction(a1, a2, b2);
  const d3 = direction(b1, b2, a1);
  const d4 = direction(b1, b2, a2);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

function intersectOffsetLines(pointA, directionA, pointB, directionB) {
  const cross = directionA.x * directionB.y - directionA.y * directionB.x;
  if (Math.abs(cross) < 0.0001) return null;
  const dx = pointB.x - pointA.x;
  const dy = pointB.y - pointA.y;
  const t = (dx * directionB.y - dy * directionB.x) / cross;
  return pointA.clone().add(directionA.clone().multiplyScalar(t));
}

function makeBackPlateShape(backPoints, bounds, options = {}) {
  const shape = makeThreeShape(backPoints, options);
  shape.holes.push(makeKeyholeCutoutPath(bounds));
  return shape;
}

function findShapeForKeyhole(shapes, keyholeBounds) {
  const keyholePoint = [
    Number.isFinite(keyholeBounds.keyholeX) ? keyholeBounds.keyholeX : 0,
    Number.isFinite(keyholeBounds.keyholeY) ? keyholeBounds.keyholeY : 0,
  ];
  let largest = null;
  let largestArea = 0;
  for (const shape of shapes) {
    const points = (shape.extractPoints(12).shape || []).map((point) => [point.x, point.y]);
    if (points.length < 3) continue;
    const area = Math.abs(polygonArea(points));
    if (area > largestArea) {
      largest = shape;
      largestArea = area;
    }
    if (pointInPolygon(keyholePoint, points)) return shape;
  }
  return largest;
}

function makeKeyholeCutoutPath(bounds, visualScale = 1) {
  const centerX = Number.isFinite(bounds.keyholeX) ? bounds.keyholeX : 0;
  const centerY = Number.isFinite(bounds.keyholeY) ? bounds.keyholeY : 0;
  const lowerRadius = 4.5 * visualScale;
  const stemWidth = 5.16 * visualScale;
  const topRadius = stemWidth / 2;
  const centerGap = (15 - 4.5 - 2.58) * visualScale;
  const topY = centerY - (topRadius - centerGap - lowerRadius) / 2;
  const lowerY = topY - centerGap;
  const left = centerX - stemWidth / 2;
  const right = centerX + stemWidth / 2;
  const localRight = stemWidth / 2;
  const neckJoinY = lowerY + Math.sqrt(Math.max(0, lowerRadius * lowerRadius - localRight * localRight));
  const path = new THREE.Path();
  path.moveTo(left, topY);
  path.absarc(centerX, topY, topRadius, Math.PI, 0, true);
  path.lineTo(right, neckJoinY);
  path.absarc(centerX, lowerY, lowerRadius, Math.acos(localRight / lowerRadius), Math.PI - Math.acos(localRight / lowerRadius), true);
  path.lineTo(left, topY);
  path.closePath();
  return path;
}

function makeKeyholeCutoutShape(bounds, visualScale = 1) {
  const path = makeKeyholeCutoutPath(bounds, visualScale);
  const points = path.getPoints(28);
  const shape = new THREE.Shape();
  points.forEach((point, idx) => {
    if (idx === 0) shape.moveTo(point.x, point.y);
    else shape.lineTo(point.x, point.y);
  });
  shape.closePath();
  return shape;
}

function applyPlanarUvs(geometry, bounds) {
  const position = geometry.attributes.position;
  const uvs = [];
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    uvs.push((x - bounds.minX) / bounds.width, (y - bounds.minY) / bounds.height);
  }
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
}

function applyLocalGeometryUvs(geometry) {
  const position = geometry.attributes.position;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const width = Math.max(0.0001, maxX - minX);
  const height = Math.max(0.0001, maxY - minY);
  const uvs = [];
  for (let i = 0; i < position.count; i += 1) {
    uvs.push(
      clamp((position.getX(i) - minX) / width, 0, 1),
      clamp((position.getY(i) - minY) / height, 0, 1),
    );
  }
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
}

function createMappedArtworkCanvas(processed) {
  const canvas = document.createElement('canvas');
  canvas.width = processed.width;
  canvas.height = processed.height;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(processed.width, processed.height);
  const displayColours = processed.colours.map((region, idx) => hexToRgb(getDisplayColour(idx, region.hex)));
  for (let i = 0; i < processed.regionIndex.length; i += 1) {
    const region = processed.regionIndex[i];
    const o = i * 4;
    if (!processed.alphaMask[i] || region < 0 || !displayColours[region]) {
      img.data[o + 3] = 0;
      continue;
    }
    const rgb = displayColours[region];
    img.data[o] = rgb[0];
    img.data[o + 1] = rgb[1];
    img.data[o + 2] = rgb[2];
    img.data[o + 3] = processed.alphaValues?.[i] || 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function processArtwork(artwork, options = {}) {
  const crop = state.edit.crop || { x: 0, y: 0, w: 1, h: 1 };
  const srcW = Math.max(1, Math.round(getArtworkImageWidth(artwork.image) * crop.w));
  const srcH = Math.max(1, Math.round(getArtworkImageHeight(artwork.image) * crop.h));
  const maxSide = Number(options.maxSide) || (artwork.type === 'svg' ? 1500 : 1200);
  const scale = artwork.type === 'svg'
    ? maxSide / Math.max(srcW, srcH)
    : Math.min(maxSide / srcW, maxSide / srcH, 1);
  let width = Math.max(12, Math.round(srcW * scale));
  let height = Math.max(12, Math.round(srcH * scale));
  let canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  let ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, width, height);
  drawArtworkIntoExpandedCrop(ctx, artwork, crop, scale);
  let img = ctx.getImageData(0, 0, width, height);
  let data = img.data;
  if (state.removeBg) {
    removeConnectedBackgroundFromImageData(data, width, height);
    ctx.putImageData(img, 0, 0);
  }
  ({ canvas, ctx, img, data, width, height } = tightenProcessedCanvasToVisibleArtwork(canvas, ctx, img, width, height));
  ({ canvas, ctx, img, data, width, height } = addTransparentCanvasPadding(canvas, ctx, width, height));
  let floatingSupportMask = null;
  let floatingSupportRgb = null;
  if (state.fixFloatingRegions) {
    floatingSupportRgb = hexToRgb(state.floatingSupportColour || DEFAULT_FLOATING_SUPPORT_COLOUR);
    floatingSupportMask = connectFloatingRegionsOnCanvas(canvas, ctx, floatingSupportRgb);
    img = ctx.getImageData(0, 0, width, height);
    data = img.data;
  }
  const paletteClusters = artwork.palette?.length
    ? artwork.palette.map((rgb, idx) => ({ original: idx, rgb: rgb.map(Number), count: 0 }))
    : null;
  let clusters = paletteClusters || [];
  const clusterTolerance = getColourClusterTolerance();
  const alphaMask = new Uint8Array(width * height);
  const alphaValues = new Uint8Array(width * height);
  const regionIndex = new Int16Array(width * height).fill(-1);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const a = data[i + 3];
      if (a < 28) {
        data[i + 3] = 0;
        continue;
      }
      const rgb = [data[i], data[i + 1], data[i + 2]];
      const isFloatingSupportPixel = Boolean(floatingSupportMask?.[y * width + x]);
      let idx;
      if (isFloatingSupportPixel) {
        idx = FLOATING_SUPPORT_CLUSTER_ORIGINAL;
        let supportCluster = clusters.find((cluster) => cluster.original === FLOATING_SUPPORT_CLUSTER_ORIGINAL);
        if (!supportCluster) {
          supportCluster = { original: FLOATING_SUPPORT_CLUSTER_ORIGINAL, rgb: floatingSupportRgb.map(Number), count: 0, isFloatingSupport: true };
          clusters.push(supportCluster);
        }
        supportCluster.count += a / 255;
      } else if (a < 74) {
        idx = -1;
      } else {
        const normalizedRgb = normalizeVectorRgb(rgb);
        if (paletteClusters) {
          const paletteCluster = paletteClusters[nearestCluster(paletteClusters, normalizedRgb, { excludeSupport: true })];
          idx = paletteCluster.original;
          paletteCluster.count += a / 255;
        } else {
          idx = findOrCreateCluster(clusters, normalizedRgb, a, clusterTolerance);
        }
      }
      alphaMask[y * width + x] = 1;
      alphaValues[y * width + x] = a;
      regionIndex[y * width + x] = idx;
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
  const requestedColourCount = clamp(Number(state.targetColorCount) || 8, 1, 8);
  const plaqueTraceQuality = normalizePlaqueTraceQuality(state.plaque.traceQuality);
  const frontColoursWereCustomized = state.productType === 'plaque'
    ? Boolean(state.plaque.frontColoursCustomized)
    : Boolean(state.frontColoursCustomized);
  const effectiveRequestedColourCount = state.productType === 'plaque'
    ? clamp(Number(state.plaque.targetColorCount) || requestedColourCount, 1, 8)
    : requestedColourCount;
  const plaqueRasterAutoPalette = state.productType === 'plaque' && artwork.type !== 'svg' && !frontColoursWereCustomized;
  const plaqueAutoColourLimit = plaqueRasterAutoPalette
    ? getPlaqueAutoPaletteLimit(activeClusters.filter((cluster) => cluster.original !== FLOATING_SUPPORT_CLUSTER_ORIGINAL), printableWeight)
    : null;
  const colourLimit = frontColoursWereCustomized ? effectiveRequestedColourCount : (plaqueAutoColourLimit || naturalColourCount);
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
  if (state.productType === 'plaque' && artwork.type !== 'svg') {
    assignPlaqueRasterPixelsToFinalColours(regionIndex, alphaMask, alphaValues, data, main, width, height);
    refinePlaqueRasterPaletteFromAssignedPixels(regionIndex, alphaMask, alphaValues, data, main);
    if (plaqueTraceQuality !== 'raw') {
      cleanupPlaqueExactAntiAliasRegions(regionIndex, alphaMask, alphaValues, data, main, width, height);
      cleanPlaqueLabelledColourMap(regionIndex, alphaMask, alphaValues, data, main, width, height);
      refinePlaqueRasterPaletteFromAssignedPixels(regionIndex, alphaMask, alphaValues, data, main);
    }
  }
  main.forEach((cluster, idx) => {
    cluster.id = idx;
    cluster.hex = rgbToHex(cluster.rgb);
    cluster.mask = new Uint8Array(width * height);
  });
  for (let i = 0; i < regionIndex.length; i += 1) {
    if (alphaMask[i] && regionIndex[i] >= 0) main[regionIndex[i]].mask[i] = 1;
  }
  if (state.productType === 'plaque' && artwork.type !== 'svg' && plaqueTraceQuality === 'smooth') {
    cleanPlaqueRasterRegionMasks(main, regionIndex, alphaMask, width, height, {
      includeRemoved: shouldKeepPlaqueDeferredDebugData(),
    });
  }

  const plaqueLabelledMap = state.productType === 'plaque' && artwork.type !== 'svg'
    ? buildPlaqueExactLabelledMap(main, regionIndex, alphaMask, alphaValues, width, height)
    : null;
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
    artworkType: artwork.type,
    artworkUrl: canvas.toDataURL('image/png'),
    artworkCanvas: canvas,
    naturalColourCount,
    alphaMask,
    alphaValues,
    regionIndex,
    colours: regionPaths,
    plaqueLabelledMap,
    silhouette,
    warnings: buildWarnings({ artwork, clusters: sourceClusters, main, islands, tinyShapes, opaqueCount, width, height }).concat(
      plaqueLabelledMap?.warnings || [],
    ),
  };
}

function getColourClusterTolerance() {
  const requested = state.productType === 'plaque'
    ? clamp(Number(state.plaque.targetColorCount) || Number(state.targetColorCount) || 8, 1, 8)
    : clamp(Number(state.targetColorCount) || 8, 1, 8);
  if (requested >= 4) return Math.min(Math.max(state.tolerance, 34), 42);
  if (requested === 3) return Math.min(Math.max(state.tolerance, 38), 48);
  return Math.min(Math.max(state.tolerance, 42), 56);
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
    const interiorRatio = stat ? stat.interior / Math.max(cluster.count, 1) : 0;
    const luma = colourLuma(cluster.rgb);
    const chroma = colourChroma(cluster.rgb);
    const isKeyNeutral = (luma <= 48 && chroma <= 32) || (luma >= 224 && chroma <= 34);
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

function averageCornerColour(data, width, height) {
  const samples = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];
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

function removeConnectedBackgroundFromImageData(data, width, height) {
  const bg = collectBackgroundSeedColours(data, width, height);
  const mask = buildConnectedBackgroundMask(data, width, height, bg, state.tolerance);
  for (let i = 0; i < mask.length; i += 1) {
    if (!mask[i]) continue;
    const o = i * 4;
    data[o + 3] = 0;
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

  const nextCanvas = document.createElement('canvas');
  nextCanvas.width = croppedWidth;
  nextCanvas.height = croppedHeight;
  const nextCtx = nextCanvas.getContext('2d', { willReadFrequently: true });
  nextCtx.clearRect(0, 0, croppedWidth, croppedHeight);
  nextCtx.drawImage(canvas, x, y, croppedWidth, croppedHeight, 0, 0, croppedWidth, croppedHeight);
  const nextImg = nextCtx.getImageData(0, 0, croppedWidth, croppedHeight);
  return {
    canvas: nextCanvas,
    ctx: nextCtx,
    img: nextImg,
    data: nextImg.data,
    width: croppedWidth,
    height: croppedHeight,
  };
}

function addTransparentCanvasPadding(canvas, ctx, width, height) {
  const pad = Math.max(20, Math.round(Math.max(width, height) * 0.065));
  const nextWidth = width + pad * 2;
  const nextHeight = height + pad * 2;
  const nextCanvas = document.createElement('canvas');
  nextCanvas.width = nextWidth;
  nextCanvas.height = nextHeight;
  const nextCtx = nextCanvas.getContext('2d', { willReadFrequently: true });
  nextCtx.clearRect(0, 0, nextWidth, nextHeight);
  nextCtx.drawImage(canvas, pad, pad);
  const nextImg = nextCtx.getImageData(0, 0, nextWidth, nextHeight);
  return {
    canvas: nextCanvas,
    ctx: nextCtx,
    img: nextImg,
    data: nextImg.data,
    width: nextWidth,
    height: nextHeight,
  };
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

function buildSilhouette(mask, width, height) {
  let count = 0;
  for (let i = 0; i < mask.length; i += 1) {
    if (mask[i]) count += 1;
  }
  if (!count) return defaultSilhouette();

  const clean = keepPrintableMaskComponents(mask, width, height, Math.max(16, Math.round(count * 0.00018)));
  const traced = traceMaskOutline(clean, width, height);
  if (traced.length >= 12) {
    const averaged = smoothPolygon(traced, 1);
    const simplified = simplifyPolygon(averaged, Math.max(0.85, Math.max(width, height) / 1280));
    const polished = chaikinSmoothClosed(simplified, 2);
    return polished.map(([x, y]) => [
      clamp(x / width, 0, 1),
      clamp(y / height, 0, 1),
    ]);
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
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
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
  return simplified.map(([x, y]) => [
    clamp(x / width, 0, 1),
    clamp(y / height, 0, 1),
  ]);
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

function polygonArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const next = points[(i + 1) % points.length];
    area += points[i][0] * next[1] - next[0] * points[i][1];
  }
  return area / 2;
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
      [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ].forEach(([nx, ny]) => {
        const ni = ny * width + nx;
        if (nx >= 0 && ny >= 0 && nx < width && ny < height && mask[ni] && !seen[ni]) {
          seen[ni] = 1;
          stack.push(ni);
        }
      });
    }
    if (component.length >= minPixels) {
      component.forEach((index) => {
        output[index] = 1;
      });
    }
  }
  return output.some((value) => value) ? output : mask;
}

function connectFloatingRegionsOnCanvas(canvas, ctx, supportRgb = hexToRgb(DEFAULT_FLOATING_SUPPORT_COLOUR)) {
  if (!canvas || !ctx) return null;
  const width = canvas.width;
  const height = canvas.height;
  const colour = { r: supportRgb[0], g: supportRgb[1], b: supportRgb[2], a: 255 };
  const supportMask = new Uint8Array(width * height);
  const initialComponents = getCanvasAlphaComponents(ctx);
  if (initialComponents.length <= 1) {
    mergeSupportMask(supportMask, fillEnclosedTransparentRegions(ctx, colour));
    return supportMask;
  }

  addFloatingIslandSupport(ctx, colour, supportMask, { mode: 'stroke' });
  mergeSupportMask(supportMask, fillEnclosedTransparentRegions(ctx, colour));

  const remainingComponents = getCanvasAlphaComponents(ctx);
  const needsBorderFill = remainingComponents.length > 1 || initialComponents.length > 1;
  if (needsBorderFill) {
    addFloatingIslandSupport(ctx, colour, supportMask, { mode: 'border' });
    mergeSupportMask(supportMask, fillEnclosedTransparentRegions(ctx, colour));
  }
  return supportMask;
}

function getCanvasAlphaComponents(ctx, minPixels = 12) {
  const canvas = ctx.canvas;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return getAlphaComponents(img.data, canvas.width, canvas.height, 28)
    .filter((component) => component.pixels.length >= minPixels)
    .sort((a, b) => b.pixels.length - a.pixels.length);
}

function mergeSupportMask(target, source) {
  if (!target || !source) return target;
  for (let i = 0; i < Math.min(target.length, source.length); i += 1) {
    if (source[i]) target[i] = 1;
  }
  return target;
}

function getFloatingSupportCluster(components, main, width, height) {
  const floating = components.slice(1);
  if (!floating.length) return [];
  const nearest = floating
    .slice()
    .sort((a, b) => distanceBetweenBounds(a.bounds, main.bounds) - distanceBetweenBounds(b.bounds, main.bounds))[0];
  const clusterBounds = {
    minX: Math.min(nearest.bounds.minX, main.bounds.minX),
    minY: Math.min(nearest.bounds.minY, main.bounds.minY),
    maxX: Math.max(nearest.bounds.maxX, main.bounds.maxX),
    maxY: Math.max(nearest.bounds.maxY, main.bounds.maxY),
  };
  const yBandPadding = Math.max(10, Math.round(height * 0.045));
  const xBandPadding = Math.max(10, Math.round(width * 0.045));
  return floating.filter((component) => (
    component.bounds.maxY >= nearest.bounds.minY - yBandPadding
    && component.bounds.minY <= main.bounds.maxY + yBandPadding
    && component.bounds.maxX >= clusterBounds.minX - xBandPadding
    && component.bounds.minX <= clusterBounds.maxX + xBandPadding
  )).sort((a, b) => distanceBetweenBounds(a.bounds, main.bounds) - distanceBetweenBounds(b.bounds, main.bounds));
}

function mergeComponents(components) {
  const merged = {
    pixels: [],
    boundary: [],
    bounds: {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
    },
  };
  components.forEach((component) => {
    merged.pixels.push(...component.pixels);
    merged.boundary.push(...component.boundary);
    merged.bounds.minX = Math.min(merged.bounds.minX, component.bounds.minX);
    merged.bounds.minY = Math.min(merged.bounds.minY, component.bounds.minY);
    merged.bounds.maxX = Math.max(merged.bounds.maxX, component.bounds.maxX);
    merged.bounds.maxY = Math.max(merged.bounds.maxY, component.bounds.maxY);
  });
  return merged;
}

function getAlphaComponents(data, width, height, alphaThreshold = 28) {
  const seen = new Uint8Array(width * height);
  const components = [];
  const stack = [];
  const neighbours = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];

  for (let i = 0; i < seen.length; i += 1) {
    if (seen[i] || data[i * 4 + 3] <= alphaThreshold) continue;
    const pixels = [];
    const boundary = [];
    const bounds = { minX: width, minY: height, maxX: 0, maxY: 0 };
    seen[i] = 1;
    stack.push(i);
    while (stack.length) {
      const current = stack.pop();
      const x = current % width;
      const y = Math.floor(current / width);
      pixels.push(current);
      bounds.minX = Math.min(bounds.minX, x);
      bounds.minY = Math.min(bounds.minY, y);
      bounds.maxX = Math.max(bounds.maxX, x);
      bounds.maxY = Math.max(bounds.maxY, y);
      let isBoundary = false;

      neighbours.forEach(([dx, dy]) => {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
          isBoundary = true;
          return;
        }
        const ni = ny * width + nx;
        if (data[ni * 4 + 3] <= alphaThreshold) {
          isBoundary = true;
          return;
        }
        if (!seen[ni]) {
          seen[ni] = 1;
          stack.push(ni);
        }
      });

      if (isBoundary) boundary.push({ x, y, index: current });
    }
    components.push({ pixels, boundary: thinBoundarySamples(boundary), bounds });
  }
  return components;
}

function thinBoundarySamples(boundary, maxSamples = 900) {
  if (boundary.length <= maxSamples) return boundary;
  const step = Math.ceil(boundary.length / maxSamples);
  const samples = [];
  for (let i = 0; i < boundary.length; i += step) samples.push(boundary[i]);
  return samples;
}

function findNearestComponentBridge(fromComponent, toComponent) {
  let best = null;
  let bestDistance = Infinity;
  fromComponent.boundary.forEach((from) => {
    toComponent.boundary.forEach((to) => {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = dx * dx + dy * dy;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = { from, to };
      }
    });
  });
  return best;
}

function sampleComponentColour(data, pixels) {
  const step = Math.max(1, Math.floor(pixels.length / 900));
  let r = 0;
  let g = 0;
  let b = 0;
  let weight = 0;
  for (let i = 0; i < pixels.length; i += step) {
    const offset = pixels[i] * 4;
    const alpha = data[offset + 3] / 255;
    if (alpha <= 0.1) continue;
    r += data[offset] * alpha;
    g += data[offset + 1] * alpha;
    b += data[offset + 2] * alpha;
    weight += alpha;
  }
  if (!weight) return { r: 0, g: 0, b: 0, a: 255 };
  return {
    r: Math.round(r / weight),
    g: Math.round(g / weight),
    b: Math.round(b / weight),
    a: 255,
  };
}

function outlineFloatingComponent(data, width, height, component, radius, colour) {
  const originalAlpha = new Uint8Array(width * height);
  for (let i = 0; i < originalAlpha.length; i += 1) originalAlpha[i] = data[i * 4 + 3] > 28 ? 1 : 0;
  const radiusSq = radius * radius;
  const targets = [];
  component.boundary.forEach((point) => {
    for (let dy = -radius; dy <= radius; dy += 1) {
      const y = point.y + dy;
      if (y < 0 || y >= height) continue;
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (dx * dx + dy * dy > radiusSq) continue;
        const x = point.x + dx;
        if (x < 0 || x >= width) continue;
        const index = y * width + x;
        if (originalAlpha[index]) continue;
        targets.push(index);
      }
    }
  });

  targets.forEach((index) => {
    const offset = index * 4;
    data[offset] = colour.r;
    data[offset + 1] = colour.g;
    data[offset + 2] = colour.b;
    data[offset + 3] = colour.a;
  });
}

function drawComponentOutlineStroke(ctx, img, component, radius, colour) {
  const pad = radius + 3;
  const minX = Math.max(0, component.bounds.minX - pad);
  const minY = Math.max(0, component.bounds.minY - pad);
  const maxX = Math.min(img.width - 1, component.bounds.maxX + pad);
  const maxY = Math.min(img.height - 1, component.bounds.maxY + pad);
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const maskCanvas = document.createElement('canvas');
  const originalCanvas = document.createElement('canvas');
  maskCanvas.width = width;
  maskCanvas.height = height;
  originalCanvas.width = width;
  originalCanvas.height = height;
  const maskCtx = maskCanvas.getContext('2d');
  const originalCtx = originalCanvas.getContext('2d');
  const mask = maskCtx.createImageData(width, height);
  const original = originalCtx.createImageData(width, height);
  component.pixels.forEach((index) => {
    const source = index * 4;
    const x = index % img.width;
    const y = Math.floor(index / img.width);
    const target = ((y - minY) * width + (x - minX)) * 4;
    mask.data[target] = colour.r;
    mask.data[target + 1] = colour.g;
    mask.data[target + 2] = colour.b;
    mask.data[target + 3] = 255;
    original.data[target] = img.data[source];
    original.data[target + 1] = img.data[source + 1];
    original.data[target + 2] = img.data[source + 2];
    original.data[target + 3] = img.data[source + 3];
  });
  maskCtx.putImageData(mask, 0, 0);
  originalCtx.putImageData(original, 0, 0);

  const strokeCanvas = document.createElement('canvas');
  strokeCanvas.width = width;
  strokeCanvas.height = height;
  const strokeCtx = strokeCanvas.getContext('2d');
  strokeCtx.imageSmoothingEnabled = false;
  for (let dy = -radius; dy <= radius; dy += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      if (dx * dx + dy * dy > radius * radius) continue;
      strokeCtx.drawImage(maskCanvas, dx, dy);
    }
  }

  ctx.save();
  ctx.globalCompositeOperation = 'destination-over';
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(strokeCanvas, minX, minY);
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(originalCanvas, minX, minY);
  ctx.restore();
}

function fillEnclosedTransparentRegions(ctx, colour) {
  const canvas = ctx.canvas;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = img.data;
  const width = canvas.width;
  const height = canvas.height;
  const filledMask = new Uint8Array(width * height);
  const outside = new Uint8Array(width * height);
  const queue = [];
  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const index = y * width + x;
    if (outside[index] || data[index * 4 + 3] > 28) return;
    outside[index] = 1;
    queue.push(index);
  };
  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
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

  const seen = new Uint8Array(width * height);
  const stack = [];
  const pixels = [];
  for (let i = 0; i < width * height; i += 1) {
    if (outside[i] || seen[i] || data[i * 4 + 3] > 28) continue;
    seen[i] = 1;
    stack.push(i);
    pixels.length = 0;
    while (stack.length) {
      const current = stack.pop();
      pixels.push(current);
      const x = current % width;
      const y = Math.floor(current / width);
      [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ].forEach(([nx, ny]) => {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) return;
        const next = ny * width + nx;
        if (outside[next] || seen[next] || data[next * 4 + 3] > 28) return;
        seen[next] = 1;
        stack.push(next);
      });
    }
    pixels.forEach((index) => {
      const offset = index * 4;
      data[offset] = colour.r;
      data[offset + 1] = colour.g;
      data[offset + 2] = colour.b;
      data[offset + 3] = colour.a;
      filledMask[index] = 1;
    });
  }
  ctx.putImageData(img, 0, 0);
  return filledMask;
}

function addFloatingIslandSupport(ctx, colour, supportMask = null, options = {}) {
  const canvas = ctx.canvas;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = img.data;
  const width = canvas.width;
  const height = canvas.height;
  const mask = supportMask || new Uint8Array(width * height);
  const mode = options.mode || 'stroke';
  const borderMode = mode === 'border';
  const components = getAlphaComponents(data, width, height, 28)
    .filter((component) => component.pixels.length >= 12)
    .sort((a, b) => b.pixels.length - a.pixels.length);
  if (!components.length || (components.length <= 1 && !borderMode)) return mask;

  const main = components[0];
  const minSide = Math.min(width, height);
  const maxRadius = borderMode
    ? clamp(Math.round(minSide * 0.09), 28, 84)
    : clamp(Math.round(minSide * 0.034), 12, 34);
  const supportCanvas = document.createElement('canvas');
  supportCanvas.width = width;
  supportCanvas.height = height;
  const supportCtx = supportCanvas.getContext('2d');
  supportCtx.imageSmoothingEnabled = false;
  supportCtx.fillStyle = `rgba(${colour.r}, ${colour.g}, ${colour.b}, 1)`;
  supportCtx.strokeStyle = supportCtx.fillStyle;
  supportCtx.lineCap = 'round';
  supportCtx.lineJoin = 'round';

  if (borderMode) {
    const perimeterRadius = clamp(Math.round(minSide * 0.045), 16, 48);
    components.forEach((component) => {
      drawDilatedComponentSupport(supportCtx, component, width, height, perimeterRadius, colour);
    });
  }

  components.slice(1).forEach((component) => {
    const distance = Math.sqrt(distanceBetweenBounds(component.bounds, main.bounds));
    const radius = borderMode
      ? clamp(Math.ceil(distance * 0.75) + 10, 14, maxRadius)
      : clamp(Math.ceil(distance * 0.46) + 6, 6, maxRadius);
    drawDilatedComponentSupport(supportCtx, component, width, height, radius, colour);
    const bridge = findNearestBoundaryPair(component, main);
    if (bridge) {
      supportCtx.lineWidth = borderMode
        ? clamp(Math.max(radius * 1.55, distance * 0.18), 16, maxRadius * 1.65)
        : clamp(Math.max(radius * 1.1, distance * 0.06), 7, maxRadius * 1.25);
      supportCtx.beginPath();
      supportCtx.moveTo(bridge.from.x + 0.5, bridge.from.y + 0.5);
      supportCtx.lineTo(bridge.to.x + 0.5, bridge.to.y + 0.5);
      supportCtx.stroke();
    }
  });

  const supportData = supportCtx.getImageData(0, 0, width, height).data;
  let changed = false;
  for (let i = 0; i < width * height; i += 1) {
    if (supportData[i * 4 + 3] <= 0 || data[i * 4 + 3] > 28) continue;
    const offset = i * 4;
    data[offset] = colour.r;
    data[offset + 1] = colour.g;
    data[offset + 2] = colour.b;
    data[offset + 3] = 255;
    mask[i] = 1;
    changed = true;
  }
  if (changed) {
    ctx.putImageData(img, 0, 0);
    if (borderMode) {
      const enclosedMask = fillEnclosedTransparentRegions(ctx, colour);
      mergeSupportMask(mask, enclosedMask);
    }
  }
  return mask;
}

function drawDilatedComponentSupport(ctx, component, width, height, radius, colour) {
  const pad = radius + 2;
  const minX = Math.max(0, component.bounds.minX - pad);
  const minY = Math.max(0, component.bounds.minY - pad);
  const maxX = Math.min(width - 1, component.bounds.maxX + pad);
  const maxY = Math.min(height - 1, component.bounds.maxY + pad);
  const localW = maxX - minX + 1;
  const localH = maxY - minY + 1;
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = localW;
  maskCanvas.height = localH;
  const maskCtx = maskCanvas.getContext('2d');
  const image = maskCtx.createImageData(localW, localH);
  component.pixels.forEach((index) => {
    const x = index % width;
    const y = Math.floor(index / width);
    const offset = ((y - minY) * localW + (x - minX)) * 4;
    image.data[offset] = colour.r;
    image.data[offset + 1] = colour.g;
    image.data[offset + 2] = colour.b;
    image.data[offset + 3] = 255;
  });
  maskCtx.putImageData(image, 0, 0);

  ctx.drawImage(maskCanvas, minX, minY);
  for (let r = 2; r <= radius; r += 2) {
    const samples = Math.max(12, Math.ceil(r * 1.65));
    for (let i = 0; i < samples; i += 1) {
      const angle = (Math.PI * 2 * i) / samples;
      const dx = Math.round(Math.cos(angle) * r);
      const dy = Math.round(Math.sin(angle) * r);
      ctx.drawImage(maskCanvas, minX + dx, minY + dy);
    }
  }
}

function findNearestBoundaryPair(a, b) {
  if (!a?.boundary?.length || !b?.boundary?.length) return null;
  const stepA = Math.max(1, Math.ceil(a.boundary.length / 700));
  const stepB = Math.max(1, Math.ceil(b.boundary.length / 900));
  let best = null;
  for (let i = 0; i < a.boundary.length; i += stepA) {
    const pa = a.boundary[i];
    for (let j = 0; j < b.boundary.length; j += stepB) {
      const pb = b.boundary[j];
      const dx = pa.x - pb.x;
      const dy = pa.y - pb.y;
      const d = dx * dx + dy * dy;
      if (!best || d < best.distance) best = { from: pa, to: pb, distance: d };
    }
  }
  return best;
}

function drawFloatingRegionBridge(ctx, from, to, colour, width, height, floatingPixels) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  const baseWidth = clamp(Math.round(Math.min(width, height) * 0.006), 3, 8);
  const sizeWidth = clamp(Math.round(Math.sqrt(floatingPixels) / 22), 0, 4);
  const lineWidth = clamp(baseWidth + sizeWidth, 3, 10);
  const curve = distance > 24 ? 0.08 : 0;
  const midX = (from.x + to.x) / 2 - dy * curve;
  const midY = (from.y + to.y) / 2 + dx * curve;

  ctx.save();
  ctx.globalCompositeOperation = 'destination-over';
  ctx.strokeStyle = `rgba(${colour.r}, ${colour.g}, ${colour.b}, 1)`;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(from.x + 0.5, from.y + 0.5);
  ctx.quadraticCurveTo(midX + 0.5, midY + 0.5, to.x + 0.5, to.y + 0.5);
  ctx.stroke();
  ctx.restore();
}

function distanceBetweenBounds(a, b) {
  const dx = Math.max(0, Math.max(a.minX - b.maxX, b.minX - a.maxX));
  const dy = Math.max(0, Math.max(a.minY - b.maxY, b.minY - a.maxY));
  return dx * dx + dy * dy;
}

function defaultSilhouette() {
  return [
    [0.18, 0.16],
    [0.82, 0.16],
    [0.88, 0.52],
    [0.7, 0.86],
    [0.3, 0.86],
    [0.12, 0.52],
  ];
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
      [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ].forEach(([nx, ny]) => {
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

function buildWarnings({ artwork, clusters, main, islands, tinyShapes, opaqueCount, width, height }) {
  const warnings = [];
  if (!opaqueCount) warnings.push({ level: 'error', text: 'No opaque logo area was detected after background removal.' });
  if (clusters.length > 8) {
    warnings.push({ level: 'warn', text: `${clusters.length} source colours were merged to the 8-colour print limit.` });
  }
  if (artwork.type === 'png') {
    warnings.push({ level: 'warn', text: 'PNG geometry is approximated from pixels. Upload SVG for cleaner separate printable colour parts.' });
  }
  if (artwork.gradients) warnings.push({ level: 'warn', text: 'SVG gradients are unsupported for separate diffuser parts and were flattened.' });
  if (artwork.pathCount > 90) warnings.push({ level: 'warn', text: 'Artwork has many vector shapes; simplify paths before production export.' });
  if (islands > 10) warnings.push({ level: 'warn', text: `${islands} floating colour islands detected. They may need bridges or separate print handling.` });
  if (tinyShapes > 0) warnings.push({ level: 'warn', text: `${tinyShapes} tiny colour region${tinyShapes > 1 ? 's' : ''} may be too small for diffuser fit.` });
  if (opaqueCount / (width * height) < 0.08) warnings.push({ level: 'warn', text: 'The silhouette is very sparse; internal islands may need manual support.' });
  if (main.length <= 8 && !warnings.length) warnings.push({ level: 'ok', text: 'Artwork is within the 8-colour print limit and ready for preview export.' });
  return warnings;
}

function renderPreview() {
  if (state.previewRenderTimer) {
    clearTimeout(state.previewRenderTimer);
    state.previewRenderTimer = null;
  }
  cancelLedThreePreviewUpgrade();
  updateDefaultLedSavedPreview();
  els.stage.classList.remove('regenerating');
  if (!state.processed) {
    renderEmptyPreview();
    return;
  }
  const { processed } = state;
  const polygon = processed.silhouette
    .map(([x, y]) => `${(x * 100).toFixed(2)}% ${(y * 100).toFixed(2)}%`)
    .join(', ');
  els.modelStack.style.setProperty('--silhouette', `polygon(${polygon})`);
  els.modelStack.style.setProperty('--artwork-aspect', processed.aspect);
  els.stage.classList.remove('preview-ready');
  applyShellColours();
  applyRotation();
  if (state.productType === 'plaque') {
    buildThreeModel();
    renderPreviewTitle();
    renderPlaqueControls();
    updateStats();
    updateProjectControls();
    finishPlaqueBuildStatus();
    return;
  }

  const svgSize = getPreviewSvgSize(processed.aspect);
  els.frontSvg.setAttribute('viewBox', `${-svgSize.width / 2} ${-svgSize.height / 2} ${svgSize.width} ${svgSize.height}`);
  const svgPolygon = processed.silhouette.map(([x, y]) => `${x * svgSize.width - svgSize.width / 2},${y * svgSize.height - svgSize.height / 2}`).join(' ');
  const mappedArtwork = renderMappedArtworkUrl(processed);
  const lidArtwork = mappedArtwork
    ? `<image class="lid-artwork" href="${escapeHtml(mappedArtwork)}" x="${-svgSize.width / 2}" y="${-svgSize.height / 2}" width="${svgSize.width}" height="${svgSize.height}" preserveAspectRatio="xMidYMid meet"></image>`
    : processed.colours.map((region) => `<path d="${region.path}" fill="${region.hex}" opacity="0.98"></path>`).join('');
  els.frontSvg.innerHTML = `
    <defs>
      <clipPath id="silhouetteClip"><polygon points="${svgPolygon}"></polygon></clipPath>
      <mask id="frameMask">
        <rect x="${-svgSize.width / 2 - 20}" y="${-svgSize.height / 2 - 20}" width="${svgSize.width + 40}" height="${svgSize.height + 40}" fill="black"></rect>
        <polygon points="${svgPolygon}" fill="white"></polygon>
        <polygon points="${scalePoints(processed.silhouette, 0.9, svgSize.width, svgSize.height)}" fill="black"></polygon>
      </mask>
      <filter id="softLidShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="9" flood-color="#000000" flood-opacity="0.26"></feDropShadow>
      </filter>
    </defs>
    <g class="diffuser-lid" clip-path="url(#silhouetteClip)" filter="url(#softLidShadow)">
      ${lidArtwork}
      <polygon points="${svgPolygon}" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="12"></polygon>
      <rect x="${-svgSize.width / 2}" y="${-svgSize.height / 2}" width="${svgSize.width}" height="${svgSize.height}" fill="rgba(255,255,255,.10)"></rect>
      <path d="M${-svgSize.width / 2} ${-svgSize.height * 0.42} C${-svgSize.width * 0.11} ${-svgSize.height * 0.54} ${svgSize.width * 0.22} ${-svgSize.height * 0.46} ${svgSize.width / 2} ${-svgSize.height * 0.31} L${svgSize.width / 2} ${-svgSize.height / 2} L${-svgSize.width / 2} ${-svgSize.height / 2}Z" fill="rgba(255,255,255,.18)"></path>
    </g>
      <rect class="front-rim" x="${-svgSize.width / 2 - 20}" y="${-svgSize.height / 2 - 20}" width="${svgSize.width + 40}" height="${svgSize.height + 40}" fill="#101413" mask="url(#frameMask)"></rect>
  `;

  els.stage.classList.remove('three-active');
  els.stage.classList.add('preview-ready');
  renderPreviewTitle();
  renderShellColourControls();
  updateStats();
  updateProjectControls();
  scheduleLedThreePreviewUpgrade();
}

function schedulePreviewRender(delay = 180) {
  if (!state.processed) return;
  if (state.productType === 'plaque') {
    schedulePlaqueBuild(Math.min(delay, 80));
    return;
  }
  if (state.previewRenderTimer) clearTimeout(state.previewRenderTimer);
  els.stage.classList.add('regenerating');
  state.previewRenderTimer = window.setTimeout(() => {
    state.previewRenderTimer = null;
    renderPreview();
    requestAnimationFrame(() => els.stage.classList.remove('regenerating'));
  }, delay);
}

function renderEmptyPreview() {
  cancelLedThreePreviewUpgrade();
  state.defaultLedPreviewScreenshotDataUrl = '';
  updateDefaultLedSavedPreview();
  applyShellColours();
  clearThreeModel();
  renderPreviewAlert([]);
  renderPreviewTitle();
  renderPlaqueControls();
  els.stage.classList.remove('three-active');
  els.stage.classList.remove('preview-ready');
  els.frontSvg.setAttribute('viewBox', '-500 -500 1000 1000');
  els.frontSvg.innerHTML = '';
  applyRotation();
  updateProjectControls();
}

function renderArtworkDiagnostics() {
  if (!state.processed) {
    renderPreviewAlert([]);
    return;
  }
  const warnings = state.processed.warnings;
  setWarnings(warnings);
  renderPreviewAlert(state.isDefaultPreview ? [] : warnings);
  const warnCount = warnings.filter((warning) => warning.level === 'warn').length;
  const hasError = warnings.some((warning) => warning.level === 'error');
  els.complexityScore.textContent = hasError ? 'Blocked' : warnCount ? `${warnCount} warning${warnCount > 1 ? 's' : ''}` : 'Good';
}

function setWarnings(warnings) {
  els.warnings.innerHTML = warnings.map((warning) => `<li class="${warning.level}">${warning.text}</li>`).join('');
}

function renderPreviewAlert() {
  if (!els.previewAlert) return;
  els.previewAlert.hidden = true;
  els.previewAlert.innerHTML = '';
  els.previewAlert.dataset.signature = '';
  els.previewAlert.classList.remove('expanded', 'error');
}

function scalePoints(points, scale, width = 1000, height = 1000) {
  const cx = points.reduce((sum, point) => sum + point[0], 0) / points.length;
  const cy = points.reduce((sum, point) => sum + point[1], 0) / points.length;
  return points.map(([x, y]) => `${(cx + (x - cx) * scale) * width - width / 2},${(cy + (y - cy) * scale) * height - height / 2}`).join(' ');
}

function applyRotation() {
  const pan = getPreviewPan();
  els.modelStack.style.transform = `translate3d(${pan.x.toFixed(1)}px, ${pan.y.toFixed(1)}px, 0) rotateX(${state.rotation.x}deg) rotateY(${state.rotation.y}deg) rotateZ(${state.rotation.z}deg)`;
  updateDefaultLedSavedPreviewTransform();
  if (state.three?.group && window.THREE) {
    state.three.group.rotation.x = THREE.Math.degToRad(state.rotation.x);
    state.three.group.rotation.y = THREE.Math.degToRad(state.rotation.y);
    state.three.group.rotation.z = THREE.Math.degToRad(state.rotation.z);
    updateThreeModelPosition();
    updateFloorEffects();
    renderThree();
  }
}

function resetRotation() {
  state.rotation = getDefaultProductPreviewRotation();
  applyRotation();
}

function updateStats() {
  const preset = SIZE_PRESETS[state.size];
  const usage = USAGE_PRESETS[state.usage] || USAGE_PRESETS.indoor;
  const activeUsage = getActiveUsagePreset();
  els.sizeOutput.textContent = preset.label;
  if (els.plaqueSizeOutput) els.plaqueSizeOutput.textContent = preset.label;
  if (els.usageOutput) els.usageOutput.textContent = usage.label;
  els.dimensionStat.textContent = state.productType === 'hype'
    ? getHypeSpecLabel()
    : (state.productType === 'plaque' ? `${preset.label} - ${activeUsage.label} Wall Plaque` : `${preset.label} - ${usage.label}`);
  if (els.depthStat) els.depthStat.textContent = `${preset.depth} mm depth`;
  syncMobileCommandBar();
  renderDiagnosticsConsole();
}

function applyShellColours() {
  const side = normalizeHex(state.shellColours.side);
  const back = normalizeHex(state.shellColours.back);
  els.modelStack.style.setProperty('--side-color', side);
  els.modelStack.style.setProperty('--side-color-dark', shadeHex(side, -24));
  els.modelStack.style.setProperty('--side-color-light', shadeHex(side, 18));
  els.modelStack.style.setProperty('--back-color', back);
  els.modelStack.style.setProperty('--back-color-dark', shadeHex(back, -22));
  els.modelStack.style.setProperty('--back-color-light', shadeHex(back, 16));
}

function renderShellColourControls() {
  const colours = state.processed?.colours || [];
  els.frontPlateColours.innerHTML = colours.length
    ? colours.map((region, idx) => {
      const hex = getDisplayColour(idx, region.hex);
      return `<button class="plate-dot" type="button" data-front-colour="${idx}" style="background:${hex}" aria-label="Edit front colour ${idx + 1}"></button>`;
    }).join('')
    : '<span class="plate-empty">Upload artwork</span>';
  els.frontPlateColours.querySelectorAll('[data-front-colour]').forEach((button) => {
    button.addEventListener('click', () => openFrontColourPopover(Number(button.dataset.frontColour), button));
  });
  const side = normalizeHex(state.shellColours.side);
  const back = normalizeHex(state.shellColours.back);
  els.sideColourButton.querySelector('i').style.background = side;
  els.backColourButton.querySelector('i').style.background = back;
  els.sideColourHex.textContent = side;
  els.backColourHex.textContent = back;
  applyShellColours();
}

function normalizeSvgPaint(value) {
  const paint = String(value || '').trim();
  if (!paint || paint === 'none' || paint.startsWith('url(')) return '';
  if (paint.startsWith('rgb')) {
    const channels = paint.match(/[\d.]+/g)?.slice(0, 3).map(Number);
    return channels?.length === 3 ? rgbToHex(channels) : '';
  }
  return normalizeHex(paint);
}

function estimateShapeArea(shape) {
  const points = shape.extractPoints(12).shape || [];
  if (points.length < 3) return 0;
  let area = svgPointArea(points);
  (shape.holes || []).forEach((hole) => {
    area -= Math.abs(svgPointArea(hole.getPoints(12)));
  });
  return area;
}

function svgPointArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }
  return area / 2;
}

function updateProjectControls() {
  if (!els.saveProject) return;
  const hasLedArtwork = hasOrderableLedArtwork();
  const hasHypeLogo = hasOrderableHypeLogo();
  const hasPlaqueArtwork = hasOrderablePlaqueArtwork();
  const disabled = state.productType === 'hype'
    ? !hasHypeLogo
    : (state.productType === 'plaque' ? !hasPlaqueArtwork : !hasLedArtwork);
  els.saveProject.disabled = disabled;
  if (els.placeOrder) {
    els.placeOrder.disabled = disabled || !state.customerEmail;
    els.placeOrder.textContent = state.orderInProgress ? 'Placing Order...' : 'Place Order';
  }
  syncMobileCommandBar();
}

function getDesignName() {
  if (state.productType === 'plaque') return state.designName.trim() || 'My Custom 3D Plaque';
  return state.designName.trim() || 'My Custom LED Sign';
}

function formatMm(value) {
  return `${(Number(value) || 0).toFixed(1)} mm`;
}

function updateRangeFill(input) {
  if (!input) return;
  const min = Number(input.min) || 0;
  const max = Number(input.max) || 100;
  const value = clamp(Number(input.value) || min, min, max);
  const percent = max === min ? 0 : ((value - min) / (max - min)) * 100;
  input.style.setProperty('--range-fill', `${clamp(percent, 0, 100)}%`);
}

function renderPreviewTitle() {
  if (state.productType === 'hype') {
    const hypeDesignName = state.designName.trim();
    const generatedHypeName = /^(classic|spinner) hype chain$/i.test(hypeDesignName);
    els.previewTitle.textContent = hypeDesignName && !generatedHypeName && !/\b(led|lightbox)\b/i.test(hypeDesignName)
      ? hypeDesignName
      : (state.hype.variant === 'spinner' ? 'Spinner Hype Chain' : 'Classic Hype Chain');
  } else if (state.productType === 'plaque') {
    els.previewTitle.textContent = state.isDefaultPreview || !state.uploadedFile ? '3D Wall Plaque' : getDesignName();
  } else {
    els.previewTitle.textContent = state.isDefaultPreview || !state.uploadedFile ? 'Example LED Sign preview' : getDesignName();
  }
  els.designName.value = state.designName || '';
}

function startDesignNameEdit() {
  if (state.isDefaultPreview) {
    state.isDefaultPreview = false;
    if (!state.designName.trim()) state.designName = '';
  }
  els.previewTitle.hidden = true;
  els.editDesignName.hidden = true;
  els.designName.hidden = false;
  els.designName.value = state.designName.trim() || getDesignName();
  els.designName.focus();
  els.designName.select();
}

function finishDesignNameEdit() {
  if (els.designName.hidden) return;
  state.designName = els.designName.value.trim();
  els.designName.hidden = true;
  els.previewTitle.hidden = false;
  els.editDesignName.hidden = false;
  renderPreviewTitle();
  updateProjectControls();
}

async function saveProjectFile() {
  if (state.productType === 'hype') {
    await saveHypeChainProjectFile();
    return;
  }
  if (!state.processed || !state.artwork) return;
  setStatus('Saving');
  els.saveProject.disabled = true;
  try {
    queueEmailMarketingSubscription(state.customerEmail);
    const project = await buildSignGuyProject();
    state.projectId = project.id;
    const localSave = isLocalTesting();
    if (localSave) {
      if (state.isAdmin) downloadProjectPayload(project);
    } else {
      await uploadProjectFolder(project);
    }
    try {
      await saveProjectRecord(project);
      await refreshProjectLog();
    } catch (storageError) {
      console.warn(storageError);
      els.projectNote.textContent = localSave
        ? 'The .SignGuy file was downloaded, but the local recent list could not be updated.'
        : 'The server folder was saved, but the local recent list could not be updated.';
    }
    els.projectNote.textContent = localSave
      ? state.isAdmin
        ? `${project.name}.SignGuy downloaded and logged for local testing.`
        : ''
      : `${project.name} saved to the ${state.customerEmail} server folder.`;
    setStatus('Saved');
    trackSignStudioEvent('save_design', {
      product_type: state.productType,
      save_destination: localSave ? 'local' : 'server',
    });
  } catch (error) {
    console.error(error);
    els.projectNote.textContent = isLocalTesting()
      ? 'Could not download this .SignGuy file.'
      : formatSaveFailureMessage(error, 'Could not save this project folder on the server.');
    setStatus('Save failed');
  } finally {
    updateProjectControls();
  }
}

async function placeOrderRequest() {
  if (state.productType === 'hype') {
    await placeHypeChainOrder();
    return;
  }
  if (state.productType === 'plaque') {
    await placePlaqueOrder();
    return;
  }
  if (!hasOrderableLedArtwork() || !state.customerEmail) {
    updateProjectControls();
    return;
  }
  setStatus('Preparing order');
  closeOnboarding();
  clearCheckoutFallback();
  state.orderInProgress = true;
  if (els.submitDesign) els.submitDesign.disabled = true;
  els.placeOrder.disabled = true;
  els.placeOrder.textContent = 'Placing Order...';
  els.saveProject.disabled = true;
  syncMobileCommandBar();
  try {
    queueEmailMarketingSubscription(state.customerEmail);
    const project = await buildSignGuyProject();
    state.projectId = project.id;
    const localOrder = isLocalTesting();
    const screenshots = await captureSubmissionScreenshots();
    const uploadResult = localOrder
      ? { ok: true, localTesting: true, emailSent: false }
      : await uploadProjectFolder(project, {
        screenshots,
        sendOrderEmail: true,
        subject: makeOrderEmailSubject('LED Sign'),
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
      ? `${project.name}.SignGuy downloaded for local checkout testing. Email is only sent from the deployed site.`
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
    if (els.submitDesign) els.submitDesign.disabled = false;
  }
}

async function openProjectFiles(fileList) {
  const file = fileList?.[0];
  if (!file) return;
  setStatus('Opening');
  try {
    const project = JSON.parse(await file.text());
    project.customerEmail = state.customerEmail;
    await restoreSignGuyProject(project);
    try {
      await saveProjectRecord(project);
      await refreshProjectLog();
    } catch (storageError) {
      console.warn(storageError);
    }
    els.projectNote.textContent = `${file.name} opened.`;
    setStatus('Project open');
  } catch (error) {
    console.error(error);
    els.projectNote.textContent = 'That file could not be opened as a .SignGuy project.';
    setStatus('Open failed');
  } finally {
    els.projectFileInput.value = '';
  }
}

async function buildSignGuyProject() {
  renderThree();
  const screenshotBlob = await captureVisualizerBlob();
  const screenshotDataUrl = await blobToDataUrl(screenshotBlob);
  const sourceDataUrl = await getArtworkProjectDataUrl();
  const now = new Date().toISOString();
  const sourceName = state.fileName || state.artwork?.name || `${baseName()}.png`;
  const usageKey = state.productType === 'plaque' ? getPlaqueUsageKey() : state.usage;
  const usageLabel = USAGE_PRESETS[usageKey]?.label || USAGE_PRESETS.indoor.label;
  return {
    type: state.productType === 'plaque' ? 'SignGuy.WallPlaqueStudio' : 'SignGuy.LightboxStudio',
    version: PROJECT_FILE_VERSION,
    id: state.projectId || makeProjectId(),
    name: getDesignName(),
    customerEmail: state.customerEmail,
    savedAt: now,
    source: {
      fileName: sourceName,
      artworkType: state.artwork.type,
      dataUrl: sourceDataUrl,
      svgText: state.artwork.svgText || '',
      pathCount: state.artwork.pathCount || 0,
      gradients: state.artwork.gradients || 0,
      palette: state.artwork.palette || null,
      hasTransparency: Boolean(state.artwork.hasTransparency),
    },
    config: {
      size: state.size,
      usage: usageKey,
      designName: state.designName,
      illuminated: state.illuminated,
      removeBg: state.removeBg,
      fixFloatingRegions: state.fixFloatingRegions,
      floatingSupportColour: state.floatingSupportColour,
      tolerance: state.tolerance,
      targetColorCount: state.targetColorCount,
      colorOverrides: [...state.colorOverrides],
      frontColoursCustomized: state.frontColoursCustomized,
      shellColours: { ...state.shellColours },
      edit: {
        crop: { ...state.edit.crop },
        cropAspect: state.edit.cropAspect,
        zoom: state.edit.zoom,
      },
      rotation: { ...state.rotation },
      previewZoom: state.previewZoom,
      previewPan: { ...getPreviewPan() },
      productType: state.productType === 'plaque' ? 'plaque' : 'led',
      plaque: state.productType === 'plaque' ? getSerializablePlaqueConfig() : null,
    },
    preview: {
      screenshotDataUrl,
      colours: state.productType === 'plaque'
        ? getPlaqueSubmittedColourItems().map((item) => ({
          index: item.index,
          source: item.source,
          display: item.display,
        }))
        : (state.processed?.colours || []).map((region, idx) => ({
          index: idx,
          source: region.hex,
          display: getDisplayColour(idx, region.hex),
        })),
      dimensions: {
        faceInches: SIZE_PRESETS[state.size].inches,
        depthMm: state.productType === 'plaque' ? state.plaque.baseThickness : SIZE_PRESETS[state.size].depth,
        usage: state.productType === 'plaque' ? `${usageLabel} Wall Plaque` : usageLabel,
      },
    },
  };
}

function getPlaqueSubmittedColourItems() {
  const backingHex = getPlaqueBackingHex(state.processed);
  const layers = getPlaqueLayerDescriptors();
  return [
    {
      index: 'backing',
      label: 'Backing',
      source: backingHex,
      display: backingHex,
    },
    ...layers.map((layer, index) => ({
      index,
      label: `Raised layer ${index + 1}`,
      source: normalizeHex(layer?.hex || '#ffffff'),
      display: getPlaqueLayerDisplayHex(layer, index),
    })),
  ];
}

async function getArtworkProjectDataUrl() {
  const dataUrl = state.artwork?.dataUrl || '';
  if (!dataUrl.startsWith('blob:')) return dataUrl;
  if (!state.uploadedFile) return '';
  try {
    return await fileToDataUrl(state.uploadedFile);
  } catch (error) {
    console.warn('Could not read original upload for project save; using normalized preview image.', error);
    return makeNormalizedRasterDataUrl(state.artwork.image, { maxSide: PLAQUE_UPLOAD_MAX_SIDE });
  }
}

async function restoreSignGuyProject(project, options = {}) {
  validateSignGuyProject(project);
  const isExampleProject = options.isExampleProject === true;
  const isDefaultPreviewProject = options.asDefaultPreview === true;
  if (!isExampleProject && !isDefaultPreviewProject) {
    state.productSelectionMenuResolved = true;
    hideProductSelectionMenu();
  }
  if (project.type === 'SignGuy.HypeChainStudio') {
    restoreHypeChainProject(project, { isExampleProject });
    if (!isExampleProject) queueEmailMarketingSubscription(project.customerEmail);
    return;
  }
  const config = project.config || {};
  const source = project.source;
  const isPlaqueProject = project.type === 'SignGuy.WallPlaqueStudio' || config.productType === 'plaque';
  const image = await loadImage(source.dataUrl);
  state.isDefaultPreview = isDefaultPreviewProject;
  state.projectId = isExampleProject ? null : (project.id || makeProjectId());
  state.fileName = isExampleProject ? '' : (source.fileName || `${project.name || 'saved-design'}.${source.artworkType || 'png'}`);
  state.designName = isExampleProject ? '' : (config.designName || project.name || '');
  if (!isExampleProject && project.customerEmail && isValidEmail(normalizeEmail(project.customerEmail))) {
    state.customerEmail = normalizeEmail(project.customerEmail);
    localStorage.setItem(EMAIL_STORAGE_KEY, state.customerEmail);
    renderSessionEmail();
    queueEmailMarketingSubscription(state.customerEmail);
  }
  state.artwork = {
    type: source.artworkType || inferArtworkType(source.dataUrl, source.fileName),
    image,
    dataUrl: source.dataUrl,
    svgText: source.svgText || (source.artworkType === 'svg' ? decodeSvgDataUrl(source.dataUrl) : ''),
    pathCount: source.pathCount || 0,
    gradients: source.gradients || 0,
    palette: source.palette || null,
    hasTransparency: source.hasTransparency ?? imageHasTransparency(image),
    name: state.fileName || source.fileName || project.name || '3D Plaque example',
  };
  state.uploadedFile = isExampleProject ? null : dataUrlToFile(source.dataUrl, state.fileName);
  renderUploadControl();
  state.size = SIZE_PRESETS[config.size] ? config.size : 'large';
  state.usage = !isPlaqueProject && USAGE_PRESETS[config.usage] ? config.usage : (USAGE_PRESETS[state.usage] ? state.usage : 'indoor');
  state.illuminated = Boolean(config.illuminated);
  state.removeBg = Boolean(config.removeBg);
  state.fixFloatingRegions = Boolean(config.fixFloatingRegions);
  state.floatingSupportColour = normalizeHex(config.floatingSupportColour || DEFAULT_FLOATING_SUPPORT_COLOUR);
  state.tolerance = clamp(Number(config.tolerance) || 28, 18, 90);
  state.targetColorCount = clamp(Number(config.targetColorCount) || 8, 1, 8);
  state.colorOverrides = Array.isArray(config.colorOverrides) ? [...config.colorOverrides] : [];
  state.frontColoursCustomized = Boolean(config.frontColoursCustomized);
  if (isPlaqueProject) {
    Object.assign(state.plaque, {
      fileName: state.fileName,
      designName: state.designName,
      isDefaultPreview: false,
      isExampleProject,
      uploadedFile: state.uploadedFile,
      uploadFingerprint: '',
      artwork: state.artwork,
      processed: null,
      processingDirty: true,
      removeBg: state.removeBg,
      fixFloatingRegions: state.fixFloatingRegions,
      floatingSupportColour: state.floatingSupportColour,
      targetColorCount: state.targetColorCount,
      colorOverrides: [...state.colorOverrides],
      frontColoursCustomized: state.frontColoursCustomized,
      selectedColor: state.selectedColor,
      selectedColourTarget: { type: 'front', index: 0 },
      projectId: state.projectId,
      usage: USAGE_PRESETS[config.plaque?.usage] ? config.plaque.usage : (USAGE_PRESETS[config.usage] ? config.usage : 'indoor'),
      baseThickness: clamp(Number(config.plaque?.baseThickness) || PLAQUE_DEFAULT_BASE_THICKNESS, PLAQUE_BASE_THICKNESS_MIN, PLAQUE_BASE_THICKNESS_MAX),
      basePadding: clamp(Number(config.plaque?.basePadding) || PLAQUE_DEFAULT_BASE_PADDING, 0, 6),
      backingColourOverride: config.plaque?.backingColourOverride ? normalizeHex(config.plaque.backingColourOverride) : '',
      layerDepths: Array.isArray(config.plaque?.layerDepths) ? config.plaque.layerDepths.map((value) => clamp(Number(value) || PLAQUE_DEFAULT_LAYER_DEPTH, PLAQUE_LAYER_DEPTH_MIN, PLAQUE_LAYER_DEPTH_MAX)) : [],
      colourOverrides: Array.isArray(config.plaque?.colourOverrides) ? config.plaque.colourOverrides.map((value) => value ? normalizeHex(value) : '') : [],
      layerSourceIndices: [],
      selectedLayer: Number(config.plaque?.selectedLayer) || 0,
      traceQuality: normalizePlaqueTraceQuality(config.plaque?.traceQuality),
      zeroGapColourLayers: config.plaque?.zeroGapColourLayers !== false,
      exactPixelBoundaryMode: normalizePlaqueTraceQuality(config.plaque?.traceQuality) !== 'smooth',
      usePngFrontTextureFallback: false,
      previewDebugMode: 'extruded',
      showVectorDebug: Boolean(config.plaque?.showVectorDebug),
      hideTopTexture: false,
      showBackingOnly: false,
      wireframe: false,
      normals: false,
      topologyDebug: false,
      showShells: false,
      booleanOnly: true,
      fastPreviewOnly: false,
      buildTimer: null,
      buildToken: 0,
      svgLayerCache: null,
    });
  }
  state.shellColours = {
    side: normalizeHex(config.shellColours?.side || '#000000'),
    back: normalizeHex(config.shellColours?.back || '#000000'),
  };
  state.edit = {
    crop: normalizeCrop(config.edit?.crop || { x: 0, y: 0, w: 1, h: 1 }),
    cropAspect: CROP_PRESETS.some((preset) => preset.id === config.edit?.cropAspect) ? config.edit.cropAspect : 'free',
    zoom: clamp(Number(config.edit?.zoom) || 1, 0.4, 2.4),
  };
  state.rotation = {
    x: Number(config.rotation?.x) || 0,
    y: Number(config.rotation?.y) || 0,
    z: Number(config.rotation?.z) || 0,
  };
  const previewZoomLimits = getPreviewZoomLimits();
  state.previewZoom = clamp(Number(config.previewZoom) || 1, previewZoomLimits.min, previewZoomLimits.max);
  state.previewPan = clampPreviewPan(config.previewPan || { x: 0, y: 0 });
  if (isPlaqueProject) {
    Object.assign(state.plaque, {
      edit: {
        crop: { ...state.edit.crop },
        cropAspect: state.edit.cropAspect,
        zoom: state.edit.zoom,
      },
      previewZoom: state.previewZoom,
      previewPan: { ...state.previewPan },
      dismissedPreviewAlert: '',
      rotation: { ...state.rotation },
    });
    state.productType = 'plaque';
    activatePlaqueArtworkState();
    applyStateToControls();
    closeWizard();
    await reprocessPlaqueArtwork({
      preserveTargetColorCount: !isExampleProject,
      processedCache: options.processedCache,
      cacheDefaultPlaqueProcessed: isExampleProject,
      defaultPlaqueProject: project,
    });
    selectProductType('plaque');
  } else {
    applyStateToControls();
    closeWizard();
    await reprocess({ preserveTargetColorCount: true });
  }
  if (els.submitDesign) els.submitDesign.disabled = state.isDefaultPreview || !state.uploadedFile;
}

function validateSignGuyProject(project) {
  const supported = project?.type === 'SignGuy.LightboxStudio'
    || project?.type === 'SignGuy.HypeChainStudio'
    || project?.type === 'SignGuy.WallPlaqueStudio';
  if (!project || !supported || !project.source?.dataUrl) {
    throw new Error('Unsupported .SignGuy project file.');
  }
}

function applyStateToControls() {
  els.removeBg.checked = state.removeBg;
  els.illuminateToggle.checked = state.illuminated;
  els.designName.value = state.designName || '';
  document.querySelectorAll('[data-size]').forEach((button) => {
    button.classList.toggle('active', button.dataset.size === state.size);
  });
  document.querySelectorAll('[data-usage]').forEach((button) => {
    button.classList.toggle('active', button.dataset.usage === state.usage);
  });
  els.plaqueUsageButtons?.forEach((button) => {
    button.classList.toggle('active', button.dataset.plaqueUsage === getPlaqueUsageKey());
  });
  applyIllumination();
  applyPreviewZoom();
  applyPreviewPan();
  updateStats();
  renderShellColourControls();
  updateProjectControls();
}

async function refreshProjectLog(options = {}) {
  const query = getProjectLogQuery();
  const refreshToken = ++state.projectLogRefreshToken;
  if (!query.email) {
    state.savedProjects = [];
    state.projectLogCount = 0;
    state.projectLogPreviewsLoaded = false;
    state.projectLogPreviewLoading = false;
    renderProjectLog();
    return;
  }
  try {
    const includePreviews = options.forcePreviews || isProjectSectionExpanded();
    if (!includePreviews) {
      const count = await getProjectRecordCount(query);
      if (refreshToken !== state.projectLogRefreshToken) return;
      state.savedProjects = [];
      state.projectLogCount = Math.min(count, PROJECT_LOG_LIMIT);
      state.projectLogPreviewsLoaded = false;
      state.projectLogHydrated = false;
      state.projectLogPreviewLoading = false;
      renderProjectLog();
      return;
    }
    state.projectLogPreviewLoading = true;
    if (isProjectSectionExpanded()) {
      els.projectList.innerHTML = '<p class="project-empty">Loading saved designs...</p>';
    }
    const projects = await getProjectRecords({ includePreviews: true, query });
    if (refreshToken !== state.projectLogRefreshToken) return;
    state.savedProjects = projects;
    state.projectLogCount = projects.length;
    state.projectLogPreviewsLoaded = true;
    state.projectLogPreviewLoading = false;
    renderProjectLog();
  } catch (error) {
    if (refreshToken !== state.projectLogRefreshToken) return;
    state.projectLogPreviewLoading = false;
    console.warn(error);
    updateProjectLogCount();
    if (isProjectSectionExpanded()) {
      els.projectList.innerHTML = '<p class="project-empty">Recent saves unavailable.</p>';
      els.projectNote.textContent = 'Use Open .SignGuy to load saved project files.';
    }
  }
}

function updateProjectLogCount(projects = state.savedProjects || []) {
  const count = Array.isArray(projects) && projects.length ? projects.length : (state.projectLogCount || 0);
  const countText = String(count);
  els.projectCount.textContent = countText;
  if (els.projectHeadingCount) els.projectHeadingCount.textContent = `(${countText})`;
}

function renderProjectLog() {
  const projects = state.savedProjects || [];
  updateProjectLogCount(projects);
  if (!isProjectSectionExpanded()) {
    els.projectList.innerHTML = '';
    state.projectLogHydrated = false;
    return;
  }
  if (state.projectLogPreviewLoading) {
    els.projectList.innerHTML = '<p class="project-empty">Loading saved designs...</p>';
    return;
  }
  if (!state.projectLogPreviewsLoaded && state.projectLogCount > 0) {
    els.projectList.innerHTML = '<p class="project-empty">Loading saved designs...</p>';
    hydrateProjectLogPreviews();
    return;
  }
  if (!projects.length) {
    els.projectList.innerHTML = '<p class="project-empty">No saved designs yet. Save your first design to come back to it later.</p>';
    els.projectNote.textContent = '';
    state.projectLogHydrated = true;
    return;
  }
  els.projectList.innerHTML = projects.map((project) => {
    const previewImage = getProjectPreviewImage(project);
    return `
    <article class="project-item" data-project-id="${escapeHtml(project.id)}" data-restore-project="${escapeHtml(project.id)}" role="button" tabindex="0" aria-label="Restore ${escapeHtml(project.name || 'saved design')}">
      ${previewImage
        ? `<img class="project-thumb" src="${escapeHtml(previewImage)}" alt="" />`
        : '<div class="project-thumb project-thumb-placeholder" aria-hidden="true"></div>'}
      <button class="project-delete" type="button" data-delete-project="${escapeHtml(project.id)}" aria-label="Delete ${escapeHtml(project.name || 'saved design')}">x</button>
    </article>
  `;
  }).join('');
  state.projectLogHydrated = true;
  els.projectList.querySelectorAll('[data-restore-project]').forEach((button) => {
    const restoreProject = async () => {
      const project = await getProjectRecord(button.dataset.restoreProject);
      await restoreSignGuyProject(project);
      els.projectNote.textContent = `${project.name || 'Saved design'}.SignGuy restored from recent saves.`;
      setStatus('Project open');
      if (isMobileControlLayout()) closeMobileControlSheet();
    };
    button.addEventListener('click', async (event) => {
      if (event.target.closest('[data-delete-project]')) return;
      await restoreProject();
    });
    button.addEventListener('keydown', async (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      await restoreProject();
    });
  });
  els.projectList.querySelectorAll('[data-delete-project]').forEach((button) => {
    button.addEventListener('click', async () => {
      const project = projects.find((item) => item.id === button.dataset.deleteProject);
      const projectName = project?.name || 'this saved design';
      if (!window.confirm(`Delete ${projectName}? This cannot be undone.`)) return;
      await deleteProjectRecord(button.dataset.deleteProject);
      await refreshProjectLog();
      els.projectNote.textContent = 'Saved design deleted.';
    });
  });
}

function getProjectPreviewImage(project) {
  return project?.preview?.screenshotDataUrl || project?.source?.dataUrl || '';
}

async function hydrateProjectLogPreviews() {
  if (state.projectLogPreviewLoading) return;
  await refreshProjectLog({ forcePreviews: true });
}

function downloadProjectPayload(project) {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/x-signguy+json' });
  downloadBlob(blob, `${projectFileBaseName(project)}.SignGuy`, 'application/x-signguy+json');
}

async function uploadProjectFolder(project, options = {}) {
  const endpoint = getProjectSaveEndpoint();
  if (!endpoint) throw new Error('Project save endpoint is unavailable.');
  const blobUploadEndpoint = getPrivateBlobUploadEndpoint();
  if (!blobUploadEndpoint || !window.SignStudioPrivateBlob?.upload) {
    throw new Error('Private Blob upload client is unavailable.');
  }
  queueEmailMarketingSubscription(project.customerEmail || state.customerEmail);
  const uploadProject = options.sendOrderEmail ? await makeCompactOrderProject(project) : project;
  const projectName = `${projectFileBaseName(uploadProject)}.SignGuy`;
  const logoFile = await makeProjectUploadLogoFile(uploadProject, { compact: Boolean(options.sendOrderEmail) });
  const rawScreenshots = options.screenshots || await captureSubmissionScreenshots();
  const screenshots = options.sendOrderEmail ? await compactSubmissionScreenshots(rawScreenshots) : rawScreenshots;
  const orderId = makeBlobUploadId(uploadProject.id);
  const assets = [
    {
      kind: 'projectFile',
      file: new File(
        [JSON.stringify(uploadProject, null, 2)],
        projectName,
        { type: 'application/x-signguy+json' },
      ),
    },
    {
      kind: 'logo',
      file: logoFile,
    },
  ];

  if (options.sendOrderEmail) {
    const logoPreview = await makeEmailLogoPreviewFile(uploadProject);
    if (logoPreview) {
      assets.push({ kind: 'logoPreview', file: logoPreview });
    }
  }

  screenshots.forEach((shot, idx) => {
    assets.push({
      kind: `renderScreenshot${idx + 1}`,
      file: shot.file,
      label: shot.label,
    });
  });

  const files = [];
  for (let index = 0; index < assets.length; index += 1) {
    const asset = assets[index];
    setStatus(`Uploading ${index + 1} of ${assets.length}`);
    files.push(await uploadPrivateBlobAsset({
      orderId,
      asset,
      endpoint: blobUploadEndpoint,
    }));
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId,
      customerEmail: uploadProject.customerEmail || state.customerEmail,
      projectName,
      sendOrderEmail: Boolean(options.sendOrderEmail),
      subject: options.subject || ORDER_SUBMISSION_SUBJECT,
      message: options.message || makeEmailBody('Shopify checkout order started'),
      messageHtml: options.messageHtml || '',
      files,
    }),
  });
  if (!response.ok) {
    let detail = '';
    try {
      detail = await response.text();
    } catch {
      detail = '';
    }
    throw new Error(`Project save endpoint returned ${response.status}${detail ? `: ${extractServerErrorDetail(detail).slice(0, 220)}` : ''}`);
  }
  try {
    return await response.json();
  } catch {
    return { ok: true, projectName };
  }
}

async function uploadPrivateBlobAsset({ orderId, asset, endpoint }) {
  const file = asset.file;
  if (!(file instanceof Blob)) throw new Error(`Could not prepare ${asset.kind} for upload.`);
  const filename = makeBlobFileName(file.name || `${asset.kind}.bin`);
  const pathname = `orders/${orderId}/${asset.kind}-${filename}`;

  try {
    const uploaded = await window.SignStudioPrivateBlob.upload(pathname, file, {
      access: 'private',
      handleUploadUrl: endpoint,
      contentType: file.type || 'application/octet-stream',
      clientPayload: JSON.stringify({ orderId, kind: asset.kind }),
    });
    return {
      kind: asset.kind,
      pathname: uploaded.pathname,
      url: uploaded.url,
      filename,
      contentType: uploaded.contentType || file.type || 'application/octet-stream',
      size: file.size,
      label: asset.label || '',
    };
  } catch (error) {
    throw new Error(`Private Blob upload failed for ${filename}: ${error?.message || 'Unknown upload error'}`);
  }
}

function extractServerErrorDetail(detail) {
  const text = String(detail || '').trim();
  if (!text) return '';
  try {
    const payload = JSON.parse(text);
    return String(payload.detail || payload.error || text).trim();
  } catch {
    return text.replace(/\s+/g, ' ').trim();
  }
}

function formatSaveFailureMessage(error, fallback) {
  const message = String(error?.message || '').trim();
  if (!message) return fallback;
  if (/No blob credentials|BLOB_READ_WRITE_TOKEN|VERCEL_OIDC_TOKEN|BLOB_STORE_ID/i.test(message)) {
    return `${fallback} Blob storage is not configured on the server.`;
  }
  if (/FUNCTION_INVOCATION_FAILED|server error has occurred/i.test(message)) {
    return `${fallback} The save API crashed on the server.`;
  }
  if (/Private Blob upload failed/i.test(message)) {
    return `${fallback} ${message.replace(/^Private Blob upload failed for\s+/i, 'Upload failed for ')}`;
  }
  if (/Project save endpoint returned/i.test(message)) {
    return `${fallback} ${message}`;
  }
  if (/Failed to fetch/i.test(message)) {
    return `${fallback} Could not reach the save server.`;
  }
  return `${fallback} ${message}`;
}

function makeBlobUploadId(projectId) {
  const projectPart = String(projectId || 'signguy')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'signguy';
  const uniquePart = (window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-');
  return `${projectPart}-${uniquePart}`.slice(0, 96);
}

function makeBlobFileName(value) {
  return String(value || 'file.bin')
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/^-|-$/g, '')
    .slice(-180) || 'file.bin';
}

function getProjectSaveEndpoint() {
  if (window.SIGN_GUY_PROJECT_SAVE_ENDPOINT) return window.SIGN_GUY_PROJECT_SAVE_ENDPOINT;
  if (isLocalTesting()) return '';
  if (!window.location.protocol.startsWith('http')) return '';
  return new URL('/api/save-project', window.location.href).href;
}

function getPrivateBlobUploadEndpoint() {
  if (window.SIGN_GUY_BLOB_UPLOAD_ENDPOINT) return window.SIGN_GUY_BLOB_UPLOAD_ENDPOINT;
  if (isLocalTesting()) return '';
  if (!window.location.protocol.startsWith('http')) return '';
  return new URL('/api/blob-upload', window.location.href).href;
}

function isLocalTesting() {
  const { protocol, hostname } = window.location;
  return protocol === 'file:' || hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

async function makeEmailLogoPreviewFile(project) {
  try {
    const dataUrl = project.type === 'SignGuy.HypeChainStudio'
      ? project.source?.dataUrl
      : state.artwork?.dataUrl || project.source?.dataUrl;

    if (!dataUrl) return null;

    const fileName = project.type === 'SignGuy.HypeChainStudio'
      ? 'hype-chain-logo-preview.png'
      : (project.type === 'SignGuy.WallPlaqueStudio' ? 'wall-plaque-logo-preview.png' : 'led-sign-logo-preview.png');

    const previewDataUrl = await makeRasterLogoPreviewDataUrl(dataUrl);
    return dataUrlToFile(previewDataUrl, fileName);
  } catch (error) {
    console.warn('Could not create email logo preview.', error);
    return null;
  }
}

async function makeProjectUploadLogoFile(project, options = {}) {
  const sourceDataUrl = project.source?.dataUrl || '';
  const sourceName = project.source?.fileName || (project.type === 'SignGuy.HypeChainStudio' ? 'hype-chain-logo.png' : `${baseName()}.png`);
  if (!options.compact) {
    return project.type === 'SignGuy.HypeChainStudio'
      ? dataUrlToFile(sourceDataUrl, sourceName)
      : state.uploadedFile || dataUrlToFile(sourceDataUrl, sourceName);
  }
  return makeCompactLogoFile(sourceDataUrl, sourceName);
}

async function makeCompactOrderProject(project) {
  const compact = JSON.parse(JSON.stringify(project));
  if (compact.source?.dataUrl) {
    const sourceName = compact.source.fileName || 'uploaded-logo.png';
    compact.source.dataUrl = await makeCompactLogoDataUrl(compact.source.dataUrl);
    compact.source.fileName = sourceName.replace(/\.(heic|heif|jpe?g|png)$/i, '.png') || 'uploaded-logo.png';
    compact.source.artworkType = inferArtworkType(compact.source.dataUrl, compact.source.fileName);
  }
  if (compact.preview?.screenshotDataUrl) {
    compact.preview.screenshotDataUrl = await compressDataUrlImage(compact.preview.screenshotDataUrl, {
      maxSide: ORDER_PROJECT_PREVIEW_MAX_SIDE,
      type: 'image/jpeg',
      quality: ORDER_SCREENSHOT_QUALITY,
      background: '#222625',
    });
  }
  if (compact.type === 'SignGuy.HypeChainStudio' && compact.config?.hype) {
    if (compact.config.hype.logoDataUrl) compact.config.hype.logoDataUrl = compact.source?.dataUrl || compact.config.hype.logoDataUrl;
    if (compact.config.hype.pendantBaseDataUrl) compact.config.hype.pendantBaseDataUrl = compact.source?.dataUrl || compact.config.hype.pendantBaseDataUrl;
  }
  return compact;
}

async function makeCompactLogoFile(dataUrl, fileName) {
  const compactDataUrl = await makeCompactLogoDataUrl(dataUrl);
  return dataUrlToFile(compactDataUrl, String(fileName || 'uploaded-logo.png').replace(/\.(heic|heif|jpe?g|png)$/i, '.png'));
}

function makeCompactLogoDataUrl(dataUrl) {
  return compressDataUrlImage(dataUrl, {
    maxSide: ORDER_LOGO_MAX_SIDE,
    type: 'image/png',
  });
}

async function compactSubmissionScreenshots(shots) {
  return Promise.all((shots || []).map(async (shot) => {
    const blob = await compressImageBlob(shot.blob || shot.file, {
      maxSide: ORDER_SCREENSHOT_MAX_SIDE,
      type: 'image/jpeg',
      quality: ORDER_SCREENSHOT_QUALITY,
      background: '#222625',
    });
    const fileName = String(shot.fileName || shot.file?.name || 'visualizer.jpg').replace(/\.(png|jpe?g)$/i, '.jpg');
    return {
      ...shot,
      blob,
      fileName,
      file: new File([blob], fileName, { type: 'image/jpeg' }),
    };
  }));
}

async function compressImageBlob(blob, options = {}) {
  const dataUrl = await blobToDataUrl(blob);
  const compactDataUrl = await compressDataUrlImage(dataUrl, options);
  return dataUrlToBlob(compactDataUrl);
}

async function compressDataUrlImage(dataUrl, options = {}) {
  const image = await loadImage(dataUrl);
  const width = image.naturalWidth || image.width || 1;
  const height = image.naturalHeight || image.height || 1;
  const scale = Math.min(1, (options.maxSide || Math.max(width, height)) / Math.max(width, height));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (options.background) {
    ctx.fillStyle = options.background;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else {
    ctx.clearRect(0, 0, targetWidth, targetHeight);
  }
  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
  return canvas.toDataURL(options.type || 'image/png', options.quality);
}

async function makeRasterLogoPreviewDataUrl(dataUrl) {
  const image = await loadImage(dataUrl);
  const sourceWidth = image.naturalWidth || image.width || 1;
  const sourceHeight = image.naturalHeight || image.height || 1;
  const maxSide = 720;
  const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL('image/png');
}

function redirectToShopifyCheckout(project, uploadResult = {}) {
  const variantId = getShopifyVariantId();
  if (!variantId) throw new Error('No matching Shopify variant was found.');
  const projectName = `${projectFileBaseName(project)}.SignGuy`;
  const params = new URLSearchParams();

  params.set('id', variantId);
  params.set('quantity', '1');
  params.set('return_to', '/cart');

  if (state.customerEmail) {
    params.set('checkout[email]', state.customerEmail);
  }

  setShopifyOrderField(params, 'Customer email', state.customerEmail || '');
  setShopifyOrderField(params, 'Design name', project.name || getDesignName());

  if (project.type === 'SignGuy.HypeChainStudio') {
    const spinner = state.hype.variant === 'spinner' && typeof syncHypeSpinnerConfig === 'function'
      ? syncHypeSpinnerConfig()
      : null;
    setShopifyOrderField(params, 'Product', 'Hype Chain');
    setShopifyOrderField(params, 'Style', state.hype.variant === 'spinner' ? 'Spinner' : 'Classic');
    if (spinner) {
      setShopifyOrderField(params, 'Spinner top text', spinner.topText);
      setShopifyOrderField(params, 'Spinner bottom text', spinner.bottomText);
      setShopifyOrderField(params, 'Spinner ring font', spinner.fontFamily);
      setShopifyOrderField(params, 'Spinner ring colour', spinner.ringColor);
      setShopifyOrderField(params, 'Spinner text colour', spinner.textColor);
      setShopifyOrderField(params, 'Spinner base colour', spinner.baseColor);
    }
    setShopifyOrderField(params, 'Pattern length', `${getHypePatternLength()} link${getHypePatternLength() === 1 ? '' : 's'}`);
    setShopifyOrderField(params, 'Primary chain colour', normalizeHex(state.hype.primary));
    if (getHypePatternLength() >= 2) setShopifyOrderField(params, 'Secondary chain colour', normalizeHex(state.hype.secondary));
    if (getHypePatternLength() >= 3) setShopifyOrderField(params, 'Tertiary chain colour', normalizeHex(state.hype.tertiary));
    setShopifyOrderField(params, 'Connector and attachment colour', normalizeHex(state.hype.primary));
    setShopifyOrderField(params, 'Pendant backing sides and hook colour', getHypePendantBodyColour());
    setShopifyOrderField(params, 'Chain length', state.hype.chainLength);
  } else if (project.type === 'SignGuy.WallPlaqueStudio') {
    const usage = USAGE_PRESETS[getPlaqueUsageKey()] || USAGE_PRESETS.indoor;
    setShopifyOrderField(params, 'Product', '3D Wall Plaque');
    setShopifyOrderField(params, 'Studio size', SIZE_PRESETS[state.size].label);
    setShopifyOrderField(params, 'Usage', usage.label);
    setShopifyOrderField(params, 'Backing colour', getPlaqueBackingHex(state.processed));
    setShopifyOrderField(params, 'Layer count', String(getPlaqueLayerDescriptors().length));
  } else {
    setShopifyOrderField(params, 'Product', 'LED Sign');
    setShopifyOrderField(params, 'Studio size', SIZE_PRESETS[state.size].label);
    setShopifyOrderField(params, 'Usage', USAGE_PRESETS[state.usage]?.label || USAGE_PRESETS.indoor.label);
  }
  setShopifyOrderField(params, 'SignGuy file', projectName);

  trackSignStudioEvent('add_to_cart', {
    ecommerce: {
      currency: 'CAD',
      items: [getAnalyticsProductItem(project)],
    },
  });
  navigateToCheckoutUrl(`${SHOPIFY_CHECKOUT_BASE_URL}/add?${params.toString()}`);
}

function setShopifyOrderField(params, label, value) {
  const safeValue = value == null ? '' : String(value);
  params.set(`properties[${label}]`, safeValue);
  params.set(`attributes[${label}]`, safeValue);
}

function isEmbeddedInFrame() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function navigateToCheckoutUrl(url) {
  if (isEmbeddedInFrame()) {
    postCheckoutMessage(url);
    window.setTimeout(() => showCheckoutFallback(url), 1200);
    return;
  }

  try {
    if (window.top && window.top !== window.self) {
      window.top.location.href = url;
      return;
    }
  } catch (error) {
    console.warn('Top-level checkout navigation was blocked by the iframe host.', error);
  }

  const opened = window.open(url, '_top');
  if (!opened) {
    window.location.assign(url);
  }
}

function postCheckoutMessage(url) {
  const payload = { type: 'SIGN_STUDIO_CHECKOUT', url };
  const legacyPayload = { signStudioCheckoutUrl: url };

  [window.parent, window.top].forEach((target) => {
    if (!target || target === window.self) return;

    try {
      target.postMessage(payload, '*');
      target.postMessage(legacyPayload, '*');
    } catch (error) {
      console.warn('Could not post checkout redirect message to iframe host.', error);
    }
  });
}

function showCheckoutFallback(url) {
  if (!els.submitNote || window.location.href.startsWith(url)) return;

  els.submitNote.classList.add('checkout-fallback-note');
  els.submitNote.innerHTML = `Cart should open automatically. <a href="${escapeHtml(url)}" target="_blank" rel="noopener">Open your Shopify cart</a>.`;
}

function clearCheckoutFallback() {
  els.submitNote?.classList.remove('checkout-fallback-note');
}

function getShopifyVariantId() {
  if (state.productType === 'hype') return SHOPIFY_HYPE_CHAIN_VARIANTS[state.hype.variant] || SHOPIFY_HYPE_CHAIN_VARIANTS.classic;
  if (state.productType === 'plaque') return SHOPIFY_CUSTOM_3D_WALL_PLAQUE_VARIANTS[state.size]?.[getPlaqueUsageKey()] || '';
  return SHOPIFY_CUSTOM_LOGO_BAR_LIGHT_VARIANTS[state.size]?.[state.usage] || '';
}

function describeOrderError(error) {
  if (error?.message?.includes('Private Blob upload')) {
    return 'Could not securely upload the design files. Please try placing the order again.';
  }
  if (error?.message?.includes('Project save endpoint is unavailable')) {
    return isLocalTesting()
      ? 'Could not prepare the local checkout test. Try saving the design first, then place the order again.'
      : 'Could not reach the project save endpoint. The order was not started because the design folder must be saved first.';
  }
  if (error?.message?.includes('Project save endpoint returned')) {
    return `${error.message}. The order was not started because the design folder must be saved first.`;
  }
  if (error?.message?.includes('Failed to fetch')) {
    return 'Could not reach /api/save-project. The order was not started because the design folder must be saved first.';
  }
  if (error?.message?.includes('Submission endpoint')) {
    return `${error.message}. The order was not started because the logo and visualizer screenshots email could not be sent.`;
  }
  if (error?.message?.includes('send submission')) {
    return `${error.message}. The order was not started because the logo and visualizer screenshots email could not be sent.`;
  }
  if (error?.message?.includes('Shopify variant')) {
    if (state.productType === 'hype') {
      return 'Could not match Hype Chain to a Shopify checkout variant.';
    }
    if (state.productType === 'plaque') {
      return 'Could not match this 3D Wall Plaque size and usage to a checkout product variant.';
    }
    return 'Could not match this size and usage to a checkout product variant.';
  }
  return 'Could not prepare this order. Try again after the preview finishes loading.';
}

function projectFileBaseName(project) {
  return projectExportBaseName(project).replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'lightbox-design';
}

function projectExportBaseName(project) {
  if (project?.type === 'SignGuy.HypeChainStudio') {
    const logoName = String(project.source?.fileName || '').replace(/\.[^.]+$/, '').trim();
    return logoName || String(project.name || 'hype-chain-design').trim();
  }
  const customName = String(project.config?.designName || '').trim();
  if (customName) return customName;
  const sourceName = String(project.source?.fileName || '').replace(/\.[^.]+$/, '').trim();
  if (sourceName) return sourceName;
  const projectName = String(project.name || '').trim();
  if (projectName && projectName !== 'My Custom LED Sign') return projectName;
  return 'lightbox-design';
}

function formatProjectDate(value) {
  if (!value) return 'unsaved';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

function makeProjectId() {
  return window.crypto?.randomUUID?.() || `signguy-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function openProjectDb() {
  if (!window.indexedDB) return Promise.reject(new Error('IndexedDB is unavailable.'));
  if (projectDbPromise) return projectDbPromise;
  projectDbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(PROJECT_DB_NAME, PROJECT_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      let projectStore = null;
      if (!db.objectStoreNames.contains(PROJECT_STORE_NAME)) {
        projectStore = db.createObjectStore(PROJECT_STORE_NAME, { keyPath: 'id' });
      } else {
        projectStore = request.transaction.objectStore(PROJECT_STORE_NAME);
      }
      ensureProjectStoreIndex(projectStore, 'savedAt', 'savedAt');
      ensureProjectStoreIndex(projectStore, PROJECT_CUSTOMER_TYPE_INDEX, ['customerEmail', 'type']);
      ensureProjectStoreIndex(projectStore, PROJECT_CUSTOMER_TYPE_SAVED_AT_INDEX, ['customerEmail', 'type', 'savedAt']);
      if (!db.objectStoreNames.contains(PLAQUE_PROCESSED_CACHE_STORE_NAME)) {
        db.createObjectStore(PLAQUE_PROCESSED_CACHE_STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open the project log.'));
  });
  return projectDbPromise;
}

function ensureProjectStoreIndex(store, name, keyPath) {
  if (!store || store.indexNames.contains(name)) return;
  store.createIndex(name, keyPath);
}

async function saveProjectRecord(project) {
  prepareProjectRecordForStorage(project);
  const db = await openProjectDb();
  const tx = db.transaction(PROJECT_STORE_NAME, 'readwrite');
  tx.objectStore(PROJECT_STORE_NAME).put(project);
  await transactionDone(tx);
  await pruneProjectRecords();
}

function prepareProjectRecordForStorage(project) {
  if (!project) return;
  if (!project.id) project.id = makeProjectId();
  if (!project.savedAt) project.savedAt = new Date().toISOString();
  project.customerEmail = normalizeEmail(project.customerEmail || state.customerEmail);
}

function getProjectLogQuery() {
  return {
    email: normalizeEmail(state.customerEmail),
    projectType: currentProjectType(),
    hypeVariant: state.productType === 'hype' ? (state.hype.variant === 'spinner' ? 'spinner' : 'classic') : '',
  };
}

function getProjectCustomerTypeKey(query = getProjectLogQuery()) {
  return [normalizeEmail(query.email), query.projectType || currentProjectType()];
}

function getProjectCustomerTypeSavedAtRange(query = getProjectLogQuery()) {
  const [email, projectType] = getProjectCustomerTypeKey(query);
  return IDBKeyRange.bound([email, projectType, ''], [email, projectType, '\uffff']);
}

async function getProjectRecordCount(query = getProjectLogQuery()) {
  const db = await openProjectDb();
  const tx = db.transaction(PROJECT_STORE_NAME, 'readonly');
  const index = tx.objectStore(PROJECT_STORE_NAME).index(PROJECT_CUSTOMER_TYPE_INDEX);
  const range = IDBKeyRange.only(getProjectCustomerTypeKey(query));
  const count = query.hypeVariant
    ? await requestCursorCount(index, range, (project) => projectMatchesProjectLogQuery(project, query))
    : await requestResult(index.count(range));
  await transactionDone(tx);
  return count;
}

async function getProjectRecords(options = {}) {
  const query = options.query || getProjectLogQuery();
  const db = await openProjectDb();
  const tx = db.transaction(PROJECT_STORE_NAME, 'readonly');
  const records = await requestCursorRecords(
    tx.objectStore(PROJECT_STORE_NAME).index(PROJECT_CUSTOMER_TYPE_SAVED_AT_INDEX),
    getProjectCustomerTypeSavedAtRange(query),
    PROJECT_LOG_LIMIT,
    query.hypeVariant ? (project) => projectMatchesProjectLogQuery(project, query) : null,
  );
  await transactionDone(tx);
  return records
    .map((project) => (options.includePreviews ? project : summarizeProjectRecord(project)));
}

function requestCursorRecords(index, range, limit = PROJECT_LOG_LIMIT, predicate = null) {
  return new Promise((resolve, reject) => {
    const records = [];
    const request = index.openCursor(range, 'prev');
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        resolve(records);
        return;
      }
      if (!predicate || predicate(cursor.value)) records.push(cursor.value);
      if (records.length >= limit) {
        resolve(records);
        return;
      }
      cursor.continue();
    };
    request.onerror = () => reject(request.error || new Error('Database cursor failed.'));
  });
}

function requestCursorCount(index, range, predicate = null) {
  return new Promise((resolve, reject) => {
    let count = 0;
    const request = index.openCursor(range, 'prev');
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        resolve(count);
        return;
      }
      if (!predicate || predicate(cursor.value)) count += 1;
      cursor.continue();
    };
    request.onerror = () => reject(request.error || new Error('Database cursor failed.'));
  });
}

function projectMatchesProjectLogQuery(project, query = getProjectLogQuery()) {
  if (!project) return false;
  if (normalizeEmail(project.customerEmail) !== normalizeEmail(query.email)) return false;
  if (project.type !== (query.projectType || currentProjectType())) return false;
  if (query.hypeVariant) return getProjectHypeVariant(project) === query.hypeVariant;
  return true;
}

function getProjectHypeVariant(project) {
  if (project?.type !== 'SignGuy.HypeChainStudio') return '';
  const explicitVariant = String(project.config?.hype?.variant || '').toLowerCase();
  if (explicitVariant === 'spinner' || explicitVariant === 'classic') return explicitVariant;
  const style = String(project.preview?.details?.style || project.name || '').toLowerCase();
  if (style.includes('spinner')) return 'spinner';
  return 'classic';
}

function summarizeProjectRecord(project) {
  if (!project) return project;
  return {
    id: project.id,
    type: project.type,
    name: project.name,
    savedAt: project.savedAt,
    customerEmail: project.customerEmail,
    source: {
      fileName: project.source?.fileName || '',
      artworkType: project.source?.artworkType || '',
    },
    preview: {
      capturedAt: project.preview?.capturedAt || '',
    },
  };
}

function currentProjectType() {
  if (state.productType === 'hype') return 'SignGuy.HypeChainStudio';
  if (state.productType === 'plaque') return 'SignGuy.WallPlaqueStudio';
  return 'SignGuy.LightboxStudio';
}

async function getProjectRecord(id) {
  const db = await openProjectDb();
  const tx = db.transaction(PROJECT_STORE_NAME, 'readonly');
  const project = await requestResult(tx.objectStore(PROJECT_STORE_NAME).get(id));
  await transactionDone(tx);
  if (!project) throw new Error('Saved project was not found.');
  if (normalizeEmail(project.customerEmail) !== normalizeEmail(state.customerEmail)) {
    throw new Error('Saved project belongs to a different email address.');
  }
  return project;
}

async function deleteProjectRecord(id) {
  const db = await openProjectDb();
  const tx = db.transaction(PROJECT_STORE_NAME, 'readwrite');
  tx.objectStore(PROJECT_STORE_NAME).delete(id);
  await transactionDone(tx);
}

async function pruneProjectRecords() {
  const db = await openProjectDb();
  const tx = db.transaction(PROJECT_STORE_NAME, 'readwrite');
  const store = tx.objectStore(PROJECT_STORE_NAME);
  const records = await requestResult(store.getAll());
  const query = getProjectLogQuery();
  records
    .filter((project) => projectMatchesProjectLogQuery(project, query))
    .sort((a, b) => String(b.savedAt || '').localeCompare(String(a.savedAt || '')))
    .slice(PROJECT_LOG_LIMIT)
    .forEach((project) => store.delete(project.id));
  await transactionDone(tx);
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Database request failed.'));
  });
}

function transactionDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Database transaction failed.'));
    tx.onabort = () => reject(tx.error || new Error('Database transaction aborted.'));
  });
}

async function submitDesignRequest() {
  if (!state.processed || !state.uploadedFile) return;
  setStatus('Submitting');
  if (els.submitDesign) els.submitDesign.disabled = true;
  try {
    const screenshots = await captureSubmissionScreenshots();
    const subject = SUBMISSION_SUBJECT;
    const body = makeEmailBody();
    const endpoint = getSubmissionEndpoint();

    if (endpoint) {
      await submitDesignToEndpoint({ endpoint, subject, body, screenshots });
      setStatus('Submitted');
      els.submitNote.textContent = `Submitted to ${CONTACT_EMAIL} with the logo and ${screenshots.length} visualizer screenshots.`;
      trackSignStudioEvent('generate_lead', {
        lead_source: 'design_submission',
        product_type: state.productType,
      });
      return;
    }

    screenshots.forEach((item) => downloadBlob(item.blob, item.file.name, 'image/png'));
    openMailDraft(subject, `${body}\n\nAttach the uploaded logo file and the downloaded visualizer screenshots before sending.`);
    els.submitNote.textContent = 'Automatic email is only available on the deployed Vercel site. A pre-addressed email draft was opened and the visualizer screenshots were downloaded.';
    setStatus('Email draft');
  } catch (error) {
    console.error(error);
    els.submitNote.textContent = describeSubmitError(error);
    setStatus('Submit failed');
  } finally {
    if (els.submitDesign) els.submitDesign.disabled = false;
  }
}

function getSubmissionEndpoint() {
  if (window.SIGN_GUY_SUBMISSION_ENDPOINT) return window.SIGN_GUY_SUBMISSION_ENDPOINT;
  if (!window.location.protocol.startsWith('http')) return '';
  return new URL('/api/submit-design', window.location.href).href;
}

function describeSubmitError(error) {
  if (error?.message?.includes('3D preview')) {
    return 'Could not capture the visualizer screenshots. Wait for the preview to finish loading, then try again.';
  }
  if (error?.message?.includes('Submission endpoint returned')) {
    return `${error.message}. Check Vercel Function Logs and SMTP environment variables.`;
  }
  if (error?.message?.includes('Failed to fetch')) {
    return 'Could not reach /api/submit-design. Make sure api/submit-design.js was pushed to GitHub and redeployed on Vercel.';
  }
  return 'Could not send this submission. Check the Vercel function logs and try again.';
}

async function captureSubmissionScreenshots() {
  const originalRotation = { ...state.rotation };
  const shots = [];
  try {
    shots.push({
      label: 'Current visualizer view',
      blob: await captureVisualizerBlob(),
      fileName: `${baseName()}-visualizer-current.png`,
    });
    state.rotation = { x: -4, y: 34, z: 0 };
    applyRotation();
    await waitFrame();
    shots.push({
      label: 'Angled side view',
      blob: await captureVisualizerBlob(),
      fileName: `${baseName()}-visualizer-angled.png`,
    });
  } finally {
    state.rotation = originalRotation;
    applyRotation();
  }
  return shots.map((shot) => ({
    ...shot,
    file: new File([shot.blob], shot.fileName, { type: 'image/png' }),
  }));
}

async function submitDesignToEndpoint({ endpoint, subject, body, screenshots }) {
  const form = new FormData();
  form.append('to', CONTACT_EMAIL);
  form.append('subject', subject);
  form.append('message', body);
  form.append('customerEmail', state.customerEmail);
  form.append('signName', getDesignName());
  form.append('uploadedFileName', state.fileName || state.uploadedFile?.name || 'logo file');
  form.append('size', SIZE_PRESETS[state.size].label);
  form.append('usage', USAGE_PRESETS[state.usage]?.label || USAGE_PRESETS.indoor.label);
  form.append('depthMm', String(SIZE_PRESETS[state.size].depth));
  form.append('sideColour', normalizeHex(state.shellColours.side));
  form.append('backColour', normalizeHex(state.shellColours.back));
  const submittedColours = state.productType === 'plaque'
    ? getPlaqueSubmittedColourItems().map((item) => item.display)
    : (state.processed?.colours || []).map((region, idx) => getDisplayColour(idx, region.hex));
  form.append('frontColours', JSON.stringify(submittedColours));
  form.append('logo', state.uploadedFile, state.uploadedFile.name || 'uploaded-logo');
  screenshots.forEach((shot, idx) => {
    form.append(`renderScreenshot${idx + 1}`, shot.file, shot.file.name);
    form.append(`renderScreenshot${idx + 1}Label`, shot.label);
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    body: form,
  });
  if (!response.ok) {
    let detail = '';
    try {
      detail = await response.text();
    } catch {
      detail = '';
    }
    throw new Error(`Submission endpoint returned ${response.status}${detail ? `: ${detail.slice(0, 160)}` : ''}`);
  }
}

function captureVisualizerBlob() {
  return new Promise((resolve, reject) => {
    const source = state.three?.renderer?.domElement;
    if (!source) {
      reject(new Error('The 3D preview is not ready yet.'));
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#303333');
    gradient.addColorStop(0.58, '#272928');
    gradient.addColorStop(1, '#3e4140');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const halo = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.48, 0, canvas.width * 0.5, canvas.height * 0.48, canvas.width * 0.32);
    halo.addColorStop(0, state.illuminated ? 'rgba(125,145,175,0.45)' : 'rgba(98,110,121,0.22)');
    halo.addColorStop(1, 'rgba(98,110,121,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('The visualizer screenshot could not be captured.'));
    }, 'image/png');
  });
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function makeEmailBody(context = 'Design submission') {
  const preset = SIZE_PRESETS[state.size];
  const isPlaque = state.productType === 'plaque';
  const usage = getActiveUsagePreset();
  const colours = (isPlaque
    ? getPlaqueSubmittedColourItems().map((item) => ({
      label: item.label,
      hex: item.display,
    }))
    : (state.processed?.colours || []).map((region, idx) => ({
      label: `Colour ${idx + 1}`,
      hex: getDisplayColour(idx, region.hex),
    })))
    .map((item) => `${item.label}: ${item.hex}`)
    .join('\n');
  const details = [
    isPlaque ? 'Custom 3D wall plaque request' : 'Custom lightbox request',
    '',
    `Context: ${context}`,
    `Customer email: ${state.customerEmail || 'Not provided'}`,
    `Sign name: ${getDesignName()}`,
    `Uploaded file: ${state.fileName || 'logo file'}`,
    `Size: ${preset.label}`,
    `Usage: ${usage.label}`,
  ];
  if (isPlaque) {
    details.push(
      `Backing thickness: ${formatMm(state.plaque.baseThickness)}`,
      `Backing colour: ${getPlaqueBackingHex(state.processed)}`,
      `Raised layers: ${getPlaqueLayerDescriptors().length}`,
    );
  } else {
    details.push(
      `Depth: ${preset.depth} mm`,
      `Preview lighting: ${state.illuminated ? 'Illuminated' : 'Not illuminated'}`,
      `Side colour: ${normalizeHex(state.shellColours.side)}`,
      `Back colour: ${normalizeHex(state.shellColours.back)}`,
    );
  }
  return [
    ...details,
    `Render screenshots: current visualizer view and angled side view`,
    '',
    isPlaque ? 'Plaque colours:' : 'Detected front colours:',
    colours || 'None detected',
  ].join('\n');
}

function makeOrderEmailSubject(productLabel) {
  const email = normalizeEmail(state.customerEmail) || 'A customer';
  return `${email} placed a ${productLabel} order`;
}

function makeOrderEmailHtml({ title, context, logoTitle, details, colourSections }) {
  const rows = details.map(([label, value]) => `
    <tr>
      <th style="text-align:left;padding:8px 12px;border-bottom:1px solid #ece6d8;color:#5f5a50;font-size:13px;">${escapeHtml(label)}</th>
      <td style="padding:8px 12px;border-bottom:1px solid #ece6d8;font-size:14px;">${escapeHtml(value)}</td>
    </tr>
  `).join('');

  const sections = colourSections
    .map((section) => makeEmailColourSectionHtml(section.title, section.colours))
    .join('');

  return `
    <div style="margin:0;padding:24px;background:#f7f3e8;color:#171717;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:720px;margin:0 auto;background:#fffdf8;border:1px solid #ded6c6;border-radius:14px;overflow:hidden;">
        <div style="padding:22px 24px;background:#ffc529;">
          <h1 style="margin:0;font-size:24px;line-height:1.15;color:#171717;">${escapeHtml(title)}</h1>
          <p style="margin:8px 0 0;font-size:14px;color:#413816;">${escapeHtml(context)}</p>
        </div>

        <div style="padding:22px 24px;">
          <h2 style="margin:0 0 12px;font-size:16px;">${escapeHtml(logoTitle)}</h2>

          <div style="display:inline-block;padding:14px;background:#f2eee4;border:1px solid #ded6c6;border-radius:12px;">
            <img src="cid:uploaded-logo" alt="${escapeHtml(logoTitle)}" style="display:block;max-width:360px;max-height:260px;width:auto;height:auto;" />
          </div>

          <h2 style="margin:24px 0 10px;font-size:16px;">Order details</h2>

          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid #ece6d8;border-radius:10px;overflow:hidden;">
            ${rows}
          </table>

          ${sections}

          <p style="margin:22px 0 0;color:#69645b;font-size:13px;">
            Attached files include the .SignGuy project file, uploaded logo, and any captured preview screenshots.
          </p>
        </div>
      </div>
    </div>
  `;
}

function makeEmailColourSectionHtml(title, colours) {
  const uniqueColours = (colours || [])
    .filter((item) => item && item.hex)
    .map((item) => ({
      label: item.label,
      hex: normalizeHex(item.hex),
    }));

  if (!uniqueColours.length) return '';

  const rows = uniqueColours.map((item) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #ece6d8;">
        <span style="display:inline-block;width:24px;height:24px;border-radius:999px;border:1px solid #b9b2a4;background:${escapeHtml(item.hex)};vertical-align:middle;margin-right:10px;"></span>
        <span style="vertical-align:middle;">${escapeHtml(item.label)}</span>
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #ece6d8;font-family:Consolas,Menlo,monospace;font-size:14px;text-transform:uppercase;">${escapeHtml(item.hex)}</td>
    </tr>
  `).join('');

  return `
    <h2 style="margin:24px 0 10px;font-size:16px;">${escapeHtml(title)}</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid #ece6d8;border-radius:10px;overflow:hidden;">
      ${rows}
    </table>
  `;
}

function makeEmailHtml(context = 'Design submission') {
  const preset = SIZE_PRESETS[state.size];
  const isPlaque = state.productType === 'plaque';
  const usage = getActiveUsagePreset();

  const frontColours = isPlaque
    ? getPlaqueSubmittedColourItems().map((item) => ({
      label: item.label,
      hex: item.display,
    }))
    : (state.processed?.colours || []).map((region, index) => ({
      label: `Front colour ${index + 1}`,
      hex: getDisplayColour(index, region.hex),
    }));

  return makeOrderEmailHtml({
    title: isPlaque ? 'Custom 3D wall plaque request' : 'Custom lightbox request',
    context,
    logoTitle: 'Uploaded logo',
    details: [
      ['Customer email', state.customerEmail || 'Not provided'],
      ['Sign name', getDesignName()],
      ['Uploaded file', state.fileName || 'logo file'],
      ['Size', preset.label],
      ['Usage', usage.label],
      ...(isPlaque
        ? [
          ['Backing thickness', formatMm(state.plaque.baseThickness)],
          ['Backing colour', getPlaqueBackingHex(state.processed)],
          ['Raised layers', String(getPlaqueLayerDescriptors().length)],
        ]
        : [
          ['Depth', `${preset.depth} mm`],
          ['Preview lighting', state.illuminated ? 'Illuminated' : 'Not illuminated'],
        ]),
    ],
    colourSections: [
      {
        title: isPlaque ? 'Plaque colours' : 'Front colours',
        colours: frontColours,
      },
      ...(!isPlaque ? [{
        title: 'Body colours',
        colours: [
          { label: 'Side colour', hex: state.shellColours.side },
          { label: 'Back colour', hex: state.shellColours.back },
        ],
      }] : []),
    ],
  });
}

function openMailDraft(subject, body) {
  const url = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const link = document.createElement('a');
  link.href = url;
  link.click();
}

function exportStlBundle() {
  if (!state.processed) return;
  const files = makeModelFiles();
  downloadBlob(makeZip(files), `${baseName()}-lightbox-stl.zip`, 'application/zip');
}

function export3mf() {
  if (!state.processed) return;
  const model = make3mfModel();
  const files = [
    { name: '[Content_Types].xml', data: textBytes(`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>`) },
    { name: '_rels/.rels', data: textBytes(`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>`) },
    { name: '3D/3dmodel.model', data: textBytes(model) },
  ];
  downloadBlob(makeZip(files), `${baseName()}-lightbox.3mf`, 'model/3mf');
}

function makeModelFiles() {
  const p = state.processed;
  const preset = SIZE_PRESETS[state.size];
  const outline = normalizedOutline(p.silhouette, preset.inches * 25.4);
  const inner = offsetOutline(outline, -7);
  const files = [
    { name: `side_wall_${state.shellColours.side.replace('#', '')}.stl`, data: textBytes(makeRingStl('side_wall', outline, inner, 0, preset.depth)) },
  ];
  files.push({ name: `back_plate_${state.shellColours.back.replace('#', '')}.stl`, data: textBytes(makeSolidStl('back_plate', offsetOutline(outline, -4), -3, 0)) });
  p.colours.forEach((region, idx) => {
    const hex = getDisplayColour(idx, region.hex);
    files.push({
      name: `front_diffuser_colour_${idx + 1}_${hex.replace('#', '')}.stl`,
      data: textBytes(makeRegionStl(`front_diffuser_colour_${idx + 1}`, region.mask, p.width, p.height, outline.scale, 0, 2.2)),
    });
  });
  return files;
}

function make3mfModel() {
  const p = state.processed;
  const preset = SIZE_PRESETS[state.size];
  const outline = normalizedOutline(p.silhouette, preset.inches * 25.4);
  const mesh = meshForSolid(offsetOutline(outline, -2), 0, preset.depth * 0.18);
  return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <metadata name="Title">${escapeXml(baseName())} LED lightbox shell preview</metadata>
  <resources>
    <object id="1" type="model">
      <mesh>
        <vertices>${mesh.vertices.map((v) => `<vertex x="${v[0].toFixed(3)}" y="${v[1].toFixed(3)}" z="${v[2].toFixed(3)}"/>`).join('')}</vertices>
        <triangles>${mesh.triangles.map((t) => `<triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}"/>`).join('')}</triangles>
      </mesh>
    </object>
  </resources>
  <build><item objectid="1"/></build>
</model>`;
}

function normalizedOutline(points, targetMm) {
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const scale = targetMm / Math.max(maxX - minX, maxY - minY);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const outline = points.map(([x, y]) => [(x - cx) * scale, (cy - y) * scale]);
  outline.scale = scale;
  return outline;
}

function offsetOutline(points, amount) {
  const cx = points.reduce((sum, point) => sum + point[0], 0) / points.length;
  const cy = points.reduce((sum, point) => sum + point[1], 0) / points.length;
  const maxR = Math.max(...points.map(([x, y]) => Math.hypot(x - cx, y - cy)));
  const scale = clamp((maxR + amount) / maxR, 0.72, 1.18);
  return points.map(([x, y]) => [cx + (x - cx) * scale, cy + (y - cy) * scale]);
}

function makeSolidStl(name, outline, z0, z1) {
  const mesh = meshForSolid(outline, z0, z1);
  return meshToAsciiStl(name, mesh);
}

function makeRingStl(name, outer, inner, z0, z1) {
  const vertices = [];
  const triangles = [];
  outer.forEach(([x, y]) => vertices.push([x, y, z0], [x, y, z1]));
  inner.forEach(([x, y]) => vertices.push([x, y, z0], [x, y, z1]));
  const n = outer.length;
  for (let i = 0; i < n; i += 1) {
    const j = (i + 1) % n;
    triangles.push([i * 2, j * 2, i * 2 + 1], [i * 2 + 1, j * 2, j * 2 + 1]);
    triangles.push([n * 2 + i * 2 + 1, n * 2 + j * 2 + 1, n * 2 + i * 2], [n * 2 + i * 2, n * 2 + j * 2 + 1, n * 2 + j * 2]);
    triangles.push([i * 2 + 1, j * 2 + 1, n * 2 + i * 2 + 1], [n * 2 + i * 2 + 1, j * 2 + 1, n * 2 + j * 2 + 1]);
    triangles.push([i * 2, n * 2 + i * 2, j * 2], [j * 2, n * 2 + i * 2, n * 2 + j * 2]);
  }
  return meshToAsciiStl(name, { vertices, triangles });
}

function meshForSolid(outline, z0, z1) {
  const vertices = [];
  const triangles = [];
  outline.forEach(([x, y]) => vertices.push([x, y, z0], [x, y, z1]));
  const bottomCenter = vertices.push([0, 0, z0]) - 1;
  const topCenter = vertices.push([0, 0, z1]) - 1;
  const n = outline.length;
  for (let i = 0; i < n; i += 1) {
    const j = (i + 1) % n;
    triangles.push([bottomCenter, j * 2, i * 2], [topCenter, i * 2 + 1, j * 2 + 1]);
    triangles.push([i * 2, j * 2, i * 2 + 1], [i * 2 + 1, j * 2, j * 2 + 1]);
  }
  return { vertices, triangles };
}

function makeRegionStl(name, mask, width, height, scale, z0, z1) {
  const cell = scale;
  const x0 = (width - 1) / 2;
  const y0 = (height - 1) / 2;
  const vertices = [];
  const triangles = [];
  const sample = Math.max(2, Math.ceil(Math.max(width, height) / 46));
  const addBox = (x, y, w, h) => {
    const left = (x - x0) * cell;
    const right = (x + w - x0) * cell;
    const top = (y0 - y) * cell;
    const bottom = (y0 - y - h) * cell;
    const base = vertices.length;
    vertices.push([left, bottom, z0], [right, bottom, z0], [right, top, z0], [left, top, z0], [left, bottom, z1], [right, bottom, z1], [right, top, z1], [left, top, z1]);
    triangles.push([base, base + 1, base + 2], [base, base + 2, base + 3], [base + 4, base + 6, base + 5], [base + 4, base + 7, base + 6], [base, base + 4, base + 5], [base, base + 5, base + 1], [base + 1, base + 5, base + 6], [base + 1, base + 6, base + 2], [base + 2, base + 6, base + 7], [base + 2, base + 7, base + 3], [base + 3, base + 7, base + 4], [base + 3, base + 4, base]);
  };
  for (let y = 0; y < height; y += sample) {
    let x = 0;
    while (x < width) {
      while (x < width && !blockHasPixel(mask, width, height, x, y, sample)) x += sample;
      const start = x;
      while (x < width && blockHasPixel(mask, width, height, x, y, sample)) x += sample;
      if (x > start) addBox(start, y, x - start, sample);
    }
  }
  return meshToAsciiStl(name, { vertices, triangles });
}

function meshToAsciiStl(name, mesh) {
  const lines = [`solid ${name}`];
  mesh.triangles.forEach(([a, b, c]) => {
    const normal = faceNormal(mesh.vertices[a], mesh.vertices[b], mesh.vertices[c]);
    lines.push(` facet normal ${normal.map(formatNumber).join(' ')}`, '  outer loop');
    [a, b, c].forEach((idx) => lines.push(`   vertex ${mesh.vertices[idx].map(formatNumber).join(' ')}`));
    lines.push('  endloop', ' endfacet');
  });
  lines.push(`endsolid ${name}`);
  return lines.join('\n');
}

function faceNormal(a, b, c) {
  const ux = b[0] - a[0];
  const uy = b[1] - a[1];
  const uz = b[2] - a[2];
  const vx = c[0] - a[0];
  const vy = c[1] - a[1];
  const vz = c[2] - a[2];
  const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
  const len = Math.hypot(...n) || 1;
  return n.map((value) => value / len);
}

function makeZip(files) {
  const encoder = new TextEncoder();
  const chunks = [];
  const central = [];
  let offset = 0;
  files.forEach((file) => {
    const name = encoder.encode(file.name);
    const data = file.data instanceof Uint8Array ? file.data : encoder.encode(String(file.data));
    const crc = crc32(data);
    const local = concatBytes([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      name,
      data,
    ]);
    chunks.push(local);
    central.push(
      concatBytes([
        u32(0x02014b50),
        u16(20),
        u16(20),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(data.length),
        u32(data.length),
        u16(name.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset),
        name,
      ]),
    );
    offset += local.length;
  });
  const centralStart = offset;
  const centralBlob = concatBytes(central);
  const end = concatBytes([u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(centralBlob.length), u32(centralStart), u16(0)]);
  return new Blob([...chunks, centralBlob, end], { type: 'application/zip' });
}

function crc32(bytes) {
  let crc = -1;
  for (let i = 0; i < bytes.length; i += 1) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ -1) >>> 0;
}

function u16(value) {
  return new Uint8Array([value & 255, (value >>> 8) & 255]);
}

function u32(value) {
  return new Uint8Array([value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255]);
}

function concatBytes(parts) {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(length);
  let offset = 0;
  parts.forEach((part) => {
    out.set(part, offset);
    offset += part.length;
  });
  return out;
}

function textBytes(text) {
  return new TextEncoder().encode(text);
}

function safeFileName(value) {
  return String(value || 'file').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-').replace(/^-|-$/g, '') || 'file';
}

function downloadBlob(blob, filename, type) {
  const url = URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function colourDistance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function rgbToHex(rgb) {
  return `#${rgb.map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0')).join('')}`;
}

function normalizeHex(value) {
  const raw = String(value || '').trim();
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(raw)) {
    return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toLowerCase();
  }
  return '#ffffff';
}

function hexToRgb(hex) {
  const normalized = normalizeHex(hex);
  return [
    parseInt(normalized.slice(1, 3), 16),
    parseInt(normalized.slice(3, 5), 16),
    parseInt(normalized.slice(5, 7), 16),
  ];
}

function shadeHex(hex, amount) {
  const rgb = hexToRgb(hex).map((value) => clamp(value + amount, 0, 255));
  return rgbToHex(rgb);
}

function liftDarkFrameColour(hex) {
  const [r, g, b] = hexToRgb(normalizeHex(hex));
  const floor = 22;
  const mix = 0.18;
  return rgbToHex([
    Math.max(floor, r + (255 - r) * mix),
    Math.max(floor, g + (255 - g) * mix),
    Math.max(floor, b + (255 - b) * mix),
  ]);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function waitFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

function waitMs(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function finishAppLoading() {
  while (performance.now() - loadingStartedAt < LOADING_MIN_VISIBLE_MS) {
    await waitMs(24);
  }
  state.loadingReady = true;
  if (state.requiresEmailGate) {
    showLoadingStart();
    return;
  }
  hideAppLoading();
}

function hideAppLoading() {
  window.SignStudioBootWatchdog?.ready();
  document.body.classList.remove('studio-loading');
  if (els.appLoading) els.appLoading.classList.add('hidden');
  resetMobileViewportAfterGate();
  maybeShowInitialProductSelectionMenu();
}

function showLoadingStart() {
  if (!els.loadingStartButton) return;
  window.SignStudioBootWatchdog?.ready();
  els.appLoadingCard?.classList.add('ready-to-start');
  els.loadingStartButton.disabled = false;
  els.loadingStartButton.textContent = 'START';
  focusEmailGateInput();
}

function focusEmailGateInput() {
  if (!els.customerEmail || !state.requiresEmailGate) return;
  window.setTimeout(() => {
    if (!els.customerEmail || els.emailGateForm?.classList.contains('hidden')) return;
    els.customerEmail.focus({ preventScroll: true });
    els.customerEmail.select();
  }, 0);
}

function resetMobileViewportAfterGate() {
  if (!window.matchMedia('(max-width: 768px)').matches) return;
  const activeElement = document.activeElement;
  if (activeElement && typeof activeElement.blur === 'function') activeElement.blur();
  resetPreviewView();
  [document.documentElement, document.body, els.appShell, els.controlPanel, els.previewPanel, els.stage].forEach((element) => {
    if (!element) return;
    element.scrollTop = 0;
    element.scrollLeft = 0;
    element.style.removeProperty('zoom');
    element.style.removeProperty('transform');
    element.style.removeProperty('translate');
    element.style.removeProperty('scale');
  });
  const resetScroll = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    els.previewPanel?.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'auto' });
  };
  resetScroll();
  requestAnimationFrame(resetScroll);
  window.setTimeout(resetScroll, 120);
}

function setStatus(text) {
  els.statusPill.textContent = text;
}

function baseName() {
  const name = state.designName.trim() || state.fileName || getDesignName();
  return name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'my-custom-led-sign';
}

function formatNumber(value) {
  return Number.isFinite(value) ? value.toFixed(5) : '0.00000';
}

function escapeXml(value) {
  return value.replace(/[<>&'"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char]);
}

function escapeHtml(value) {
  return String(value).replace(/[<>&"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[char]);
}
