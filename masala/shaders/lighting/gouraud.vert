attribute vec3 vPosition;
attribute vec3 vNormal;
attribute vec2 vTexCoords;

uniform mat4 modelMat;
uniform mat4 viewProjectionMat;

uniform vec3 eyePosition;

const int maxLights = 20;
const float attenuationCutoff = 0.002;

uniform int lightCount;
uniform int lightType[maxLights];
uniform vec3 lightColor[maxLights];
uniform vec3 lightPosition[maxLights];
uniform vec3 lightDirection[maxLights];
uniform float lightAngleInner[maxLights];
uniform float lightAngleOuter[maxLights];
uniform float lightRadius[maxLights];

uniform float materialShininess;
uniform vec3 materialAmbientK;
uniform vec3 materialDiffuseK;
uniform vec3 materialSpecularK;

uniform vec3 ambientLight;

varying vec2 texCoords;
varying vec3 vColor;


// Compute attenuation based on distance and light size.
// More information:
//      http://imdoingitwrong.wordpress.com/2011/01/31/light-attenuation/
float computeAttenuation(float distance, float radius) {
    // Compute distance from the light's surface instead of center.
    float d = max(distance - radius, 0.0);

    // Compute basic attenuation factor.
    float denominator = d / radius + 1.0;
    float attenuation = 1.0 / (denominator * denominator);

    // The attenuation factor is approaching 0 when the distance is approaching
    // infinity, wasting computational power for an effect that is not visible
    // to the human eye. To avoid this, we cutoff the attenuation factor and
    // scale it.
    attenuation = (attenuation - attenuationCutoff) / (1.0 - attenuationCutoff);
    return max(attenuation, 0.0);
}

vec3 computeLight(vec3 V, vec3 vPositionGlobal, vec3 vNormalGlobal,
    bool spotlight, vec3 color, vec3 position, vec3 direction,
    float inner, float outer, float radius) {

    // Compute light direction.
    vec3 L = position - vPositionGlobal;
    float distance = length(L);
    L /= distance;
    float spotFalloff = 1.0;
    float currentAngle;

    // If the light is spotlight, we also compute the falloff.
    if (spotlight) {
        // Compute angle between spotlight direction and light direction.
        currentAngle = dot(-L, direction);

        float differenceAngle = inner - outer;
        spotFalloff = clamp((currentAngle - outer) / differenceAngle, 0.0, 1.0);
    }

    // If our vertex is inside the spotlight or the light is omni.
    if (!spotlight || (spotlight && currentAngle > outer)) {

        vec3 H = normalize(L + V);

        // Compute attenuation.
        float attenuation = computeAttenuation(distance, radius);

        vec3 diffuseLight, specularLight;

        // Compute the diffuse component.
        float diffuseTerm = clamp(dot(vNormalGlobal, L), 0.0, 1.0);
        diffuseLight = materialDiffuseK * color * diffuseTerm;

        if (diffuseLight.r > 0.0 || diffuseLight.g > 0.0 ||
                diffuseLight.b > 0.0) {
            specularLight = (materialSpecularK * color *
                smoothstep(0.0, 1.0, diffuseTerm) *
                pow(clamp(dot(vNormalGlobal, H), 0.0, 1.0), materialShininess));

            return spotFalloff * attenuation * (diffuseLight + specularLight);
        }
    }

    return vec3(0);
}

void main(void) {
    texCoords = vTexCoords;

    vec3 vPositionGlobal = (modelMat * vec4(vPosition, 1)).xyz;
    vec3 vNormalGlobal = normalize(mat3(modelMat) * vNormal);

    vec3 V = eyePosition - vPositionGlobal;
    vec3 color = materialAmbientK * ambientLight;

    // Compute the color, considering every other light in the scene.
    for (int i = 0; i < maxLights; i++) {
        if (i > lightCount) {
            break;
        }

        color += computeLight(V, vPositionGlobal, vNormalGlobal,
            lightType[i] == 1, lightColor[i], lightPosition[i],
            lightDirection[i], lightAngleInner[i], lightAngleOuter[i],
            lightRadius[i]);
    }

    vColor = color;
    gl_Position = (viewProjectionMat * modelMat * vec4(vPosition, 1));
}