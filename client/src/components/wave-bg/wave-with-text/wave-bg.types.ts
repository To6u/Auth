export interface WaveShaderProgram {
    program: WebGLProgram;
    locations: {
        position: number;
        gradient: WebGLUniformLocation | null;
        gradientEnd: WebGLUniformLocation | null;
        tint: WebGLUniformLocation | null;
        resolution: WebGLUniformLocation | null;
        time: WebGLUniformLocation | null;
        refractionStrength: WebGLUniformLocation | null;
        chromaticAberration: WebGLUniformLocation | null;
        vertical: WebGLUniformLocation | null;
    };
}

export interface LineShaderProgram {
    program: WebGLProgram;
    locations: {
        position: number;
        color: number;
        u: number;
        v: number;
        resolution: WebGLUniformLocation | null;
        opacity: WebGLUniformLocation | null;
    };
}

export interface MouseState {
    x: number;
    y: number;
    smoothX: number;
    smoothY: number;
    active: boolean;
    smoothActive: number;
}

export interface TextLine {
    velopX1: number;
    velopY1: number;
    velopX2: number;
    velopY2: number;
    signX1: number;
    signY1: number;
    signX2: number;
    signY2: number;
}

export interface TextAnimState {
    initialized: boolean;
    initialProgress: number;
    initialDone: boolean;
    morphProgress: number;
    morphTarget: 0 | 1;
    lastMorphTime: number;
    timerProgress: number;
    exitProgress: number;
    scrollY: number;
    waveScrollProgress: number;
    /** Прогресс скролла к секции #contacts [0..1], сглаженный */
    contactsProgress: number;
    /** Целевое значение для contactsProgress до сглаживания */
    contactsTarget: number;
}
