import { useRef, memo } from 'react';
import { useWaveAnimation } from './useWaveAnimation';
import './waves-canvas.css';

interface Props {
    showText?: boolean;
}

const WavesWithText = memo(({ showText = true }: Props) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // Ref синхронизируется с пропом при каждом рендере —
    // RAF-loop читает актуальное значение без пересоздания эффекта
    const showTextRef = useRef(showText);
    showTextRef.current = showText;

    useWaveAnimation(canvasRef, showTextRef);
    return <canvas ref={canvasRef} className="waves-canvas" />;
});

WavesWithText.displayName = 'WavesWithText';

export default WavesWithText;
