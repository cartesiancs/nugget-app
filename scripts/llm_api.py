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
        print("request for llm:", request.command, request.context)

        # TODO: Uncomment and configure the actual LLM service URL
        # response = requests.post(
        #     "http://192.168.46.138:3001/llm",
        #     json={"command": request.command, "context": request.context}
        # )
        # print("response from llm:", response)
        # return response.json()

        # Temporary mock response for testing
        return {"type": "text", "data": f"Processed command: {request.command}"}
    except requests.RequestException as e:
        raise HTTPException(
            status_code=500, detail=f"Error communicating with LLM service: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
