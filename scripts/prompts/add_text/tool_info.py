TOOL_INFO = {
    "add_text": {
        "description": "Add text onto the timeline",
        "params": {
            "text": {"type": "string", "description": "The text content to be displayed. For example, if the user says 'add the text epic', this value should be 'epic'."},
            "fontsize": {"type": "integer", "description": "The font size of the text."},
            "textColor": {"type": "string", "description": "The color of the text as a hex code e.g. '#FF0000'."},
            "locationX": {"type": "integer", "description": "The X coordinate for the top-left corner of the text."},
            "locationY": {"type": "integer", "description": "The Y coordinate for the top-left corner of the text."},
            "startTime": {"type": "integer", "description": "The start time for the text to appear on the timeline, in milliseconds."},
            "duration": {"type": "integer", "description": "How long the text should be displayed, in milliseconds."},
        }
    }
} 