from http.client import HTTPException
from pydantic import BaseModel
from requests import Request
import requests
from fastapi import APIRouter
from typing import Optional, Dict, Any

router = APIRouter()


class LLMRequest(BaseModel):
    command: str
    context: Optional[dict] = None


@router.post("/api/llm")
async def getResponseFromLlama3(request: LLMRequest):
    try:
        print("request for llm:", request.command, request.context)

        

        return {"type": "text", "data": f"Processed command: {request.command}"}
    except requests.RequestException as e:
        raise HTTPException(
            status_code=500, detail=f"Error communicating with LLM service: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    print("Starting FastAPI processing server on http://localhost:5000")
    uvicorn.run(router, host="0.0.0.0", port=5001)
