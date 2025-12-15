import * as THREE from 'three'
import { MapControls } from 'three/addons/controls/MapControls.js'

export function createScene(cube: THREE.Mesh, cubewireframe: THREE.Mesh) {
  const width = window.innerWidth
  const height = window.innerHeight

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#272932')

  const camera = new THREE.PerspectiveCamera(100, width / height, 1, 2000)

  const renderer = new THREE.WebGLRenderer()
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.autoClear = true
  renderer.setSize(width, height)
  document.body.appendChild(renderer.domElement)

  // Position camera at an angle to view the terrain from above
  camera.position.set(10, 10, 10)

  // Lights
  const ambientlight = new THREE.AmbientLight(0xffffff)
  scene.add(ambientlight)

  const light = new THREE.DirectionalLight()
  light.position.set(40, 30, 0)
  light.target = cube
  scene.add(light)

  // Helpers
  const axesHelper = new THREE.AxesHelper(5)
  scene.add(axesHelper)

  // Add meshes to the scene
  scene.add(cube, cubewireframe)

  // Camera controls
  const controls = new MapControls(camera, renderer.domElement)

  controls.mouseButtons = {
    LEFT: THREE.MOUSE.PAN,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.ROTATE,
  }

  controls.keys = {
    LEFT: 'ArrowLeft',
    UP: 'ArrowUp',
    RIGHT: 'ArrowRight',
    BOTTOM: 'ArrowDown',
  }

  controls.enablePan = true
  controls.enableRotate = true
  controls.enableZoom = true
  controls.screenSpacePanning = false
  controls.update()

  return {
    scene,
    camera,
    renderer,
    controls,
    light,
    axesHelper,
  }
}


