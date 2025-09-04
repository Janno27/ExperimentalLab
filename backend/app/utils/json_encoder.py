import math
import numpy as np

def clean_json_nan(data):
    """
    Recursively clean a dictionary or list to remove NaN, infinity, and -infinity.
    Replace them with None, which is JSON compliant (null).
    """
    if isinstance(data, dict):
        return {k: clean_json_nan(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [clean_json_nan(i) for i in data]
    elif isinstance(data, float) and (math.isnan(data) or math.isinf(data)):
        return None
    elif isinstance(data, (np.floating, np.integer)):
        if np.isnan(data) or np.isinf(data):
            return None
        return float(data)  # Convert numpy numbers to standard Python types
    elif isinstance(data, np.bool_):
        return bool(data) # Convert numpy bool to standard Python bool
    return data 