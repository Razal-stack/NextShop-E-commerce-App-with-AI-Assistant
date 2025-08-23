"""
Execution Planner for App-Specific AI Reasoning
Pure LLM-driven execution planning with no hardcoded patterns
"""
from typing import Dict, List, Any, Optional
from pydantic import BaseModel
import json
import logging
from .config_manager import AppConfig, config_manager

logger = logging.getLogger(__name__)


class ExecutionStep(BaseModel):
    """Single execution step"""
    step_number: int
    step_type: str  # "data_fetch", "filter", "search", "ui_action"
    tool_name: str
    description: str
    parameters: Dict[str, Any]
    depends_on: Optional[List[int]] = []  # Steps this depends on
    optional: bool = False


class QueryAnalysis(BaseModel):
    """Analysis of user query"""
    intent: str
    confidence: float
    detected_entities: Dict[str, Any]
    requires_conversation_context: bool = False


class ExecutionPlan(BaseModel):
    """Complete execution plan"""
    query_analysis: QueryAnalysis
    steps: List[ExecutionStep]
    fallback_response: Optional[str] = None
    expected_result_format: str
    ui_guidance: Optional[str] = None


class ExecutionPlanner:
    """Creates execution plans based purely on LLM analysis - NO hardcoded patterns"""
    
    def __init__(self):
        # NO HARDCODED PATTERNS - Everything is LLM-driven
        pass
    
    def create_execution_plan_with_llm(
        self,
        query: str,
        app_name: str,
        llm_analysis: str,
        conversation_history: Optional[List[Dict]] = None,
        available_categories: Optional[List[str]] = None,
        mcp_tools: Optional[List[Dict]] = None,
        ui_handlers: Optional[List[Dict]] = None
    ) -> ExecutionPlan:
        """Create execution plan using PURE LLM analysis - NO pattern matching"""
        
        # Get app configuration
        app_config = config_manager.get_app_config(app_name)
        if not app_config:
            return ExecutionPlan(
                query_analysis=QueryAnalysis(
                    intent="error",
                    confidence=0.0,
                    detected_entities={},
                    requires_conversation_context=False
                ),
                steps=[],
                fallback_response=f"Unknown app: {app_name}",
                expected_result_format="text_response"
            )
        
        print(f"🧠 [AI Server] LLM analysis result: {llm_analysis}")
        
        # Parse LLM analysis - MUST be JSON
        try:
            # Extract the first complete JSON object from LLM response
            json_start = llm_analysis.find('{')
            if json_start == -1:
                raise ValueError("No JSON object found in LLM response")
            
            # Find the first complete JSON object by counting braces
            brace_count = 0
            json_end = json_start
            for i, char in enumerate(llm_analysis[json_start:], start=json_start):
                if char == '{':
                    brace_count += 1
                elif char == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        json_end = i + 1
                        break
            
            if brace_count != 0:
                raise ValueError("Incomplete JSON object in LLM response")
                
            first_json = llm_analysis[json_start:json_end]
            print(f"🎯 [AI Server] Extracted first JSON: {first_json}")
            
            llm_data = json.loads(first_json)
            print(f"✅ [AI Server] Parsed LLM data: {llm_data}")
        except json.JSONDecodeError as e:
            print(f"❌ [AI Server] JSON DECODE FAILED: {e}")
            print(f"🔍 [AI Server] Raw LLM response: {llm_analysis}")
            raise ValueError(f"LLM response is not valid JSON: {e}")
        
        # Create query analysis from LLM data
        query_analysis = QueryAnalysis(
            intent=llm_data.get('intent', 'general'),
            confidence=llm_data.get('confidence', 0.5),
            detected_entities=llm_data,
            requires_conversation_context=conversation_history is not None and len(conversation_history) > 0
        )
        
        # Handle different intents
        intent = llm_data.get('intent', 'product_search')
        
        if intent == "general_chat":
            # For general chat, return a direct response from LLM
            chat_message = llm_data.get('message', 'I can help you with shopping questions.')
            return ExecutionPlan(
                query_analysis=query_analysis,
                steps=[],
                fallback_response=chat_message,
                expected_result_format="text_response",
                ui_guidance=None
            )
        
        # Check if query is within app scope using LLM data
        if not self._is_query_in_scope(llm_data, app_config):
            return ExecutionPlan(
                query_analysis=query_analysis,
                steps=[],
                fallback_response=app_config.fallback_message or "I can only help with shopping-related queries.",
                expected_result_format="text_response"
            )
        
        # Create execution steps using PURE LLM analysis
        steps = self._create_steps_from_llm_data(llm_data, mcp_tools or [])
        
        return ExecutionPlan(
            query_analysis=query_analysis,
            steps=steps,
            expected_result_format="structured_product_response" if steps else "text_response",
            ui_guidance=None  # Let frontend handle UI logic
        )
    
    def _is_query_in_scope(self, llm_data: Dict[str, Any], app_config: AppConfig) -> bool:
        """Check if query is within app scope using LLM analysis"""
        # Trust LLM intent classification completely
        intent = llm_data.get('intent', 'general')
        confidence = llm_data.get('confidence', 0.0)
        
        # If LLM says it's product-related with decent confidence, trust it
        return intent != 'general' or confidence > 0.7
    
    def _create_steps_from_llm_data(self, llm_data: Dict[str, Any], mcp_tools: List[Dict]) -> List[ExecutionStep]:
        """Create execution steps based on intent - handle different types of queries"""
        steps = []
        intent = llm_data.get('intent', 'product_search')
        
        print(f"🎯 [AI Server] Creating steps for intent: {intent}")
        print(f"🧠 [AI Server] LLM data: {llm_data}")
        
        if intent == "product_search":
            # Create product search step
            steps.append(ExecutionStep(
                step_number=1,
                step_type="search",
                tool_name="products.list",
                description="Execute product search with LLM analysis",
                parameters=llm_data,  # Pass ENTIRE LLM output to backend
                depends_on=[],
                optional=False
            ))
            print(f"🛍️ [AI Server] Created product search step")
            
        elif intent == "ui_handling_action":
            # Create UI action step
            ui_handlers = llm_data.get('ui_handlers', [])
            steps.append(ExecutionStep(
                step_number=1,
                step_type="ui_action",
                tool_name="ui.handle",
                description="Execute UI action",
                parameters={
                    "action": llm_data.get('action', 'unknown'),
                    "ui_handlers": ui_handlers,
                    "query": llm_data.get('original_query', '')
                },
                depends_on=[],
                optional=False
            ))
            print(f"🎮 [AI Server] Created UI action step")
            
        elif intent == "general_chat":
            # For general chat, we don't need any steps - just return the message
            print(f"💬 [AI Server] General chat detected - no steps needed")
            # No steps needed, will be handled by fallback_response
            
        else:
            print(f"❓ [AI Server] Unknown intent: {intent}, treating as general chat")
        
        print(f"🚀 [AI Server] Created {len(steps)} execution steps")
        return steps


# Global planner instance
execution_planner = ExecutionPlanner()
