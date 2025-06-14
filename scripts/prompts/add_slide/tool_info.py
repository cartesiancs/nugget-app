TOOL_INFO = {
    "add_slide": {
        "description": "Add a slide with text, background color, and animation onto the timeline.",
        "params": {
            "text": {"type": "string", "description": "The text content to be displayed on the slide. NULL if not specified."},
            "position": {"type": "string", "description": "Where should the slide start? Can be either 'begin' or 'end'. NULL if not specified."},
            "duration": {"type": "integer", "description": "How long the slide should be displayed, in milliseconds. NULL if not specified."},
            "bgColor": {"type": "string", "description": "The background color of the slide as a hex code, e.g., 'black', '#000000'. NULL if not specified."},
            "animation": {"type": "string", "description": "Set to 'True' to enable animation, 'NULL' if disable/not specified."},
        }
    }
} 