#!/usr/bin/env python3
"""
Setup and run the NextShop AI Inference Server
"""
import os
import sys
import subprocess
import urllib.request
from pathlib import Path

def check_python():
    """Check Python version"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ required")
        return False
    print(f"✅ Python {sys.version.split()[0]} found")
    return True

def setup_venv():
    """Create and activate virtual environment"""
    venv_path = Path("venv")
    if not venv_path.exists():
        print("📦 Creating virtual environment...")
        subprocess.run([sys.executable, "-m", "venv", "venv"], check=True)
    
    # Determine activation script based on OS
    if os.name == 'nt':  # Windows
        activate_script = venv_path / "Scripts" / "activate.bat"
        pip_path = venv_path / "Scripts" / "pip"
        python_path = venv_path / "Scripts" / "python"
    else:  # Unix/Linux/Mac
        activate_script = venv_path / "bin" / "activate"
        pip_path = venv_path / "bin" / "pip"
        python_path = venv_path / "bin" / "python"
    
    return str(pip_path), str(python_path)

def install_requirements(pip_path):
    """Install Python requirements"""
    print("📋 Installing requirements...")
    subprocess.run([pip_path, "install", "--upgrade", "pip"], check=True)
    subprocess.run([pip_path, "install", "-r", "requirements.txt"], check=True)
    print("✅ Requirements installed")

def check_model():
    """Check if any GGUF models exist"""
    import glob
    
    model_dir = Path("models")
    if not model_dir.exists():
        model_dir.mkdir(exist_ok=True)
        
    gguf_files = list(model_dir.glob("*.gguf"))
    
    if not gguf_files:
        print("❌ No GGUF models found!")
        print(f"   Please download any GGUF model file to: {model_dir.absolute()}")
        print()
        print("📋 Recommended models:")
        print("   • Qwen2.5-3B-Instruct: https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF")
        print("   • Llama-3.1-8B: https://huggingface.co/bartowski/Meta-Llama-3.1-8B-Instruct-GGUF")
        print("   • Phi-3.5-Mini: https://huggingface.co/microsoft/Phi-3.5-mini-instruct-gguf")
        print()
        print("💡 Any .gguf file will work - the server auto-detects models!")
        return False
    
    print(f"✅ Found {len(gguf_files)} GGUF model(s):")
    for model_file in gguf_files[:3]:  # Show first 3
        model_size_mb = model_file.stat().st_size / (1024 * 1024)
        print(f"   • {model_file.name} ({model_size_mb:.1f} MB)")
    if len(gguf_files) > 3:
        print(f"   • ... and {len(gguf_files) - 3} more")
    
    # Show which one will be loaded
    primary_model = sorted([f.name for f in gguf_files])[0]
    print(f"🎯 Primary model to load: {primary_model}")
    
    return True

def main():
    """Main setup and run function"""
    print("🚀 NextShop AI Inference Server Setup")
    print("=" * 40)
    
    if not check_python():
        return 1
    
    try:
        pip_path, python_path = setup_venv()
        install_requirements(pip_path)
        
        if not check_model():
            print("\n⚠️  Server can start but will fail without the model file")
            response = input("Continue anyway? (y/N): ")
            if response.lower() != 'y':
                return 1
        
        print("\n🎯 Starting AI Inference Server...")
        print("   Server will run on: http://localhost:8009")
        print("   Health check: http://localhost:8009/health")
        print("   Press Ctrl+C to stop")
        print("=" * 40)
        
        # Start the server
        subprocess.run([python_path, "main.py"])
        
    except KeyboardInterrupt:
        print("\n👋 Server stopped")
        return 0
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
