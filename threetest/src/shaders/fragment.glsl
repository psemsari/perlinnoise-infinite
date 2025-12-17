uniform float uTime;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  // Couleur de base (rouge)
  vec3 color = vec3(1.0, 0.0, 0.0);
  
  // Animation simple : pulse entre 0.3 et 1.0
  float pulse = sin(uTime * 2.0) * 0.5 + 0.5;
  pulse = pulse * 0.7 + 0.3;
  
  // Appliquer le pulse à la couleur
  //color *= pulse;
  
  // Ajouter un léger effet basé sur la normale (éclairage simple)
  float light = dot(vNormal, vec3(0.5, 1.0, 0.8));
  light = light * 0.5 + 0.5;
  
  gl_FragColor = vec4(color * light, 1.0);
}
