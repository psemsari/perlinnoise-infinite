import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0a0a0);
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 100);
camera.position.set(0, 15, 15);
camera.lookAt(0,0,0);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const axesHelper = new THREE.AxesHelper(10);
scene.add(axesHelper);

// Camera controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.update();

// Lights
scene.add(new THREE.AmbientLight(0xffffff,0.6));
const dirLight = new THREE.DirectionalLight(0xffffff,0.8); 
dirLight.position.set(10,20,10); 
scene.add(dirLight);

// =========================
//   ROUTE
// =========================

const roadPoints: THREE.Vector2[] = [
  new THREE.Vector2(-10, -4),  // x, z
  new THREE.Vector2(-8, -3),   // x, z
  new THREE.Vector2(-6, -2),   // x, z
  new THREE.Vector2(-4, -1),   // x, z
  new THREE.Vector2(-3, 0),    // x, z
  new THREE.Vector2(-1, 1),    // x, z
  new THREE.Vector2(0, 2),     // x, z
  new THREE.Vector2(1.5, 1.5), // x, z
  new THREE.Vector2(3, 1),     // x, z
  new THREE.Vector2(4.5, 0),   // x, z
  new THREE.Vector2(6, -1),    // x, z
  new THREE.Vector2(7, -2),    // x, z
  new THREE.Vector2(8, -3),    // x, z
  new THREE.Vector2(9, -4),    // x, z
  new THREE.Vector2(10, -5)    // x, z
];

const roadWidth = 2;
const halfRoadWidth = roadWidth / 2;

// Utils math
function getDirection(a: THREE.Vector2, b: THREE.Vector2): THREE.Vector2 {
  return new THREE.Vector2().subVectors(b, a).normalize();
}

function getPerpendicular(dir: THREE.Vector2): THREE.Vector2 {
  return new THREE.Vector2(-dir.y, dir.x);
}

// Calcul des directions
const directions: THREE.Vector2[] = [];

for (let i = 0; i < roadPoints.length; i++) {
  if (i === 0) {
    directions.push(getDirection(roadPoints[i], roadPoints[i + 1]));
  } else if (i === roadPoints.length - 1) {
    directions.push(getDirection(roadPoints[i - 1], roadPoints[i]));
  } else {
    const dirPrev = getDirection(roadPoints[i - 1], roadPoints[i]);
    const dirNext = getDirection(roadPoints[i], roadPoints[i + 1]);

    const avgDir = new THREE.Vector2()
      .addVectors(dirPrev, dirNext)
      .normalize();

    directions.push(avgDir);
  }
}

// Vertices gauche / droite
const roadVertices: THREE.Vector3[] = [];
const roadHeight = 0; // Hauteur de la route au-dessus du plan

for (let i = 0; i < roadPoints.length; i++) {
  const normal = getPerpendicular(directions[i]);

  const left = new THREE.Vector3(
    roadPoints[i].x + normal.x * halfRoadWidth,
    roadHeight,
    roadPoints[i].y + normal.y * halfRoadWidth
  );

  const right = new THREE.Vector3(
    roadPoints[i].x - normal.x * halfRoadWidth,
    roadHeight,
    roadPoints[i].y - normal.y * halfRoadWidth
  );

  roadVertices.push(left, right);
}

// Triangles (indices)
const roadIndices: number[] = [];

for (let i = 0; i < roadPoints.length - 1; i++) {
  const i0 = i * 2;
  const i1 = i * 2 + 1;
  const i2 = i * 2 + 2;
  const i3 = i * 2 + 3;

  // triangle 1
  roadIndices.push(i0, i2, i1);
  // triangle 2
  roadIndices.push(i2, i3, i1);
}

// Buffer Geometry
const roadGeometry = new THREE.BufferGeometry();

const roadPositionArray = new Float32Array(roadVertices.length * 3);

roadVertices.forEach((v, i) => {
  roadPositionArray[i * 3 + 0] = v.x;
  roadPositionArray[i * 3 + 1] = v.y;
  roadPositionArray[i * 3 + 2] = v.z;
});

roadGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(roadPositionArray, 3)
);

roadGeometry.setIndex(roadIndices);
roadGeometry.computeVertexNormals();

// Road Mesh
const roadMaterial = new THREE.MeshStandardMaterial({
  color: 0x404040,
  side: THREE.DoubleSide,
  wireframe: true
});

const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
scene.add(roadMesh);

// =========================
//   PLAN avec vertices qui se baissent près de la route
// =========================

const planeSize = 20;
const planeSegments = 20;
const planeVertices: THREE.Vector3[] = [];
const planeIndices: number[] = [];

// Créer les vertices du plan
for (let i = 0; i <= planeSegments; i++) {
  for (let j = 0; j <= planeSegments; j++) {
    const x = -planeSize / 2 + (planeSize * i) / planeSegments;
    const z = -planeSize / 2 + (planeSize * j) / planeSegments;
    planeVertices.push(new THREE.Vector3(x, 0, z));
  }
}

// Fonction pour calculer la distance minimale d'un point à la route (dans le plan XZ)
function getMinDistanceToRoad(point: THREE.Vector3): number {
  let minDist = Infinity;
  
  for (let i = 0; i < roadPoints.length - 1; i++) {
    // Points du segment de route dans le plan XZ
    const p1 = new THREE.Vector2(roadPoints[i].x, roadPoints[i].y);
    const p2 = new THREE.Vector2(roadPoints[i + 1].x, roadPoints[i + 1].y);
    const point2D = new THREE.Vector2(point.x, point.z);
    
    // Vecteur du segment
    const line = new THREE.Vector2().subVectors(p2, p1);
    const pointToP1 = new THREE.Vector2().subVectors(point2D, p1);
    const lineLengthSq = line.lengthSq();
    
    if (lineLengthSq > 0) {
      // Projection du point sur le segment
      const t = Math.max(0, Math.min(1, pointToP1.dot(line) / lineLengthSq));
      const closestPoint = p1.clone().add(line.multiplyScalar(t));
      const dist = point2D.distanceTo(closestPoint);
      minDist = Math.min(minDist, dist);
    }
  }
  
  return minDist;
}

// Ajuster la hauteur Y des vertices en fonction de la distance à la route
const depressionRadius = 3; // Rayon d'influence de la route
const maxDepression = 0.5; // Profondeur maximale de la dépression

planeVertices.forEach(vertex => {
  const distToRoad = getMinDistanceToRoad(vertex);
  
  if (distToRoad < depressionRadius) {
    // Interpolation smoothstep pour une transition douce
    const t = 1 - (distToRoad / depressionRadius);
    const smoothT = t * t * (3 - 2 * t);
    vertex.y = -maxDepression * smoothT;
  }
});

// Créer les faces du plan
for (let i = 0; i < planeSegments; i++) {
  for (let j = 0; j < planeSegments; j++) {
    const a = i * (planeSegments + 1) + j;
    const b = i * (planeSegments + 1) + j + 1;
    const c = (i + 1) * (planeSegments + 1) + j;
    const d = (i + 1) * (planeSegments + 1) + j + 1;
    
    planeIndices.push(a, b, c);
    planeIndices.push(b, d, c);
  }
}

// Créer la géométrie du plan
const planeGeometry = new THREE.BufferGeometry();
const planePositionArray = new Float32Array(planeVertices.length * 3);

planeVertices.forEach((v, i) => {
  planePositionArray[i * 3 + 0] = v.x;
  planePositionArray[i * 3 + 1] = v.y;
  planePositionArray[i * 3 + 2] = v.z;
});

planeGeometry.setAttribute('position', new THREE.BufferAttribute(planePositionArray, 3));
planeGeometry.setIndex(planeIndices);
planeGeometry.computeVertexNormals();

const planeMaterial = new THREE.MeshStandardMaterial({color: "grey", wireframe: true});
const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
scene.add(planeMesh);

// Render loop
function animate(){ 
    requestAnimationFrame(animate); 
    controls.update();
    renderer.render(scene,camera);
}
animate();
