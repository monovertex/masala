precision mediump float;

varying vec2 texCoords;

uniform sampler2D colorTexture;

void main () {
    gl_FragColor = vec4(vec3(1, 1, 1) -
        texture2D(colorTexture, texCoords).xyz, 1);
}