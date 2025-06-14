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
    example_params = {}
    for p_name in params:
        if p_name == 'text': example_params[p_name] = 'hello world'
        elif p_name == 'fontsize': example_params[p_name] = 30
        elif p_name == 'startTime': example_params[p_name] = 1000
        elif p_name == 'duration': example_params[p_name] = 5000
        else: example_params[p_name] = "NULL"

    return f"""You are a highly intelligent parameter extractor for a tool-using system. Your goal is to extract parameters for the '{tool_name}' tool based on the user's command. You MUST respond with a single, valid JSON object. Do not add any text before or after the JSON object.

TOOL DESCRIPTION: {tool['description']}

PARAMETERS TO EXTRACT:
{param_definitions}

If a parameter's value cannot be found in the user command, you MUST use the string "NULL" for its value.

For example, for the user command "add text 'hello world' at 1s for 5s, font size 30", your response should be:
```json
{json.dumps(example_params, indent=2)}
```
""" 