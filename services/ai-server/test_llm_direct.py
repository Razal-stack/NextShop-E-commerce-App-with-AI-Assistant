"""
Direct LLM test to check if model is actually running
"""
from app.models import model_manager
import asyncio
import json

async def test_llm_direct():
    print('🧠 Testing direct LLM call...')
    
    # Test 1: Simple gender-specific query
    prompt1 = """Return EXACTLY ONE JSON object. No explanations.

Query: "i need only women's jacket"
Available Categories: ['electronics', "men's clothing", "women's clothing", 'jewelery']

If "only women's" return categories: ["women's clothing"] only
If no gender specified return both clothing categories

Format: {"intent":"product_search","categories":["women's clothing"]}

Output:"""
    
    print("\n🔍 Test 1 - Women's only jacket:")
    print(f"Prompt: {prompt1}")
    
    result1 = await model_manager.generate_text(
        instruction=prompt1,
        context='JSON formatter',
        parameters={'max_tokens': 100, 'temperature': 0.0}
    )
    print(f'📥 Raw LLM result: {result1}')
    
    # Test 2: General query
    prompt2 = """Return EXACTLY ONE JSON object. No explanations.

Query: "i need jackets"
Available Categories: ['electronics', "men's clothing", "women's clothing", 'jewelery']

If "only women's" return categories: ["women's clothing"] only
If no gender specified return both clothing categories

Format: {"intent":"product_search","categories":["men's clothing","women's clothing"]}

Output:"""
    
    print("\n🔍 Test 2 - General jackets:")
    print(f"Prompt: {prompt2}")
    
    result2 = await model_manager.generate_text(
        instruction=prompt2,
        context='JSON formatter',
        parameters={'max_tokens': 100, 'temperature': 0.0}
    )
    print(f'📥 Raw LLM result: {result2}')
    
    # Check if LLM is actually loaded
    status = model_manager.get_status()
    print(f"\n📊 Model Manager Status: {status}")

if __name__ == "__main__":
    asyncio.run(test_llm_direct())
