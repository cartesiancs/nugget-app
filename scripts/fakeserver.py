from requests import Request
from fastapi import FastAPI
from typing import Optional, Dict, Any
import uvicorn

app = FastAPI()


@app.post("/api/llm", response_model=None)
async def process(request: Request):
    data = await request.json();


if __name__ == "__main__":
    print("Starting FastAPI processing server on http://localhost:5000")
    uvicorn.run(app, host="0.0.0.0", port=5001)
