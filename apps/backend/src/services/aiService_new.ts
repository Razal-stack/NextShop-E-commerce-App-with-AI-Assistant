import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { InferenceChatModel } from "../lib/customLLM";
import * as toolFactory from '../mcp/tools';
import axios from 'axios';
import redisClient from '../lib/redisClient';

const AI_INFERENCE_URL = process.env.AI_INFERENCE_URL ?? 'http://localhost:8000';

interface NexResponse {
    message: string;
    displayMode: 'chat_only' | 'auto_navigate' | 'dual_view';
    data?: {
        products?: any[];
        totalFound?: number;
        cart?: any;
    };
    actions?: {
        type: 'navigate' | 'filter_products' | 'add_to_cart' | 'add_to_wishlist' | 'ui_handler';
        payload: any;
    }[];
    executionPlan?: {
        steps: ExecutionStep[];
        requiresUserConfirmation?: boolean;
    };
    uiHandlers?: UIHandler[];
}

interface ExecutionStep {
    step_number: number;
    step_type: string; // "data_fetch", "filter", "search", "ui_action"
    tool_name: string;
    description: string;
    parameters: any;
    depends_on?: number[];
    optional?: boolean;
}

interface UIHandler {
    type: string; // "add_to_cart", "remove_from_cart", "login", "confirmation"
    description: string;
    data?: any;
    requiresConfirmation?: boolean;
}

interface AppReasoningRequest {
    app_name: string;
    user_query: string;
    available_categories?: string[];
    conversation_history?: Array<{role: string, content: string, timestamp?: string}>;
    mcp_tools_context?: any[];
    ui_handlers_context?: any[];
    current_filters?: any;
    user_session?: any;
}

interface AppReasoningResponse {
    query_analysis: {
        intent: string;
        confidence: number;
        detected_entities: any;
        requires_conversation_context: boolean;
    };
    execution_plan: ExecutionStep[];
    fallback_response?: string;
    expected_result_format: string;
    ui_guidance?: string;
    processing_time_ms: number;
    model_used: string;
    app_config_used: string;
}

export class AIService {
    private executor: AgentExecutor;
    private userId: number;
    private tools: any[];
    private conversationHistory: Array<{role: string, content: string, timestamp: string}> = [];

    constructor(userId: number) {
        this.userId = userId;
        const llm = new InferenceChatModel({});
        this.tools = Object.values(toolFactory).map(createTool => createTool(userId));
        
        // Enhanced prompt for better reasoning
        const prompt = ChatPromptTemplate.fromMessages([
          ["system", `You are NextShop's AI assistant. Your job is to analyze user queries and coordinate with our AI reasoning server for execution planning.

Available MCP tools:
${this.tools.map(tool => `- ${tool.name}: ${tool.description}`).join('\n')}

Your role is to:
1. Send complex queries to the AI reasoning server for execution planning
2. Execute the planned steps using available MCP tools
3. Handle simple queries directly
4. Manage conversation context and user session

Always maintain context and provide helpful, accurate responses about products, shopping, and e-commerce tasks.`],
          ["human", "{input}"],
          ["ai", "{agent_scratchpad}"]
        ]);
        const agent = createToolCallingAgent({ llm, tools: this.tools, prompt });
        this.executor = new AgentExecutor({ agent, tools: this.tools, verbose: true });
    }

    public async run(query: string, conversationHistory: Array<{role: string, content: string}> = []): Promise<NexResponse> {
        // Update conversation history
        this.conversationHistory = conversationHistory.map(msg => ({
            ...msg,
            timestamp: new Date().toISOString()
        }));
        
        try {
            // First, get execution plan from AI reasoning server
            const reasoningResponse = await this.getExecutionPlan(query, conversationHistory);
            
            // Check if we have a fallback response (out of scope or simple query)
            if (reasoningResponse.fallback_response) {
                return {
                    message: reasoningResponse.fallback_response,
                    displayMode: 'chat_only'
                };
            }
            
            // Execute the planned steps
            if (reasoningResponse.execution_plan && reasoningResponse.execution_plan.length > 0) {
                return await this.executeSteps(reasoningResponse.execution_plan, reasoningResponse.ui_guidance, query);
            }
            
            // Fallback to direct execution if no plan
            return await this.directExecution(query);
            
        } catch (error) {
            console.error('AI Service error:', error);
            return {
                message: "I apologize, but I'm having trouble processing your request right now. Could you please try rephrasing your question?",
                displayMode: 'chat_only'
            };
        }
    }
    
    private async getExecutionPlan(query: string, conversationHistory: Array<{role: string, content: string}>): Promise<AppReasoningResponse> {
        // Get available categories from products
        const availableCategories = await this.getAvailableCategories();
        
        // Prepare MCP tools context
        const mcpToolsContext = this.tools.map(tool => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.schema || {}
        }));
        
        // Prepare UI handlers context
        const uiHandlersContext = [
            {
                name: "add_to_cart",
                description: "Add selected products to shopping cart",
                requires_data: true,
                data_format: "product_list"
            },
            {
                name: "remove_from_cart", 
                description: "Remove products from shopping cart",
                requires_data: true,
                data_format: "product_ids"
            },
            {
                name: "show_product_details",
                description: "Display detailed product information",
                requires_data: true,
                data_format: "product_id"
            },
            {
                name: "login_required",
                description: "Prompt user to login",
                requires_data: false
            },
            {
                name: "confirmation_required",
                description: "Ask for user confirmation before proceeding",
                requires_data: true,
                data_format: "action_details"
            }
        ];
        
        const requestData: AppReasoningRequest = {
            app_name: "nextshop",
            user_query: query,
            available_categories: availableCategories,
            conversation_history: conversationHistory,
            mcp_tools_context: mcpToolsContext,
            ui_handlers_context: uiHandlersContext,
            current_filters: {},
            user_session: {
                user_id: this.userId,
                timestamp: new Date().toISOString()
            }
        };
        
        const response = await axios.post(`${AI_INFERENCE_URL}/app-reason`, requestData, {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        return response.data;
    }
    
    private async executeSteps(steps: ExecutionStep[], uiGuidance?: string, originalQuery?: string): Promise<NexResponse> {
        let accumulatedData: any = {};
        let products: any[] = [];
        let uiHandlers: UIHandler[] = [];
        let message = "";
        let displayMode: 'chat_only' | 'auto_navigate' | 'dual_view' = 'chat_only';
        
        // Execute steps in order
        for (const step of steps) {
            try {
                const result = await this.executeStep(step, accumulatedData);
                accumulatedData[`step_${step.step_number}`] = result;
                
                // Process results based on step type
                if (step.step_type === 'data_fetch' && result.success && result.products) {
                    products = result.products;
                }
                
                if (step.step_type === 'filter' && result.success && result.products) {
                    products = result.products;
                }
                
                if (step.step_type === 'search' && result.success && result.products) {
                    products = result.products;
                }
                
                if (step.step_type === 'ui_action') {
                    uiHandlers.push({
                        type: step.tool_name,
                        description: step.description,
                        data: step.parameters,
                        requiresConfirmation: true
                    });
                }
                
            } catch (error) {
                console.error(`Step ${step.step_number} failed:`, error);
                // Continue with other steps unless critical
                if (!step.optional) {
                    return {
                        message: `I encountered an issue while ${step.description.toLowerCase()}. Please try again.`,
                        displayMode: 'chat_only'
                    };
                }
            }
        }
        
        // Format response based on results
        if (products.length > 0) {
            const totalFound = products.length;
            message = `I found ${totalFound} products that match your request! `;
            
            if (originalQuery?.includes('under') || originalQuery?.includes('below')) {
                const priceMatch = originalQuery.match(/(\d+)/);
                if (priceMatch) message += `All items are under £${priceMatch[1]}. `;
            }
            
            message += `Here are the ${Math.min(products.length, 5)} best matches:`;
            
            displayMode = products.length > 3 ? 'auto_navigate' : 'dual_view';
            
            return {
                message,
                displayMode,
                data: {
                    products: products.slice(0, 10), // Limit display
                    totalFound
                },
                actions: products.length > 3 ? [{
                    type: 'navigate',
                    payload: { page: '/products' }
                }] : [],
                executionPlan: { steps },
                uiHandlers
            };
        }
        
        // Handle UI-only actions
        if (uiHandlers.length > 0) {
            return {
                message: uiGuidance || "I've prepared some actions for you to review.",
                displayMode: 'chat_only',
                uiHandlers,
                executionPlan: { 
                    steps,
                    requiresUserConfirmation: true
                }
            };
        }
        
        // Default response
        return {
            message: message || "I've processed your request successfully!",
            displayMode: 'chat_only',
            executionPlan: { steps }
        };
    }
    
    private async executeStep(step: ExecutionStep, accumulatedData: any): Promise<any> {
        // Find the matching MCP tool
        const tool = this.tools.find(t => t.name === step.tool_name);
        if (!tool) {
            throw new Error(`Tool ${step.tool_name} not found`);
        }
        
        // Prepare parameters, substituting templates from previous steps
        let parameters = { ...step.parameters };
        
        // Replace template variables from previous step results
        const paramStr = JSON.stringify(parameters);
        const substituted = paramStr.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            if (key === 'previous_step_product_ids') {
                const lastStepWithProducts: any = Object.values(accumulatedData)
                    .reverse()
                    .find((data: any) => data?.products?.length > 0);
                return JSON.stringify(lastStepWithProducts?.products?.map((p: any) => p.id) || []);
            }
            if (key === 'final_product_list') {
                const allProducts = Object.values(accumulatedData)
                    .flatMap((data: any) => data?.products || []);
                return JSON.stringify(allProducts);
            }
            return accumulatedData[key] || match;
        });
        
        parameters = JSON.parse(substituted);
        
        // Execute the tool
        const result = await tool.func(JSON.stringify(parameters));
        return JSON.parse(result);
    }
    
    private async getAvailableCategories(): Promise<string[]> {
        try {
            const tool = this.tools.find(t => t.name.includes('products.list') || t.name.includes('categories'));
            if (tool) {
                const result = await tool.func('{"limit": 1}');
                const parsed = JSON.parse(result);
                return parsed.availableCategories || [
                    "men's clothing",
                    "women's clothing", 
                    "electronics",
                    "jewelery"
                ];
            }
        } catch (error) {
            console.error('Failed to get categories:', error);
        }
        
        return [
            "men's clothing",
            "women's clothing", 
            "electronics",
            "jewelery",
            "home & garden",
            "sports & outdoors"
        ];
    }
    
    private async directExecution(query: string): Promise<NexResponse> {
        // Fallback to original execution method for simple queries
        const result = await this.executor.invoke({ input: query });
        
        try {
            const toolCall = JSON.parse(result.output);
            if (toolCall.tool && toolCall.args) {
                const matchingTool = this.tools.find(tool => tool.name === toolCall.tool);
                if (matchingTool) {
                    const toolResult = await matchingTool.func(JSON.stringify(toolCall.args));
                    return this.formatResponse(query, toolCall.tool, toolResult);
                }
            }
        } catch (e) {
            // Not a tool call
        }
        
        return {
            message: result.output,
            displayMode: 'chat_only'
        };
    }

    private formatResponse(query: string, toolName: string, toolResult: string): NexResponse {
        try {
            const result = JSON.parse(toolResult);
            
            if (toolName.includes('products.list')) {
                const products = result.success ? result.products : [];
                const totalFound = products.length;
                
                // Smart response based on query context
                let message = "";
                let displayMode: 'chat_only' | 'auto_navigate' | 'dual_view' = 'chat_only';
                
                if (totalFound > 0) {
                    message = `I found ${totalFound} products! `;
                    
                    // Check for price queries
                    if (query.includes('under') || query.includes('below')) {
                        const priceMatch = query.match(/(\d+)/);
                        if (priceMatch) message += `All items are under £${priceMatch[1]}. `;
                    }
                    
                    message += `Here are the best matches:`;
                    displayMode = totalFound > 3 ? 'auto_navigate' : 'dual_view';
                    
                    return {
                        message,
                        displayMode,
                        data: {
                            products: products.slice(0, 10),
                            totalFound
                        },
                        actions: totalFound > 3 ? [{
                            type: 'navigate',
                            payload: { page: '/products' }
                        }] : []
                    };
                } else {
                    return {
                        message: "I couldn't find any products matching that criteria. Try different keywords or categories!",
                        displayMode: 'chat_only'
                    };
                }
            }
            
            if (toolName.includes('cart.add')) {
                if (result.success) {
                    return {
                        message: `Great! I've added the product to your cart. Your cart now has ${result.cartTotal} items.`,
                        displayMode: 'chat_only',
                        data: { cart: result.cart }
                    };
                } else {
                    return {
                        message: result.error || "I couldn't add that item to your cart. Please try again.",
                        displayMode: 'chat_only'
                    };
                }
            }
            
            if (toolName.includes('cart.get')) {
                if (result.success && result.items && result.items.length > 0) {
                    return {
                        message: `You have ${result.items.length} items in your cart with a total of £${result.total.toFixed(2)}.`,
                        displayMode: 'chat_only',
                        data: { cart: result }
                    };
                } else {
                    return {
                        message: "Your cart is currently empty. Start shopping to add some products!",
                        displayMode: 'chat_only'
                    };
                }
            }
            
            if (toolName.includes('notifications.emailCart')) {
                if (result.success) {
                    return {
                        message: `Perfect! I've sent your cart summary to ${result.email}. Check your inbox!`,
                        displayMode: 'chat_only'
                    };
                } else {
                    return {
                        message: result.error || "I couldn't send the email. Please check the email address and try again.",
                        displayMode: 'chat_only'
                    };
                }
            }
            
            // Default response for other tools
            return {
                message: result.success ? 
                    (result.message || "Task completed successfully!") :
                    (result.error || "I encountered an issue processing that request."),
                displayMode: 'chat_only',
                data: result.data || {}
            };
            
        } catch (error) {
            console.error('Error parsing tool result:', error);
            return {
                message: "I completed the task, but had trouble formatting the response. Please check if everything looks correct.",
                displayMode: 'chat_only'
            };
        }
    }

    public async imageSearch(image_b64: string): Promise<NexResponse> {
        const response = await axios.post(`${AI_INFERENCE_URL}/describe-image`, { image_b64 });
        const caption = response.data.caption;
        if (!caption) {
            return {
                message: "I couldn't analyze that image. Please try a different image or ask about products in text.",
                displayMode: 'chat_only'
            };
        }
        const searchQuery = `Find products that look like: ${caption}. Also, tell the user you understood the image by mentioning what you saw.`;
        return this.run(searchQuery);
    }
}
