"use client";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function Snow({ shake }: { shake: number }) {
  const N = 420;
  const ref = useRef<THREE.Points>(null);
  const last = useRef(shake);
  const energy = useRef(1);
  const { pos, vel } = useMemo(() => {
    const pos = new Float32Array(N * 3), vel = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = Math.cbrt(Math.random()) * 0.95, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      pos.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)], i * 3);
    }
    return { pos, vel };
  }, []);
  useFrame((_, dt) => {
    if (shake !== last.current) {
      last.current = shake;
      energy.current = 1.4;
    }
    const e = (energy.current *= 0.986);
    const p = ref.current!.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < N; i++) {
      const k = i * 3;
      vel[k] += (Math.random() - 0.5) * 0.08 * e;
      vel[k + 1] += (Math.random() - 0.45) * 0.08 * e - 0.004;
      vel[k + 2] += (Math.random() - 0.5) * 0.08 * e;
      for (let j = 0; j < 3; j++) vel[k + j] *= 0.95;
      pos[k] += vel[k] * dt * 4;
      pos[k + 1] += vel[k + 1] * dt * 4;
      pos[k + 2] += vel[k + 2] * dt * 4;
      const d = Math.hypot(pos[k], pos[k + 1], pos[k + 2]);
      if (d > 0.95) {
        pos[k] *= 0.94 / d;
        pos[k + 1] *= 0.94 / d;
        pos[k + 2] *= 0.94 / d;
        vel[k + 1] = -Math.abs(vel[k + 1]) * 0.3;
      }
      if (pos[k + 1] < -0.62) pos[k + 1] = -0.62;
    }
    p.array.set(pos);
    p.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[pos, 3]} /></bufferGeometry>
      <pointsMaterial size={0.035} color="#ffffff" transparent opacity={0.92} depthWrite={false} sizeAttenuation />
    </points>
  );
}

function Scene({ photo, shake }: { photo: string; shake: number }) {
  const tex = useLoader(THREE.TextureLoader, photo);
  tex.colorSpace = THREE.SRGBColorSpace;
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.y = Math.sin(clock.elapsedTime * 0.35) * 0.25;
  });
  return (
    <group ref={group}>
      <mesh position={[0, 0.02, 0]}>
        <circleGeometry args={[0.72, 64]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.66, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.72, 48]} />
        <meshStandardMaterial color="#efe8ff" roughness={0.9} />
      </mesh>
      <Snow shake={shake} />
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhysicalMaterial transmission={1} thickness={0.25} roughness={0.04} ior={1.3} clearcoat={1} transparent opacity={0.35} color="#e8e0ff" envMapIntensity={1} />
      </mesh>
      <mesh position={[0, -1.08, 0]}>
        <cylinderGeometry args={[0.82, 1.0, 0.42, 64]} />
        <meshStandardMaterial color="#7a3519" roughness={0.45} metalness={0.15} />
      </mesh>
      <mesh position={[0, -0.9, 0]}>
        <torusGeometry args={[0.8, 0.025, 12, 64]} />
        <meshStandardMaterial color="#ffc870" emissive="#ffc870" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

export default function Globe3D({ photo, shake, size = 320 }: { photo: string; shake: number; size?: number }) {
  return (
    <div style={{ width: size, height: size * 1.22 }}>
      <Canvas camera={{ position: [0, 0.05, 3.3], fov: 42 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.8} />
        <pointLight position={[2, 3, 3]} intensity={30} color="#ffd9a0" />
        <pointLight position={[-3, -1, 2]} intensity={14} color="#c9b6ff" />
        <Scene photo={photo} shake={shake} />
      </Canvas>
    </div>
  );
}
