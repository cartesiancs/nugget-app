import random

CONVERSATIONAL_RESPONSES = [
    "Sure, I can do that for you!",
    "Okay, executing now.",
    "Let's do this!",
    "On it!",
    "Consider it done.",
    "Right away.",
    "Processing your request.",
    "Working on it now.",
    "Of course!",
    "Done.",
    "Got it.",
    "Alright, here you go.",
    "Just a moment.",
    "Here are the results.",
    "As you wish."
]

def get_random_conversational_response() -> str:
    """Returns a random conversational response."""
    return random.choice(CONVERSATIONAL_RESPONSES) 