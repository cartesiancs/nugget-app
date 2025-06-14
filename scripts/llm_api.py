from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import requests

router = APIRouter()


class LLMRequest(BaseModel):
    command: str


@router.get("/api/llm")
async def getResponseFromLlama3(command: str):
    try:
        print("request for llm:", command)
        # TODO: Uncomment and configure the actual LLM service URL
        # response = requests.get("http://192.168.46.138:3001/llm", params={"command": command})
        # print("response from llm:", response)
        # return response.json()

        # Temporary mock response for testing
        return {"type": "text", "data": f"Processed command: {command}"}
    except requests.RequestException as e:
        raise HTTPException(
            status_code=500, detail=f"Error communicating with LLM service: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
