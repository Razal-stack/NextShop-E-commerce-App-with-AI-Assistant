// apps/web/app/api/ai/query/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { query, userId = 1, conversationHistory } = await req.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ 
        success: false, 
        error: 'Query is required and must be a string' 
      }, { status: 400 });
    }

    console.log(`🔍 [Next.js API] Processing query: "${query}"`);
    console.log(`💬 [Next.js API] Conversation history: ${conversationHistory?.length || 0} messages`);

    // Forward to Express MCP backend (timeout and error handling is done by HTTP services)
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    const auth = req.headers.get('authorization');
    if (auth) headers.set('Authorization', auth);
    
    const backendUrl = process.env.EXPRESS_API_URL || 'http://localhost:3001';
    
    const res = await fetch(`${backendUrl}/api/ai/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, userId, conversationHistory })
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Backend error ${res.status}:`, errorText);
      
      // Handle specific timeout error
      if (res.status === 408) {
        return NextResponse.json({ 
          success: false, 
          error: 'The AI server is taking longer than usual to process your request. This is normal for the first few queries while the model loads. Please try again in a moment.' 
        }, { status: 408 });
      }
      
      return NextResponse.json({ 
        success: false, 
        error: `Backend error: ${res.status} ${res.statusText}` 
      }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
    
  } catch (err: any) {
    console.error('AI Query API Error:', err);
    
    // Handle timeout errors from fetch
    if (err.name === 'AbortError' || err.message?.includes('timeout')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Request timeout - The AI server is taking longer than expected. Please try again.' 
      }, { status: 408 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error', 
      details: process.env.NODE_ENV === 'development' ? String(err) : undefined 
    }, { status: 500 });
  }
}
