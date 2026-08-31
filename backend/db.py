"""
backend/db.py  —  Pool de conexiones a PostgreSQL para el servidor Flask.
Compartido entre todos los endpoints REST.
"""
import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

_conn = None


def get_conn():
    """Devuelve la conexión activa; la reconecta si se cayó."""
    global _conn
    try:
        if _conn is None or _conn.closed:
            raise psycopg2.OperationalError
        _conn.isolation_level  # ping barato
    except Exception:
        _conn = psycopg2.connect(
            host=os.environ["PG_HOST"],
            port=int(os.environ.get("PG_PORT", 5432)),
            dbname=os.environ["PG_DB"],
            user=os.environ["PG_USER"],
            password=os.environ["PG_PASSWORD"],
        )
        _conn.autocommit = True
    return _conn


def fetch_telemetry(limit: int = 500, from_ts: str | None = None, to_ts: str | None = None) -> list[dict]:
    """
    Devuelve hasta `limit` lecturas en orden cronológico ascendente.
    Opcionalmente filtra por rango de tiempo (ISO 8601 strings).
    """
    conditions = []
    params: list = []

    if from_ts:
        conditions.append("timestamp >= %s")
        params.append(from_ts)
    if to_ts:
        conditions.append("timestamp <= %s")
        params.append(to_ts)

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    # Seleccionamos en orden ASC para que el frontend los grafique bien
    query = f"""
        SELECT *
        FROM (
            SELECT * FROM telemetry
            {where}
            ORDER BY timestamp DESC
            LIMIT %s
        ) sub
        ORDER BY timestamp ASC
    """
    params.append(limit)

    with get_conn().cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(query, params)
        return [dict(row) for row in cur.fetchall()]


def fetch_last_reading() -> dict | None:
    """Último paquete recibido (para el endpoint /api/landing)."""
    with get_conn().cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("SELECT * FROM telemetry ORDER BY timestamp DESC LIMIT 1")
        row = cur.fetchone()
        return dict(row) if row else None
