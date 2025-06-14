TOOL_INFO = {
    "add_shape": {
        "description": "Add a shape onto the timeline. Can be a 'circle', 'triangle', or 'rectangle'.",
        "params": {
            "shape": {"type": "string", "description": "The type of shape to add. Can be 'circle', 'triangle', or 'rectangle'."},
            "locationX": {"type": "integer", "description": "The X coordinate for the top-left corner of the shape's bounding box."},
            "locationY": {"type": "integer", "description": "The Y coordinate for the top-left corner of the shape's bounding box."},
            "width": {"type": "integer", "description": "The width of the shape. For a circle, this is the diameter."},
            "height": {"type": "integer", "description": "The height of the shape. For a square, use equal width and height."},
            "fillColor": {"type": "string", "description": "The fill color of the shape as a hex code or color name, e.g., 'red', '#FF0000'."},
            "startTime": {"type": "integer", "description": "The start time for the shape to appear on the timeline, in milliseconds."},
            "duration": {"type": "integer", "description": "How long the shape should be displayed, in milliseconds."},
        }
    }
} 