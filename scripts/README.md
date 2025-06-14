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
### /api/image/portrait-effect/
sample request
```bash
curl -X POST "http://localhost:8000/api/image/portrait-effect" \
     -H "accept: application/json" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@assets/mountains.jpg"
```
### /api/image/color-transfer/
sample request
```bash
curl -X POST "http://localhost:8000/api/image/color-transfer" \
     -H "accept: application/json" \
     -H "Content-Type: multipart/form-data" \
    -F "reference_file=@assets/barbie.jpg" \
    -F "target_file=@assets/mountains.jpg"
```

### /api/image/image-generation/
```bash
uv run python models/image.py generate_image -p "a beautiful sunset over mountains" -o test_generation.png --steps 20
```