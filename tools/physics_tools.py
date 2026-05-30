from langchain_core.tools import tool
from agents.core.physics.decline_curve import calculate_arps_decline

@tool
def reservoir_production_forecast(qi: float, di: float, b: float, months: int):
    """
    Calculates a reservoir production forecast using Arps Decline. 
    Input qi (initial rate), di (nominal decline), b (hyperbolic factor), and months.
    """
    return calculate_arps_decline(qi, di, b, months)