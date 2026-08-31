"""
backend/main.py  —  Servidor Flask del Picosatélite Nanonauta
Expone:
  GET  /api/telemetry          → historial de lecturas (JSON)
  GET  /api/telemetry/live     → stream SSE en tiempo real ⚡
  GET  /api/mission            → info de la misión (estático)
  GET  /api/components         → lista de componentes (estático)
  GET  /api/landing            → último estado de aterrizaje
  GET  /                       → sirve el frontend Next.js exportado

Uso:
  python backend/main.py
  (o)  python -m flask --app backend/main run --host=0.0.0.0 --port=8000
"""
import json
import os
import sys
import time

from flask import Flask, Response, jsonify, request, send_from_directory
from flask_cors import CORS

# ── Importar la cola SSE de nanonauta ─────────────────────────────────────────
# Ajusta el path si ejecutas desde otro directorio
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "nanonauta", "python"))
from sse_queue import sse_queue  # noqa: E402

from db import fetch_last_reading, fetch_telemetry  # noqa: E402

# ── Rutas de datos estáticos ──────────────────────────────────────────────────
_MOCK_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "lib", "api", "mock")
_FRONTEND_OUT = os.path.join(os.path.dirname(__file__), "..", "frontend", "out")

# ── App Flask ─────────────────────────────────────────────────────────────────
app = Flask(__name__, static_folder=None)
CORS(app, resources={r"/api/*": {"origins": "*"}})


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _row_to_reading(row: dict) -> dict:
    """
    Convierte una fila de PostgreSQL al formato TelemetryReading
    que espera el frontend (tipos.ts).
    """
    ts = row["timestamp"]
    # psycopg2 devuelve datetime objects; los convertimos a ISO string
    if hasattr(ts, "isoformat"):
        ts = ts.strftime("%Y-%m-%dT%H:%M:%S.000Z")

    return {
        "timestamp":         ts,
        "altitud_m":         float(row["altitud_m"]),
        "temperatura_c":     float(row["temp_bme_c"]),
        "temperatura_mpu_c": float(row["temp_mpu_c"]),
        "presion_hpa":       float(row["presion_hpa"]),
        "gps": {
            "lat":       float(row["gps_lat"]),
            "lng":       float(row["gps_lng"]),
            "alt_m":     float(row["altitud_m"]),
            "satelites": int(row["gps_satelites"]),
        },
        "acelerometro": {
            "x": float(row["accel_x"]),
            "y": float(row["accel_y"]),
            "z": float(row["accel_z"]),
        },
        "giroscopio": {
            "x": float(row["gyro_x"]),
            "y": float(row["gyro_y"]),
            "z": float(row["gyro_z"]),
        },
        "magnetometro": {
            "x": float(row["mag_x"]),
            "y": float(row["mag_y"]),
            "z": float(row["mag_z"]),
        },
        "rssi_dbm":              float(row["rssi_dbm"]),
        "estado":                row["estado"],
        "velocidad_vertical_ms": float(row.get("vel_vertical_ms", 0)),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints REST
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/telemetry")
def get_telemetry():
    """
    Devuelve el historial de telemetría.
    Query params opcionales: from (ISO), to (ISO), limit (int, default 500)
    """
    from_ts = request.args.get("from")
    to_ts   = request.args.get("to")
    limit   = int(request.args.get("limit", 500))

    try:
        rows = fetch_telemetry(limit=limit, from_ts=from_ts, to_ts=to_ts)
        readings = [_row_to_reading(r) for r in rows]
        return jsonify(readings)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.get("/api/telemetry/live")
def telemetry_live():
    """
    Endpoint SSE — el browser se conecta una sola vez y recibe cada paquete
    nuevo en tiempo real sin hacer polling.

    Protocolo SSE:
      event: telemetry
      data: { ...TelemetryReading }
    """
    def event_stream():
        # Heartbeat inicial para que el browser sepa que la conexión está viva
        yield "event: connected\ndata: ok\n\n"

        while True:
            try:
                # Espera hasta 20 s por un nuevo paquete
                payload = sse_queue.get(timeout=20)
                yield f"event: telemetry\ndata: {payload}\n\n"
            except Exception:
                # Timeout → enviar comentario de keepalive y seguir esperando
                yield ": keepalive\n\n"

    return Response(
        event_stream(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # deshabilita buffering en nginx
        },
    )


@app.get("/api/mission")
def get_mission():
    """Información estática de la misión (leída del mock existente)."""
    with open(os.path.join(_MOCK_DIR, "mission.mock.json"), encoding="utf-8") as f:
        return Response(f.read(), mimetype="application/json")


@app.get("/api/components")
def get_components():
    """Lista de componentes del satélite (leída del mock existente)."""
    with open(os.path.join(_MOCK_DIR, "components.mock.json"), encoding="utf-8") as f:
        return Response(f.read(), mimetype="application/json")


@app.get("/api/landing")
def get_landing():
    """
    Estado de aterrizaje: detecta si el satélite ha aterrizado
    en base al último paquete en PostgreSQL.
    Si no hay datos, devuelve el mock por defecto.
    """
    try:
        row = fetch_last_reading()
        if row is None:
            raise ValueError("sin datos")

        ts = row["timestamp"]
        if hasattr(ts, "isoformat"):
            ts = ts.strftime("%Y-%m-%dT%H:%M:%S.000Z")

        aterrizo = row["estado"] == "aterrizado"
        return jsonify({
            "aterrizo": aterrizo,
            "timestamp": ts if aterrizo else None,
            "coordenadas": {
                "lat": float(row["gps_lat"]),
                "lng": float(row["gps_lng"]),
            } if aterrizo else None,
            "metodo_deteccion": "Altitud barométrica < 20 m y velocidad vertical ≈ 0",
            "ultimo_paquete": ts,
            "precision_m": 15,
        })
    except Exception:
        # Si no hay DB aún, devuelve el mock
        with open(os.path.join(_MOCK_DIR, "landing.mock.json"), encoding="utf-8") as f:
            return Response(f.read(), mimetype="application/json")


# ─────────────────────────────────────────────────────────────────────────────
# Servir frontend Next.js exportado como archivos estáticos
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path: str):
    """
    Sirve los archivos del frontend Next.js exportado (frontend/out/).
    Ejecuta primero `npm run build` en la carpeta frontend/.
    """
    if not os.path.isdir(_FRONTEND_OUT):
        return (
            "<h1>Frontend no compilado</h1>"
            "<p>Ejecuta <code>cd frontend && npm run build</code> primero.</p>",
            503,
        )

    # Si es un archivo directo, servirlo
    target = os.path.join(_FRONTEND_OUT, path)
    if os.path.isfile(target):
        return send_from_directory(_FRONTEND_OUT, path)

    # Si es una ruta de Next.js, buscar el index.html correspondiente
    html_target = os.path.join(_FRONTEND_OUT, path, "index.html")
    if os.path.isfile(html_target):
        return send_from_directory(os.path.join(_FRONTEND_OUT, path), "index.html")

    # Fallback al index.html raíz (SPA)
    return send_from_directory(_FRONTEND_OUT, "index.html")


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"[Nanonauta] Servidor iniciado en http://0.0.0.0:{port}")
    # threaded=True es OBLIGATORIO para SSE (cada cliente necesita su propio hilo)
    app.run(host="0.0.0.0", port=port, threaded=True, debug=False)
