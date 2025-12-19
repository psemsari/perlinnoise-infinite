uniform float uTime;
uniform vec3 uLightDirection;
uniform float uLightIntensity;
uniform float uAmbientLight;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  // Couleur de base
  vec3 color = vec3(128.0/255.0, 88.0/255.0, 62.0/255.0);
  
  // Direction de la lumière (depuis la surface vers la lumière)
  vec3 lightDir = normalize(-uLightDirection);
  
  // Calcul de l'éclairage diffus avec la normale
  float NdotL = max(dot(vNormal, lightDir), 0.0);
  
  // Éclairage combiné : ambiant + diffus
  float light = uAmbientLight + NdotL * uLightIntensity;
  
  // S'assurer que la lumière ne dépasse pas 1.0
  light = min(light, 1.0);
  
  gl_FragColor = vec4(color * light, 1.0);
}
