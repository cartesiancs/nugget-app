from typing import Union, Dict
from fastapi import FastAPI

router = FastAPI()

@router.get("/api/health")
def health() -> Dict[str, Union[int, str]]:
    return {"status": 200, "message": "quarts backend working"}
