# FastAPI backend
## Setup
1. install `uv`
```bash
pip install uv
```

2. execute using `./run_server`

3. add packages using `uv add <packages>`

4. run using `uv run <file>`


# Testing stuff
## Video
### /api/video/video-stabilization
sample request
```bash
curl -X POST "http://localhost:8000/api/video/video-stabilization" \
     -H "accept: application/json" \
     -H "Content-Type: application/json" \
     -d '{
       "video_path": "assets/demo_video.mp4",
       "time_stamp": [0.0, 30.0]
     }'
```

### /api/video/remove-bg
sample request
```bash
curl -X POST "http://localhost:8000/api/video/remove-bg" \
     -H "accept: application/json" \
     -H "Content-Type: application/json" \
     -d '{
       "video_path": "assets/demo_video.mp4"
     }'
```

### /api/video/color-grading
sample request
```bash
curl -X POST "http://localhost:8000/api/video/color-grading" \
     -H "accept: application/json" \
     -H "Content-Type: application/json" \
     -d '{
       "video_path": "assets/demo_video.mp4",
       "reference_image_path": "assets/demo_reference.jpg"
     }'
```

### /api/video/portrait-effect
sample request
```bash
curl -X POST "http://localhost:8000/api/video/portrait-effect" \
     -H "accept: application/json" \
     -H "Content-Type: application/json" \
     -d '{
       "video_path": "assets/demo_video.mp4"
     }'
```
## Image
### /api/image/super-resolution
sample request
```bash
curl -X POST "http://localhost:8000/api/image/super-resolution" \
     -H "accept: application/json" \
     -H "Content-Type: application/json" \
     -d '{
       "image_path": "/absolute/path/to/your/image.jpg"
     }'
```
### /api/image/portrait-effect/
sample request
```bash
curl -X POST "http://localhost:8000/api/image/portrait-effect" \
     -H "accept: application/json" \
     -H "Content-Type: application/json" \
     -d '{
       "image_path": "/absolute/path/to/your/image.jpg"
     }'
```
### /api/image/color-transfer/
sample request
```bash
curl -X POST "http://localhost:8000/api/image/color-transfer" \
     -H "accept: application/json" \
     -H "Content-Type: application/json" \
     -d '{
       "image_path": "/absolute/path/to/target/image.jpg",
       "reference_image_path": "/absolute/path/to/reference/image.jpg"
     }'
```

### /api/image/background-removal/
sample request
```bash
curl -X POST "http://localhost:8000/api/image/remove-bg" \
     -H "accept: application/json" \
     -H "Content-Type: application/json" \
     -d '{
       "image_path": "/absolute/path/to/your/image.jpg"
     }'
```

### /api/image/image-generation/
```bash
uv run python models/image.py generate_image -p "a beautiful sunset over mountains" -o test_generation.png --steps 20
```