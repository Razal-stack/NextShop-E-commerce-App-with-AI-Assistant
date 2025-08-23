#!/usr/bin/env python3
"""
Initialize NextShop configuration for the AI server
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config_manager import config_manager

def init_configs():
    """Initialize all app configurations"""
    print("🔧 Initializing AI Server Configurations...")
    
    # Check if configs directory exists
    config_dir = config_manager.configs_dir
    print(f"📁 Config directory: {config_dir}")
    
    # Force create NextShop config
    print("🏪 Creating NextShop configuration...")
    config_manager._create_nextshop_config()
    
    # List available apps
    available_apps = config_manager.list_available_apps()
    print(f"✅ Available apps: {available_apps}")
    
    # Get NextShop config details
    nextshop_config = config_manager.get_app_config("nextshop")
    if nextshop_config:
        print(f"🛍️ NextShop config loaded successfully!")
        print(f"   - Version: {nextshop_config.app_version}")
        print(f"   - MCP Tools: {len(nextshop_config.mcp_tools)}")
        print(f"   - Categories: {len(nextshop_config.categories)}")
        print(f"   - UI Handlers: {len(nextshop_config.ui_handlers)}")
    else:
        print("❌ Failed to load NextShop config")
        return False
    
    return True

if __name__ == "__main__":
    success = init_configs()
    if success:
        print("\n🎉 Configuration initialization complete!")
        sys.exit(0)
    else:
        print("\n💥 Configuration initialization failed!")
        sys.exit(1)
