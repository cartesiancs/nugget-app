# FastAPI backend
## Setup
1. install `uv`
```bash
pip install uv
```

2. execute using `./run_server`

3. add packages using `uv add <packages>`

4. run using `uv run <file>`


## Testing stuff
### /api/image/super-resolution
sample request
```bash
curl -X POST "http://localhost:8000/api/image/super-resolution" \
     -H "accept: application/json" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@assets/mountains.jpg"
```