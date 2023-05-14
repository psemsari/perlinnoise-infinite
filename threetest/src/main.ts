import './style.css'
import * as THREE from 'three';
import * as SN from 'simplex-noise';
import { MapControls } from 'three/addons/controls/MapControls.js';

const width = window.innerWidth
const height = window.innerHeight

const scene = new THREE.Scene();
scene.background = new THREE.Color('#272932')
const camera = new THREE.PerspectiveCamera( 100, width / height, 1, 2000);
const renderer = new THREE.WebGLRenderer();
renderer.autoClear = true
renderer.setSize( width, height );
document.body.appendChild( renderer.domElement );
camera.position.z = 10;
camera.position.y = 10;
camera.position.x = 10;

const pwidth = 100
const pheight = 100
const cols = 100
const rows = 100
const count_xvertice = cols + 1
const zoffset = 2
const count_coord = 3

const geometry = new THREE.PlaneGeometry(pwidth, pheight, cols, rows)
const attribute = geometry.getAttribute('position')
const array = attribute.array
let result = new Float32Array(array);
const noise = SN.createNoise2D()

function map_range(value : number, low1 : number, high1: number, low2 : number, high2: number) {
  return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}
  

let buffer = new THREE.BufferAttribute(result, 3)
geometry.setAttribute('position', buffer)
console.log(geometry, geometry.getAttribute('position'))
const wireframe = new THREE.MeshBasicMaterial( { color: 0x950404, wireframe: true, visible: false } );
const material = new THREE.MeshStandardMaterial( { color: 0xD8A47F, visible: true } );
//const material = new THREE.MeshDepthMaterial({ color: 0xffffff, wireframe: true })
const cube = new THREE.Mesh( geometry, material );
const cubewireframe = new THREE.Mesh( geometry, wireframe );
cubewireframe.rotation.x = -Math.PI / 2 //https://www.alloprof.qc.ca/fr/eleves/bv/mathematiques/les-angles-trigonometriques-radians-m1469
cube.rotation.x = -Math.PI / 2
scene.add( cube, cubewireframe );

// const light = new THREE.PointLight(0xffffff)
// light.position.set(-10,10,5)
// scene.add(light)

// const pointLightHelper = new THREE.PointLightHelper( light );
// scene.add( pointLightHelper );

const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
scene.add( directionalLight );


const axesHelper = new THREE.AxesHelper( 5 );
scene.add( axesHelper );

const controls = new MapControls( camera, renderer.domElement );
controls.mouseButtons = {
	LEFT: THREE.MOUSE.PAN,
	MIDDLE: THREE.MOUSE.DOLLY,
	RIGHT: THREE.MOUSE.ROTATE
}

controls.keys = {
	LEFT: 'ArrowLeft', //left arrow
	UP: 'ArrowUp', // up arrow
	RIGHT: 'ArrowRight', // right arrow
	BOTTOM: 'ArrowDown' // down arrow
}

controls.enablePan = true
controls.enableRotate = true
controls.enableZoom = true

controls.screenSpacePanning = false;

controls.update()

let flying = 0
let rowsmax = 1
noise_map()
animate()

function animate() {
  setTimeout( function() {
    requestAnimationFrame( animate );
  }, 1000 / 60 );


  renderer.render( scene, camera );
}

function noise_map()
{
  flying -= 0.01
  let yoff = flying
  for (let y = 0; y <= rows; y++)
  {
    let xoff = 0
    for (let x = 0; x <= cols; x++)
    {
      let i = (y * count_xvertice * count_coord) + (x * count_coord) + zoffset;
      result[i] = map_range(noise(xoff, yoff), 0, 1, -10, 0)
      xoff += 0.015
    }
    yoff += 0.015
  }
  let buffer = new THREE.BufferAttribute(result, 3)
  geometry.setAttribute('position', buffer)
  if (rowsmax < 100)
    rowsmax++;
}