"use client";

import { useRef, useMemo, useState, useCallback, useEffect } from "react";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useGLTF, Bounds } from "@react-three/drei";
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
  hoveredId?: string | null;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string | null) => void;
  shellOpen?: boolean;
  explode?: number;
  /** Explosión individual por capa (id de capa → 0-1). Tiene prioridad sobre `explode` global para esa pieza. */
  explodePerLayer?: Record<string, number>;
  autoRotate?: boolean;
  /** Vista activa del ensamble: 0 carcasa, 1 electrónica, 2 protección, 3 todo. */
  viewIndex?: number;
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
  threaded_lid_top: [0, 1, 0],
  threaded_lid_bottom: [0, -1, 0],
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
  threaded_lid_top: [0, 1, 0],
  threaded_lid_bottom: [0, -1, 0],
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
  /* Carcasa / estructura (los nombres del GLB suelen incluir el sufijo .001) */
  tapadera_sup: "tapadera-sup",
  "tapadera_sup.001": "tapadera-sup",
  tapadera_inf: "tapadera-inf",
  "tapadera_inf.001": "tapadera-inf",
  threaded_lid_top: "tapadera-sup",
  threaded_lid_bottom: "tapadera-inf",
  base_paracaidas: "base-paracaidas",
  "base_paracaidas.001": "base-paracaidas",
  cilindro: "cilindro",
  "cilindro.001": "cilindro",
  "Parachute+": "paracaidas",
  parachute: "paracaidas",

  /* Grupos y meshes del GLB exportado desde Blender */
  pcb_base: "pcb-base",
  pcb_mid: "pcb-mid",
  pcb_top: "pcb-top",
  rp2040_zero: "rp2040-zero",
  sd_reader: "sd-reader",
  battery: "bateria",
  gps: "atgm336h",
  lora: "lora",
  mpu6050: "mpu6050",
  qmc5883p: "qmc5883p",
  xl6009: "xl6009",
  bmp280: "bmp280",
  egg: "egg",
  cono_inf001: "egg-protection",
  cono_superior001: "egg-protection",
  parte_inferior001: "estructura",
  parte_superior001: "estructura",

  /* PCB brain (3D_pcbBase) */
  "3D_pcbBase_2026-08-27": "pcb-base",
  "RP2040-zero": "rp2040-zero",
  "SD Reader.001": "sd-reader",

  /* PCB Metrics (3D_pcbMid) */
  "3D_pcbMid_2026-08-27": "pcb-mid",
  BMP280: "bmp280",
  "MPU 6050": "mpu6050",
  QMC5883P: "qmc5883p",

  /* PCB Top (3D_pcbTop) */
  "3D_pcbTop_2026-08-27": "pcb-top",
  ATGM336H: "atgm336h",
  LoRa: "lora",

  /* Energía y periféricos */
  Batery: "bateria",
  XL6009: "xl6009",
  "SG90-Servo": "sg90-servo",
};

/* Las vistas parciales solo muestran objetos que cuelgan de estos Empty. */
const VISIBLE_GROUPS_BY_VIEW: Record<number, Set<string> | null> = {
  0: new Set(["VIEW_SHELL_PARACHUTE", "SHARED"]),
  1: new Set(["VIEW_ELECTRONICS"]),
  2: new Set(["VIEW_EGG_PROTECTION"]),
  3: null,
};

function getOwningViewGroup(object: THREE.Object3D, scene: THREE.Object3D) {
  let current: THREE.Object3D | null = object.parent;

  while (current && current !== scene) {
    if (current.name === "VIEW_SHELL_PARACHUTE" || current.name === "VIEW_ELECTRONICS" || current.name === "VIEW_EGG_PROTECTION" || current.name === "SHARED") {
      return current.name;
    }
    current = current.parent;
  }

  return null;
}

function resolveLayerId(object: THREE.Object3D, scene?: THREE.Object3D) {
  let current: THREE.Object3D | null = object;

  while (current) {
    const layerId = MESH_TO_LAYER[current.name];
    if (layerId) return layerId;
    if (scene && current === scene) break;
    current = current.parent;
  }

  return null;
}

/* ─── Componente interno: Escena 3D con el modelo GLB ─── */

interface SceneProps {
  layers: LayerSpec[];
  selectedId?: string | null;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string | null) => void;
  shellOpen?: boolean;
  explode?: number;
  explodePerLayer?: Record<string, number>;
  hoveredId?: string | null;
  onPointerData?: (data: { layerId: string; x: number; y: number } | null) => void;
  viewIndex: number;
}

function Scene({ layers, selectedId, hoveredId: externalHoveredId, onHover, onSelect, shellOpen, explode = 0, explodePerLayer, onPointerData, viewIndex }: SceneProps) {
  const { scene } = useGLTF(MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);
  const { gl } = useThree();

  // Hover manejado dentro de la escena para un resalte inmediato,
  // independiente del estado de la página. Se combina con el hover
  // externo (p. ej. al pasar el cursor por la lista lateral).
  const [internalHoveredId, setInternalHoveredId] = useState<string | null>(null);
  const hoveredId = internalHoveredId ?? externalHoveredId ?? null;

  // Guardar posiciones originales de cada mesh al cargar
  const originalPositions = useRef<Map<string, THREE.Vector3>>(new Map());

  // Encontrar todas las mallas y guardar sus posiciones originales una sola vez
  const meshList = useMemo(() => {
    const list: THREE.Mesh[] = [];
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        list.push(mesh);
      }
    });
    return list;
  }, [scene]);

  useEffect(() => {
    meshList.forEach((mesh) => {
      if (!originalPositions.current.has(mesh.uuid)) {
        originalPositions.current.set(mesh.uuid, mesh.position.clone());
      }
    });
  }, [meshList]);

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
    
    const found = meshList.filter((m) => resolveLayerId(m, scene));
    const notFound = meshList.filter((m) => !resolveLayerId(m, scene));
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

    const exportedGroups = [
      "VIEW_SHELL_PARACHUTE",
      "VIEW_ELECTRONICS",
      "VIEW_EGG_PROTECTION",
      "SHARED",
    ].map((name) => ({ name, count: scene.getObjectByName(name)?.children.length ?? 0 }));
    console.log("[SatelliteModel] Grupos de vistas exportados:", exportedGroups);
  }, [meshList, scene]);

  // Un mesh sin grupo pertenece únicamente a la vista completa. Esto evita
  // mostrar accidentalmente restos de una exportación anterior en las vistas parciales.
  useEffect(() => {
    const visibleGroups = VISIBLE_GROUPS_BY_VIEW[viewIndex] ?? VISIBLE_GROUPS_BY_VIEW[3];

    meshList.forEach((mesh) => {
      const groupName = getOwningViewGroup(mesh, scene);
      mesh.visible = visibleGroups === null || (groupName !== null && visibleGroups.has(groupName));
    });
  }, [meshList, scene, viewIndex]);

  // Aplicar colores según LAYERS y resaltar selección / hover.
  // El resalte usa el material emissive, así que se mantiene igual
  // aunque se haga zoom o se gire la cámara.
  useEffect(() => {
    meshList.forEach((mesh) => {
      const layerId = resolveLayerId(mesh, scene);
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

        // Resalte: selección tiene prioridad (más fuerte), luego hover (sutil)
        if (layerId && layerId === selectedId) {
          mat.emissive = new THREE.Color("#FFB020");
          mat.emissiveIntensity = 0.55;
        } else if (layerId && layerId === hoveredId) {
          mat.emissive = new THREE.Color("#FFCC66");
          mat.emissiveIntensity = 0.28;
        } else {
          mat.emissive = new THREE.Color("#000000");
          mat.emissiveIntensity = 0;
        }
      }
    });
  }, [meshList, layers, selectedId, hoveredId, scene]);

  // Aplicar posiciones: original + shell offset + explode offset
  useEffect(() => {
    meshList.forEach((mesh) => {
      const original = originalPositions.current.get(mesh.uuid);
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

      // Sumar offset de explosión (per-layer tiene prioridad sobre global)
      const layerId = resolveLayerId(mesh, scene);
      const layerExplode = (explodePerLayer && layerId && layerId in explodePerLayer)
        ? explodePerLayer[layerId]
        : explode;

      if (layerExplode > 0) {
        const dir = EXPLODE_DIRECTIONS[name];
        if (dir) {
          mesh.position.x += dir[0] * EXPLODE_DISTANCE * layerExplode;
          mesh.position.y += dir[1] * EXPLODE_DISTANCE * layerExplode;
          mesh.position.z += dir[2] * EXPLODE_DISTANCE * layerExplode;
        }
      }
    });
  }, [meshList, scene, shellOpen, explode, explodePerLayer]);

  // Eventos de interacción
  const handlePointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      const layerId = resolveLayerId(e.object, scene);
      if (layerId) {
        setInternalHoveredId(layerId);
        onHover?.(layerId);
        const rect = gl.domElement.getBoundingClientRect();
        onPointerData?.({ layerId, x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    },
    [onHover, onPointerData, gl, scene]
  );

  const handlePointerOut = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setInternalHoveredId(null);
      onHover?.(null);
      onPointerData?.(null);
    },
    [onHover, onPointerData]
  );

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      const layerId = resolveLayerId(e.object, scene);
      onSelect?.(layerId);
    },
    [onSelect, scene]
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
  hoveredId,
  onHover,
  onSelect,
  shellOpen = false,
  explode = 0,
  explodePerLayer,
  autoRotate = false,
  viewIndex = 3,
}: SatelliteModelProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [modelAvailable, setModelAvailable] = useState<boolean | null>(null);

  const tooltipData = useMemo<TooltipData | null>(() => {
    const activeId = selectedId ?? hoveredId;
    const layer = activeId ? layers.find((item) => item.id === activeId) : null;
    if (!layer) return null;
    return { nombre: layer.nombre, modelo: layer.modelo, specs: layer.specs ?? {} };
  }, [selectedId, hoveredId, layers]);

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
          <Bounds key={viewIndex} fit clip observe margin={1.6}>
            <Scene
              layers={layers}
              selectedId={selectedId}
              hoveredId={hoveredId}
              onHover={onHover}
              onSelect={onSelect}
              shellOpen={shellOpen}
              explode={explode}
              explodePerLayer={explodePerLayer}
              onPointerData={handlePointerData}
              viewIndex={viewIndex}
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
