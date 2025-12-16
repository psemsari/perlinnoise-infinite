import * as THREE from 'three'
import * as SN from 'simplex-noise'
import { noiseParams } from './noiseParams'

// Base terrain grid configuration (serves as reference size, UI scales from here)
let count_xvertice = noiseParams.cols + 1 // Number of vertices per row (cols + 1 for edges)
const zoffset = 2   // Index offset to access Z coordinate in vertex array (x=0, y=1, z=2)
const count_coord = 3 // Number of coordinates per vertex (x, y, z)

// Create a plane geometry that will be deformed into terrain
const geometry = new THREE.PlaneGeometry(noiseParams.planeWidth, noiseParams.planeHeight, noiseParams.cols, noiseParams.rows)
const attribute = geometry.getAttribute('position')
const array = attribute.array as Float32Array
let result = new Float32Array(array)

// Bruit 3D (remplace le bruit 2D précédent)
const noise3D = SN.createNoise3D()
const noise = SN.createNoise2D()

// Height thresholds / colors
const phase_color = {
  water : new THREE.Color(0x00B09B), // Teal for water (deepest areas)
  grass : new THREE.Color(0xAECC6F), // Green for grass (low areas)
  grey  : new THREE.Color(0x80583E), // Brown for rock/ground (mid elevation)
  snow  : new THREE.Color(0xFFFFFF), // White for snow (highest peaks)
}

// Initialize color array (same size as position array, RGB per vertex)
let color = new Float32Array(attribute.array as Float32Array)

// Initialize buffer attribute with vertex positions
let buffer = new THREE.BufferAttribute(result, 3)
geometry.setAttribute('position', buffer)

// Materials and meshes
const wireframe = new THREE.MeshBasicMaterial({ color: 0x950404, wireframe: true, visible: true })
const material = new THREE.MeshLambertMaterial({ visible: true, vertexColors: true })

const cube = new THREE.Mesh(geometry, material)
const cubewireframe = new THREE.Mesh(geometry, wireframe)

// Rotate plane 90 degrees around X-axis to lay flat
cube.rotation.x = -Math.PI / 2
cubewireframe.rotation.x = -Math.PI / 2

function applyParamsToTerrain() {
  // Visibilité du wireframe
  cubewireframe.visible = noiseParams.showWireframe

  // Mise à l'échelle du terrain selon les paramètres de largeur/hauteur
  //cube.geometry = new THREE.PlaneGeometry(noiseParams.planeWidth, noiseParams.planeHeight, noiseParams.cols, noiseParams.rows)
  //cubewireframe.geometry = new THREE.PlaneGeometry(noiseParams.planeWidth, noiseParams.planeHeight, noiseParams.cols, noiseParams.rows)

}

// Appliquer les paramètres initiaux
applyParamsToTerrain()

cube.receiveShadow = true
cube.geometry.computeVertexNormals()
cube.geometry.normalizeNormals()

// Animation state (offset for noise animation – "flying" effect)
let flying = 0
let rowsmax = 1

export function resetFlying() {
  flying = 0
}

// Permet de mettre à jour le terrain (wireframe + taille) depuis l'extérieur (UI)
export function updateTerrainFromParams() {
  applyParamsToTerrain()
}

/**
 * Maps a value from one range to another
 */
function map_range(value: number, low1: number, high1: number, low2: number, high2: number) {
  return low2 + (high2 - low2) * (value - low1) / (high1 - low1)
}

/**
 * FBM 3D (Fractal Brownian Motion) basé sur simplex-noise
 * Combine plusieurs octaves de bruit avec fréquence croissante et amplitude décroissante.
 */
function fbm3D(x: number, y: number, z: number): number {
  let total = 0
  let amplitude = 1
  let maxAmplitude = 0

  // On part des échelles de bruit de base et on les augmente avec la lacunarité
  let freqX = noiseParams.noiseScaleX
  let freqY = noiseParams.noiseScaleY
  let freqZ = noiseParams.noiseScaleX // on peut réutiliser l'échelle X pour Z

  const octaves = Math.max(1, Math.min(Math.floor(noiseParams.fbmOctaves), noiseParams.fbmOctavesParams.length))

  for (let i = 0; i < octaves; i++) {
    const octaveParams = noiseParams.fbmOctavesParams[i]

    if (octaveParams.enabled) {
      const value = noise3D(x * freqX, y * freqY, z * freqZ) // simplex-noise retourne ~[-1, 1]
      total += value * amplitude
      maxAmplitude += amplitude
    }

    // Appliquer les paramètres globaux + par-octave pour la prochaine itération
    amplitude *= noiseParams.fbmGain * octaveParams.gain
    freqX *= noiseParams.fbmLacunarity * octaveParams.lacunarity
    freqY *= noiseParams.fbmLacunarity * octaveParams.lacunarity
    freqZ *= noiseParams.fbmLacunarity * octaveParams.lacunarity
  }

  // Normaliser le résultat du FBM dans [0, 1]
  return maxAmplitude > 0 ? map_range(total, -maxAmplitude, maxAmplitude, 0, 1) : 0.5
}

/**
 * Generates and updates terrain using simplex noise
 * Creates animated terrain by continuously shifting the noise sampling position
 */
function noise_map() {
  // Mettre à jour l'offset de vol si l'animation est activée
  if (noiseParams.animate) {
    flying += noiseParams.flyingSpeed
  }
  let yoff = noiseParams.yOffset // décalage de base en Y

  // Iterate through all vertices in the grid
  for (let y = 0; y <= noiseParams.rows; y++) {
    let xoff = 0 // Reset X offset for each row
    for (let x = 0; x <= noiseParams.cols; x++) {
      // Calculate index for Z coordinate (height) in the vertex array
      let i = (y * count_xvertice * count_coord) + (x * count_coord) + zoffset

      // Sample noise 3D (simple ou FBM) à la position courante
      const baseValue = noiseParams.useFBM
        ? fbm3D(xoff, yoff, flying)
        : map_range(noise3D(xoff, yoff, flying), 0, 1, noiseParams.heightMin, noiseParams.heightMax) // normaliser le bruit simple dans [0,1]

      // Mapper la valeur normalisée [0,1] vers la plage de hauteurs désirée
      const height = baseValue
      result[i] = height

      // Calculate index for color coordinates (X, Y, Z of vertex)
      i = (y * count_xvertice * count_coord) + (x * count_coord)

      // Base color for all vertices
      color[i] = phase_color.water.r
      color[i + 1] = phase_color.water.g
      color[i + 2] = phase_color.water.b

      // Increment X offset for next column (controls noise scale)
      xoff += noiseParams.noiseScaleX
    }
    // Increment Y offset for next row
    yoff += noiseParams.noiseScaleY
  }

  // Update geometry with new vertex positions (heights)
  let positionBuffer = new THREE.BufferAttribute(result, 3)
  geometry.setAttribute('position', positionBuffer)

  // Update geometry with new vertex colors
  let colorBuffer = new THREE.BufferAttribute(color, 3)
  geometry.setAttribute('color', colorBuffer)

  // Recalculate normals for proper lighting after geometry changes
  geometry.computeVertexNormals()
  geometry.normalizeNormals()

  if (rowsmax < 100) {
    rowsmax++
  }
}

export { geometry, cube, cubewireframe, noise_map }


