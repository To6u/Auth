import { useRef, memo } from 'react';
import { useWaveAnimation } from './useWaveAnimation';
import './waves-canvas.css';

const WavesWithText = memo(() => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useWaveAnimation(canvasRef);
    return <canvas ref={canvasRef} className="waves-canvas" />;
});

WavesWithText.displayName = 'WavesWithText';

export default WavesWithText;