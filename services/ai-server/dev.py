#!/usr/bin/env python3
"""Development server runner - equivalent to 'pnpm dev' for webapp"""

import os
import sys
import subprocess

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print(f"Error: Python 3.8+ required, but you have {sys.version}")
        print("Please install Python 3.8 or higher from https://python.org")
        sys.exit(1)

def get_python_executable():
    """Get the right Python executable based on platform and virtual environment"""
    if sys.platform == "win32":
        venv_python = "venv\\Scripts\\python.exe"
    else:
        venv_python = "venv/bin/python"
    
    # Use virtual environment Python if it exists
    if os.path.exists(venv_python):
        return venv_python
    else:
        # Fall back to system Python
        return sys.executable

def main():
    """Start the development server with hot reload"""
    print("Starting AI Server Development Mode...")
    
    # Check Python version first
    check_python_version()
    
    # Ensure we're in the right directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Get the right Python executable
    python_exe = get_python_executable()
    
    if not os.path.exists("venv"):
        print("Virtual environment not found. Please run 'python install.py' first.")
        sys.exit(1)
    
    try:
        # Start uvicorn with hot reload
        subprocess.run([
            python_exe, "-m", "uvicorn",
            "app.main:app",
            "--host", "0.0.0.0", 
            "--port", "8000",
            "--reload",
            "--log-level", "info"
        ], check=True)
    except KeyboardInterrupt:
        print("\nServer stopped")
    except Exception as e:
        print(f"Error starting server: {e}")
        print("Make sure you ran 'python install.py' first to set up dependencies")
        sys.exit(1)

if __name__ == "__main__":
    main()
