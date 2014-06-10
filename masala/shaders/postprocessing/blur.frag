precision mediump float;

varying vec2 texCoords;

uniform sampler2D colorTexture;
// uniform int xstep, ystep;

// // =============================================================================

// // Gaussian blur. Using a blur mask with sigma = 1.0.
// // More info: http://homepages.inf.ed.ac.uk/rbf/HIPR2/gsmooth.htm
// float blurMask[25];


// vec3 blur(vec2 coords) {
//     vec3 sum = vec3(0, 0, 0);
//     float mean = 0.0;
//     int i, j;

//     for (int k = 0; k < 25; k++) {
//         i = k / 5 - 2;
//         j = int(mod(float(k), 5.0)) - 2;

//         sum += texture2D(
//             colorTexture,
//             coords + vec2(i * xstep, j * ystep)
//         ).xyz * blurMask[k];

//         mean += blurMask[5];
//     }

//     // int k = 0, l;
//     // for (int i = -2; i < 3; i++) {
//     //     l = 0;
//     //     for (int j = -2; j < 3; j++) {
//     //         sum += texture2D(colorTexture, coords +
//     //             vec2(i * xstep, j * ystep)).xyz * blurMask[k * 5 + l];
//     //         mean += blurMask[k * 5 + l];

//     //         l++;
//     //     }

//     //     k++;
//     // }

//     return sum / mean;
// }

// // =============================================================================

// void main () {
//     blurMask[0] = 1.0; blurMask[1] = 4.0; blurMask[2] = 7.0;
//     blurMask[3] = 4.0; blurMask[4] = 1.0; blurMask[5] = 4.0;
//     blurMask[6] = 16.0; blurMask[7] = 26.0; blurMask[8] = 16.0;
//     blurMask[9] = 4.0; blurMask[10] = 7.0; blurMask[11] = 26.0;
//     blurMask[12] = 41.0; blurMask[13] = 26.0; blurMask[14] = 7.0;
//     blurMask[15] = 4.0; blurMask[16] = 16.0; blurMask[17] = 26.0;
//     blurMask[18] = 16.0; blurMask[19] = 4.0; blurMask[20] = 1.0;
//     blurMask[21] = 4.0; blurMask[22] = 7.0; blurMask[23] = 4.0;
//     blurMask[24] = 1.0;

//     gl_FragColor = vec4(blur(texCoords), 1);
// }

void main () {
    gl_FragColor = vec4(
        vec3(1, 1, 1) - texture2D(colorTexture, texCoords).xyz, 1);
}