from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import requests
import json

from main import router


class LLMRequest(BaseModel):
    command: str
    context: Optional[dict] = None


@router.post("/api/llm")
async def getResponseFromLlama3(request: LLMRequest):
    try:
        # response = requests.post(
        #     "http://192.168.46.138:3001/api/",
        #     json={"command": request.command, "context": request.context},
        # )
        print("response from llm:")
        llm_response = {
            "tool_name": "add_image",
            "params": {"file_url": "image.png"},
        }
        return llm_response
    except requests.RequestException as e:
        raise HTTPException(
            status_code=500, detail=f"Error communicating with LLM service: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
