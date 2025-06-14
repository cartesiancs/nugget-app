import json
from prompts.tool_info import TOOL_INFO

def get_system_prompt_for_param_extraction(tool_name: str):
    """
    Generates a system prompt for the LLM to extract parameters for a given tool.
    """
    if tool_name not in TOOL_INFO:
        raise ValueError(f"Tool '{tool_name}' not found in TOOL_INFO.")

    tool = TOOL_INFO[tool_name]
    params = tool["params"]
    
    param_definitions = "\n".join([f'- `{name}` ({details["type"]}): {details["description"]}' for name, details in params.items()])

    # Dynamically create an example for the prompt to guide the LLM.
    example_params = {
        "text": "My new slide",
        "position": "NULL",
        "duration": 4000,
        "bgColor": "white",
        "animation": "NULL"
    }

    return f"""You are a highly intelligent parameter extractor for a tool-using system. Your goal is to extract parameters for the '{tool_name}' tool based on the user's command. You MUST respond with a single, valid JSON object. Do not add any text before or after the JSON object.

TOOL DESCRIPTION: {tool['description']}

PARAMETERS TO EXTRACT:
{param_definitions}

If a parameter's value cannot be found in the user command, you MUST use the string "NULL" for its value.

For example, for the user command "add a slide for 4s with text 'My new slide' and a white background", your response should be:
```json
{json.dumps(example_params, indent=2)}
```
""" 