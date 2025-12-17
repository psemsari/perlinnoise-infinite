export type FBMOctaveParams = {
  enabled: boolean
  amplitude: number
  frequency: number
}

export type NoiseParams = {
  flyingSpeed: number
  noiseScaleX: number
  noiseScaleY: number
  amplitude: number
  frequency: number
  heightMin: number
  heightMax: number
  yOffset: number
  animate: boolean
  showWireframe: boolean
  planeWidth: number
  planeHeight: number
  cols: number
  rows: number
  // FBM (Fractal Brownian Motion)
  useFBM: boolean
  fbmOctaves: number
  fbmLacunarity: number
  fbmInitialFrequency: number
  fbmAmplitudeDecay: number
  fbmInitialAmplitude: number
  fbmAmplitude: number
  fbmFrequency: number
  fbmOctavesParams: FBMOctaveParams[]
}

const FBM_OCTAVES_MAX = 8

export const noiseParams: NoiseParams = {
  flyingSpeed: -0.001, // Vitesse d'animation (négatif = animation vers l'avant)
  noiseScaleX: 0.050,  // Échelle du bruit sur l'axe X (plus petit = plus de détails)
  noiseScaleY: 0.050,  // Échelle du bruit sur l'axe Y
  amplitude: 10,
  frequency: 2,
  heightMin: -20,      // Hauteur minimale du terrain
  heightMax: 0,        // Hauteur maximale du terrain
  yOffset: 0,          // Offset Y initial pour le bruit
  animate: true,       // Activer/désactiver l'animation
  showWireframe: false, // Afficher ou masquer le maillage wireframe
  planeWidth: 100,     // Largeur "physique" du terrain
  planeHeight: 100,    // Hauteur "physique" du terrain
  cols: 100,            // Nombre de colonnes (segments) dans la grille
  rows: 100,            // Nombre de lignes (segments) dans la grille
  useFBM: true,       // Utiliser le FBM ou un simple bruit
  fbmOctaves: 1,       // Nombre d'octaves pour le FBM
  fbmLacunarity: 2.0,  // Multiplicateur de fréquence entre les octaves
  fbmInitialFrequency: 5.0,        // Fréquence initiale pour le FBM
  fbmAmplitudeDecay: 1.0,        // Décay de l'amplitude entre les octaves
  fbmInitialAmplitude: 9.0,        // Amplitude initiale pour le FBM
  fbmAmplitude: 0.0,        // Amplitude pour le FBM
  fbmFrequency: 0.0,        // Multiplicateur de fréquence entre les octaves
  fbmOctavesParams: Array.from({ length: FBM_OCTAVES_MAX }, () => ({
    enabled: true,
    amplitude: 1.0,
    frequency: 1.0,
  })),
}


