"""
App Configuration Manager for AI Server
Manages different app contexts and their specific capabilities
"""
import json
import yaml
from pathlib import Path
from typing import Dict, List, Any, Optional
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)


class MCPTool(BaseModel):
    """MCP Tool Definition"""
    name: str
    description: str
    parameters: Dict[str, Any]
    category: str  # "data", "action", "ui"
    required_params: List[str] = []


class FilterConstraint(BaseModel):
    """Filter Constraint Definition"""
    name: str
    type: str  # "range", "categorical", "boolean", "text"
    description: str
    options: Optional[List[str]] = None  # For categorical filters
    min_value: Optional[float] = None     # For range filters
    max_value: Optional[float] = None     # For range filters


class UIHandler(BaseModel):
    """UI Handler Definition"""
    name: str
    description: str
    requires_data: bool = False
    data_format: Optional[str] = None


class AppConfig(BaseModel):
    """Complete App Configuration - Simplified for Dynamic Architecture"""
    app_name: str
    app_version: str
    description: str
    
    # Core capabilities - simplified for dynamic loading
    mcp_tools: List[Dict[str, Any]] = []  # Dynamic tools from backend
    filter_constraints: List[Dict[str, Any]] = []
    ui_handlers: List[Dict[str, Any]] = []  # Dynamic handlers from backend
    categories: List[str]
    
    # AI behavior settings
    ai_scope: str  # Description of what the AI should help with
    fallback_message: str  # When query is outside scope
    max_steps: int = 4
    
    # Context settings
    include_conversation_history: bool = True
    max_conversation_turns: int = 10


class ConfigManager:
    """Manages app configurations and provides context"""
    
    def __init__(self):
        self.configs_dir = Path("configs")
        self.configs_dir.mkdir(exist_ok=True)
        self.loaded_configs: Dict[str, AppConfig] = {}
        self._load_all_configs()
    
    def _load_all_configs(self):
        """Load all app configurations"""
        if not self.configs_dir.exists():
            logger.warning("No configs directory found, creating default NextShop config")
            self._create_nextshop_config()
            return
            
        for config_file in self.configs_dir.glob("*.json"):
            try:
                with open(config_file, 'r') as f:
                    config_data = json.load(f)
                    config = AppConfig(**config_data)
                    self.loaded_configs[config.app_name] = config
                    logger.info(f"Loaded config for {config.app_name}")
            except Exception as e:
                logger.error(f"Failed to load config {config_file}: {e}")
    
    def get_app_config(self, app_name: str) -> Optional[AppConfig]:
        """Get configuration for a specific app"""
        return self.loaded_configs.get(app_name)
    
    def list_available_apps(self) -> List[str]:
        """List all configured apps"""
        return list(self.loaded_configs.keys())
    
    def _create_nextshop_config(self):
        """Create default NextShop configuration - Dynamic architecture with no hardcoded MCP tools"""
        nextshop_config = {
            "app_name": "nextshop",
            "app_version": "1.0.0",
            "description": "NextShop E-commerce AI Assistant",
            
            # MCP Tools are passed dynamically by backend - no hardcoded tools
            "mcp_tools": [],
            
            # Filter constraints are generic and not tool-specific
            "filter_constraints": [
                {
                    "name": "price_range",
                    "type": "range",
                    "description": "Product price range",
                    "min_value": 0,
                    "max_value": 10000
                },
                {
                    "name": "rating",
                    "type": "range", 
                    "description": "Product rating",
                    "min_value": 1,
                    "max_value": 5
                },
                {
                    "name": "availability",
                    "type": "categorical",
                    "description": "Product availability",
                    "options": ["in_stock", "out_of_stock", "pre_order"]
                },
                {
                    "name": "brand",
                    "type": "categorical",
                    "description": "Product brand",
                    "options": []  # Will be populated dynamically
                }
            ],
            
            # UI handlers are passed dynamically by backend - no hardcoded handlers
            "ui_handlers": [],
            
            # Categories will be passed dynamically from backend - no hardcoded categories
            "categories": [],
            
            "ai_scope": "I am a NextShop AI assistant focused on helping customers find, compare, and purchase products. I can search products, apply filters, check availability, and guide you through the shopping process.",
            
            "fallback_message": "I'm here to help you with shopping on NextShop. I can help you find products, check prices, and guide you through your purchase. For general questions outside of shopping, I'd recommend asking elsewhere.",
            
            "max_steps": 4,
            "include_conversation_history": True,
            "max_conversation_turns": 10
        }
        
        # Save the config
        config_path = self.configs_dir / "nextshop.json"
        with open(config_path, 'w') as f:
            json.dump(nextshop_config, f, indent=2)
        
        # Load it
        config = AppConfig(**nextshop_config)
        self.loaded_configs["nextshop"] = config
        logger.info("Created and loaded default NextShop configuration")


# Global config manager instance
config_manager = ConfigManager()
