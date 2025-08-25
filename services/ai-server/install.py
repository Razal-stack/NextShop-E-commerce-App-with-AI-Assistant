#!/usr/bin/env python3
"""Install script - equivalent to 'pnpm i' for webapp"""

import os
import sys
import subprocess
import venv

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print(f"Error: Python 3.8+ required, but you have {sys.version}")
        print("Please install Python 3.8 or higher from https://python.org")
        sys.exit(1)
    
    print(f"Python {sys.version_info.major}.{sys.version_info.minor} detected - OK")

def main():
    """Install dependencies like pnpm i"""
    print("Installing AI Server dependencies...")
    
    # Check Python version first
    check_python_version()
    
    # Ensure we're in the right directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Create venv if it doesn't exist
    if not os.path.exists("venv"):
        print("Creating virtual environment...")
        venv.create("venv", with_pip=True)
    
    # Get the right python executable
    if sys.platform == "win32":
        python_exe = "venv\\Scripts\\python.exe"
        pip_exe = "venv\\Scripts\\pip.exe"
    else:
        python_exe = "venv/bin/python"
        pip_exe = "venv/bin/pip"
    
    try:
        # Upgrade pip first
        print("Upgrading pip...")
        subprocess.run([python_exe, "-m", "pip", "install", "--upgrade", "pip"], check=True)
        
        # Install project in development mode
        print("Installing dependencies...")
        subprocess.run([pip_exe, "install", "-e", ".[dev]"], check=True)
        
        # Automatically download optimal models for this system
        print("\nDownloading AI models...")
        print("This will select the best models based on your available RAM...")
        try:
            subprocess.run([python_exe, "download_models.py"], check=True)
            print("Models downloaded successfully!")
        except subprocess.CalledProcessError as e:
            print(f"Warning: Model download failed: {e}")
            print("You can download models later by running: python download_models.py")
        
        print("\nInstallation complete!")
        print("Run 'python dev.py' to start development server")
        
    except subprocess.CalledProcessError as e:
        print(f"Installation failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
