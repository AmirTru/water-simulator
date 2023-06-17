uniform vec3 uDepthColor;
uniform vec3 uSurfaceColor;
uniform float uColorOffset;
uniform float uColorMultiplier;

vec3 foamColor = vec3(0.0);

vec3 sandColor = vec3(0.992, 0.859, 0.584);
varying vec2 vUv;
varying float vElevation;

void main() {

    //add foam to color 
    float foam = 0.0;
    foam += smoothstep(0., 0.1, vElevation * .5);
    foam = pow(foam, 0.5);
    foamColor += vec3(foam);

    float mixStrength = (vElevation * uColorMultiplier) + uColorOffset;
    vec3 color = mix(uDepthColor, uSurfaceColor, mixStrength);
    color += mix(color, foamColor, 0.039) + vElevation * 0.05;

    float strength = step(0.5, distance(vUv, vec2(0.5)) + 0.25);

    //toon shading

    vec3 mixedColor = mix(color, sandColor, strength);
    // color += vec3(strength);

    gl_FragColor = vec4(mixedColor, 1.0);
}