"""
db.py  —  conexión a PostgreSQL para nanonauta/python/
Usa psycopg2 y lee credenciales desde .env o variables de entorno.
"""
import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

# Carga el .env que está un nivel arriba (nanonauta/.env)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

_conn = None  # conexión única reutilizada (Arduino Uno Q tiene poca RAM)


def get_conn():
    """Devuelve la conexión activa; la reconecta si se cayó."""
    global _conn
    try:
        if _conn is None or _conn.closed:
            raise psycopg2.OperationalError("sin conexión")
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


INSERT_SQL = """
INSERT INTO telemetry (
    timestamp,
    accel_x, accel_y, accel_z,
    gyro_x,  gyro_y,  gyro_z,
    temp_mpu_c, temp_bme_c, presion_hpa, altitud_m,
    mag_x, mag_y, mag_z,
    gps_lat, gps_lng, gps_satelites,
    rssi_dbm,
    estado, vel_vertical_ms
) VALUES (
    NOW(),
    %(accel_x)s, %(accel_y)s, %(accel_z)s,
    %(gyro_x)s,  %(gyro_y)s,  %(gyro_z)s,
    %(temp_mpu_c)s, %(temp_bme_c)s, %(presion_hpa)s, %(altitud_m)s,
    %(mag_x)s, %(mag_y)s, %(mag_z)s,
    %(gps_lat)s, %(gps_lng)s, %(gps_satelites)s,
    %(rssi_dbm)s,
    %(estado)s, %(vel_vertical_ms)s
)
"""


def insert_telemetry(row: dict) -> None:
    """Inserta un paquete de telemetría en la base de datos."""
    with get_conn().cursor() as cur:
        cur.execute(INSERT_SQL, row)
