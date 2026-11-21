/**
 * Bannière d'accueil : le logo NEXORA en verre optique (Three.js), chargé uniquement à la demande.
 *
 * Inspiré du moteur « Premium 3D Glass » : verre en transmission totale, irisation, vernis,
 * dispersion chromatique, environnement « studio » de panneaux lumineux, prisme extrudé biseauté.
 * Ici, la dispersion est native (MeshPhysicalMaterial.dispersion, Three.js ≥ r163).
 *
 * Deux pièces : l'hexagone en verre clair et le N en verre teinté violet (comme le logo).
 * Économies : géométrie générée (aucun fichier), densité de pixels ≤ 1,5, rendu en pause hors écran
 * ou onglet caché, ressources libérées au démontage.
 */
import {
  ACESFilmicToneMapping,
  AmbientLight,
  Color,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  Path,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShaderMaterial,
  Shape,
  SRGBColorSpace,
  Vector2,
  WebGLRenderer,
} from "three";

// ------------------------------------------------------------------ géométrie du logo (repère SVG 24 × 24)
const HEX = [[12, 1.5], [21.5, 7], [21.5, 17], [12, 22.5], [2.5, 17], [2.5, 7]] as const;
const RING = 1.15; // demi-épaisseur du cadre hexagonal
const N_HALF = 1.35; // demi-épaisseur des traits du N

/** Repère SVG (y vers le bas, centre 12,12) → repère 3D (y vers le haut, centré). */
const toWorld = (x: number, y: number, k: number) => new Vector2((x - 12) * k, (12 - y) * k);

function hexPoints(scale: number, k: number) {
  return HEX.map(([x, y]) => toWorld(12 + (x - 12) * scale, 12 + (y - 12) * scale, k));
}

/** Contour du N à traits épais (polygone simple, sans croisement). */
function nPoints(k: number) {
  const h = N_HALF;
  const d = h * Math.SQRT2;
  const pts: [number, number][] = [
    [8 - h, 16 + h], [8 - h, 8 - h], [8 - h + d, 8 - h], [16 - h, 16 - h - d], [16 - h, 8 - h],
    [16 + h, 8 - h], [16 + h, 16 + h], [16 + h - d, 16 + h], [8 + h, 8 + h + d], [8 + h, 16 + h],
  ];
  return pts.map(([x, y]) => toWorld(x, y, k));
}

function buildLogo(height: number, depth: number) {
  const k = height / 21; // hauteur de l'hexagone ≈ 21 unités SVG
  const r = 10.5;
  const ring = new Shape(hexPoints((r + RING) / r, k));
  ring.holes.push(new Path(hexPoints((r - RING) / r, k).reverse()));
  const n = new Shape(nPoints(k).reverse());
  const opts = { depth, steps: 1, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.05, bevelSegments: 6, curveSegments: 8 };
  const ringGeo = new ExtrudeGeometry(ring, opts);
  const nGeo = new ExtrudeGeometry(n, { ...opts, depth: depth * 1.15 });
  ringGeo.translate(0, 0, -depth / 2);
  nGeo.translate(0, 0, -(depth * 1.15) / 2);
  return { ringGeo, nGeo };
}

// ------------------------------------------------------------------ matériaux
function glassMaterial(tint?: string) {
  return new MeshPhysicalMaterial({
    color: tint ? new Color(tint).lerp(new Color("#ffffff"), 0.7) : new Color("#ffffff"),
    metalness: 0,
    roughness: 0.025,
    transmission: 1,
    thickness: 0.9,
    ior: 1.46,
    dispersion: 0.35, // séparation des couleurs sur les arêtes, comme un prisme
    attenuationColor: new Color(tint ?? "#edf7ff"),
    attenuationDistance: tint ? 3.2 : 10,
    clearcoat: 0.65,
    clearcoatRoughness: 0.018,
    iridescence: 0.55,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [100, 420],
    envMapIntensity: 1.1,
    // Verre teinté : légère lueur interne, comme un néon pris dans le verre (le violet de la marque).
    emissive: new Color(tint ?? "#000000"),
    emissiveIntensity: tint ? 0.16 : 0,
    side: DoubleSide,
  });
}

/** Environnement « studio » : de longs panneaux lumineux donnent des reflets nets et colorés. */
function studioEnvironment(renderer: WebGLRenderer) {
  const studio = new Scene();
  studio.background = new Color("#05060a");
  const panels: [number, number, number, number, number, string, number][] = [
    [2.8, 8, -4, 2, 3, "#ffffff", 2.6],
    [0.65, 7, 3, 1, 2, "#dceeff", 4.0],
    [5, 0.7, 0, 5, -1, "#ffffff", 3.5],
    [0.5, 6, -2, 0, -4, "#9281f7", 3.2], // violet de la charte
    [1.0, 5, 3, -1, -3, "#baa7ff", 2.4],
    [4, 0.35, 0, -3, 3, "#92bbff", 3.0],
    [0.16, 5, -3, 0, 2, "#ffffff", 5.0],
  ];
  for (const [w, h, x, y, z, color, intensity] of panels) {
    const panel = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: new Color(color).multiplyScalar(intensity), side: DoubleSide }));
    panel.position.set(x, y, z);
    panel.lookAt(0, 0, 0);
    studio.add(panel);
  }
  const pmrem = new PMREMGenerator(renderer);
  const env = pmrem.fromScene(studio, 0.025, 0.1, 100);
  studio.traverse((o) => {
    if (o instanceof Mesh) {
      o.geometry.dispose();
      (o.material as MeshBasicMaterial).dispose();
    }
  });
  pmrem.dispose();
  return env;
}

/**
 * Fond derrière le verre : noir avec une lueur violette et une fine trame,
 * pour que la réfraction ait quelque chose à déformer. Il se fond dans le noir de la page sur les bords.
 */
function backdrop() {
  return new ShaderMaterial({
    depthWrite: false,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      varying vec2 vUv; uniform float uTime;
      float line(float v, float w){ return 1.0 - smoothstep(0.0, w, abs(v)); }
      void main(){
        vec2 uv = vUv - 0.5;
        float r = length(uv);
        vec3 violet = vec3(0.57, 0.50, 0.97);
        vec3 col = violet * 0.22 * exp(-r * r * 9.0);
        col += vec3(0.44, 0.72, 1.0) * 0.05 * exp(-dot(uv - vec2(0.16, -0.10), uv - vec2(0.16, -0.10)) * 28.0);
        // fines lignes : elles se tordent à travers le verre et révèlent la réfraction
        vec2 g = fract(uv * 9.0 + vec2(0.0, uTime * 0.008)) - 0.5;
        float grid = max(line(g.x, 0.012), line(g.y, 0.012));
        col += vec3(0.75, 0.75, 0.9) * grid * 0.07 * (1.0 - smoothstep(0.12, 0.42, r));
        col *= 1.0 - smoothstep(0.26, 0.5, r); // bords du cadre : noir pur, comme la page
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

// ------------------------------------------------------------------ montage
/**
 * onReady  : la 3D est affichée (le logo SVG peut s'effacer).
 * onTooSlow: l'appareil ne suit pas (images trop lentes) ; la 3D s'est arrêtée d'elle-même.
 */
export function mountHeroScene(container: HTMLElement, onReady: () => void, onTooSlow: () => void = () => {}, watchdog = true): () => void {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  } catch {
    return () => {}; // WebGL indisponible : le logo plat reste affiché
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 1);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  // La passe de réfraction est calculée en résolution réduite : le flou du verre le masque.
  renderer.transmissionResolutionScale = 0.6;
  container.appendChild(renderer.domElement);

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 60);
  camera.position.set(0, 0, 9);
  scene.add(camera);

  const env = studioEnvironment(renderer);
  scene.environment = env.texture;

  const bgMat = backdrop();
  // Plan unitaire, mis à l'échelle exacte du cadre de la caméra (voir resize) : le fondu atteint les bords.
  const BG_DIST = 6;
  const bg = new Mesh(new PlaneGeometry(1, 1), bgMat);
  bg.position.set(0, 0, -BG_DIST);
  bg.renderOrder = -1;
  camera.add(bg);

  const { ringGeo, nGeo } = buildLogo(3.2, 0.46);
  const clear = glassMaterial();
  const violet = glassMaterial("#a593ff");
  const logo = new Group();
  logo.add(new Mesh(ringGeo, clear), new Mesh(nGeo, violet));
  scene.add(logo);

  scene.add(new AmbientLight(0xffffff, 0.15));
  const key = new DirectionalLight(0xffffff, 2.2);
  key.position.set(4, 6, 5);
  scene.add(key);

  const resize = () => {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const h = 2 * BG_DIST * Math.tan((camera.fov * Math.PI) / 360);
    bg.scale.set(h * camera.aspect * 1.02, h * 1.02, 1);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  // Réaction au pointeur (souris ou doigt), lissée
  const target = { x: 0, y: 0 };
  const onPointer = (e: PointerEvent) => {
    target.x = (e.clientX / window.innerWidth - 0.5) * 0.7;
    target.y = (e.clientY / window.innerHeight - 0.5) * 0.45;
  };
  window.addEventListener("pointermove", onPointer, { passive: true });

  let raf = 0;
  let visible = true;
  let stopped = false;
  const t0 = performance.now();
  // 30 images/s suffisent pour un balancement lent, et divisent le coût par deux.
  const FRAME_MS = 1000 / 30;
  let last = 0;
  // Surveillance permanente PENDANT l'affichage (un canvas invisible ne coûte presque rien, donc
  // on ne juge qu'une fois le verre visible) : intervalle entre images dessinées, par tranches de 1,2 s.
  // Deux tranches d'affilée sous ~18 images/s : le verre s'arrête et le logo SVG reprend sa place.
  let gaps: number[] = [];
  let prevTick = 0;
  let slowWindows = 0;
  let windowStart = 0;
  let readySent = false;
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    if (now - last < FRAME_MS - 2) return;
    last = now;
    // Intervalle entre deux images réellement dessinées (≈ 33 ms attendu à 30 images/s).
    if (watchdog && prevTick) {
      if (!gaps.length) windowStart = prevTick;
      gaps.push(now - prevTick);
      // Tranches de 1,2 s (et non d'un nombre fixe d'images) : la réaction reste rapide même quand c'est lent.
      if (now - windowStart >= 1200 && gaps.length >= 4) {
        const median = [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length / 2)];
        gaps = [];
        slowWindows = median > 55 ? slowWindows + 1 : 0;
        if (slowWindows >= 2) {
          stopped = true;
          pause();
          onTooSlow();
          return;
        }
      }
    }
    prevTick = now;
    const t = (now - t0) / 1000;
    // Balancement lent (un logo plat ne tourne pas sur lui-même : il resterait de profil)
    const ry = Math.sin(t * 0.35) * 0.5 + target.x;
    const rx = Math.sin(t * 0.27) * 0.12 - 0.08 + target.y;
    logo.rotation.y += (ry - logo.rotation.y) * 0.06;
    logo.rotation.x += (rx - logo.rotation.x) * 0.06;
    logo.position.y = Math.sin(t * 0.6) * 0.06;
    // Entrée douce : léger zoom pendant la première seconde
    const s = Math.min(1, 0.9 + t * 0.1);
    logo.scale.setScalar(s);
    bgMat.uniforms.uTime.value = t;
    renderer.render(scene, camera);
    if (!readySent) {
      readySent = true;
      onReady();
    }
  };
  const play = () => {
    if (stopped || raf || !visible || document.hidden) return;
    raf = requestAnimationFrame(loop);
  };
  const pause = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    prevTick = 0; // une pause (onglet caché, hors écran) ne compte pas comme une image lente
    gaps = [];
  };
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) play();
    else pause();
  });
  io.observe(container);
  const onVis = () => (document.hidden ? pause() : play());
  document.addEventListener("visibilitychange", onVis);
  play();

  return () => {
    pause();
    io.disconnect();
    ro.disconnect();
    window.removeEventListener("pointermove", onPointer);
    document.removeEventListener("visibilitychange", onVis);
    ringGeo.dispose();
    nGeo.dispose();
    clear.dispose();
    violet.dispose();
    bgMat.dispose();
    bg.geometry.dispose();
    env.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
}
