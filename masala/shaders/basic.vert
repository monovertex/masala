attribute vec3 vPosition;

uniform mat4 modelMat;
uniform mat4 viewProjectionMat;

void main(void) {
    gl_Position = (viewProjectionMat * modelMat * vec4(vPosition, 1));
}