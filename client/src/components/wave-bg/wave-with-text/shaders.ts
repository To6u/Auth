export const WAVE_VERTEX_SHADER = `
    precision mediump float;
    attribute vec2 a_position;
    uniform vec2 u_resolution;
    varying vec2 v_position;
    varying float v_gradientPos;

    void main() {
        vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
        gl_Position = vec4(clipSpace.x, -clipSpace.y, 0.0, 1.0);
        v_position = a_position;
        v_gradientPos = a_position.x / u_resolution.x;
    }
`;

export const WAVE_FRAGMENT_SHADER = `
    #ifdef GL_OES_standard_derivatives
    #extension GL_OES_standard_derivatives : enable
    #endif

    precision mediump float;
    uniform vec4 u_gradient;
    uniform vec4 u_gradientEnd;
    uniform vec4 u_tint;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform float u_refractionStrength;
    uniform float u_chromaticAberration;

    varying vec2 v_position;
    varying float v_gradientPos;

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

    float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
        m = m * m;
        m = m * m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }

    void main() {
        vec4 baseColor = mix(u_gradient, u_gradientEnd, v_gradientPos);

        if (u_refractionStrength < 0.1) {
            gl_FragColor = baseColor;
            return;
        }

        vec2 noiseCoord = v_position / u_resolution * 3.0 + u_time * 0.0001;
        float noise = snoise(noiseCoord * 2.0) * 0.5 + snoise(noiseCoord * 4.0) * 0.25;

        vec3 color = baseColor.rgb;
        if (u_chromaticAberration > 0.0) {
            float shift = noise * u_chromaticAberration * 0.02;
            color.r += shift;
            color.b -= shift;
        }

        #ifdef GL_OES_standard_derivatives
        vec2 grad = vec2(dFdx(v_position.y), dFdy(v_position.y));
        float fresnel = pow(1.0 - min(length(grad) * 50.0, 1.0), 2.0);
        #else
        float fresnel = 0.2;
        #endif

        color += vec3(fresnel) * 0.3;
        color *= 1.0 + noise * u_refractionStrength * 0.01;
        color = mix(color, u_tint.rgb, u_tint.a * 0.15);

        gl_FragColor = vec4(color, baseColor.a);
    }
`;

export const LINE_VERTEX_SHADER = `
    precision mediump float;
    attribute vec2 a_position;
    attribute vec4 a_color;
    uniform vec2 u_resolution;
    varying vec4 v_color;

    void main() {
        vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
        gl_Position = vec4(clipSpace.x, -clipSpace.y, 0.0, 1.0);
        v_color = a_color;
    }
`;

export const LINE_FRAGMENT_SHADER = `
    precision mediump float;
    varying vec4 v_color;

    void main() {
        gl_FragColor = v_color;
    }
`;
