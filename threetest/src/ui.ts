import { noiseParams } from './noiseParams'
import { resetFlying, updateTerrainFromParams } from './terrain'

/**
 * Crée un panneau de contrôle avec des sliders pour manipuler les paramètres du simplex-noise
 */
export function createControlPanel() {
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

      // Si on modifie la taille du terrain, on applique immédiatement les changements
      if (key === 'planeWidth' || key === 'planeHeight') {
        updateTerrainFromParams()
      }
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
      const checked = (e.target as HTMLInputElement).checked
      ;(noiseParams[key] as boolean) = checked

      // Si on touche au wireframe, on met à jour immédiatement le terrain
      if (key === 'showWireframe') {
        updateTerrainFromParams()
      }
    })

    container.appendChild(checkbox)
    container.appendChild(labelEl)

    return container
  }

  // Ajouter tous les contrôles
  panel.appendChild(createCheckbox('Animation', 'animate'))
  panel.appendChild(createCheckbox('Wireframe', 'showWireframe'))

  // Contrôles FBM / bruit
  panel.appendChild(createCheckbox('Utiliser FBM', 'useFBM'))
  panel.appendChild(createSlider('Octaves FBM', 'fbmOctaves', 1, 8, 1))
  panel.appendChild(createSlider('Lacunarité FBM', 'fbmLacunarity', 1.0, 4.0, 0.1))
  panel.appendChild(createSlider('Gain FBM', 'fbmGain', 0.1, 1.0, 0.05))

  // Taille du terrain
  panel.appendChild(createSlider('Largeur terrain', 'planeWidth', 20, 300, 1))
  panel.appendChild(createSlider('Hauteur terrain', 'planeHeight', 20, 300, 1))
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
    resetFlying()

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

  // Ajouter un bouton pour masquer/afficher le panneau si besoin (optionnel)
}


