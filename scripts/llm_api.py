from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import requests
import json
from prompts.system_prompt_tool_info import get_system_prompt_tool_info
from prompts.tool_info import TOOL_INFO
from prompts.conversational_responses import get_random_conversational_response
import importlib
import os
import logging
from utils.image_helpers import (
    perform_background_removal,
    validate_image_path,
    load_image_from_path,
    generate_filename_from_path,
    save_processed_image_png
)
from cv_api import api_image_background_removal, api_image_portrait_effect, api_image_super_resolution
from data_models import ImageRequest
from thefuzz import process

router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LLMRequest(BaseModel):
    command: str
    context: Optional[dict] = None


def build_response(
    success: bool,
    tool_name: str = None,
    error: str = None,
    text: str = None,
    params: dict = None,
    message: str = None,
):
    """Builds a consistent API response object."""
    if text is None and success:
        text = get_random_conversational_response()
    elif text is None and not success:
        text = "I'm sorry, I ran into a problem. " + (error or "Please try again.")
        
    return {
        "success": success,
        "tool_name": tool_name,
        "error": error,
        "text": text,
        "params": params or {},
        "message": message,
    }


def _get_image_uri_from_context(context: Optional[dict]) -> Optional[str]:
    """Extracts the image URI from the request context, prioritizing preview over timeline."""
    logger.info("Attempting to extract image URI from context...")
    if not context:
        logger.warning("Context is empty.")
        return None

    # Check preview context first
    preview_context = context.get("preview")
    if (preview_context and 
        preview_context.get("selected") and 
        isinstance(preview_context.get("selectedData"), dict) and 
        preview_context["selectedData"].get("localpath")):
        
        image_uri = preview_context["selectedData"]["localpath"]
        logger.info(f"Found image URI in 'preview' context: {image_uri}")
        return image_uri

    # Check timeline context if not in preview
    timeline_context = context.get("timeline")
    if (timeline_context and 
        timeline_context.get("selected") and 
        isinstance(timeline_context.get("selectedData"), dict) and 
        timeline_context["selectedData"].get("localpath")):
        
        image_uri = timeline_context["selectedData"]["localpath"]
        logger.info(f"Found image URI in 'timeline' context: {image_uri}")
        return image_uri

    logger.warning("No usable image path found in preview or timeline context.")
    return None


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
        print(json.dumps(request.context, indent=2))
        logger.info("🤖 Starting API call to getResponseFromLlama3")
        logger.info(f"Received command: '{request.command}'")

        # Step 1: Identify the tool
        logger.info("Step 1: Identifying tool from command...")
        system_prompt_tool_info = get_system_prompt_tool_info()
        messages_tool_identification = [
            {"role": "system", "content": system_prompt_tool_info},
            {"role": "user", "content": request.command}
        ]
        
        tool_identification_response = call_llm(messages_tool_identification)
        
        try:
            # The response content from the LLM is a JSON string.
            tool_data = json.loads(tool_identification_response['choices'][0]['message']['content'])
            llm_tool_name = tool_data.get("tool")

            # Find the best match for the tool name
            available_tools = list(TOOL_INFO.keys()) + ["NULL"]
            best_match, score = process.extractOne(llm_tool_name, available_tools)

            tool_name = llm_tool_name
            if score > 80: # Confidence threshold
                tool_name = best_match
            
            logger.info(f"LLM identified tool: '{llm_tool_name}', Matched tool: '{tool_name}' with score {score}")

        except (json.JSONDecodeError, KeyError, IndexError) as e:
            logger.error(f"Failed to parse tool identification response: {e}")
            return build_response(success=False, error=f"Could not parse tool identification response: {e}")

        # Step 2: Handle the identified tool
        logger.info("Step 2: Handling identified tool...")
        if tool_name in ["image_bg_remove", "add_portrait_effect", "make_super_res"]:
            logger.info(f"Handling context-based image tool: '{tool_name}'")
            image_uri = _get_image_uri_from_context(request.context)

            if not image_uri:
                error_msg = f"To use {tool_name}, please select an item on the timeline or in the preview."
                return build_response(success=False, tool_name=tool_name, error=error_msg, text=error_msg)

            if image_uri.startswith('file://'):
                image_uri = image_uri.replace('file://', '', 1)
            
            image_uri = os.path.normpath(image_uri)
            logger.info(f"Normalized image URI: {image_uri}")

            # Call the appropriate cv_api function
            api_request = ImageRequest(image_path=image_uri)
            api_response = None
            if tool_name == "image_bg_remove":
                logger.info("Calling cv_api for background removal...")
                api_response = await api_image_background_removal(api_request)
            elif tool_name == "add_portrait_effect":
                logger.info("Calling cv_api for portrait effect...")
                api_response = await api_image_portrait_effect(api_request)
            else: # make_super_res
                logger.info("Calling cv_api for super resolution...")
                api_response = await api_image_super_resolution(api_request)
            
            logger.info("Received response from cv_api.")

            if api_response and api_response.get("success"):
                return build_response(
                    success=True,
                    tool_name=tool_name,
                    params={"imageUri": api_response["data"].link}
                )
            else:
                error_message = api_response.get('error') if isinstance(api_response, dict) else "Unknown error from CV API"
                logger.error(f"cv_api call failed for '{tool_name}': {error_message}")
                return build_response(success=False, tool_name=tool_name, error=error_message)

        elif tool_name in TOOL_INFO:
            logger.info(f"Handling tool '{tool_name}' with parameter extraction.")
            try:
                # Dynamically import the parameter extraction prompt for the identified tool
                logger.info(f"Loading parameter extraction prompt for '{tool_name}'...")
                param_extraction_module = importlib.import_module(f"prompts.{tool_name}.system_prompt_param_extraction")
                get_system_prompt_for_param_extraction = getattr(param_extraction_module, 'get_system_prompt_for_param_extraction')
                logger.info("Prompt loaded successfully.")
            except (ImportError, AttributeError) as e:
                error_msg = f"Could not load parameter extraction prompt for tool '{tool_name}': {e}"
                logger.error(f"Failed to load parameter extraction prompt for '{tool_name}': {e}")
                return build_response(success=False, error=error_msg)

            # Create user content for parameter extraction
            user_content = f"Command: {request.command}"
            if request.context:
                user_content += f"\nContext: {json.dumps(request.context)}"
            
            # Call LLM again to extract parameters
            logger.info("Calling LLM to extract parameters...")
            system_prompt_param_extraction = get_system_prompt_for_param_extraction(tool_name)
            messages_param_extraction = [
                {"role": "system", "content": system_prompt_param_extraction},
                {"role": "user", "content": user_content}
            ]
            
            param_extraction_response = call_llm(messages_param_extraction, temperature=0.1)
            logger.info("Received parameter extraction response from LLM.")
            
            try:
                extracted_params = json.loads(param_extraction_response['choices'][0]['message']['content'])
                logger.info(f"Extracted parameters: {extracted_params}")
                
                if tool_name == "add_file":
                    file_to_add = extracted_params.get("fileName")
                    if not file_to_add or file_to_add == "NULL":
                        error_msg = "Could not identify the file to add from your command."
                        logger.error("LLM did not extract a filename for add_file tool.")
                        return build_response(success=False, tool_name=tool_name, error=error_msg)

                    files_in_context = request.context.get("files", [])
                    if not files_in_context:
                        error_msg = "There are no files available in the current context to add."
                        logger.error("No files found in context for add_file tool.")
                        return build_response(success=False, tool_name=tool_name, error=error_msg)
                    
                    # Fuzzy search
                    best_match, score = process.extractOne(file_to_add, files_in_context)
                    
                    if score > 80: # Confidence threshold
                        logger.info(f"Fuzzy search matched '{file_to_add}' to '{best_match}' with score {score}.")
                        return build_response(
                            success=True,
                            tool_name=tool_name,
                            params={"fileName": best_match, "directory": request.context.get("current_directory")},
                            message=f"Successfully identified file '{best_match}'."
                        )
                    else:
                        error_msg = f"I could not find a file named '{file_to_add}' in the available files."
                        logger.warning(f"Could not find a confident match for file '{file_to_add}'. Best match '{best_match}' with score {score}.")
                        return build_response(
                            success=False,
                            tool_name=tool_name,
                            params={"fileName": "NULL"},
                            error=error_msg
                        )

                elif tool_name in ["add_text", "add_shape", "add_slide"]:
                    logger.info(f"Successfully processed '{tool_name}'.")
                    return build_response(success=True, tool_name=tool_name, params=extracted_params)

            except (json.JSONDecodeError, KeyError, IndexError) as e:
                error_msg = f"Could not parse parameter extraction response: {e}"
                logger.error(error_msg)
                return build_response(success=False, tool_name=tool_name, error=error_msg)

        elif tool_name == "NULL":
            logger.info("No specific tool identified. Returning NULL response.")
            return build_response(success=True, tool_name="NULL", message="No specific tool identified for the command.")
            
        else:
            # Handle unknown or not-yet-implemented tools
            message = f"Tool '{tool_name}' is identified but not implemented."
            logger.warning(message)
            return build_response(success=True, tool_name=tool_name, message=message)

    except requests.RequestException as e:
        error_msg = f"Error communicating with LLM service: {str(e)}"
        logger.critical(f"LLM service communication error: {e}")
        return build_response(success=False, error=error_msg)
    except HTTPException as e:
        logger.error(f"HTTP exception caught: {e.detail}")
        return build_response(success=False, error=e.detail)
    except Exception as e:
        logger.critical(f"An unexpected error occurred: {e}", exc_info=True)
        return build_response(success=False, error=str(e))
