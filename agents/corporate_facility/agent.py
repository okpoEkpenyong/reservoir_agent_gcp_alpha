from google.adk import Agent
from google.adk.a2a.utils.agent_to_a2a import to_a2a
import os

# Mock tool to simulate HVAC control
def optimize_cooling(room_id: str, occupancy_count: int):
    """Signals the HVAC system to pre-cool a room for a spike in occupancy."""
    return f"HVAC System: Pre-cooling initiated for {room_id}. Target temp: 19°C for {occupancy_count} engineers."

corporate_facility_agent = Agent(
    name="corporate_facility_agent",
    model="gemini-1.5-flash",
    instruction="""
    You are the Corporate Facility Manager. 
    You receive notifications from the Reservoir Engineering team.
    Your task is to book boardrooms and optimize HVAC systems (pre-cooling) 
    when large-scale simulation reviews or all-hands meetings are triggered.
    """,
    tools=[optimize_cooling]
)

# This creates the A2A server app
# In production, this would be its own Cloud Run service
a2a_app = to_a2a(corporate_facility_agent, port=8008)