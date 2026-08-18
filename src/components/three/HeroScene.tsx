"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Float } from "@react-three/drei";
import * as THREE from "three";

useGLTF.preload("/models/toy_car_opt.glb");

function Car() {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF("/models/toy_car_opt.glb");

  useEffect(() => {
    scene.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return;
      const mesh = obj as THREE.Mesh;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of materials) {
        const m = mat as THREE.MeshStandardMaterial;
        if (m.name === "Glass") {
          m.color.set("#22d3ee");
          m.metalness = 0.1;
          m.roughness = 0.05;
          m.emissive.set("#06b6d4");
          m.emissiveIntensity = 0.25;
          m.transparent = true;
          m.opacity = 0.9;
        } else {
          m.color.set("#c084fc");
          m.metalness = 0.7;
          m.roughness = 0.3;
          m.emissive.set("#a855f7");
          m.emissiveIntensity = 0.35;
        }
      }
    });
  }, [scene]);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.35;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.12;
  });

  return (
    <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.3}>
      <group ref={groupRef} scale={55} rotation={[0, Math.PI / 2, 0]}>
        <primitive object={scene} />
      </group>
    </Float>
  );
}

function createParticleGeometry() {
  const count = 1200;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 30;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return geometry;
}

function Particles() {
  const ref = useRef<THREE.Points>(null);
  const [geometry] = useState(createParticleGeometry);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.02;
    ref.current.rotation.x = state.clock.elapsedTime * 0.01;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.03}
        color="#a855f7"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

export default function HeroScene({ active = true }: { active?: boolean }) {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        frameloop={active ? "always" : "never"}
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ powerPreference: "high-performance", antialias: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={1.6} />
        <pointLight position={[-5, -5, 5]} intensity={0.8} color="#06b6d4" />
        <pointLight position={[0, 2, 3]} intensity={0.8} color="#c084fc" />
        <Car />
        <Particles />
      </Canvas>
    </div>
  );
}