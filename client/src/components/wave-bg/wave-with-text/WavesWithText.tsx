import { memo, useRef } from 'react';
import { useWaveAnimation } from './useWaveAnimation';
import './waves-canvas.css';

interface Props {
    showText?: boolean;
    /** На мобилке/планшете — волны статичны, текст анимируется */
    isStatic?: boolean;
    /** Только текст без волн (WebGL canvas остаётся) — для мобильных устройств */
    noWaves?: boolean;
}

const WavesWithText = memo(({ showText = true, isStatic = false, noWaves = false }: Props) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // Ref синхронизируется с пропом при каждом рендере —
    // RAF-loop читает актуальное значение без пересоздания эффекта
    const showTextRef = useRef(showText);
    showTextRef.current = showText;

    useWaveAnimation(canvasRef, showTextRef, isStatic, noWaves);
    return <canvas ref={canvasRef} className="waves-canvas" />;
});

WavesWithText.displayName = 'WavesWithText';

export default WavesWithText;
