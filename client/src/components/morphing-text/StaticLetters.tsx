import React, { useEffect, useRef, useState, memo } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import './static-letters.css';

// Thresholds для IntersectionObserver — 7 вместо 101
const INTERSECTION_THRESHOLDS = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1];

const StaticLetters: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isInViewport, setIsInViewport] = useState(true);

    // Прогресс анимации выхода из viewport
    const exitProgress = useMotionValue(0);

    // Трансформируем в смещение
    const deX = useTransform(exitProgress, [0, 1], [50, -400]);
    const erX = useTransform(exitProgress, [0, 1], [-50, 400]);

    // Fade out при выходе из viewport
    const opacity = useTransform(exitProgress, [0, 0.8, 1], [1, 0.3, 0]);

    // Spring анимации — активны только когда в viewport
    const springConfig = { stiffness: 60, damping: 20, mass: 0.8 };
    const smoothDeX = useSpring(deX, springConfig);
    const smoothErX = useSpring(erX, springConfig);
    const smoothOpacity = useSpring(opacity, { stiffness: 100, damping: 20 });

    // Определяем нужна ли CSS float анимация
    // Включаем только когда полностью виден (exitProgress близок к 0)
    const shouldAnimate = isInViewport && exitProgress.get() < 0.05;

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const heroSection = container.closest('.hero');
        if (!heroSection) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                const ratio = entry.intersectionRatio;
                const isVisible = entry.isIntersecting && ratio > 0.05;

                setIsInViewport(isVisible);
                exitProgress.set(1 - ratio);
            },
            {
                threshold: INTERSECTION_THRESHOLDS,
                rootMargin: '-100px 0px 0px 0px'
            }
        );

        observer.observe(heroSection);

        return () => observer.disconnect();
    }, [exitProgress]);

    // Когда полностью вне viewport — рендерим placeholder
    if (!isInViewport && exitProgress.get() >= 0.95) {
        return (
            <div
                ref={containerRef}
                className="static-letters"
                style={{ visibility: 'hidden' }}
            />
        );
    }

    return (
        <motion.div
            ref={containerRef}
            className="static-letters"
            style={{ opacity: smoothOpacity }}
        >
            <motion.svg
                className={shouldAnimate ? "static-letters__de" : "static-letters__de-no-anim"}
                viewBox="0 0 260 150"
                xmlns="http://www.w3.org/2000/svg"
                style={{ x: smoothDeX }}
            >
                <path
                    d="M56.8182 147.443H0L24.1477 1.98864H78.6932C93.6553 1.98864 106.155 4.99527 116.193 11.0085C126.231 17.0218 133.357 25.6155 137.571 36.7898C141.785 47.964 142.614 61.2689 140.057 76.7046C137.595 91.572 132.599 104.285 125.071 114.844C117.59 125.402 108.026 133.475 96.3778 139.063C84.7775 144.65 71.5909 147.443 56.8182 147.443ZM45.0284 113.92H59.375C66.572 113.92 72.9877 112.666 78.6222 110.156C84.304 107.599 89.0388 103.338 92.8267 97.3722C96.6619 91.3589 99.4318 83.1439 101.136 72.7273C102.746 62.8788 102.699 55.2794 100.994 49.929C99.2898 44.5313 96.0464 40.7907 91.2642 38.7074C86.482 36.5767 80.303 35.5114 72.7273 35.5114H58.0966L45.0284 113.92Z"
                    fill="white"
                />
                <path
                    d="M122.68 147.443L146.827 1.98864H251.657L246.259 33.8068H180.918L176.941 58.8068H236.884L231.486 90.625H171.543L167.566 115.625H232.623L227.225 147.443H122.68Z"
                    fill="white"
                />
            </motion.svg>

            <motion.svg
                className={shouldAnimate ? "static-letters__er" : "static-letters__er-no-anim"}
                viewBox="0 0 1020 150"
                xmlns="http://www.w3.org/2000/svg"
                style={{ x: smoothErX }}
            >
                <path
                    d="M785.711 147.443L809.859 1.98864H914.688L909.29 33.8068H843.95L839.972 58.8068H899.915L894.518 90.625H834.575L830.597 115.625H895.654L890.256 147.443H785.711Z"
                    fill="white"
                />
                <path
                    d="M987.175 93.2055L1007.72 147.443H964.818L947.248 99.4318H933.635L925.614 147.443H886.125L910.273 1.98864H973.057C983.852 1.98864 992.967 3.9536 1000.4 7.88353C1007.83 11.8135 1013.18 17.4716 1016.45 24.858C1019.72 32.2443 1020.5 41.0985 1018.8 51.4205C1017.09 61.8371 1013.33 70.6203 1007.5 77.7699C1002.11 84.401 995.334 89.5462 987.175 93.2055ZM944.648 33.5227L938.762 68.75H952.602C957.242 68.75 961.314 68.1818 964.818 67.0455C968.322 65.8618 971.163 64.0152 973.341 61.5057C975.519 58.9489 976.939 55.5871 977.602 51.4205C978.265 47.2538 977.934 43.8684 976.608 41.2642C975.282 38.6127 973.08 36.6714 970.003 35.4403C966.925 34.1619 963.114 33.5227 958.568 33.5227H944.648Z"
                    fill="white"
                />
            </motion.svg>
        </motion.div>
    );
};

export default memo(StaticLetters);