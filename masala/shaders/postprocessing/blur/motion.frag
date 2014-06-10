precision mediump float;

varying vec2 texCoords;

uniform sampler2D colorTexture;
uniform float xStep, yStep;
uniform int xSpeed, ySpeed;

void main () {

    vec3 color = vec3(0);
    float kernelSize = float((xSpeed * 2 + 1) * (ySpeed * 2 + 1));
    int i = -xSpeed, j = -ySpeed;

    for (int k = 0; k < 1000; k++) {
        for (int l = 0; l < 1000; l++) {
            color += texture2D(colorTexture, texCoords +
                vec2(float(i) * xStep, float(j) * yStep)).xyz;
            j++;
            if (j > ySpeed) break;
        }
        i++;
        if (i > xSpeed) break;
    }

    color = color / kernelSize;

    gl_FragColor = vec4(color, 1);
}