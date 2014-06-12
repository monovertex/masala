precision mediump float;

uniform vec3 eyePosition;
varying vec3 vPositionGlobal;
varying vec3 vNormalGlobal;
varying vec2 texCoords;

//==============================================================================

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
uniform vec3 materialEmissiveK;
uniform vec3 materialAmbientK;
uniform vec3 materialDiffuseK;
uniform vec3 materialSpecularK;

uniform vec3 ambientLight;

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

// Compute the light for a vertex, coming from a single light source.
vec3 computeLight(vec3 V, bool spotlight, vec3 color, vec3 position,
    vec3 direction, float inner, float outer, float radius) {

    // Compute light direction.
    vec3 L = position - vPositionGlobal;
    float dist = length(L);
    L = normalize(L);
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

        // Compute the diffuse component.
        float diffuseTerm = dot(vNormalGlobal, L);

        // Compute the specular component and return attenuated and reduced
        // color.
        // We're using the diffuse term with a smoothstep to smooth the hard
        // edges on dull specular light.
        if (diffuseTerm > 0.0) {
            vec3 diffuseLight, specularLight;

            // Compute the reflected light ray.
            vec3 R = normalize(reflect(-L, vNormalGlobal));

            // Compute attenuation.
            float attenuation = computeAttenuation(dist, radius);

            diffuseLight = materialDiffuseK * color * diffuseTerm;

            specularLight = (materialSpecularK * color *
                smoothstep(0.0, 1.0, diffuseTerm) *
                pow(max(dot(V, R), 0.0), materialShininess));

            return spotFalloff * attenuation * (diffuseLight + specularLight);
        }
    }

    return vec3(0);
}

//==============================================================================

uniform bool textured;
uniform bool alphaTextured;
uniform sampler2D colorTexture;
uniform sampler2D alphaTexture;

//==============================================================================

void main() {

    vec3 V = normalize(eyePosition - vPositionGlobal);
    vec3 color = materialEmissiveK;

    if (textured) {
        color = texture2D(colorTexture, texCoords).xyz;
    }

    if (alphaTextured) {
        if (texture2D(alphaTexture, texCoords).x < 0.5) {
            discard;
        }
    }

    color += materialAmbientK * ambientLight;

    // Compute the color, considering every other light in the scene.
    for (int i = 0; i < maxLights; i++) {
        if (i > lightCount) {
            break;
        }

        color += computeLight(V, lightType[i] == 1, lightColor[i],
            lightPosition[i], lightDirection[i], lightAngleInner[i],
            lightAngleOuter[i], lightRadius[i]);
    }

    gl_FragColor = vec4(color, 1);
}