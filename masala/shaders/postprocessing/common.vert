attribute vec3 vPosition;
attribute vec2 vTexCoords;

varying vec2 texCoords;

void main(void) {
    texCoords = vTexCoords;
    gl_Position = vec4(vPosition, 1);
}