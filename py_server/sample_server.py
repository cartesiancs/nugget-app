from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import uvicorn

app = FastAPI()


class TextDataInput(BaseModel):
    text: Optional[str] = None
    textcolor: Optional[str] = None
    fontsize: Optional[int] = None
    locationX: Optional[int] = None
    locationY: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    startTime: Optional[int] = None
    duration: Optional[int] = None
    optionsAlign: Optional[str] = None
    backgroundEnable: Optional[bool] = None
    # Allow any other fields that might be sent
    extra_data: Dict[str, Any] = Field(default_factory=dict)


class TextDataOutput(TextDataInput):
    python_processed: bool = True
    text: Optional[str] = None  # Override to ensure it's included in output


@app.post("/api/process_text_data")
async def process_text_data(data: TextDataInput) -> TextDataOutput:
    print(f"FastAPI server received data: {data.model_dump(exclude_unset=True)}")

    # Convert Pydantic model to dict for manipulation if needed, or work with model directly
    processed_data_dict = data.model_dump(exclude_unset=True)

    if data.text is not None:
        processed_data_dict["text"] = f"[FastAPI says: {data.text}]"
    else:
        processed_data_dict["text"] = "[FastAPI says: No text provided]"

    # Create an output model instance
    # Ensure all fields from input are carried over, plus the new/modified ones
    output_data = TextDataOutput(**processed_data_dict, python_processed=True)

    print(
        f"FastAPI server returning processed data: {output_data.model_dump(exclude_unset=True)}"
    )
    return output_data


if __name__ == "__main__":
    print("Starting FastAPI processing server on http://localhost:5000")
    uvicorn.run(app, host="0.0.0.0", port=5000)
