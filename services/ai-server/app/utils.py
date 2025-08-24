"""
Generic JSON utilities for AI Server
"""
import json
import logging

logger = logging.getLogger(__name__)


def complete_json_structure(response: str) -> str:
    """
    Generic JSON completion utility - only ensures proper JSON structure
    Purpose: Complete incomplete JSON with proper closing braces/brackets
    
    Args:
        response: Raw string that may contain incomplete JSON
        
    Returns:
        Properly closed JSON string that can be parsed
    """
    if not response.strip():
        return "{}"
    
    # Find the first JSON object
    json_start = response.find('{')
    if json_start == -1:
        logger.warning("No JSON object found in response")
        return "{}"
    
    # Extract from first brace onwards
    json_part = response[json_start:].strip()
    
    # Count unmatched opening brackets/braces
    open_braces = 0
    open_brackets = 0
    in_string = False
    escaped = False
    
    for i, char in enumerate(json_part):
        if escaped:
            escaped = False
            continue
            
        if char == '\\':
            escaped = True
            continue
            
        if char == '"' and not escaped:
            in_string = not in_string
            continue
            
        if not in_string:
            if char == '{':
                open_braces += 1
            elif char == '}':
                open_braces -= 1
            elif char == '[':
                open_brackets += 1
            elif char == ']':
                open_brackets -= 1
    
    # Remove trailing comma if present
    if json_part.rstrip().endswith(','):
        json_part = json_part.rstrip()[:-1]
    
    # Close unmatched brackets and braces
    while open_brackets > 0:
        json_part += ']'
        open_brackets -= 1
        
    while open_braces > 0:
        json_part += '}'
        open_braces -= 1
    
    # Validate the completed JSON
    try:
        json.loads(json_part)
        logger.info(f"JSON completion successful - {len(json_part)} chars")
        return json_part
    except json.JSONDecodeError as e:
        logger.error(f"JSON completion failed: {e}")
        # If still invalid, return minimal valid JSON
        return "{}"


def is_json_response(response: str) -> bool:
    """
    Check if response appears to contain JSON data
    
    Args:
        response: String to check
        
    Returns:
        True if response looks like it contains JSON
    """
    if not response.strip():
        return False
    
    # Check for JSON indicators
    return (response.strip().startswith('{') or 
            '{' in response or 
            response.strip().startswith('[') or 
            '[' in response)


def safe_json_parse(json_string: str) -> dict:
    """
    Safely parse JSON string with fallback
    
    Args:
        json_string: JSON string to parse
        
    Returns:
        Parsed JSON dict or empty dict if parsing fails
    """
    try:
        return json.loads(json_string)
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing failed: {e}")
        return {}
