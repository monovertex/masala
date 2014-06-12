precision mediump float;

varying vec2 texCoords;
varying vec3 vColor;

uniform vec3 materialEmissiveK;

uniform bool textured;
uniform bool alphaTextured;
uniform sampler2D colorTexture;
uniform sampler2D alphaTexture;


void main(){

    vec3 color = vColor;

    if (textured) {
        color += texture2D(colorTexture, texCoords).xyz;
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