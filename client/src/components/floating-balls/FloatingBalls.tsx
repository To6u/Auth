import React, { useRef } from 'react';
import { useBouncingBalls, useHitTest } from './useBouncingBalls';
import { useImages, useImageSets } from './useImages';
import './floating-balls.css';

interface FloatingBallsProps {
    images: string[];
    altImages?: string[][];
    className?: string;
    containerRef?: React.RefObject<HTMLDivElement | null> | React.RefObject<HTMLDivElement>;
}

export const FloatingBalls = ({ images: imageSrcs, altImages: altImageSrcs = [], className, containerRef: externalRef }: FloatingBallsProps) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const containerRef = (externalRef ?? internalRef) as React.RefObject<HTMLDivElement | null>;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const hoveredIdRef = useRef<number | null>(null);

    const images = useImages(imageSrcs);
    const altImages = useImageSets(altImageSrcs);

    const ballsRef = useBouncingBalls({
        count: imageSrcs.length,
        containerRef,
        canvasRef,
        images,
        altImages,
        hoveredIdRef,
    });

    const { handleMouseMove, handleMouseLeave } = useHitTest(ballsRef, containerRef, hoveredIdRef);

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
