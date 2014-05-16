attribute vec3 vPosition;

uniform mat4 modelMat;
uniform mat4 viewMat;
uniform mat4 projectionMat;

void main(void) {
    gl_Position = (projectionMat * viewMat * modelMat * vec4(vPosition, 1));
}