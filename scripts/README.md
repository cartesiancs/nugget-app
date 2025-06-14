# FastAPI backend
## Setup
1. install `uv`
```bash
pip install uv
```

2. execute using `./run_server`

3. add packages using `uv add <packages>`

4. run using `uv run <file>`

## Audio

### Text-to-Speech API
Convert text to speech using the Bark model.

**Endpoint:** `POST /api/audio/text-to-speech`

**Request Body:**
```json
{
    "text": "Text to convert to speech",
    "speaker": "v2/en_speaker_6"  // Optional, defaults to v2/en_speaker_6
}
```

**Example curl command:**
```bash
curl -X POST "http://localhost:8000/api/audio/text-to-speech" \
     -H "Content-Type: application/json" \
     -d '{"text": "Hello, this is a test.", "speaker": "v2/en_speaker_6"}'
```

### Noise Removal API
Remove background noise from audio files using DeepFilter.

**Endpoint:** `POST /api/audio/remove-noise`

**Request:**
- Content-Type: `multipart/form-data`
- Parameter: `file` (audio file)


**Example curl command:**
```bash
curl -X POST "http://localhost:8000/api/audio/remove-noise" \
     -F "file=@/path/to/your/audio.wav"
```

**Error Responses:**
- 400 Bad Request:
  - "No file provided"
  - "Unsupported file format. Supported formats: WAV, MP3, M4A, OGG, FLAC"
  - "File too large. Maximum size is 50MB"
- 500 Internal Server Error:
  - "Failed to process audio file"
  - "Failed to save processed audio"

**Notes:**
- All processed audio files are saved in the `assets/public` 