attribute vec3 vPosition;
attribute vec3 vNormal;
attribute vec3 vTexCoords;

uniform mat4 modelMat;
uniform mat4 viewMat;
uniform mat4 projectionMat;

varying vec3 vPositionGlobal;
varying vec3 vNormalGlobal;

void main(void) {
    vPositionGlobal = (modelMat * vec4(vPosition, 1)).xyz;
    vNormalGlobal = normalize(mat3(modelMat) * vNormal);

    vec3 dummy = vTexCoords;

    gl_Position = (projectionMat * viewMat * modelMat * vec4(vPosition, 1));
}