-- ============================================================
-- Picosatélite — Esquema PostgreSQL
-- Ejecutar una sola vez:  psql -U picosatelite -d picosatelite -f schema.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS telemetry (
    id               SERIAL        PRIMARY KEY,
    timestamp        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    -- Acelerómetro MPU-6050 (g)
    accel_x          FLOAT8        NOT NULL,
    accel_y          FLOAT8        NOT NULL,
    accel_z          FLOAT8        NOT NULL,

    -- Giroscopio MPU-6050 (°/s)
    gyro_x           FLOAT8        NOT NULL,
    gyro_y           FLOAT8        NOT NULL,
    gyro_z           FLOAT8        NOT NULL,

    -- Temperatura interna MPU-6050 (°C)
    temp_mpu_c       FLOAT8        NOT NULL,

    -- BME/BMP280 — temperatura (°C) y presión (hPa)
    temp_bme_c       FLOAT8        NOT NULL,
    presion_hpa      FLOAT8        NOT NULL,

    -- Altitud barométrica (m)
    altitud_m        FLOAT8        NOT NULL,

    -- Magnetómetro QMC5883P (raw counts)
    mag_x            FLOAT8        NOT NULL,
    mag_y            FLOAT8        NOT NULL,
    mag_z            FLOAT8        NOT NULL,

    -- GPS
    gps_lat          FLOAT8        NOT NULL,
    gps_lng          FLOAT8        NOT NULL,
    gps_satelites    INT           NOT NULL,

    -- Calidad de enlace LoRa (dBm)
    rssi_dbm         FLOAT8        NOT NULL,

    -- Campos calculados en Python
    estado           TEXT          NOT NULL DEFAULT 'pre-lanzamiento',
    vel_vertical_ms  FLOAT8        NOT NULL DEFAULT 0.0
);

-- Índice para consultas por tiempo (el endpoint /api/telemetry filtra por rango)
CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON telemetry (timestamp DESC);

-- Vista útil para debug rápido
CREATE OR REPLACE VIEW v_telemetry_last10 AS
SELECT id, timestamp, altitud_m, temp_bme_c, presion_hpa, rssi_dbm, estado
FROM   telemetry
ORDER  BY timestamp DESC
LIMIT  10;
