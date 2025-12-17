import * as THREE from 'three'
import { MapControls } from 'three/addons/controls/MapControls.js'
import vertexShader from './shaders/vertex.glsl?raw'
import fragmentShader from './shaders/fragment.glsl?raw'

// Créer la scène
const scene = new THREE.Scene()
scene.background = new THREE.Color('#272932')

// Caméra
const width = window.innerWidth
const height = window.innerHeight
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
camera.position.set(0, 10, 10)
camera.lookAt(0, 0, 0)

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(width, height)
document.body.appendChild(renderer.domElement)

// Créer le matériau shader
const shaderMaterial = new THREE.ShaderMaterial({
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  uniforms: {
    uTime: { value: 0.0 },
    uNoiseScale: { value: 0.009 }, // Échelle du bruit (plus petit = plus de détails)
    uNoiseAmplitude: { value: 100.0 } // Amplitude du bruit (hauteur de la déformation)
  }
})

// Créer un plan de 10x10 avec le shader
const geometry = new THREE.PlaneGeometry(100, 100, 1000, 1000)
const plane = new THREE.Mesh(geometry, shaderMaterial)
plane.material.wireframe = true
// Tourner le plan pour qu'il soit horizontal (visible depuis le haut)
plane.rotation.x = -Math.PI / 2
scene.add(plane)

// Ajouter un helper pour les axes
const axesHelper = new THREE.AxesHelper(3)
scene.add(axesHelper)

// Contrôles de la caméra
const controls = new MapControls(camera, renderer.domElement)
controls.enablePan = true
controls.enableRotate = true
controls.enableZoom = true

// Gérer le redimensionnement de la fenêtre
window.addEventListener('resize', () => {
  const newWidth = window.innerWidth
  const newHeight = window.innerHeight
  camera.aspect = newWidth / newHeight
  camera.updateProjectionMatrix()
  renderer.setSize(newWidth, newHeight)
})

// Compteurs de performance
let frameCountForFPS = 0 // Compteur pour calculer le FPS
let lastTime = performance.now()
let fps = 0
const fpsUpdateInterval = 1000 // Mettre à jour le FPS toutes les secondes

// Éléments DOM pour afficher les stats
const fpsElement = document.getElementById('fps')
const frameTimeElement = document.getElementById('frameTime')

// Boucle d'animation
function animate() {
  requestAnimationFrame(animate)
  
  // Mesurer le temps au début du calcul de la frame
  const frameStartTime = performance.now()
  
  // Incrémenter le compteur pour le FPS
  frameCountForFPS++
  
  // Calculer le FPS
  const currentTime = performance.now()
  const deltaTime = currentTime - lastTime
  
  if (deltaTime >= fpsUpdateInterval) {
    fps = Math.round((frameCountForFPS * 1000) / deltaTime)
    frameCountForFPS = 0
    lastTime = currentTime
    
    // Mettre à jour l'affichage du FPS
    if (fpsElement) fpsElement.textContent = fps.toString()
  }
  
  // Mettre à jour le temps pour l'animation du shader
  shaderMaterial.uniforms.uTime.value += 0.01
  
  controls.update()
  renderer.render(scene, camera)
  
  // Mesurer le temps à la fin du calcul et calculer le temps de calcul de la frame
  const frameEndTime = performance.now()
  const frameTime = frameEndTime - frameStartTime
  
  // Mettre à jour l'affichage du temps de frame (arrondi à 2 décimales)
  if (frameTimeElement) frameTimeElement.textContent = frameTime.toFixed(2)
}

animate()
