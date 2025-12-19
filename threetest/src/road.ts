import * as THREE from "three";
import { MapControls } from "three/examples/jsm/controls/MapControls.js";

/* =========================
   SCÈNE BASIQUE
========================= */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

// Caméra
const width = window.innerWidth
const height = window.innerHeight
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
camera.position.set(0, 10, 10);
camera.lookAt(0, 0, 0);
// Ajouter un helper pour les axes
const axesHelper = new THREE.AxesHelper(3)
scene.add(axesHelper)

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(width, height)
document.body.appendChild(renderer.domElement)

// Contrôles de la caméra
const controls = new MapControls(camera, renderer.domElement)
controls.enablePan = true
controls.enableRotate = true
controls.enableZoom = true

/* =========================
   DONNÉES ROUTE
========================= */

const points: THREE.Vector2[] = [
  new THREE.Vector2(-6, -2),  // x, z
  new THREE.Vector2(0, 2),    // x, z
  new THREE.Vector2(6, -1)    // x, z
];

const roadWidth = 1;
const halfWidth = roadWidth / 2;

/* =========================
   UTILS MATH
========================= */

function getDirection(a: THREE.Vector2, b: THREE.Vector2): THREE.Vector2 {
  return new THREE.Vector2().subVectors(b, a).normalize();
}

function getPerpendicular(dir: THREE.Vector2): THREE.Vector2 {
  return new THREE.Vector2(-dir.y, dir.x);
}

/* =========================
   CALCUL DES DIRECTIONS
========================= */

const directions: THREE.Vector2[] = [];

for (let i = 0; i < points.length; i++) {
  if (i === 0) {
    directions.push(getDirection(points[i], points[i + 1]));
  } else if (i === points.length - 1) {
    directions.push(getDirection(points[i - 1], points[i]));
  } else {
    const dirPrev = getDirection(points[i - 1], points[i]);
    const dirNext = getDirection(points[i], points[i + 1]);

    const avgDir = new THREE.Vector2()
      .addVectors(dirPrev, dirNext)
      .normalize();

    directions.push(avgDir);
  }
}

/* =========================
   VERTICES GAUCHE / DROITE
========================= */

const vertices: THREE.Vector3[] = [];

for (let i = 0; i < points.length; i++) {
  const normal = getPerpendicular(directions[i]);

  const left = new THREE.Vector3(
    points[i].x + normal.x * halfWidth,
    0,
    points[i].y + normal.y * halfWidth
  );

  const right = new THREE.Vector3(
    points[i].x - normal.x * halfWidth,
    0,
    points[i].y - normal.y * halfWidth
  );

  vertices.push(left, right);
}

/* =========================
   TRIANGLES (INDICES)
========================= */

const indices: number[] = [];

for (let i = 0; i < points.length - 1; i++) {
  const i0 = i * 2;
  const i1 = i * 2 + 1;
  const i2 = i * 2 + 2;
  const i3 = i * 2 + 3;

  // triangle 1
  indices.push(i0, i2, i1);
  // triangle 2
  indices.push(i2, i3, i1);
}

/* =========================
   BUFFER GEOMETRY
========================= */

const geometry = new THREE.BufferGeometry();

const positionArray = new Float32Array(vertices.length * 3);

vertices.forEach((v, i) => {
  positionArray[i * 3 + 0] = v.x;
  positionArray[i * 3 + 1] = v.y;
  positionArray[i * 3 + 2] = v.z;
});

geometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positionArray, 3)
);

geometry.setIndex(indices);
geometry.computeVertexNormals();

/* =========================
   MESH
========================= */

const material = new THREE.MeshStandardMaterial({
  color: 0x404040,
  side: THREE.DoubleSide
});

const roadMesh = new THREE.Mesh(geometry, material);
roadMesh.material.wireframe = true;
scene.add(roadMesh);

/* =========================
   DEBUG VISUEL (OPTIONNEL)
========================= */

// points
points.forEach(p => {
  const g = new THREE.CircleGeometry(0.05, 16);
  const m = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const d = new THREE.Mesh(g, m);
  d.rotation.x = -Math.PI / 2;  // Rotation pour mettre la face en haut
  d.position.set(p.x, 0.01, p.y);  // x, y (petit offset), z
  scene.add(d);
});

// lumière
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 10);
scene.add(light);

/* =========================
   RENDER LOOP
========================= */

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();
