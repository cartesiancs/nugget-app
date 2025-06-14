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

        filepath = request.context["preview"]["selectedData"]["localpath"][7:]

        print(filepath)

        target_url = "http://localhost:5151/api/image/super-resolution"
        
        headers = {
            "accept": "application/json",
        }

        try:
            with open(filepath, "rb") as f:
                files = {
                    "file": (filepath.split('/')[-1], f, "image/jpeg") # Or appropriate content type
                }
                
                # Make the POST request to the other service
                response_from_service = requests.post(target_url, headers=headers, files=files)
                
                print(f"Response from {target_url}: {response_from_service.status_code}")
                # You might want to process response_from_service.json() or .text here

                print(response_from_service.json())

        except FileNotFoundError:
            raise HTTPException(status_code=404, detail=f"File not found: {filepath}")
        except requests.RequestException as e:
            # This catches errors from the requests.post call to the other service
            raise HTTPException(
                status_code=502, # Bad Gateway, as this service acts as a gateway
                detail=f"Error communicating with image service at {target_url}: {str(e)}"
            )
        
        return {"type": "text", "data": f"Processed command: {request.command}, and attempted to process file: {filepath}"}
    
    except HTTPException as e: # Re-raise HTTPExceptions to be handled by FastAPI
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    print("Starting FastAPI processing server on http://localhost:8000")
    uvicorn.run(router, host="0.0.0.0", port=8000)
