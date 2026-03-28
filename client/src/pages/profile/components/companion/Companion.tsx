import { Environment, OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type * as THREE from 'three';
import { ErrorBoundary } from '@/components/error-boundary/ErrorBoundary.tsx';
import './companion.css';

useGLTF.preload('/scene-slim-opt.glb');

const CAMERA = { position: [-0.008, 0.999, 0.053] as [number, number, number], fov: 45 };

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
    const handleLoad = useCallback(() => setLoaded(true), []);

    return (
        <div
            className={`companion${hovered ? ' companion--interactive' : ''}${loaded ? ' companion--loaded' : ''}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
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
