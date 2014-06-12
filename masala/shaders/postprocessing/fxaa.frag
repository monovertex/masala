precision mediump float;

// Original source:
// http://horde3d.org/wiki/index.php5?title=Shading_Technique_-_FXAA

// Original paper:
// http://developer.download.nvidia.com/assets/gamedev/files/sdk/11/FXAA_WhitePaper.pdf

uniform sampler2D colorTexture;
uniform vec2 texelSize;
varying vec2 texCoords;

float FXAA_SPAN_MAX = 6.0;
float FXAA_REDUCE_FACTOR = 0.03125;
float FXAA_REDUCE_MIN = 0.0078125;

float luminosity (vec3 color) {
    return 0.299 * color.x + 0.587 * color.y + 0.114 * color.z;
}

void main() {

    vec3 colorUpLeft = texture2D(colorTexture, texCoords +
        (vec2(-1.0, -1.0) * texelSize)).xyz;
    vec3 colorUpRight = texture2D(colorTexture, texCoords +
        (vec2(+1.0, -1.0) * texelSize)).xyz;
    vec3 colorDownLeft = texture2D(colorTexture, texCoords +
        (vec2(-1.0, +1.0) * texelSize)).xyz;
    vec3 colorDownRight = texture2D(colorTexture, texCoords +
        (vec2(+1.0, +1.0) * texelSize)).xyz;
    vec3 colorMiddle  = texture2D(colorTexture, texCoords).xyz;

    float lumUpLeft = luminosity(colorUpLeft);
    float lumUpRight = luminosity(colorUpRight);
    float lumDownLeft = luminosity(colorDownLeft);
    float lumDownRight = luminosity(colorDownRight);
    float lumMiddle  = luminosity(colorMiddle);

    float lumMin = min(
        lumMiddle,
        min(
            min(lumUpLeft, lumUpRight),
            min(lumDownLeft, lumDownRight)
        )
    );
    float lumMax = max(
        lumMiddle,
        max(
            max(lumUpLeft, lumUpRight),
            max(lumDownLeft, lumDownRight)
        )
    );

    vec2 dir;
    dir.x = -((lumUpLeft + lumUpRight) - (lumDownLeft + lumDownRight));
    dir.y =  ((lumUpLeft + lumDownLeft) - (lumUpRight + lumDownRight));

    float dirReduce = max((lumUpLeft + lumUpRight + lumDownLeft +
        lumDownRight) * FXAA_REDUCE_FACTOR, FXAA_REDUCE_MIN);

    float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);

    dir = min(
        vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX),
        max(
            vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),
            dir * rcpDirMin
        )
    ) * texelSize;

    vec3 rgbA = 0.5 * (
        texture2D(colorTexture, texCoords + dir * (1.0 / 3.0 - 0.5)).xyz +
        texture2D(colorTexture, texCoords + dir * (2.0 / 3.0 - 0.5)).xyz
    );
    vec3 rgbB = rgbA * 0.5 + 0.25 * (
        texture2D(colorTexture, texCoords + dir * -0.5).xyz +
        texture2D(colorTexture, texCoords + dir * 0.5).xyz
    );
    float lumB = luminosity(rgbB);

    vec3 color = vec3(0);
    if((lumB < lumMin) || (lumB > lumMax)){
        color = rgbA;
    } else {
        color = rgbB;
    }

    gl_FragColor = vec4(color, 1.0);
}