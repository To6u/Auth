import '@testing-library/jest-dom';

// WebGL context mock — для canvas-компонентов (WaveBackground, Projects 3D)
const mockWebGLContext: Partial<WebGLRenderingContext> = {
    canvas: {} as HTMLCanvasElement,
    drawingBufferWidth: 800,
    drawingBufferHeight: 600,
    getExtension: () => null,
    getParameter: () => null,
    createShader: () => ({}) as WebGLShader,
    shaderSource: () => {},
    compileShader: () => {},
    getShaderParameter: () => true,
    createProgram: () => ({}) as WebGLProgram,
    attachShader: () => {},
    linkProgram: () => {},
    getProgramParameter: () => true,
    useProgram: () => {},
    createBuffer: () => ({}) as WebGLBuffer,
    bindBuffer: () => {},
    bufferData: () => {},
    enableVertexAttribArray: () => {},
    vertexAttribPointer: () => {},
    getAttribLocation: () => 0,
    getUniformLocation: () => ({}) as WebGLUniformLocation,
    uniform1f: () => {},
    uniform2f: () => {},
    uniform3f: () => {},
    uniform4f: () => {},
    uniform1i: () => {},
    uniformMatrix4fv: () => {},
    viewport: () => {},
    clear: () => {},
    clearColor: () => {},
    drawArrays: () => {},
    drawElements: () => {},
    enable: () => {},
    disable: () => {},
    blendFunc: () => {},
    createTexture: () => ({}) as WebGLTexture,
    bindTexture: () => {},
    texImage2D: () => {},
    texParameteri: () => {},
    createFramebuffer: () => ({}) as WebGLFramebuffer,
    bindFramebuffer: () => {},
    framebufferTexture2D: () => {},
    deleteBuffer: () => {},
    deleteShader: () => {},
    deleteProgram: () => {},
    deleteTexture: () => {},
    deleteFramebuffer: () => {},
};

HTMLCanvasElement.prototype.getContext = vi.fn((contextId: string) => {
    if (contextId === 'webgl' || contextId === 'webgl2' || contextId === 'experimental-webgl') {
        return mockWebGLContext as WebGLRenderingContext;
    }
    if (contextId === '2d') {
        return {
            fillRect: vi.fn(),
            clearRect: vi.fn(),
            getImageData: vi.fn(() => ({ data: new Array(4) })),
            putImageData: vi.fn(),
            createImageData: vi.fn(() => []),
            setTransform: vi.fn(),
            drawImage: vi.fn(),
            save: vi.fn(),
            fillText: vi.fn(),
            restore: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            closePath: vi.fn(),
            stroke: vi.fn(),
            translate: vi.fn(),
            scale: vi.fn(),
            rotate: vi.fn(),
            arc: vi.fn(),
            fill: vi.fn(),
            measureText: vi.fn(() => ({ width: 0 })),
            canvas: {} as HTMLCanvasElement,
        } as unknown as CanvasRenderingContext2D;
    }
    return null;
}) as typeof HTMLCanvasElement.prototype.getContext;

// ResizeObserver mock
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// matchMedia mock
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});
