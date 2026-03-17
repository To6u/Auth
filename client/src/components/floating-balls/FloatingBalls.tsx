import type React from 'react';
import { useRef } from 'react';
import { useBouncingBalls, useHitTest } from './useBouncingBalls';
import { useImageSets, useImages } from './useImages';
import './floating-balls.css';

interface FloatingBallsProps {
    images: string[];
    altImages?: string[][];
    className?: string;
    containerRef?: React.RefObject<HTMLDivElement | null> | React.RefObject<HTMLDivElement>;
    autoSwitch?: boolean;
}

export const FloatingBalls = ({
    images: imageSrcs,
    altImages: altImageSrcs = [],
    className,
    containerRef: externalRef,
    autoSwitch = false,
}: FloatingBallsProps) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const containerRef = (externalRef ?? internalRef) as React.RefObject<HTMLDivElement | null>;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const hoveredIdRef = useRef<number | null>(null);

    const images = useImages(imageSrcs);
    const altImages = useImageSets(altImageSrcs);

    const { sortedRef } = useBouncingBalls({
        count: imageSrcs.length,
        containerRef,
        canvasRef,
        images,
        altImages,
        hoveredIdRef,
        autoSwitch,
    });

    const { handleMouseMove, handleMouseLeave } = useHitTest(sortedRef, containerRef, hoveredIdRef);

    return (
        <div
            ref={containerRef}
            className={`floating-balls${className ? ` ${className}` : ''}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <canvas ref={canvasRef} className="floating-balls__canvas" />
        </div>
    );
};

export default FloatingBalls;
