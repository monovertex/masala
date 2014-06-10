precision mediump float;

varying vec2 texCoords;

uniform sampler2D colorTexture;
uniform float xStep, yStep;

// =============================================================================

// Gaussian blur. Using a blur mask with sigma = 1.0.
// More info: http://homepages.inf.ed.ac.uk/rbf/HIPR2/gsmooth.htm
float blurMask[25];


vec3 blur(vec2 coords) {
    vec3 sum = vec3(0, 0, 0);
    float mean = 0.0;
    float i, j;

    for (int k = 0; k < 25; k++) {
        i = float(k) / 5.0 - 2.0;
        j = mod(float(k), 5.0) - 2.0;

        sum += texture2D(
            colorTexture,
            coords + vec2(i * xStep, j * yStep)
        ).xyz * blurMask[k];

        mean += blurMask[k];
    }

    return sum / mean;
}

// =============================================================================

void main () {
    blurMask[0] = 1.0; blurMask[1] = 4.0; blurMask[2] = 7.0;
    blurMask[3] = 4.0; blurMask[4] = 1.0; blurMask[5] = 4.0;
    blurMask[6] = 16.0; blurMask[7] = 26.0; blurMask[8] = 16.0;
    blurMask[9] = 4.0; blurMask[10] = 7.0; blurMask[11] = 26.0;
    blurMask[12] = 41.0; blurMask[13] = 26.0; blurMask[14] = 7.0;
    blurMask[15] = 4.0; blurMask[16] = 16.0; blurMask[17] = 26.0;
    blurMask[18] = 16.0; blurMask[19] = 4.0; blurMask[20] = 1.0;
    blurMask[21] = 4.0; blurMask[22] = 7.0; blurMask[23] = 4.0;
    blurMask[24] = 1.0;

    gl_FragColor = vec4(blur(texCoords), 1);
}