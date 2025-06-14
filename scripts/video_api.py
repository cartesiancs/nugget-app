from main import router


@router.get("/api/video/video-stabilization")
def api_video_stabilization():
    pass


@router.get("/api/image/remove-bg")
def api_video_background_removal():
    pass


@router.get("api/image/color-grading")
def api_video_color_grading():
    pass


@router.get("api/image/portrait-effect")
def api_video_portrait_effect():
    pass


@router.get("api/image/super-resolution")
def api_video_super_resolution():
    pass
