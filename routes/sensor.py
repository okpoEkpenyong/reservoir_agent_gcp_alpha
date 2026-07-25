# add to routes/sensor.py

@router.get("/readings/recent")
async def get_recent_readings(limit: int = 20):
    conn = await get_db_connection()
    try:
        rows = await conn.fetch(
            """
            SELECT reading_id, flow_rate, unit, status, rationale, timestamp
            FROM flare_monitor_readings
            ORDER BY timestamp DESC
            LIMIT $1
            """,
            limit,
        )
        return [dict(row) for row in rows]
    finally:
        await conn.close()