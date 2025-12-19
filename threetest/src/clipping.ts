import * as THREE from 'three';

// --- Scène et caméra ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 3;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// --- Quad initial ---
let vertices = new Float32Array([
    -0.5, -0.5, 0,  // 0
     0.5,  0.5, 0,  // 2
    -0.5,  0.5, 0   // 3
]);

let indices = new Uint16Array([
    0, 1, 2
]);

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
geometry.setIndex(new THREE.BufferAttribute(indices, 1));

const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
const quad = new THREE.Mesh(geometry, material);
scene.add(quad);

// --- Fonction pour supprimer le premier vertex ---
function removeVertex(indexToRemove: number) {
    console.log('removeVertex', indexToRemove);
    
    vertices = new Float32Array([
        -0.5, -0.5, 0,  // 0
         0.5,  0.5, 0,  // 2
        -0.5,  0.5, 0   // 3
    ]);
    
    indices = new Uint16Array([
        0, 2, 3
    ]);

    // Supprimer l'ancien attribut et l'index
    geometry.deleteAttribute('position');
    geometry.setIndex(null);
    
    // Créer les nouveaux attributs
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    
}

// --- Animation ---
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

// --- Input clavier ---
let vertexRemoved = false;
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !vertexRemoved) {
        removeVertex(1); // supprime le vertex 1
        vertexRemoved = true;
    }
});

// --- Resize ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight);
});
