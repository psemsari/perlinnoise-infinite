import './style.css'
import { cube, cubewireframe, noise_map } from './terrain'
import { createScene } from './scene'
import { createControlPanel } from './ui'

// Initialisation de la scène, de la caméra, du renderer et des contrôles
const { scene, camera, renderer } = createScene(cube, cubewireframe)

// Créer l'interface de contrôle pour les paramètres de bruit
createControlPanel()

// Générer un premier terrain puis démarrer la boucle d'animation
noise_map()
animate()

/**
 * Boucle d'animation principale : rendu de la scène et mise à jour du terrain
 */
function animate() {
  setTimeout(() => {
    requestAnimationFrame(animate)
  }, 1000 / 60)

  renderer.render(scene, camera)
  noise_map()
}
