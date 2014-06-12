precision mediump float;

varying vec2 texCoords;

uniform sampler2D colorTexture;
uniform vec2 texelSize;

float filter[9];

vec3 blur() {
    vec3 sum = vec3(0);
    float i;

    for (int k = 0; k < 9; k++) {
        i = float(k - 4);

        sum += texture2D(colorTexture, texCoords +
            vec2(0, i * texelSize.y)).xyz * filter[k];
    }

    return sum;
}

// =============================================================================

void main () {
    filter[0] = 0.00390625; filter[1] = 0.03125; filter[2] = 0.109375;
    filter[3] = 0.21875; filter[4] = 0.2734375; filter[5] = 0.21875;
    filter[6] = 0.109375; filter[7] = 0.03125; filter[8] = 0.00390625;

    gl_FragColor = vec4(blur(), 1);
}