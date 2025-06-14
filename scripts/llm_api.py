from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import requests
import json
from prompts.system_prompt_tool_info import get_system_prompt_tool_info
from prompts.tool_info import TOOL_INFO
from prompts.conversational_responses import get_random_conversational_response
import importlib

router = APIRouter()


class LLMRequest(BaseModel):
    command: str
    context: Optional[dict] = None


def call_llm(messages, temperature=0.0):
    """Helper function to make a call to the LLM."""
    headers = {
        'accept': '*/*',
        'Authorization': 'Bearer F7AN14R-59X4B0X-J060Q8D-05W2ANW',
        'Content-Type': 'application/json'
    }
    
    request_body = {
        "messages": messages,
        "model": "quartz",
        "stream": False,
        "temperature": temperature
    }
    
    response = requests.post(
        "http://localhost:49728/api/v1/openai/chat/completions",
        json=request_body,
        headers=headers
    )
    
    response.raise_for_status() # Raise an exception for bad status codes
    return response.json()


@router.post("/api/llm")
async def getResponseFromLlama3(request: LLMRequest):
    try:
        # Step 1: Identify the tool
        system_prompt_tool_info = get_system_prompt_tool_info()
        messages_tool_identification = [
            {"role": "system", "content": system_prompt_tool_info},
            {"role": "user", "content": request.command}
        ]
        
        tool_identification_response = call_llm(messages_tool_identification)
        
        try:
            # The response content from the LLM is a JSON string.
            tool_data = json.loads(tool_identification_response['choices'][0]['message']['content'])
            tool_name = tool_data.get("tool")
        except (json.JSONDecodeError, KeyError, IndexError) as e:
            raise HTTPException(status_code=500, detail=f"Could not parse tool identification response: {e}")

        # Step 2: Handle the identified tool
        if tool_name in TOOL_INFO:
            try:
                # Dynamically import the parameter extraction prompt for the identified tool
                param_extraction_module = importlib.import_module(f"prompts.{tool_name}.system_prompt_param_extraction")
                get_system_prompt_for_param_extraction = getattr(param_extraction_module, 'get_system_prompt_for_param_extraction')
            except (ImportError, AttributeError) as e:
                raise HTTPException(status_code=500, detail=f"Could not load parameter extraction prompt for tool '{tool_name}': {e}")

            # Call LLM again to extract parameters
            system_prompt_param_extraction = get_system_prompt_for_param_extraction(tool_name)
            messages_param_extraction = [
                {"role": "system", "content": system_prompt_param_extraction},
                {"role": "user", "content": request.command}
            ]
            
            param_extraction_response = call_llm(messages_param_extraction, temperature=0.1)
            
            try:
                extracted_params = json.loads(param_extraction_response['choices'][0]['message']['content'])
                
                # Custom logic for 'add_text' can go here. For now, just return.
                if tool_name == "add_text" or tool_name == "add_shape" or tool_name == "add_slide":
                    return {"tool_name": tool_name, "text": get_random_conversational_response(), "params": extracted_params}

            except (json.JSONDecodeError, KeyError, IndexError) as e:
                raise HTTPException(status_code=500, detail=f"Could not parse parameter extraction response: {e}")

        elif tool_name == "NULL":
            # print("HI, I AM NOT CALING ANY TOOLS BECAUES FU")
            return {"tool_name": "NULL", "message": "No specific tool identified for the command."}
            
        else:
            # Handle unknown or not-yet-implemented tools
            return {"tool_name": tool_name, "message": "Tool identified, but not yet implemented."}

    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error communicating with LLM service: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
