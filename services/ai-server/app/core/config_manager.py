"""
Generic configuration manager for any application
Supports YAML and JSON formats dynamically
"""
import json
import yaml
import os
from typing import Dict, Any, List, Optional, Union
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class ConfigManager:
    """Generic configuration manager - no app-specific knowledge"""
    
    def __init__(self, config_dir: str = "configs"):
        """Initialize generic config manager"""
        self.config_dir = Path(config_dir)
        self.config_dir.mkdir(exist_ok=True)
        self._configs: Dict[str, Dict[str, Any]] = {}
        self._load_all_configs()
    
    def _load_all_configs(self):
        """Load all config files (JSON and YAML) automatically"""
        config_files = list(self.config_dir.glob("*.json")) + list(self.config_dir.glob("*.yaml")) + list(self.config_dir.glob("*.yml"))
        
        for config_file in config_files:
            try:
                app_name = config_file.stem
                config_data = self._load_config_file(config_file)
                self._configs[app_name] = config_data
                logger.info(f"✅ Loaded {config_file.suffix} config for '{app_name}'")
            except Exception as e:
                logger.error(f"❌ Failed to load {config_file}: {e}")
    
    def _load_config_file(self, config_file: Path) -> Dict[str, Any]:
        """Load config file - auto-detect JSON or YAML"""
        with open(config_file, 'r', encoding='utf-8') as f:
            if config_file.suffix.lower() in ['.yaml', '.yml']:
                return yaml.safe_load(f)
            else:  # JSON
                return json.load(f)
    
    def list_available_apps(self) -> List[str]:
        """List all available app configurations"""
        return list(self._configs.keys())
    
    def get_config(self, app_name: str) -> Optional[Dict[str, Any]]:
        """Get complete configuration for any app"""
        return self._configs.get(app_name)
    
    def get_config_value(self, app_name: str, key_path: str, default: Any = None) -> Any:
        """Get specific config value using dot notation (e.g., 'llm.parameters.temperature')"""
        config = self.get_config(app_name)
        if not config:
            return default
        
        keys = key_path.split('.')
        value = config
        
        try:
            for key in keys:
                value = value[key]
            return value
        except (KeyError, TypeError):
            return default
    
    def reload_config(self, app_name: str) -> bool:
        """Reload specific app configuration"""
        # Find config file (check both JSON and YAML)
        for extension in ['.json', '.yaml', '.yml']:
            config_file = self.config_dir / f"{app_name}{extension}"
            if config_file.exists():
                try:
                    config_data = self._load_config_file(config_file)
                    self._configs[app_name] = config_data
                    logger.info(f"✅ Reloaded config for '{app_name}' from {config_file.name}")
                    return True
                except Exception as e:
                    logger.error(f"❌ Failed to reload {app_name}: {e}")
                    return False
        
        logger.error(f"❌ No config file found for '{app_name}'")
        return False
    
    def reload_all_configs(self):
        """Reload all configurations"""
        self._configs.clear()
        self._load_all_configs()
    
    def config_exists(self, app_name: str) -> bool:
        """Check if configuration exists for app"""
        return app_name in self._configs
    
    def get_app_list_with_info(self) -> Dict[str, Dict[str, Any]]:
        """Get list of apps with basic info"""
        apps_info = {}
        for app_name, config in self._configs.items():
            apps_info[app_name] = {
                "name": config.get("app", {}).get("name", app_name),
                "version": config.get("app", {}).get("version", "unknown"),
                "description": config.get("app", {}).get("description", "No description available")
            }
        return apps_info


# Global instance
config_manager = ConfigManager()
