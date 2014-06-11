precision mediump float;

uniform mat4 viewProjectionMat;
uniform mat4 viewProjectionInverseMat;
uniform mat4 previousViewProjectionMat;

varying vec2 texCoords;

uniform sampler2D colorTexture;
uniform sampler2D depthTexture;

uniform vec2 texelSize;

uniform float fps;

int sampleCount = 8;

void main () {

    // Get world position.
    float z = texture2D(depthTexture, texCoords).r * 2.0 - 1.0;

    vec4 ndcPosition = vec4(texCoords * 2.0 - 1.0, z, 1);

    vec4 clipPosition = viewProjectionInverseMat * ndcPosition;

    vec4 worldPosition = clipPosition / clipPosition.w;

    // Compute velocity;
    vec4 clipPreviousPosition = previousViewProjectionMat * worldPosition;

    vec4 ndcPreviousPosition = clipPreviousPosition / clipPreviousPosition.w;

    vec2 previousPosition = ndcPreviousPosition.xy * 0.5 + 0.5;

    vec2 velocity = (texCoords - previousPosition) * 90.0 / fps;

    vec3 color = texture2D(colorTexture, texCoords).xyz;

    int i = 1;
    for (int l = 0; l < 100; l++) {
        vec2 offset = velocity * (float(i) / float(sampleCount) - 0.5);
        color += texture2D(colorTexture, texCoords + offset).xyz;

        if (i == sampleCount) break;
        i++;
    }

    color /= float(sampleCount);

    gl_FragColor = vec4(color, 1.0);

    // // Blur along the vector.
    // float sampleCount = 8;
    // vec3 color = vec3(0);

    // // for (int i = 0; i < 3; i++) {
    // //     coords += velocity;
    // //     color += texture2D(colorTexture, coords).xyz;
    // // }

    // int i = 0;
    // for (int l = 0; l < 100; l++) {
    //     vec2 offset = velocity * (float(i) / sampleCount - 0.5);
    //     color += texture2D(colorTexture, texCoords + offset).xyz;

    //     if (float(i) >= sampleCount) break;
    //     i++;
    // }

    // gl_FragColor = vec4(color / sampleCount, 1);
}