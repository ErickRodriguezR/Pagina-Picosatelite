"use client";

import { useRef, useMemo, useState, useCallback, useEffect } from "react";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center, Bounds } from "@react-three/drei";
import * as THREE from "three";
import { ComponentTooltip } from "./ComponentTooltip";
import type { TooltipData } from "./ComponentTooltip";

export interface LayerSpec {
  id: string;
  nombre: string;
  modelo: string;
  categoria: string;
  color: string;
  specs?: Record<string, string>;
}

export interface SatelliteModelProps {
  layers: LayerSpec[];
  selectedId?: string | null;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string | null) => void;
  shellOpen?: boolean;
  explode?: number;
  autoRotate?: boolean;
}

const MODEL_PATH = "/models/satellite-shell.glb";

/*
 * Direcciones de explosión relativas al centro del modelo.
 * Se multiplican por el factor `explode` (0–1).
 * Ajusta estos valores si la dirección no es la esperada.
 */
const EXPLODE_DIRECTIONS: Record<string, [number, number, number]> = {
  tapadera_sup: [0, 1, 0],
  tapadera_inf: [0, -1, 0],
  base_paracaidas: [0, 1.5, 0],
  cilindro: [0, 0, 0],
};

/* Cuánto se separa (metros) a explode = 1 */
const EXPLODE_DISTANCE = 0.06;

/* Cuánto se abren las tapas con shellOpen */
const SHELL_DISTANCE = 0.025;
const SHELL_DIRECTIONS: Record<string, [number, number, number]> = {
  tapadera_sup: [0, 1, 0],
  tapadera_inf: [0, -1, 0],
  base_paracaidas: [0, 0, 0],
  cilindro: [0, 0, 0],
};

/* ─── Mapa de nombres de objetos en el GLB → IDs de capas ─── */
/*
 * IMPORTANTE: Los nombres aquí deben coincidir EXACTAMENTE con los nombres
 * de los objetos en Blender (panel Outliner). Son case-sensitive.
 * 
 * Si tus objetos se llaman diferente, actualiza este mapa.
 * Ejemplos comunes de cómo Blender nombra objetos importados de STL:
 *   "tapadera_sup", "Tapadera_sup", "tapadera_sup.001", etc.
 *
 * Abre la consola del navegador (F12) para ver los nombres reales impresos.
 */
const MESH_TO_LAYER: Record<string, string> = {
  tapadera_sup: "tapadera-sup",
  tapadera_inf: "tapadera-inf",
  base_paracaidas: "base-paracaidas",
  cilindro: "cilindro",
};

/* ─── Componente interno: Escena 3D con el modelo GLB ─── */

interface SceneProps {
  layers: LayerSpec[];
  selectedId?: string | null;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string | null) => void;
  shellOpen?: boolean;
  explode?: number;
  onPointerData?: (data: { layerId: string; x: number; y: number } | null) => void;
}

function Scene({ layers, selectedId, onHover, onSelect, shellOpen, explode = 0, onPointerData }: SceneProps) {
  const { scene } = useGLTF(MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);
  const { gl } = useThree();

  // Guardar posiciones originales de cada mesh al cargar
  const originalPositions = useRef<Map<string, THREE.Vector3>>(new Map());

  // Encontrar todas las mallas y guardar sus posiciones originales una sola vez
  const meshList = useMemo(() => {
    const list: THREE.Mesh[] = [];
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        list.push(mesh);
        // Guardar posición original si no la tenemos
        if (!originalPositions.current.has(mesh.name)) {
          originalPositions.current.set(mesh.name, mesh.position.clone());
        }
      }
    });
    return list;
  }, [scene]);

  // Log de nombres de objetos para debug (solo una vez)
  useEffect(() => {
    console.log(
      "[SatelliteModel] Objetos encontrados en el GLB:",
      meshList.map((m) => m.name)
    );
    console.log(
      "[SatelliteModel] Nombres esperados en MESH_TO_LAYER:",
      Object.keys(MESH_TO_LAYER)
    );
    
    const found = meshList.filter((m) => MESH_TO_LAYER[m.name]);
    const notFound = meshList.filter((m) => !MESH_TO_LAYER[m.name]);
    if (notFound.length > 0) {
      console.warn(
        "[SatelliteModel] ⚠️ Estos objetos NO están mapeados (no tendrán color ni interacción):",
        notFound.map((m) => m.name)
      );
    }
    if (found.length > 0) {
      console.log(
        "[SatelliteModel] ✓ Objetos mapeados correctamente:",
        found.map((m) => m.name)
      );
    }
  }, [meshList]);

  // Aplicar colores según LAYERS y resaltar selección
  useEffect(() => {
    meshList.forEach((mesh) => {
      const layerId = MESH_TO_LAYER[mesh.name];
      const layer = layerId ? layers.find((l) => l.id === layerId) : null;

      // Asegurar que el material sea individual (no compartido)
      if (mesh.material && !Array.isArray(mesh.material)) {
        mesh.material = (mesh.material as THREE.MeshStandardMaterial).clone();
        const mat = mesh.material as THREE.MeshStandardMaterial;

        // Aplicar color de la capa
        if (layer) {
          mat.color = new THREE.Color(layer.color);
          mat.roughness = 0.5;
          mat.metalness = 0.1;
        }

        // Highlight de selección
        if (layerId === selectedId) {
          mat.emissive = new THREE.Color("#FFB020");
          mat.emissiveIntensity = 0.4;
        } else {
          mat.emissive = new THREE.Color("#000000");
          mat.emissiveIntensity = 0;
        }
      }
    });
  }, [meshList, layers, selectedId]);

  // Aplicar posiciones: original + shell offset + explode offset
  useEffect(() => {
    meshList.forEach((mesh) => {
      const original = originalPositions.current.get(mesh.name);
      if (!original) return;

      // Empezar desde la posición original del GLB
      mesh.position.copy(original);

      const name = mesh.name;

      // Sumar offset de shell open
      if (shellOpen) {
        const dir = SHELL_DIRECTIONS[name];
        if (dir) {
          mesh.position.x += dir[0] * SHELL_DISTANCE;
          mesh.position.y += dir[1] * SHELL_DISTANCE;
          mesh.position.z += dir[2] * SHELL_DISTANCE;
        }
      }

      // Sumar offset de explosión
      if (explode > 0) {
        const dir = EXPLODE_DIRECTIONS[name];
        if (dir) {
          mesh.position.x += dir[0] * EXPLODE_DISTANCE * explode;
          mesh.position.y += dir[1] * EXPLODE_DISTANCE * explode;
          mesh.position.z += dir[2] * EXPLODE_DISTANCE * explode;
        }
      }
    });
  }, [meshList, shellOpen, explode]);

  // Eventos de interacción
  const handlePointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      const name = e.object.name;
      const layerId = MESH_TO_LAYER[name] ?? null;
      if (layerId) {
        onHover?.(layerId);
        gl.domElement.style.cursor = "pointer";
        const rect = gl.domElement.getBoundingClientRect();
        onPointerData?.({ layerId, x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    },
    [onHover, onPointerData, gl]
  );

  const handlePointerOut = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onHover?.(null);
      gl.domElement.style.cursor = "grab";
      onPointerData?.(null);
    },
    [onHover, onPointerData, gl]
  );

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      const name = e.object.name;
      const layerId = MESH_TO_LAYER[name] ?? null;
      onSelect?.(layerId);
    },
    [onSelect]
  );

  return (
    <group
      ref={groupRef}
      rotation={[0, 0, 0]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {/* Renderizar la escena completa del GLB como está — respeta posiciones y jerarquía */}
      <primitive object={scene} />
    </group>
  );
}

/* ─── Fallback mientras no existe el GLB ─── */

function PlaceholderScene() {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.08, 32]} />
        <meshStandardMaterial color="#2A3B57" transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.031, 0.031, 0.008, 32]} />
        <meshStandardMaterial color="#E7ECF2" />
      </mesh>
      <mesh position={[0, -0.045, 0]}>
        <cylinderGeometry args={[0.031, 0.031, 0.008, 32]} />
        <meshStandardMaterial color="#E7ECF2" />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <coneGeometry args={[0.025, 0.015, 32]} />
        <meshStandardMaterial color="#5B6C88" />
      </mesh>
    </group>
  );
}

/* ─── Componente principal ─── */

export function SatelliteModel({
  layers,
  selectedId,
  onHover,
  onSelect,
  shellOpen = false,
  explode = 0,
  autoRotate = false,
}: SatelliteModelProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [modelAvailable, setModelAvailable] = useState<boolean | null>(null);

  const tooltipData = useMemo<TooltipData | null>(() => {
    const layer = selectedId ? layers.find((item) => item.id === selectedId) : null;
    if (!layer) return null;
    return { nombre: layer.nombre, modelo: layer.modelo, specs: layer.specs ?? {} };
  }, [selectedId, layers]);

  // Detectar si el archivo GLB existe
  useEffect(() => {
    fetch(MODEL_PATH, { method: "HEAD" })
      .then((res) => setModelAvailable(res.ok))
      .catch(() => setModelAvailable(false));
  }, []);

  const handlePointerData = useCallback(
    (data: { layerId: string; x: number; y: number } | null) => {
      setTooltipPos(data ? { x: data.x, y: data.y } : null);
    },
    []
  );

  const handleCanvasPointerMissed = useCallback(() => {
    onSelect?.(null);
    onHover?.(null);
    setTooltipPos(null);
  }, [onSelect, onHover]);

  return (
    <div className="stage" ref={stageRef}>
      <div className="stage__hud" aria-hidden="true">
        <span>PS-01 · vista de ensamble</span>
        <span>esc. 1:1</span>
      </div>

      <Canvas
        camera={{ position: [60, 0.05, 0.2], fov: 40, near: 0.001, far: 10 }}
        onPointerMissed={handleCanvasPointerMissed}
        style={{ position: "absolute", inset: 0 }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[1, 2, 3]} intensity={1.2} />
        <directionalLight position={[-1, -0.5, -1]} intensity={0.3} />

        {modelAvailable ? (
          <Bounds fit clip observe margin={1.6}>
            <Scene
              layers={layers}
              selectedId={selectedId}
              onHover={onHover}
              onSelect={onSelect}
              shellOpen={shellOpen}
              explode={explode}
              onPointerData={handlePointerData}
            />
          </Bounds>
        ) : (
          <Bounds fit clip observe margin={1.6}>
            <PlaceholderScene />
          </Bounds>
        )}

        <OrbitControls
          autoRotate={autoRotate}
          autoRotateSpeed={1.5}
          enableDamping
          dampingFactor={0.08}
          minPolarAngle={Math.PI * 0.15}
          maxPolarAngle={Math.PI * 0.85}
          makeDefault
        />
      </Canvas>

      {modelAvailable === false && (
        <div
          className="notice"
          role="note"
          style={{
            position: "absolute",
            bottom: "var(--space-3)",
            left: "var(--space-3)",
            right: "var(--space-3)",
            fontSize: "0.75rem",
            pointerEvents: "none",
          }}
        >
          <p style={{ margin: 0 }}>
            Geometría <b>placeholder</b>. Coloca{" "}
            <code>satellite-shell.glb</code> en <code>public/models/</code>{" "}
            para ver el modelo real.
          </p>
        </div>
      )}

      <ComponentTooltip data={tooltipData} position={tooltipPos} />
    </div>
  );
}

// Precargar el modelo
try {
  useGLTF.preload(MODEL_PATH);
} catch {
  // El archivo aún no existe
}
