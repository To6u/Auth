import { Environment, OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type * as THREE from 'three';
import { ErrorBoundary } from '@/components/error-boundary/ErrorBoundary.tsx';
import './companion.css';

useGLTF.preload('/scene-slim-opt.glb');

const CAMERA = { position: [-0.008, 0.999, 0.053] as [number, number, number], fov: 45 };
const SPIN_MS = 2500;
const PAUSE_MS = 5000;

function Model({ onLoad }: { onLoad: () => void }) {
    const { scene } = useGLTF('/scene-slim-opt.glb');
    const ref = useRef<THREE.Group>(null);

    const clonedScene = useRef<THREE.Group | null>(null);
    if (clonedScene.current === null) {
        clonedScene.current = scene.clone(true);
        const bg = clonedScene.current.getObjectByName('background');
        if (bg) bg.removeFromParent();
    }

    useEffect(() => {
        onLoad();
    }, [onLoad]);

    if (!clonedScene.current) return null;

    return <primitive ref={ref} object={clonedScene.current} />;
}

function Invalidator({ autoRotate }: { autoRotate: boolean }) {
    const { invalidate } = useThree();

    useEffect(() => {
        if (autoRotate) invalidate();
    }, [autoRotate, invalidate]);

    useFrame(({ invalidate: inv }) => {
        if (autoRotate) inv();
    });

    return null;
}

export function Companion() {
    const [hovered, setHovered] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [hintVisible, setHintVisible] = useState(false);
    const handleLoad = useCallback(() => setLoaded(true), []);
    const cycleStopRef = useRef<(() => void) | null>(null);

    const startCycle = useCallback((delay: number) => {
        let t1: ReturnType<typeof setTimeout>;
        let t2: ReturnType<typeof setTimeout>;
        let cancelled = false;

        const stop = () => {
            cancelled = true;
            clearTimeout(t1);
            clearTimeout(t2);
        };

        t1 = setTimeout(() => {
            if (cancelled) return;
            setHintVisible(true);
            t2 = setTimeout(() => {
                if (cancelled) return;
                setHintVisible(false);
                cycleStopRef.current = startCycle(PAUSE_MS);
            }, SPIN_MS);
        }, delay);

        return stop;
    }, []);

    useEffect(() => {
        if (!loaded) return;
        cycleStopRef.current = startCycle(900);
        return () => cycleStopRef.current?.();
    }, [loaded, startCycle]);

    const handleMouseEnter = useCallback(() => {
        setHovered(true);
        setHintVisible(false);
        cycleStopRef.current?.();
        cycleStopRef.current = null;
    }, []);

    const handleMouseLeave = useCallback(() => {
        setHovered(false);
        cycleStopRef.current = startCycle(PAUSE_MS);
    }, [startCycle]);

    return (
        <div
            className={`companion${hovered ? ' companion--interactive' : ''}${loaded ? ' companion--loaded' : ''}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <AnimatePresence>
                {hintVisible && (
                    <motion.span
                        key="hint"
                        className="companion__hint"
                        aria-hidden="true"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'tween', ease: [0.619, -1, 0.269, 2], duration: 0.4 }}
                    >
                        <span className="companion__hint-icon">
                            <RefreshCw size={18} strokeWidth={1.5} />
                        </span>
                    </motion.span>
                )}
            </AnimatePresence>
            <ErrorBoundary fallback={null} name="Companion">
                <Canvas
                    className="companion__canvas"
                    camera={CAMERA}
                    dpr={[1, 2]}
                    frameloop="demand"
                >
                    <ambientLight intensity={1} />
                    <directionalLight position={[2, 4, 3]} intensity={3} />
                    <OrbitControls
                        enableZoom={false}
                        enablePan={false}
                        autoRotate={!hovered}
                        autoRotateSpeed={0.5}
                    />
                    <Suspense fallback={null}>
                        <Environment preset="city" />
                        <Model onLoad={handleLoad} />
                    </Suspense>
                    <Invalidator autoRotate={!hovered} />
                </Canvas>
            </ErrorBoundary>
        </div>
    );
}
