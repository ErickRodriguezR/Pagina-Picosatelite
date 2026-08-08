import Link from "next/link";
import { Hero, MissionSpecs, MissionTimeline } from "@/components/landing";
import type { SpecGroup } from "@/components/landing";

/**
 * Vista 01 — Landing
 * Datos estáticos de presentación. Se conectarán a lib/api/client.ts
 * cuando se implemente esa capa.
 */
export default function HomePage() {
  return (
    <section aria-labelledby="heroTitle">
      <Hero
        missionName="Nanonauta"
        objective="Levantar un perfil atmosférico vertical (presión, temperatura, humedad) durante ascenso y descenso, validar el enlace LoRa de largo alcance y recuperar la cápsula intacta."
        launchDate="2026-07-25 15:40:00"
        site="Uruapan Michoacán (ITSU)"
        subsystemCount={10}
        stats={{ apogeeM: "—", durationS: "—", packets: "—", driftKm: "—" }}
        sheet={MISSION_SHEET}
      />

      <MissionSpecs groups={SPEC_GROUPS} />

      <MissionTimeline />

      {/* CTA BAND */}
      <div className="container section section--tight">
        <div className="cta-band">
          <div>
            <h2>El interior, capa por capa</h2>
            <p>
              La cápsula se abre en el visor 3D: pasa el cursor sobre cada PCB,
              sensor o módulo para ver el modelo exacto que usamos y su ficha
              técnica.
            </p>
          </div>
          <div className="btn-row">
            <Link className="btn btn--primary" href="/modelo-3d">
              Abrir el visor 3D
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Datos estáticos (se moverán a lib/api/mock cuando se cree esa capa) ─── */

const MISSION_SHEET: [string, string][] = [
  ["Identificador", "PS-01 / CANSAT"],
  ["Lanzamiento", "2026-07-25 15:40:00 UTC"],
  ["Sitio", "Uruapan Michoacán (ITSU)"],
  ["Elevación del sitio", "2 500 m MSL"],
  ["Altitud objetivo", "1 200 m AGL"],
  ["Apogeo registrado", "—"],
  ["Temperatura mínima", "—"],
  ["Aceleración pico", "—"],
  ["Último paquete", "—"],
  ["Estado", "Sin datos"],
];

const SPEC_GROUPS: SpecGroup[] = [
  {
    title: "Cápsula",
    items: [
      ["Formato", "Tipo CanSat, cilíndrico"],
      ["Diámetro / alto", "60 mm × 110 mm"],
      ["Masa en vuelo", "350 g"],
      ["Estructura", "Impresión 3D PETG + varillas guía"],
      ["Recuperación", "Paracaídas de nylon, descenso ≈5 m/s"],
    ],
  },
  {
    title: "Cómputo y almacenamiento",
    items: [
      ["MCU", "Waveshare RP2040-Zero (ARM Cortex-M0+ dual-core)"],
      ["Almacenamiento", "microSD vía SPI1"],
      ["Puertos", "USB-Serial, bus I²C, SPI1, UART"],
    ],
  },
  {
    title: "Sensado",
    items: [
      ["Inercial", "MPU-6050 (acelerómetro ±2g + giroscopio ±250°/s)"],
      ["Magnetómetro", "QMC5883P (3 ejes, rango ±8 Gauss)"],
      ["Temperatura", "MPU-6050 (interna) + BMP280"],
      ["Presión / altitud", "BMP280"],
      ["GPS", "ATGM336H (UART 9600 baud)"],
    ],
  },
  {
    title: "Enlace y energía",
    items: [
      ["Telemetría", "LoRa RA-02 (SX1278), 433 MHz"],
      ["Cadencia", "1 paquete/s"],
      ["Alcance esperado", "≈5 km línea de vista"],
      ["Autonomía estimada", "≈2 h en transmisión"],
    ],
  },
];


