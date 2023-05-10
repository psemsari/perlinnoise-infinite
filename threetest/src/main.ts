import './style.css'
import * as THREE from 'three';
import * as SN from 'simplex-noise';

const width = window.innerWidth
const height = window.innerHeight

const scene = new THREE.Scene();
scene.background = new THREE.Color('#272932')
const camera = new THREE.PerspectiveCamera( 75, width / height, 1, 2000);

const renderer = new THREE.WebGLRenderer();
renderer.autoClear = true
renderer.setSize( width, height );
document.body.appendChild( renderer.domElement );
camera.position.z = 2;
camera.position.y = -10

camera.rotation.x = 0.85

// const vertices = new Float32Array( [
//   1.0,  1.0,  0.0, // v1
//   -1.0, 1.0,  0.0, // v2
//   -1.0, -1.0,  0.0, // v0
// // -1.0, -1.0,  0.0, // v0
// // 1.0, -1.0,  0.0, // v2
// // 1.0,  1.0,  0.0, // v1

// //   -1.0, -1.0,  0.0, // v0
// //   1.0, -1.0,  0.0, // v1
// //   1.0,  1.0,  0.0, // v2

// //   1.0,  1.0,  0.0, // v3
// //  -1.0,  1.0,  0.0, // v4
// //  -1.0, -1.0,  0.0  // v5
// ] );

// const geometry = new THREE.BufferGeometry()//new THREE.BoxGeometry( 1, 1, 1 )//
// geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))

const cols = 100
const rows = 100
const scale = 1

const geometry = new THREE.PlaneGeometry(cols, rows, cols * scale, rows * scale)
const attribute = geometry.getAttribute('position')
const array = attribute.array
let result = new Float32Array(array);

const noise = SN.createNoise2D()

function map_range(value : number, low1 : number, high1: number, low2 : number, high2: number) {
  return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}


// let yoff = 0
// for (let y = 0; y < rows; y++)
// {
//   let xoff = 0
//   for (let x = 0; x < cols; x++)
//   {
//     let i = (y * cols + x) * 3 + 2;
//     result[i] = map_range(noise(xoff, yoff), 0, 1, -1, 1)
//     xoff += 0.1
//   }
//   yoff += 0.1
// }

// for (let i = 0; i < array.length; i++)
// {
//   if ((i + 1) % 3 == 0)
//     result[i] = noise(-0.5, 0.5)
// }
  

let buffer = new THREE.BufferAttribute(result, 3)
geometry.setAttribute('position', buffer)
console.log(geometry, geometry.getAttribute('position'))
const wireframe = new THREE.MeshBasicMaterial( { color: 0x950404, wireframe: true } );
const material = new THREE.MeshStandardMaterial( { color: 0xD8A47F } );
//const material = new THREE.MeshDepthMaterial({ color: 0xffffff, wireframe: true })
const cube = new THREE.Mesh( geometry, material );
const cubewireframe = new THREE.Mesh( geometry, wireframe );
scene.add( cube, cubewireframe );

const light = new THREE.PointLight(0xffffff)
light.position.set(-15,-5,10)
scene.add(light)

cube.rotation.y += 0
//cube.rotation.y += 0.4
const axesHelper = new THREE.AxesHelper( );
scene.add( axesHelper );

let flying = 0

function animate() {
  setTimeout( function() {
    requestAnimationFrame( animate );
  }, 1000 / 60 );
  flying -= 0.003
  let yoff = flying
  for (let y = 0; y < rows; y++)
  {
    let xoff = flying
    for (let x = 0; x < cols; x++)
    {
      let i = (y * cols + x) * 3 + 2;
      result[i] = map_range(noise(xoff, yoff), 0, 1, -1, 1)
      xoff += 0.1
    }
    yoff += 0.1
  }
  let buffer = new THREE.BufferAttribute(result, 3)
  geometry.setAttribute('position', buffer)
	renderer.render( scene, camera );
}
animate();