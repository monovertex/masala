precision mediump float;

varying vec2 texCoords;
varying vec3 vColor;

uniform vec3 materialEmissiveK;

const int maxTextures = 10;
uniform bool textured;
uniform bool alphaTextured;
uniform int textureCount;
uniform sampler2D colorTexture[maxTextures];
uniform sampler2D alphaTexture;

// There is a bug with indexing in a for-loop when working with a sampler2D
// array. This is a hack, but at least it works.
vec3 multipleTexture2D() {
    vec3 color = vec3(0);

    if (textureCount > 0) color += texture2D(colorTexture[0], texCoords).xyz;
    if (textureCount > 1) color += texture2D(colorTexture[1], texCoords).xyz;
    if (textureCount > 2) color += texture2D(colorTexture[2], texCoords).xyz;
    if (textureCount > 3) color += texture2D(colorTexture[3], texCoords).xyz;
    if (textureCount > 4) color += texture2D(colorTexture[4], texCoords).xyz;
    if (textureCount > 5) color += texture2D(colorTexture[5], texCoords).xyz;
    if (textureCount > 6) color += texture2D(colorTexture[6], texCoords).xyz;
    if (textureCount > 7) color += texture2D(colorTexture[7], texCoords).xyz;
    if (textureCount > 8) color += texture2D(colorTexture[8], texCoords).xyz;
    if (textureCount > 9) color += texture2D(colorTexture[9], texCoords).xyz;

    return color;
}


void main(){

    vec3 color = vColor;

    if (textured) {
        if (textureCount == 1) {
            color += texture2D(colorTexture[0], texCoords).xyz;
        } else {
            color += multipleTexture2D();
        }
    } else {
        color += materialEmissiveK;
    }

    if (alphaTextured) {
        if (texture2D(alphaTexture, texCoords).x < 0.5) {
            discard;
        }
    }

    gl_FragColor = vec4(color, 1);
}