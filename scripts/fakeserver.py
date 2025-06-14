from fastapi import FastAPI
from typing import Optional, Dict, Any
import uvicorn

app = FastAPI()


@app.post("/api/llm")
async def process(data: any) -> any:
    print(data)

if __name__ == "__main__":
    print("Starting FastAPI processing server on http://localhost:5000")
    uvicorn.run(app, host="0.0.0.0", port=5000)
