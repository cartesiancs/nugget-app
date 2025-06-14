import os
import importlib.util

TOOL_INFO = {}

def load_tools():
    """
    Dynamically loads tool information from all subdirectories in the prompts folder.
    """
    prompts_dir = os.path.dirname(__file__)
    
    for tool_name in os.listdir(prompts_dir):
        tool_dir = os.path.join(prompts_dir, tool_name)
        if os.path.isdir(tool_dir):
            tool_info_path = os.path.join(tool_dir, "tool_info.py")
            if os.path.exists(tool_info_path):
                spec = importlib.util.spec_from_file_location(f"prompts.{tool_name}.tool_info", tool_info_path)
                tool_module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(tool_module)
                
                if hasattr(tool_module, 'TOOL_INFO'):
                    TOOL_INFO.update(tool_module.TOOL_INFO)

# Load tools on startup
load_tools()
