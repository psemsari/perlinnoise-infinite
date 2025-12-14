// Import CSS styles and Three.js libraries
import './style.css'
import * as THREE from 'three';
import * as SN from 'simplex-noise'; // Simplex noise for generating terrain height maps
import { MapControls } from 'three/addons/controls/MapControls.js';

// Get viewport dimensions for full-screen rendering
const width = window.innerWidth
const height = window.innerHeight

// Initialize Three.js scene with dark background
const scene = new THREE.Scene();
scene.background = new THREE.Color('#272932')
// Create perspective camera with wide field of view (100 degrees)
// Near plane: 1, Far plane: 2000 (defines render distance)
const camera = new THREE.PerspectiveCamera( 100, width / height, 1, 2000);
// Create WebGL renderer with shadow mapping enabled
const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true // Enable shadow rendering
renderer.shadowMap.type = THREE.PCFShadowMap // Use Percentage-Closer Filtering for smoother shadows
renderer.autoClear = true // Automatically clear the canvas each frame
renderer.setSize( width, height ); // Set renderer to full window size
document.body.appendChild( renderer.domElement ); // Add canvas to DOM
// Position camera at an angle to view the terrain from above
camera.position.z = 10;
camera.position.y = 10;
camera.position.x = 10;

// Terrain grid configuration
const pwidth = 100  // Physical width of the terrain plane
const pheight = 100 // Physical height of the terrain plane
const cols = 100    // Number of columns (segments) in the grid
const rows = 100    // Number of rows (segments) in the grid
const count_xvertice = cols + 1 // Number of vertices per row (cols + 1 for edges)
const zoffset = 2   // Index offset to access Z coordinate in vertex array (x=0, y=1, z=2)
const count_coord = 3 // Number of coordinates per vertex (x, y, z)

// Create a plane geometry that will be deformed into terrain
// The plane is subdivided into a grid for detailed height variation
const geometry = new THREE.PlaneGeometry(pwidth, pheight, cols, rows)
const attribute = geometry.getAttribute('position') // Get vertex position data
const array = attribute.array // Raw Float32Array of vertex positions
let result = new Float32Array(array); // Copy for manipulation (will store modified Z heights)
const noise = SN.createNoise2D() // Create 2D simplex noise generator

/**
 * Maps a value from one range to another
 * @param value - Input value to map
 * @param low1 - Lower bound of input range
 * @param high1 - Upper bound of input range
 * @param low2 - Lower bound of output range
 * @param high2 - Upper bound of output range
 * @returns Value mapped to output range
 */
function map_range(value : number, low1 : number, high1: number, low2 : number, high2: number) {
  return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

// Initialize buffer attribute with vertex positions
let buffer = new THREE.BufferAttribute(result, 3)
geometry.setAttribute('position', buffer)
console.log(geometry, geometry.getAttribute('position'))
// Create wireframe material (currently hidden, can be toggled for debugging)
const wireframe = new THREE.MeshBasicMaterial( { color: 0x950404, wireframe: true, visible: true } );
// Create standard material that supports vertex colors and lighting
const material = new THREE.MeshStandardMaterial( { visible: true, vertexColors: true } );
//const material = new THREE.MeshDepthMaterial({ color: 0xffffff, wireframe: true })
// Create mesh objects from the geometry
const cube = new THREE.Mesh( geometry, material );
const cubewireframe = new THREE.Mesh( geometry, wireframe );
// Rotate plane 90 degrees around X-axis to lay flat (from vertical to horizontal)
// -Math.PI / 2 = -90 degrees (reference: https://www.alloprof.qc.ca/fr/eleves/bv/mathematiques/les-angles-trigonometriques-radians-m1469)
cubewireframe.rotation.x = -Math.PI / 2
cube.rotation.x = -Math.PI / 2
cube.receiveShadow = true // Allow terrain to receive shadows from lights
cube.geometry.computeVertexNormals() // Calculate normals for proper lighting
cube.geometry.normalizeNormals() // Normalize normals to unit length
scene.add( cube, cubewireframe ); // Add both meshes to the scene

// Add ambient light for overall scene illumination (fills in shadows)
const ambientlight = new THREE.AmbientLight(0xffffff)
scene.add(ambientlight)

// Alternative point light setup (commented out)
// const light = new THREE.PointLight(0xffffff)
// light.position.set(-10,10,5)
// scene.add(light)

// Helper to visualize point light position (commented out)
// const pointLightHelper = new THREE.PointLightHelper( light );
// scene.add( pointLightHelper );

// Add directional light (like sunlight) to create shadows and depth
const light = new THREE.DirectionalLight()
light.position.set(40, 30, 0) // Position light source
light.target = cube // Point light at the terrain
scene.add(light)

// Add axes helper to visualize coordinate system (red=X, green=Y, blue=Z)
const axesHelper = new THREE.AxesHelper( 5 );
scene.add( axesHelper );

// Set up camera controls for interactive navigation
const controls = new MapControls( camera, renderer.domElement );
// Configure mouse button mappings
controls.mouseButtons = {
	LEFT: THREE.MOUSE.PAN,    // Left click: pan the camera
	MIDDLE: THREE.MOUSE.DOLLY, // Middle click: zoom (dolly in/out)
	RIGHT: THREE.MOUSE.ROTATE // Right click: rotate the camera
}

// Configure keyboard controls for camera movement
controls.keys = {
	LEFT: 'ArrowLeft',   // Left arrow: pan left
	UP: 'ArrowUp',       // Up arrow: pan up
	RIGHT: 'ArrowRight', // Right arrow: pan right
	BOTTOM: 'ArrowDown'  // Down arrow: pan down
}

// Enable all control features
controls.enablePan = true    // Allow panning
controls.enableRotate = true // Allow rotation
controls.enableZoom = true   // Allow zooming

// Pan in world space rather than screen space (more natural for terrain viewing)
controls.screenSpacePanning = false;

controls.update() // Initialize controls

// Animation state variables
let flying = 0  // Time offset for noise animation (creates "flying" effect)
let rowsmax = 1 // Counter for progressive rendering (currently unused in final version)

// Paramètres contrôlables du simplex-noise
const noiseParams = {
  flyingSpeed: -0.001,      // Vitesse d'animation (négatif = animation vers l'avant)
  noiseScaleX: 0.015,       // Échelle du bruit sur l'axe X (plus petit = plus de détails)
  noiseScaleY: 0.015,       // Échelle du bruit sur l'axe Y
  heightMin: -10,           // Hauteur minimale du terrain
  heightMax: 0,             // Hauteur maximale du terrain
  yOffset: 0,               // Offset Y initial pour le bruit
  animate: true,            // Activer/désactiver l'animation
}

// Height thresholds for color mapping (terrain elevation zones)
// Heights below these values determine terrain type color
// const height_color = [-14, -8, -6] // Water, Grass, Grey thresholds (actuellement commenté)
const phase_color = {
  water : new THREE.Color(0x00B09B), // Teal for water (deepest areas)
  grass : new THREE.Color(0xAECC6F), // Green for grass (low areas)
  grey : new THREE.Color(0x80583E),   // Brown for rock/ground (mid elevation)
  snow : new THREE.Color(0xFFFFFF),   // White for snow (highest peaks)
}
// Initialize color array (same size as position array, RGB per vertex)
let color = new Float32Array(attribute.array)

// Créer l'interface de contrôle
createControlPanel()

noise_map() // Generate initial terrain
animate()   // Start animation loop

/**
 * Crée un panneau de contrôle avec des sliders pour manipuler les paramètres du simplex-noise
 */
function createControlPanel() {
  // Créer le conteneur principal
  const panel = document.createElement('div')
  panel.id = 'noise-control-panel'
  panel.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(39, 41, 50, 0.95);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 20px;
    color: white;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 14px;
    min-width: 280px;
    max-width: 320px;
    z-index: 1000;
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  `
  
  // Titre du panneau
  const title = document.createElement('h3')
  title.textContent = 'Contrôles Simplex Noise'
  title.style.cssText = `
    margin: 0 0 15px 0;
    font-size: 18px;
    font-weight: 600;
    color: #fff;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 10px;
  `
  panel.appendChild(title)
  
  // Fonction helper pour créer un contrôle slider
  function createSlider(label: string, key: keyof typeof noiseParams, min: number, max: number, step: number = 0.001) {
    const container = document.createElement('div')
    container.style.cssText = 'margin-bottom: 15px;'
    
    const labelEl = document.createElement('label')
    labelEl.textContent = label
    labelEl.style.cssText = `
      display: block;
      margin-bottom: 5px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.8);
    `
    
    const sliderContainer = document.createElement('div')
    sliderContainer.style.cssText = 'display: flex; align-items: center; gap: 10px;'
    
    const slider = document.createElement('input')
    slider.type = 'range'
    slider.min = min.toString()
    slider.max = max.toString()
    slider.step = step.toString()
    const currentValue = noiseParams[key] as number
    slider.value = currentValue.toString()
    slider.style.cssText = `
      flex: 1;
      height: 6px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      outline: none;
      cursor: pointer;
    `
    
    const valueDisplay = document.createElement('span')
    valueDisplay.textContent = currentValue.toFixed(3)
    valueDisplay.style.cssText = `
      min-width: 60px;
      text-align: right;
      font-size: 12px;
      font-family: 'Courier New', monospace;
      color: #AECC6F;
    `
    
    slider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value)
      ;(noiseParams[key] as number) = value
      valueDisplay.textContent = value.toFixed(3)
    })
    
    sliderContainer.appendChild(slider)
    sliderContainer.appendChild(valueDisplay)
    container.appendChild(labelEl)
    container.appendChild(sliderContainer)
    
    return container
  }
  
  // Fonction helper pour créer un contrôle checkbox
  function createCheckbox(label: string, key: keyof typeof noiseParams) {
    const container = document.createElement('div')
    container.style.cssText = 'margin-bottom: 15px; display: flex; align-items: center; gap: 10px;'
    
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.checked = noiseParams[key] as boolean
    checkbox.style.cssText = 'width: 18px; height: 18px; cursor: pointer;'
    
    const labelEl = document.createElement('label')
    labelEl.textContent = label
    labelEl.style.cssText = `
      font-size: 12px;
      color: rgba(255, 255, 255, 0.8);
      cursor: pointer;
      user-select: none;
    `
    
    checkbox.addEventListener('change', (e) => {
      ;(noiseParams[key] as boolean) = (e.target as HTMLInputElement).checked
    })
    
    container.appendChild(checkbox)
    container.appendChild(labelEl)
    
    return container
  }
  
  // Ajouter tous les contrôles
  panel.appendChild(createCheckbox('Animation', 'animate'))
  panel.appendChild(createSlider('Vitesse Animation', 'flyingSpeed', -0.1, 0.1, 0.001))
  panel.appendChild(createSlider('Échelle Bruit X', 'noiseScaleX', 0.001, 0.1, 0.001))
  panel.appendChild(createSlider('Échelle Bruit Y', 'noiseScaleY', 0.001, 0.1, 0.001))
  panel.appendChild(createSlider('Hauteur Min', 'heightMin', -20, 10, 0.5))
  panel.appendChild(createSlider('Hauteur Max', 'heightMax', -10, 20, 0.5))
  panel.appendChild(createSlider('Offset Y', 'yOffset', -10, 10, 0.1))
  
  // Bouton pour réinitialiser
  const resetButton = document.createElement('button')
  resetButton.textContent = 'Réinitialiser'
  resetButton.style.cssText = `
    width: 100%;
    padding: 10px;
    margin-top: 10px;
    background: rgba(148, 4, 4, 0.3);
    border: 1px solid rgba(148, 4, 4, 0.5);
    border-radius: 4px;
    color: white;
    cursor: pointer;
    font-size: 12px;
    transition: background 0.2s;
  `
  resetButton.addEventListener('mouseenter', () => {
    resetButton.style.background = 'rgba(148, 4, 4, 0.5)'
  })
  resetButton.addEventListener('mouseleave', () => {
    resetButton.style.background = 'rgba(148, 4, 4, 0.3)'
  })
  resetButton.addEventListener('click', () => {
    noiseParams.flyingSpeed = -0.001
    noiseParams.noiseScaleX = 0.015
    noiseParams.noiseScaleY = 0.015
    noiseParams.heightMin = -10
    noiseParams.heightMax = 0
    noiseParams.yOffset = 0
    noiseParams.animate = true
    flying = 0
    // Mettre à jour tous les sliders
    const sliders = panel.querySelectorAll('input[type="range"]')
    const checkboxes = panel.querySelectorAll('input[type="checkbox"]')
    const valueDisplays = panel.querySelectorAll('span')
    sliders.forEach((slider, index) => {
      const keys: (keyof typeof noiseParams)[] = ['flyingSpeed', 'noiseScaleX', 'noiseScaleY', 'heightMin', 'heightMax', 'yOffset']
      if (index < keys.length) {
        const value = noiseParams[keys[index]] as number
        ;(slider as HTMLInputElement).value = value.toString()
        valueDisplays[index].textContent = value.toFixed(3)
      }
    })
    ;(checkboxes[0] as HTMLInputElement).checked = noiseParams.animate
  })
  panel.appendChild(resetButton)
  
  // Ajouter le panneau au DOM
  document.body.appendChild(panel)
  
  // Ajouter un bouton pour masquer/afficher le panneau
  const toggleButton = document.createElement('button')
  toggleButton.textContent = '◄'
  toggleButton.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
    background: rgba(39, 41, 50, 0.95);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: white;
    cursor: pointer;
    font-size: 20px;
    z-index: 1001;
    display: none;
  `
  
  let panelVisible = true
  toggleButton.addEventListener('click', () => {
    panelVisible = !panelVisible
    panel.style.display = panelVisible ? 'block' : 'none'
    toggleButton.textContent = panelVisible ? '◄' : '►'
  })
  document.body.appendChild(toggleButton)
}

/**
 * Main animation loop - renders the scene and updates terrain each frame
 * Uses setTimeout to throttle to ~60 FPS (1000ms / 60 = ~16.67ms per frame)
 */
function animate() {
  setTimeout( function() {
    requestAnimationFrame( animate ); // Schedule next frame
  }, 1000 / 60 );
  renderer.render( scene, camera ); // Render the scene
  noise_map() // Update terrain height and colors each frame
}
console.log(cube)

/**
 * Generates and updates terrain using simplex noise
 * Creates animated terrain by continuously shifting the noise sampling position
 */
function noise_map()
{
  // Mettre à jour l'offset de vol si l'animation est activée
  if (noiseParams.animate) {
    flying += noiseParams.flyingSpeed
  }
  let yoff = noiseParams.yOffset + flying // Start Y offset from current flying value
  
  // Iterate through all vertices in the grid
  for (let y = 0; y <= rows; y++)
  {
    let xoff = 0 // Reset X offset for each row
    for (let x = 0; x <= cols; x++)
    {
      // Calculate index for Z coordinate (height) in the vertex array
      // Formula: (row * vertices_per_row * coords_per_vertex) + (col * coords_per_vertex) + z_offset
      let i = (y * count_xvertice * count_coord) + (x * count_coord) + zoffset;
      
      // Sample noise at current position and map to height range using parameters
      // Noise returns [0, 1], we map it to terrain height
      let height = map_range(noise(xoff, yoff), 0, 1, noiseParams.heightMin, noiseParams.heightMax)
      result[i] = height // Store height in Z coordinate
      
      // Calculate index for color coordinates (X, Y, Z of vertex)
      i = (y * count_xvertice * count_coord) + (x * count_coord)
      
      //base color for all vertices
      color[i] = phase_color.water.r
      color[i + 1] = phase_color.water.g
      color[i + 2] = phase_color.water.b

      // Color vertices based on height (biome/terrain type)
      /*if (height < height_color[0]){ // Deep water
        color[i] = phase_color.water.r     // Red component
        color[i + 1] = phase_color.water.g // Green component
        color[i + 2] = phase_color.water.b // Blue component
      }
      else if (height < height_color[1]){ // Grass/land
        color[i] = phase_color.grass.r
        color[i + 1] = phase_color.grass.g
        color[i + 2] = phase_color.grass.b
      }
      else if (height < height_color[2]){ // Rock/mountain
        color[i] = phase_color.grey.r
        color[i + 1] = phase_color.grey.g
        color[i + 2] = phase_color.grey.b
      }
      else { // Snow peaks (highest elevation)
        color[i] = phase_color.snow.r
        color[i + 1] = phase_color.snow.g
        color[i + 2] = phase_color.snow.b
      }*/
      xoff += noiseParams.noiseScaleX // Increment X offset for next column (controls noise scale)
    }
    yoff += noiseParams.noiseScaleY // Increment Y offset for next row
  }
  
  // Update geometry with new vertex positions (heights)
  let buffer = new THREE.BufferAttribute(result, 3)
  geometry.setAttribute('position', buffer)
  
  // Update geometry with new vertex colors
  buffer = new THREE.BufferAttribute(color, 3)
  geometry.setAttribute('color', buffer)
  
  // Recalculate normals for proper lighting after geometry changes
  geometry.computeVertexNormals()
  geometry.normalizeNormals()
  
  // Progressive rendering counter (currently unused but kept for potential future use)
  if (rowsmax < 100)
    rowsmax++;
}
