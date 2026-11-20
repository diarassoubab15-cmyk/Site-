/**
 * Scène 3D de la bannière d'accueil (Three.js), chargée uniquement à la demande.
 * Un cube noir mat aux arêtes fines, éclairé par une lueur violette, qui tourne lentement
 * et s'oriente vers le pointeur. Aucun modèle ni texture à télécharger : tout est généré.
 * Économies : 1 objet, 2 lumières, pas d'ombres ni de post-traitement, densité de pixels ≤ 1,5,
 * rendu en pause hors écran ou onglet caché, ressources libérées au démontage.
 */
import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";

export function mountHeroScene(container: HTMLElement, onReady: () => void): () => void {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  } catch {
    return () => {}; // WebGL indisponible : le cube CSS reste affiché
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0, 7);

  const group = new Group();
  const box = new BoxGeometry(2, 2, 2);
  const mat = new MeshStandardMaterial({ color: new Color("#0b0c0e"), roughness: 0.42, metalness: 0.55 });
  const cube = new Mesh(box, mat);
  const edgesGeo = new EdgesGeometry(box);
  const edgesMat = new LineBasicMaterial({ color: new Color("#4a4f55"), transparent: true, opacity: 0.9 });
  const edges = new LineSegments(edgesGeo, edgesMat);
  edges.scale.setScalar(1.002);
  group.add(cube, edges);
  group.rotation.set(-0.42, 0.6, 0);
  scene.add(group);

  scene.add(new AmbientLight(0xffffff, 0.35));
  const key = new DirectionalLight(0xdfe6ff, 1.1);
  key.position.set(3, 4, 5);
  const rim = new DirectionalLight(0x9281f7, 1.6); // lueur violette de la charte
  rim.position.set(-5, -1, -2);
  scene.add(key, rim);

  // Taille
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

  // Réaction au pointeur (souris ou doigt), lissée
  const target = { x: 0, y: 0 };
  const onPointer = (e: PointerEvent) => {
    target.x = (e.clientX / window.innerWidth - 0.5) * 0.6;
    target.y = (e.clientY / window.innerHeight - 0.5) * 0.4;
  };
  window.addEventListener("pointermove", onPointer, { passive: true });

  // Boucle de rendu, uniquement quand c'est visible
  let raf = 0;
  let visible = true;
  let last = performance.now();
  let spin = 0;
  let first = true;
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    spin += dt * 0.22;
    group.rotation.y = 0.6 + spin + target.x;
    group.rotation.x += (-0.42 + target.y - group.rotation.x) * 0.06;
    renderer.render(scene, camera);
    if (first) {
      first = false;
      onReady();
    }
    raf = requestAnimationFrame(loop);
  };
  const play = () => {
    if (raf || !visible || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  };
  const pause = () => {
    cancelAnimationFrame(raf);
    raf = 0;
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
    box.dispose();
    edgesGeo.dispose();
    mat.dispose();
    edgesMat.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
}
