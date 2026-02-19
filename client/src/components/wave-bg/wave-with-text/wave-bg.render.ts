import { parsedWaveColors, wavesConfig } from '@/components/wave-bg/wave-with-text/wavesConfigWebGL';
import type { WaveShaderProgram, LineShaderProgram, TextLine, TextAnimState } from './wave-bg.types';
import { fillLineBuffer } from './wave-bg.anim';

const FLOATS_PER_VERTEX = 6;

export const renderWave = (
    gl: WebGLRenderingContext,
    program: WaveShaderProgram,
    buffer: WebGLBuffer,
    vertices: Float32Array,
    vertexCount: number,
    waveIndex: number,
    time: number,
    width: number,
    height: number
): void => {
    gl.useProgram(program.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices.subarray(0, vertexCount * 2), gl.DYNAMIC_DRAW);

    gl.enableVertexAttribArray(program.locations.position);
    gl.vertexAttribPointer(program.locations.position, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(program.locations.resolution, width, height);
    gl.uniform1f(program.locations.time, time);

    const colors = parsedWaveColors[waveIndex];
    gl.uniform4fv(program.locations.gradient, colors.gradientStart);
    gl.uniform4fv(program.locations.gradientEnd, colors.gradientEnd);

    const wave = wavesConfig[waveIndex];
    if (wave.glassEffect) {
        gl.uniform4fv(program.locations.tint, colors.tint);
        gl.uniform1f(program.locations.refractionStrength, wave.glassEffect.refractionStrength);
        gl.uniform1f(program.locations.chromaticAberration, wave.glassEffect.chromaticAberration);
    } else {
        gl.uniform4f(program.locations.tint, 0, 0, 0, 0);
        gl.uniform1f(program.locations.refractionStrength, 0);
        gl.uniform1f(program.locations.chromaticAberration, 0);
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexCount);
};

// time передаётся для совместимости сигнатуры — не используется здесь,
// updateTextAnimState вызывается выше в хуке перед render
export const renderTextLines = (
    gl: WebGLRenderingContext,
    program: LineShaderProgram,
    buffer: WebGLBuffer,
    lineDataBuf: Float32Array,
    lines: TextLine[],
    anim: TextAnimState,
    width: number,
    height: number,
    dpr: number
): void => {
    const idx = fillLineBuffer(lineDataBuf, lines, anim, width, height, dpr);
    if (idx === 0) return;

    gl.useProgram(program.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, lineDataBuf.subarray(0, idx), gl.DYNAMIC_DRAW);

    const stride = FLOATS_PER_VERTEX * 4;
    gl.enableVertexAttribArray(program.locations.position);
    gl.vertexAttribPointer(program.locations.position, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(program.locations.color);
    gl.vertexAttribPointer(program.locations.color, 4, gl.FLOAT, false, stride, 2 * 4);

    gl.uniform2f(program.locations.resolution, width, height);
    gl.drawArrays(gl.TRIANGLES, 0, idx / FLOATS_PER_VERTEX);
};
