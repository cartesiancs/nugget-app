from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import requests
import json

router = APIRouter()


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
        # print("response from llm:", response)
        llm_response = {
            "tool_name": "add_slide",
            "params": {
                "text": "Welcome to Qualcomm Hack",
                # "textColor": "#ffffff",
                "position": "NULL",
                # "bgColor": "#00ff00",
                # "duration": 3000,
                # "animation": True,
            },
        }
        return llm_response
    except requests.RequestException as e:
        raise HTTPException(
            status_code=500, detail=f"Error communicating with LLM service: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
