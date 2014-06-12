precision mediump float;

varying vec2 texCoords;

uniform vec2 texelSize;
uniform sampler2D colorTexture;

float luminosity (vec3 color) {
    return 0.2126 * color.x + 0.7152 * color.y + 0.0722 * color.z;
}

void main () {

    vec3 avg = vec3(0);
    vec3 color = texture2D(colorTexture, texCoords).xyz;
    float l = luminosity(color);

    for (int i = -2; i <= 2; i++) {
        for (int j = -2; j <= 2; j++) {
            avg += texture2D(colorTexture, texCoords +
                vec2(float(i) * texelSize.x, float(j) *
                texelSize.y)).xyz * 0.04;
        }
    }

    color += avg * (1.0 - l) + color * l * 0.5;

    gl_FragColor = vec4(color, 1);

}