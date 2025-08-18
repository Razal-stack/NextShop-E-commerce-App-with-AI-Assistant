// AI Planner - converts user intents to structured tool calls
// This will be implemented with deterministic parser → Transformers.js → WebLLM

import { INTENTS, type Intent, type IntentClassification } from '@nextshop/shared-schemas/intents';

export interface PlannerEngine {
  classify(input: string): Promise<IntentClassification>;
  isAvailable(): boolean;
}

// Placeholder implementations for the tiered engines
export class DeterministicPlanner implements PlannerEngine {
  async classify(input: string): Promise<IntentClassification> {
    // TODO: Implement regex + rule-based classification
    return {
      intent: INTENTS.GENERAL_HELP,
      confidence: 0.5,
      requiredAuth: false,
      multiStep: false,
    };
  }

  isAvailable(): boolean {
    return true;
  }
}

export class TransformersPlanner implements PlannerEngine {
  async classify(input: string): Promise<IntentClassification> {
    // TODO: Implement Transformers.js NLU
    return {
      intent: INTENTS.GENERAL_HELP,
      confidence: 0.7,
      requiredAuth: false,
      multiStep: false,
    };
  }

  isAvailable(): boolean {
    // TODO: Check if transformers.js models are loaded
    return false;
  }
}

export class WebLLMPlanner implements PlannerEngine {
  async classify(input: string): Promise<IntentClassification> {
    // TODO: Implement WebLLM classification
    return {
      intent: INTENTS.GENERAL_HELP,
      confidence: 0.9,
      requiredAuth: false,
      multiStep: false,
    };
  }

  isAvailable(): boolean {
    // TODO: Check if WebLLM is loaded
    return false;
  }
}

// Main planner that tries engines in order
export class TieredPlanner {
  private engines: PlannerEngine[];

  constructor() {
    this.engines = [
      new DeterministicPlanner(),
      new TransformersPlanner(),
      new WebLLMPlanner(),
    ];
  }

  async classify(input: string): Promise<IntentClassification> {
    for (const engine of this.engines) {
      if (engine.isAvailable()) {
        try {
          const result = await engine.classify(input);
          if (result.confidence > 0.8) {
            return result;
          }
        } catch (error) {
          console.warn(`Engine ${engine.constructor.name} failed:`, error);
          continue;
        }
      }
    }

    // Fallback to general help
    return {
      intent: INTENTS.GENERAL_HELP,
      confidence: 0.3,
      requiredAuth: false,
      multiStep: false,
    };
  }
}

export function createPlanner(): TieredPlanner {
  return new TieredPlanner();
}
