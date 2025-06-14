from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import requests

router = FastAPI()


@router.get("/api/llm")
async def getResponseFromLlama3(request):
    try:
        print("request for llm:", request)
        return True
        # response = requests.get("http://192.168.46.138:3001/llm", data=request.data)
        # print("response from llm:", response)
        # return response
    except requests.RequestException as e:
        raise HTTPException(
            status_code=500, detail=f"Error communicating with LLM service: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
