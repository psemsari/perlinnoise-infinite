uniform float uTime;
uniform float uNoiseScale; // Échelle du bruit
uniform float uNoiseAmplitude; // Amplitude du bruit
varying vec3 vNormal;
varying vec3 vPosition;

// Fonction de hash pour générer des valeurs pseudo-aléatoires
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Fonction de bruit 2D (simplifié, style Perlin)
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f); // Smoothstep
  
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Fonction de bruit fractal (FBM - Fractional Brownian Motion)
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  
  // 4 octaves de bruit
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  
  return value;
}

void main() {
  // Créer une copie de la position pour la modifier
  vec3 modifiedPosition = position;
  
  // Mettre z = 1 si x = 0 et y = 0
  //if (position.x == -1.5 && position.y == 1.5) {
  //  modifiedPosition.z = 1.0;
  //}
  
  // Ajouter du bruit Perlin pour modifier z
  vec2 noiseCoord = position.xy * uNoiseScale + uTime * 0.1; // Coordonnées du bruit avec animation
  float noiseValue = fbm(noiseCoord); // Valeur entre 0 et 1
  modifiedPosition.z += (noiseValue - 0.5) * uNoiseAmplitude; // Centrer autour de 0
  
  vNormal = normalize(normalMatrix * normal);
  vPosition = modifiedPosition;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(modifiedPosition, 1.0);
}
