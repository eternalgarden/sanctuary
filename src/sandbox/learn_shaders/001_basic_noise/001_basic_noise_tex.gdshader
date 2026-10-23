shader_type spatial;
uniform sampler2D noise;

void vertex() {
    
      VERTEX.y += cos(VERTEX.x) * sin(VERTEX.z);
}
