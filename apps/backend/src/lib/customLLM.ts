import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatGeneration, ChatGenerationChunk, ChatResult } from "@langchain/core/outputs";
import { BaseMessage, AIMessage } from "@langchain/core/messages";
import { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import axios from 'axios';

const AI_INFERENCE_URL = process.env.AI_INFERENCE_URL ?? 'http://localhost:8009';

export class InferenceChatModel extends BaseChatModel {
  _llmType() { return "InferenceChatModel"; }

  bindTools(tools: any[]): InferenceChatModel {
    // For tool calling, we just return this instance since we handle tools in the agent
    return this;
  }

  async _generate(
    messages: BaseMessage[],
    options?: any,
    runManager?: CallbackManagerForLLMRun
  ): Promise<ChatResult> {
    // Convert messages to a single prompt string
    const prompt = messages.map(m => `${m._getType()}: ${m.content}`).join('\n');
    
    const response = await axios.post(`${AI_INFERENCE_URL}/api/v1/generate`, { prompt });
    let generations = response.data.generations;
    
    if (Array.isArray(generations) && generations.length > 0) {
      const gen = generations.flat(Infinity)[0];
      let text = gen.text;
      if (Array.isArray(text)) text = text.map(t => typeof t === 'string' ? t : t.text).join(' ');
      if (typeof text === 'object' && text.text) text = text.text;
      if (typeof text !== 'string') text = String(text);
      
      const chatGeneration: ChatGeneration = {
        text,
        message: new AIMessage(text),
        generationInfo: {},
      };
      
      return {
        generations: [chatGeneration],
        llmOutput: {}
      };
    }
    
    const emptyChatGeneration: ChatGeneration = {
      text: "",
      message: new AIMessage(""),
      generationInfo: {}
    };
    
    return {
      generations: [emptyChatGeneration],
      llmOutput: {}
    };
  }
}
