import { useGLTF } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useRef } from 'react';
import { Mesh, MeshStandardMaterial } from 'three';
import type * as THREE from 'three';
import { ErrorBoundary } from '@/components/error-boundary/ErrorBoundary';

const MODEL = '/medal-nd.glb';
useGLTF.preload(MODEL);

function MedalMesh() {
    const { scene } = useGLTF(MODEL);
    const groupRef = useRef<THREE.Group>(null);

    useEffect(() => {
        scene.traverse((child) => {
            if (child instanceof Mesh) {
                const vertexCount = child.geometry.attributes.position?.count ?? 0;
                if (vertexCount <= 4) {
                    child.visible = false;
                    return;
                }
                child.material = new MeshStandardMaterial({
                    color: '#fbbf24',
                    metalness: 0.8,
                    roughness: 0.2,
                });
            }
        });
    }, [scene]);

    useFrame((_, delta) => {
        if (groupRef.current) groupRef.current.rotation.z += delta * 0.4;
    });

    return (
        <group ref={groupRef} scale={2}>
            <group rotation={[-Math.PI / 2, 0, 0]}>
                <primitive object={scene} />
            </group>
        </group>
    );
}

export function Medal3DIcon() {
    return (
        <div className="medal-3d-icon" aria-hidden="true">
            <ErrorBoundary fallback={null}>
                <Canvas
                    camera={{ position: [-1.13, -1.21, 1.87], fov: 50 }}
                    dpr={[1, 2]}
                    gl={{ antialias: true, alpha: true }}
                >
                    <ambientLight intensity={1.2} />
                    <directionalLight position={[2, 2, 2]} intensity={1.5} />
                    <directionalLight position={[-2, -1, 1]} intensity={0.5} color="#fde68a" />
                    <Suspense fallback={null}>
                        <MedalMesh />
                    </Suspense>
                </Canvas>
            </ErrorBoundary>
        </div>
    );
}
