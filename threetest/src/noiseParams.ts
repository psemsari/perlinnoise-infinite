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
}

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
}


