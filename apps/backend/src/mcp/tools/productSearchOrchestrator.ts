/**
 * MODULAR PRODUCT SEARCH ORCHESTRATOR
 * Manages step-by-step execution efficiently
 * Integrates with AI config and handles all advanced features
 */

import {
  SearchContext,
  StepResult,
  Step1_Initialize,
  Step2_CategoryFilter,
  Step3_ApplyConstraints,
  Step4_SearchFilter,
  Step5_VariantFilter,
  Step6_ScoringAndSorting,
  Step7_FinalProcessing
} from './productSearchSteps';

export interface OrchestrationResult {
  success: boolean;
  data: any[];
  context: SearchContext;
  execution: {
    stepsExecuted: string[];
    totalSteps: number;
    executionTimeMs: number;
    fallbacksUsed: number;
    processingPipeline: StepSummary[];
  };
  uiHandlers?: string[];
  intent?: string;
  metadata?: any;
}

export interface StepSummary {
  step: string;
  applied: string[];
  count: number;
  executionTimeMs: number;
  fallbackUsed?: boolean;
}

/**
 * MAIN ORCHESTRATOR CLASS
 * Executes all steps in sequence with error handling
 */
export class ProductSearchOrchestrator {
  
  /**
   * Execute complete search pipeline
   * Handles all advanced features from AI config
   */
  static async executeFullPipeline(searchData: any): Promise<OrchestrationResult> {
    const startTime = Date.now();
    console.log(`\n🚀 STARTING MODULAR PRODUCT SEARCH PIPELINE`);
    console.log(`📋 Search Data:`, JSON.stringify(searchData, null, 2));
    
    const executionSteps: StepSummary[] = [];
    let fallbacksUsed = 0;
    
    try {
      // STEP 1: INITIALIZATION
      const step1Start = Date.now();
      let result = await Step1_Initialize.execute(searchData);
      const step1Time = Date.now() - step1Start;
      
      executionSteps.push({
        step: result.stepInfo.step,
        applied: result.stepInfo.applied,
        count: result.stepInfo.count,
        executionTimeMs: step1Time,
        fallbackUsed: result.stepInfo.fallbackUsed
      });
      
      if (result.stepInfo.fallbackUsed) fallbacksUsed++;
      
      // STEP 2: CATEGORY FILTERING
      const step2Start = Date.now();
      result = Step2_CategoryFilter.execute(result);
      const step2Time = Date.now() - step2Start;
      
      executionSteps.push({
        step: result.stepInfo.step,
        applied: result.stepInfo.applied,
        count: result.stepInfo.count,
        executionTimeMs: step2Time,
        fallbackUsed: result.stepInfo.fallbackUsed
      });
      
      if (result.stepInfo.fallbackUsed) fallbacksUsed++;
      
      // STEP 3: CONSTRAINT HANDLING
      const step3Start = Date.now();
      result = Step3_ApplyConstraints.execute(result);
      const step3Time = Date.now() - step3Start;
      
      executionSteps.push({
        step: result.stepInfo.step,
        applied: result.stepInfo.applied,
        count: result.stepInfo.count,
        executionTimeMs: step3Time,
        fallbackUsed: result.stepInfo.fallbackUsed
      });
      
      if (result.stepInfo.fallbackUsed) fallbacksUsed++;
      
      // STEP 4: SEARCH FILTERING WITH FALLBACK
      const step4Start = Date.now();
      result = Step4_SearchFilter.execute(result);
      const step4Time = Date.now() - step4Start;
      
      executionSteps.push({
        step: result.stepInfo.step,
        applied: result.stepInfo.applied,
        count: result.stepInfo.count,
        executionTimeMs: step4Time,
        fallbackUsed: result.stepInfo.fallbackUsed
      });
      
      if (result.stepInfo.fallbackUsed) fallbacksUsed++;
      
      // STEP 5: VARIANT FILTERING
      const step5Start = Date.now();
      result = Step5_VariantFilter.execute(result);
      const step5Time = Date.now() - step5Start;
      
      executionSteps.push({
        step: result.stepInfo.step,
        applied: result.stepInfo.applied,
        count: result.stepInfo.count,
        executionTimeMs: step5Time,
        fallbackUsed: result.stepInfo.fallbackUsed
      });
      
      if (result.stepInfo.fallbackUsed) fallbacksUsed++;
      
      // STEP 6: INTELLIGENT SCORING & SORTING
      const step6Start = Date.now();
      result = Step6_ScoringAndSorting.execute(result);
      const step6Time = Date.now() - step6Start;
      
      executionSteps.push({
        step: result.stepInfo.step,
        applied: result.stepInfo.applied,
        count: result.stepInfo.count,
        executionTimeMs: step6Time,
        fallbackUsed: result.stepInfo.fallbackUsed
      });
      
      if (result.stepInfo.fallbackUsed) fallbacksUsed++;
      
      // STEP 7: FINAL PROCESSING & UI HANDLERS
      const step7Start = Date.now();
      result = Step7_FinalProcessing.execute(result);
      const step7Time = Date.now() - step7Start;
      
      executionSteps.push({
        step: result.stepInfo.step,
        applied: result.stepInfo.applied,
        count: result.stepInfo.count,
        executionTimeMs: step7Time,
        fallbackUsed: result.stepInfo.fallbackUsed
      });
      
      if (result.stepInfo.fallbackUsed) fallbacksUsed++;
      
      const totalTime = Date.now() - startTime;
      
      // FINAL RESULT
      const orchestrationResult: OrchestrationResult = {
        success: true,
        data: result.products,
        context: result.context,
        execution: {
          stepsExecuted: executionSteps.map(s => s.step),
          totalSteps: executionSteps.length,
          executionTimeMs: totalTime,
          fallbacksUsed,
          processingPipeline: executionSteps
        },
        uiHandlers: searchData.ui_handlers || [],
        intent: searchData.intent || 'product_search',
        metadata: result.context.metadata
      };
      
      // Log final result
      console.log(`\n✅ PIPELINE COMPLETE`);
      console.log(`⏱️  Total execution time: ${totalTime}ms`);
      console.log(`📊 Results: ${result.products.length} products`);
      console.log(`🔄 Fallbacks used: ${fallbacksUsed}`);
      console.log(`🎯 Steps executed: ${executionSteps.map(s => s.step).join(' → ')}`);
      
      if (searchData.ui_handlers && searchData.ui_handlers.length > 0) {
        console.log(`🎮 UI Handlers: ${searchData.ui_handlers.join(', ')}`);
      }
      
      return orchestrationResult;
      
    } catch (error) {
      console.error(`❌ PIPELINE FAILED:`, error);
      
      // Return error with context
      return {
        success: false,
        data: [],
        context: {} as SearchContext,
        execution: {
          stepsExecuted: executionSteps.map(s => s.step),
          totalSteps: executionSteps.length,
          executionTimeMs: Date.now() - startTime,
          fallbacksUsed,
          processingPipeline: executionSteps
        },
        uiHandlers: [],
        intent: 'error',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }
  
  /**
   * Execute custom step range
   * For debugging or partial processing
   */
  static async executeStepRange(
    searchData: any, 
    startStep: number = 1, 
    endStep: number = 7
  ): Promise<OrchestrationResult> {
    console.log(`🔧 EXECUTING STEP RANGE ${startStep}-${endStep}`);
    
    // For now, execute full pipeline - can be enhanced for partial execution
    if (startStep === 1 && endStep === 7) {
      return this.executeFullPipeline(searchData);
    }
    
    // Partial execution logic can be added here
    throw new Error("Partial step execution not yet implemented");
  }
  
  /**
   * Quick validation of search data
   */
  static validateSearchData(searchData: any): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (!searchData) {
      issues.push("No search data provided");
    }
    
    if (!searchData.intent && !searchData.query) {
      issues.push("No intent or query provided");
    }
    
    // Add more validation as needed
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
}

/**
 * CONVENIENCE FUNCTIONS FOR COMMON OPERATIONS
 */
export class ProductSearchHelpers {
  
  /**
   * Execute search with AI config integration
   */
  static async searchWithAIConfig(
    userQuery: string,
    aiAnalysis: any,
    additionalOptions: any = {}
  ): Promise<OrchestrationResult> {
    
    // Merge AI analysis with additional options
    const searchData = {
      query: userQuery,
      intent: aiAnalysis.intent,
      categories: aiAnalysis.categories,
      product_items: aiAnalysis.product_items,
      constraints: aiAnalysis.constraints,
      ui_handlers: aiAnalysis.ui_handlers,
      variants: aiAnalysis.variants,
      confidence: aiAnalysis.confidence,
      ...additionalOptions
    };
    
    return ProductSearchOrchestrator.executeFullPipeline(searchData);
  }
  
  /**
   * Execute gift search mode
   */
  static async executeGiftSearch(
    occasion: string = 'general',
    budget?: number,
    categories?: string[]
  ): Promise<OrchestrationResult> {
    
    const searchData = {
      query: `gifts for ${occasion}`,
      intent: 'product_search',
      categories: categories || [],
      constraints: {
        gift: true,
        occasion,
        ...(budget && { price: { max: budget } }),
        sort_by: 'popularity',
        limit: 10
      }
    };
    
    return ProductSearchOrchestrator.executeFullPipeline(searchData);
  }
  
  /**
   * Execute comparison search
   */
  static async executeComparisonSearch(
    productItems: string[],
    categories?: string[]
  ): Promise<OrchestrationResult> {
    
    const searchData = {
      query: `compare ${productItems.join(' ')}`,
      intent: 'product_search',
      categories: categories || [],
      product_items: productItems,
      constraints: {
        special_search: 'compare',
        sort_by: 'rating',
        limit: 20
      }
    };
    
    return ProductSearchOrchestrator.executeFullPipeline(searchData);
  }
}
