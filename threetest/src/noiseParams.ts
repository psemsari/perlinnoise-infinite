export type FBMOctaveParams = {
  enabled: boolean
  gain: number
  lacunarity: number
}

export type NoiseParams = {
  flyingSpeed: number
  noiseScaleX: number
  noiseScaleY: number
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
  fbmGain: number
  fbmOctavesParams: FBMOctaveParams[]
}

const FBM_OCTAVES_MAX = 8

export const noiseParams: NoiseParams = {
  flyingSpeed: -0.001, // Vitesse d'animation (négatif = animation vers l'avant)
  noiseScaleX: 0.015,  // Échelle du bruit sur l'axe X (plus petit = plus de détails)
  noiseScaleY: 0.015,  // Échelle du bruit sur l'axe Y
  heightMin: -10,      // Hauteur minimale du terrain
  heightMax: 0,        // Hauteur maximale du terrain
  yOffset: 0,          // Offset Y initial pour le bruit
  animate: true,       // Activer/désactiver l'animation
  showWireframe: true, // Afficher ou masquer le maillage wireframe
  planeWidth: 100,     // Largeur "physique" du terrain
  planeHeight: 100,    // Hauteur "physique" du terrain
  cols: 10,            // Nombre de colonnes (segments) dans la grille
  rows: 10,            // Nombre de lignes (segments) dans la grille
  useFBM: false,       // Utiliser le FBM ou un simple bruit
  fbmOctaves: 4,       // Nombre d'octaves pour le FBM
  fbmLacunarity: 2.0,  // Multiplicateur de fréquence entre les octaves
  fbmGain: 0.5,        // Facteur de réduction d'amplitude entre les octaves
  fbmOctavesParams: Array.from({ length: FBM_OCTAVES_MAX }, () => ({
    enabled: true,
    gain: 1.0,
    lacunarity: 1.0,
  })),
}


