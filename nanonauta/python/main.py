"""
main.py  —  receptor LoRa Nanonauta
Lee paquetes del Arduino Uno Q mediante el puente arduino-python,
parsea el CSV de 16 valores, calcula campos derivados,
inserta en PostgreSQL y publica en la cola SSE para el browser.

Formato del paquete (una sola línea CSV + línea RSSI separada):
  -0.40,-0.90,0.14,-1.87,1.95,0.17,44.29,25.21,817.54,1774.00,-1226,-626,-1920,19.47,0.00,26
  RSSI: -80

Índices:
  0-2   Acelerómetro X/Y/Z (g)
  3-5   Giroscopio X/Y/Z (°/s)
  6     Temperatura MPU-6050 (°C)
  7     Temperatura BME/BMP (°C)
  8     Presión (hPa)
  9     Altitud (m)
  10-12 Magnetómetro X/Y/Z (counts)
  13-14 GPS lat/lng
  15    Satélites GPS
"""
import json
import time
from arduino.app_utils import Bridge, App  # puente Arduino Uno Q

from db import insert_telemetry
from sse_queue import sse_queue

# ── Estado interno para calcular campos derivados ─────────────────────────────
_prev_altitud: float | None = None
_prev_time: float | None = None


def _calcular_estado(altitud: float, vel_vertical: float) -> str:
    """Determina la fase de vuelo en base a altitud y velocidad vertical."""
    if altitud < 20 and _prev_altitud is None:
        return "pre-lanzamiento"
    if vel_vertical > 1.0:
        return "ascenso"
    if vel_vertical < -1.0:
        return "descenso"
    if altitud < 20:
        return "aterrizado"
    return "ascenso"  # por defecto mientras sube despacio


def _parse_rssi(raw_rssi: str) -> float:
    """Extrae el número de 'RSSI: -80' → -80.0"""
    try:
        return float(raw_rssi.strip().split(":")[-1].strip())
    except (ValueError, IndexError):
        return 0.0


def _parse_packet(mensaje: str) -> dict | None:
    """
    El puente entrega el paquete como una cadena que puede venir en dos formatos:
      a) Una sola cadena con el CSV y el RSSI separados por salto de línea
      b) Solo el CSV (el RSSI se recibe aparte en la siguiente llamada)

    Aquí manejamos el formato A (ambos en el mismo string) que es lo más común
    con el Arduino Uno Q y la función 'leerPaquete'.
    """
    global _prev_altitud, _prev_time

    lines = [l.strip() for l in mensaje.strip().splitlines() if l.strip()]
    if not lines:
        return None

    csv_line = lines[0]
    rssi_line = lines[1] if len(lines) > 1 else "RSSI: 0"

    parts = csv_line.split(",")
    if len(parts) < 16:
        print(f"[WARN] Paquete incompleto ({len(parts)} campos): {csv_line}")
        return None

    try:
        vals = [float(p) for p in parts]
    except ValueError as e:
        print(f"[WARN] Error al convertir valores: {e}")
        return None

    altitud = vals[9]
    now = time.monotonic()

    # Velocidad vertical (m/s)
    if _prev_altitud is not None and _prev_time is not None:
        dt = now - _prev_time
        vel_vertical = (altitud - _prev_altitud) / dt if dt > 0 else 0.0
    else:
        vel_vertical = 0.0

    estado = _calcular_estado(altitud, vel_vertical)

    _prev_altitud = altitud
    _prev_time = now

    return {
        "accel_x":       vals[0],
        "accel_y":       vals[1],
        "accel_z":       vals[2],
        "gyro_x":        vals[3],
        "gyro_y":        vals[4],
        "gyro_z":        vals[5],
        "temp_mpu_c":    vals[6],
        "temp_bme_c":    vals[7],
        "presion_hpa":   vals[8],
        "altitud_m":     altitud,
        "mag_x":         vals[10],
        "mag_y":         vals[11],
        "mag_z":         vals[12],
        "gps_lat":       vals[13],
        "gps_lng":       vals[14],
        "gps_satelites": int(vals[15]),
        "rssi_dbm":      _parse_rssi(rssi_line),
        "estado":        estado,
        "vel_vertical_ms": round(vel_vertical, 3),
    }


def _row_to_sse_payload(row: dict) -> str:
    """
    Convierte el dict del paquete al formato TelemetryReading que espera el frontend.
    """
    import datetime
    ts = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.000Z")
    return json.dumps({
        "timestamp":         ts,
        "altitud_m":         row["altitud_m"],
        "temperatura_c":     row["temp_bme_c"],
        "temperatura_mpu_c": row["temp_mpu_c"],
        "presion_hpa":       row["presion_hpa"],
        "gps": {
            "lat":       row["gps_lat"],
            "lng":       row["gps_lng"],
            "alt_m":     row["altitud_m"],
            "satelites": row["gps_satelites"],
        },
        "acelerometro": {"x": row["accel_x"], "y": row["accel_y"], "z": row["accel_z"]},
        "giroscopio":   {"x": row["gyro_x"],  "y": row["gyro_y"],  "z": row["gyro_z"]},
        "magnetometro": {"x": row["mag_x"],   "y": row["mag_y"],   "z": row["mag_z"]},
        "rssi_dbm":          row["rssi_dbm"],
        "estado":            row["estado"],
        "velocidad_vertical_ms": row["vel_vertical_ms"],
    })


def main():
    mensaje = Bridge.call("leerPaquete")

    if not mensaje:
        return  # sin datos todavía

    print("Paquete recibido:")
    print(mensaje)

    row = _parse_packet(mensaje)
    if row is None:
        return

    # 1) Guardar en PostgreSQL
    try:
        insert_telemetry(row)
    except Exception as e:
        print(f"[ERROR DB] {e}")

    # 2) Publicar en cola SSE (no bloquea si está llena)
    payload = _row_to_sse_payload(row)
    try:
        sse_queue.put_nowait(payload)
    except Exception:
        pass  # cola llena → descarta (browser se reconecta)

    time.sleep(0.1)


App.run(user_loop=main)