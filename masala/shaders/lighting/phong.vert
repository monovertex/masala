attribute vec3 vPosition;
attribute vec3 vNormal;
attribute vec2 vTexCoords;

uniform mat4 modelMat;
uniform mat4 viewProjectionMat;

varying vec3 vPositionGlobal;
varying vec3 vNormalGlobal;
varying vec2 texCoords;

void main(void) {
    vPositionGlobal = (modelMat * vec4(vPosition, 1)).xyz;
    vNormalGlobal = normalize(mat3(modelMat) * vNormal);

    texCoords = vTexCoords;

    gl_Position = (viewProjectionMat * modelMat * vec4(vPosition, 1));
}