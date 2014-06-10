precision mediump float;

varying vec2 texCoords;

uniform sampler2D colorTexture;
uniform float yStep;
uniform int ySpeed;

void main () {

    vec3 color = vec3(0);
    int speed = ySpeed;
    int kernelSize = speed * 2 + 1;
    int i = -speed;

    for (int k = 0; k <= 1000; k++) {
        color += texture2D(colorTexture, texCoords +
            vec2(0, float(i) * yStep)).xyz;

        i++;
        if (i > speed) break;
    }

    color = color / float(kernelSize);

    gl_FragColor = vec4(color, 1);
}