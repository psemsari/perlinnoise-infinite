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
    text-align: center;
  `
  panel.appendChild(title)

  // Conteneur des onglets et du contenu
  const tabsBar = document.createElement('div')
  tabsBar.style.cssText = `
    display: flex;
    gap: 6px;
    margin-bottom: 10px;
  `

  const contentContainer = document.createElement('div')
  contentContainer.style.cssText = `
    margin-top: 4px;
  `

  panel.appendChild(tabsBar)
  panel.appendChild(contentContainer)

  // Gestion des sections/volets
  const sections: HTMLElement[] = []
  const tabButtons: HTMLButtonElement[] = []

  function setActiveSection(index: number) {
    sections.forEach((section, i) => {
      section.style.display = i === index ? 'block' : 'none'
    })
    tabButtons.forEach((btn, i) => {
      btn.style.background = i === index ? 'rgba(255, 255, 255, 0.15)' : 'transparent'
      btn.style.color = i === index ? '#fff' : 'rgba(255, 255, 255, 0.7)'
    })
  }

  function createSectionTab(label: string) {
    const index = sections.length

    const button = document.createElement('button')
    button.textContent = label
    button.style.cssText = `
      border: none;
      padding: 4px 8px;
      border-radius: 999px;
      font-size: 11px;
      cursor: pointer;
      background: transparent;
      color: rgba(255, 255, 255, 0.7);
    `
    button.addEventListener('click', () => setActiveSection(index))
    tabsBar.appendChild(button)
    tabButtons.push(button)

    const section = document.createElement('div')
    section.style.display = 'none'
    contentContainer.appendChild(section)
    sections.push(section)

    // Activer le premier par défaut
    if (index === 0) {
      setActiveSection(0)
    }

    return section
  }

  // Création des différents volets
  const generalSection = createSectionTab('Général')
  const terrainSection = createSectionTab('Terrain')
  const baseNoiseSection = createSectionTab('Bruit de base')
  const fbmGlobalSection = createSectionTab('FBM global')
  const fbmOctavesSection = createSectionTab('FBM par octave')

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
      if (key === 'planeWidth' || key === 'planeHeight' || key === 'cols' || key === 'rows') {
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
  // Général
  generalSection.appendChild(createCheckbox('Animation', 'animate'))
  generalSection.appendChild(createSlider('Vitesse Animation', 'flyingSpeed', -0.1, 0.1, 0.001))

  // Terrain
  terrainSection.appendChild(createCheckbox('Wireframe', 'showWireframe'))
  terrainSection.appendChild(createSlider('Largeur terrain', 'planeWidth', 20, 300, 1))
  terrainSection.appendChild(createSlider('Hauteur terrain', 'planeHeight', 20, 300, 1))
  terrainSection.appendChild(createSlider('Nombre de colonnes', 'cols', 2, 100, 1))
  terrainSection.appendChild(createSlider('Nombre de lignes', 'rows', 2, 100, 1))

  // Bruit de base
  baseNoiseSection.appendChild(createSlider('Échelle Bruit X', 'noiseScaleX', 0.001, 0.1, 0.001))
  baseNoiseSection.appendChild(createSlider('Échelle Bruit Y', 'noiseScaleY', 0.001, 0.1, 0.001))
  baseNoiseSection.appendChild(createSlider('Offset Y', 'yOffset', -10, 10, 0.1))
  baseNoiseSection.appendChild(createSlider('Amplitude', 'amplitude', 1, 100, 1))
  baseNoiseSection.appendChild(createSlider('Fréquence', 'frequency', 0.1, 10, 0.1))

  // Contrôles FBM / bruit global
  fbmGlobalSection.appendChild(createCheckbox('Utiliser FBM', 'useFBM'))
  fbmGlobalSection.appendChild(createSlider('Octaves FBM', 'fbmOctaves', 1, 8, 1))
  fbmGlobalSection.appendChild(createSlider('Lacunarité FBM', 'fbmLacunarity', 2, 100.0, 1))
  fbmGlobalSection.appendChild(createSlider('Amplitude initiale FBM', 'fbmInitialAmplitude', 0.1, 100.0, 0.1))
  fbmGlobalSection.appendChild(createSlider('Amp Decay', 'fbmAmplitudeDecay', 0.1, 5.0, 0.1))
  fbmGlobalSection.appendChild(createSlider('Fréquence initiale FBM', 'fbmInitialFrequency', 0.1, 50.0, 0.1))
  fbmGlobalSection.appendChild(createSlider('Amplitude FBM', 'fbmAmplitude', 0.0, 100.0, 0.1))
  fbmGlobalSection.appendChild(createSlider('Fréquence FBM', 'fbmFrequency', 0.0, 1000.0, 1))

  // Contrôles détaillés par octave FBM
  const fbmDetailsTitle = document.createElement('h4')
  fbmDetailsTitle.textContent = 'FBM par octave'
  fbmDetailsTitle.style.cssText = `
    margin: 10px 0 5px 0;
    font-size: 13px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
  `
  fbmOctavesSection.appendChild(fbmDetailsTitle)

  noiseParams.fbmOctavesParams.forEach((octave, index) => {
    const container = document.createElement('div')
    container.style.cssText = `
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      padding: 8px;
      margin-bottom: 8px;
    `

    const header = document.createElement('div')
    header.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;'

    const label = document.createElement('span')
    label.textContent = `Octave ${index + 1}`
    label.style.cssText = 'font-size: 12px; color: rgba(255, 255, 255, 0.9);'

    const enableCheckbox = document.createElement('input')
    enableCheckbox.type = 'checkbox'
    enableCheckbox.checked = octave.enabled
    enableCheckbox.style.cssText = 'width: 14px; height: 14px; cursor: pointer;'
    enableCheckbox.addEventListener('change', (e) => {
      noiseParams.fbmOctavesParams[index].enabled = (e.target as HTMLInputElement).checked
    })

    header.appendChild(label)
    header.appendChild(enableCheckbox)
    container.appendChild(header)

    // Slider amplitude
    const gainContainer = document.createElement('div')
    gainContainer.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 4px;'

    const gainLabel = document.createElement('span')
    gainLabel.textContent = 'Amplitude'
    gainLabel.style.cssText = 'font-size: 11px; color: rgba(255, 255, 255, 0.7); min-width: 40px;'

    const gainSlider = document.createElement('input')
    gainSlider.type = 'range'
    gainSlider.min = '0.1'
    gainSlider.max = '2.0'
    gainSlider.step = '0.05'
    gainSlider.value = octave.amplitude.toString()
    gainSlider.style.cssText = 'flex: 1;'

    const gainValue = document.createElement('span')
    gainValue.textContent = octave.amplitude.toFixed(2)
    gainValue.style.cssText = 'font-size: 11px; color: #AECC6F; min-width: 38px; text-align: right;'

    gainSlider.addEventListener('input', (e) => {
      const v = parseFloat((e.target as HTMLInputElement).value)
      noiseParams.fbmOctavesParams[index].amplitude = v
      gainValue.textContent = v.toFixed(2)
    })

    gainContainer.appendChild(gainLabel)
    gainContainer.appendChild(gainSlider)
    gainContainer.appendChild(gainValue)
    container.appendChild(gainContainer)

    // Slider lacunarité
    const lacContainer = document.createElement('div')
    lacContainer.style.cssText = 'display: flex; align-items: center; gap: 8px;'

    const lacLabel = document.createElement('span')
    lacLabel.textContent = 'Lacunarité'
    lacLabel.style.cssText = 'font-size: 11px; color: rgba(255, 255, 255, 0.7); min-width: 60px;'

    const lacSlider = document.createElement('input')
    lacSlider.type = 'range'
    lacSlider.min = '0.5'
    lacSlider.max = '3.0'
    lacSlider.step = '0.05'
    lacSlider.value = octave.frequency.toString()
    lacSlider.style.cssText = 'flex: 1;'

    const lacValue = document.createElement('span')
    lacValue.textContent = octave.frequency.toFixed(2)
    lacValue.style.cssText = 'font-size: 11px; color: #AECC6F; min-width: 38px; text-align: right;'

    lacSlider.addEventListener('input', (e) => {
      const v = parseFloat((e.target as HTMLInputElement).value)
      noiseParams.fbmOctavesParams[index].frequency = v
      lacValue.textContent = v.toFixed(2)
    })

    lacContainer.appendChild(lacLabel)
    lacContainer.appendChild(lacSlider)
    lacContainer.appendChild(lacValue)
    container.appendChild(lacContainer)

    fbmOctavesSection.appendChild(container)
  })

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


