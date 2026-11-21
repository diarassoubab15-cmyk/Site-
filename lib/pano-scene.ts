/**
 * Visionneuse 360° (Three.js), chargée seulement à l'ouverture de la visite.
 * Une photo équirectangulaire (2:1) est plaquée à l'intérieur d'une sphère ; on regarde autour
 * en glissant, on zoome en pinçant ou à la molette. Une seule pièce en mémoire à la fois.
 */
import { MathUtils, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, SphereGeometry, SRGBColorSpace, Texture, TextureLoader, Vector3, WebGLRenderer } from "three";

export type PanoHandle = { show: (url: string) => Promise<void>; dispose: () => void };

export function mountPano(container: HTMLElement, onInteract?: () => void): PanoHandle | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
  } catch {
    return null; // pas de WebGL : la visite s'affiche à plat
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = SRGBColorSpace;
  container.appendChild(renderer.domElement);
  renderer.domElement.style.touchAction = "none";

  const scene = new Scene();
  const camera = new PerspectiveCamera(75, 1, 0.1, 1100);
  const geometry = new SphereGeometry(500, 60, 40);
  geometry.scale(-1, 1, 1); // on regarde l'intérieur de la sphère
  const material = new MeshBasicMaterial();
  scene.add(new Mesh(geometry, material));
  const loader = new TextureLoader();
  loader.setCrossOrigin("anonymous");
  let texture: Texture | null = null;

  let lon = 0, lat = 0, fov = 75;
  let auto = true;
  let idleTimer = 0;
  const pointers = new Map<number, { x: number; y: number }>();
  let pinchStart = 0, fovStart = fov;

  const interact = () => {
    auto = false;
    onInteract?.();
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => (auto = true), 6000);
  };
  const onDown = (e: PointerEvent) => {
    renderer.domElement.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchStart = Math.hypot(a.x - b.x, a.y - b.y);
      fovStart = fov;
    }
    interact();
  };
  const onMove = (e: PointerEvent) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchStart) fov = MathUtils.clamp(fovStart * (pinchStart / d), 30, 90);
      return;
    }
    const k = fov / 75 * 0.12;
    lon -= (e.clientX - prev.x) * k;
    lat += (e.clientY - prev.y) * k;
  };
  const onUp = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchStart = 0;
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    fov = MathUtils.clamp(fov + e.deltaY * 0.04, 30, 90);
    interact();
  };
  const onKey = (e: KeyboardEvent) => {
    const step = { ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, 6], ArrowDown: [0, -6] }[e.key];
    if (step) { lon += step[0]; lat += step[1]; interact(); }
    if (e.key === "+" || e.key === "=") { fov = Math.max(30, fov - 6); interact(); }
    if (e.key === "-") { fov = Math.min(90, fov + 6); interact(); }
  };
  const el = renderer.domElement;
  el.addEventListener("pointerdown", onDown);
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerup", onUp);
  el.addEventListener("pointercancel", onUp);
  el.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKey);

  const resize = () => {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  const target = new Vector3();
  let raf = 0;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    if (document.hidden) return;
    if (auto) lon += 0.04;
    lat = MathUtils.clamp(lat, -85, 85);
    const phi = MathUtils.degToRad(90 - lat), theta = MathUtils.degToRad(lon);
    target.set(500 * Math.sin(phi) * Math.cos(theta), 500 * Math.cos(phi), 500 * Math.sin(phi) * Math.sin(theta));
    camera.lookAt(target);
    if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
    renderer.render(scene, camera);
  };
  loop();

  return {
    show: (url) =>
      new Promise((resolve, reject) => {
        loader.load(
          url,
          (t) => {
            t.colorSpace = SRGBColorSpace;
            const old = texture;
            texture = t;
            material.map = t;
            material.needsUpdate = true;
            old?.dispose();
            lon = 0; lat = 0; fov = 75;
            resolve();
          },
          undefined,
          () => reject(new Error("Panorama introuvable")),
        );
      }),
    dispose: () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(idleTimer);
      ro.disconnect();
      window.removeEventListener("keydown", onKey);
      texture?.dispose();
      material.dispose();
      geometry.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      el.remove();
    },
  };
}
