precision mediump float;

varying vec2 texCoords;

uniform sampler2D colorTexture;

float luminosity (vec3 color) {
    return 0.2126 * color.x + 0.7152 * color.y + 0.0722 * color.z;
}

// Luminosity gray-scale filter (weighted average, for human eye).
void main () {
    vec3 color = texture2D(colorTexture, texCoords).xyz;
    float l = luminosity(color);

    gl_FragColor = vec4(l, l, l, 1);
}