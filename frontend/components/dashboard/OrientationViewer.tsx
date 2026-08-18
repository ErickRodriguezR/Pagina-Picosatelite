"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { Vector3Reading } from "@/lib/api";

/* ─── Tipos ─── */

export interface OrientationViewerProps {
  /** Último vector de giroscopio (°/s) para aplicar como rotación acumulada. */
  gyro: Vector3Reading | null;
  /** Último vector de acelerómetro (g) — se usa para estimar inclinación estática. */
  accel: Vector3Reading | null;
}

/* ─── Carcasa (cilindro simplificado del CanSat) ─── */

function CansatShell({ gyro, accel }: { gyro: Vector3Reading | null; accel: Vector3Reading | null }) {
  const groupRef = useRef<THREE.Group>(null!);
  const rotRef = useRef(new THREE.Euler(0, 0, 0, "XYZ"));

  // Escala de tiempo fija para simular la integración del gyro
  const dt = 1 / 60;

  useFrame(() => {
    if (!groupRef.current) return;

    if (gyro) {
      // Integrar velocidad angular (°/s → rad/frame)
      const degToRad = Math.PI / 180;
      rotRef.current.x += gyro.x * degToRad * dt;
      rotRef.current.y += gyro.y * degToRad * dt;
      rotRef.current.z += gyro.z * degToRad * dt;
    } else if (accel) {
      // Fallback: inclinación estática desde acelerómetro
      const pitch = Math.atan2(accel.y, Math.sqrt(accel.x ** 2 + accel.z ** 2));
      const roll = Math.atan2(-accel.x, accel.z);
      rotRef.current.x = pitch;
      rotRef.current.z = roll;
    }

    groupRef.current.rotation.copy(rotRef.current);
  });

  // Geometría de la cápsula: cilindro principal + tapa superior redondeada
  const capsuleRadius = 0.6; // ~60mm escalado
  const capsuleHeight = 1.1; // ~110mm escalado

  return (
    <group ref={groupRef}>
      {/* Cuerpo cilíndrico */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[capsuleRadius, capsuleRadius, capsuleHeight, 32]} />
        <meshStandardMaterial
          color="#1a2a40"
          metalness={0.3}
          roughness={0.6}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Tapa superior */}
      <mesh position={[0, capsuleHeight / 2, 0]}>
        <sphereGeometry args={[capsuleRadius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#1a2a40"
          metalness={0.3}
          roughness={0.6}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Tapa inferior */}
      <mesh position={[0, -capsuleHeight / 2, 0]} rotation={[Math.PI, 0, 0]}>
        <sphereGeometry args={[capsuleRadius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#1a2a40"
          metalness={0.3}
          roughness={0.6}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Líneas de referencia (anillos) */}
      <mesh position={[0, capsuleHeight * 0.25, 0]}>
        <torusGeometry args={[capsuleRadius + 0.01, 0.015, 8, 48]} />
        <meshStandardMaterial color="#FFB020" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, -capsuleHeight * 0.25, 0]}>
        <torusGeometry args={[capsuleRadius + 0.01, 0.015, 8, 48]} />
        <meshStandardMaterial color="#FFB020" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Indicador de orientación (flecha "arriba" del cansat) */}
      <mesh position={[0, capsuleHeight / 2 + capsuleRadius + 0.15, 0]}>
        <coneGeometry args={[0.08, 0.2, 12]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>

      {/* Ejes de referencia (miniatura) */}
      <axesHelper args={[1.2]} />
    </group>
  );
}

/* ─── Componente principal con Canvas ─── */

export function OrientationViewer({ gyro, accel }: OrientationViewerProps) {
  // Formato de datos para los indicadores
  const gyroText = gyro
    ? `X: ${gyro.x.toFixed(1)}°/s  Y: ${gyro.y.toFixed(1)}°/s  Z: ${gyro.z.toFixed(1)}°/s`
    : "Sin datos";

  return (
    <div className="panel panel--corner" style={{ position: "relative" }}>
      <div className="panel__title">
        <h3 style={{ fontSize: "0.98rem" }}>Orientación en tiempo real</h3>
        <span className="badge">MPU-6050</span>
      </div>
      <p className="muted" style={{ fontSize: "0.82rem", margin: "0 0 var(--space-3)" }}>
        Rotación de la carcasa integrada desde el giroscopio. Arrastra para orbitar.
      </p>

      {/* Canvas 3D */}
      <div
        style={{
          width: "100%",
          height: "280px",
          borderRadius: "var(--radius-md, 8px)",
          overflow: "hidden",
          background: "linear-gradient(180deg, #0a0f1a 0%, #111927 100%)",
        }}
      >
        <Canvas camera={{ position: [2.5, 1.5, 2.5], fov: 45 }}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[3, 5, 2]} intensity={0.8} />
          <pointLight position={[-3, -2, 4]} intensity={0.3} color="#60a5fa" />
          <CansatShell gyro={gyro} accel={accel} />
          <OrbitControls enablePan={false} enableZoom={true} dampingFactor={0.08} />
          <gridHelper args={[4, 8, "#1e293b", "#1e293b"]} position={[0, -1.2, 0]} />
        </Canvas>
      </div>

      {/* Lecturas del gyro */}
      <div
        className="mono"
        style={{
          fontSize: "0.72rem",
          color: "var(--text-muted)",
          marginTop: "var(--space-2)",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--space-1)",
        }}
      >
        <span>Gyro: {gyroText}</span>
        <span style={{ color: "#22c55e" }}>▲ = proa del satélite</span>
      </div>
    </div>
  );
}
