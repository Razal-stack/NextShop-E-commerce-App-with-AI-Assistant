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

    // Forward to Express MCP backend
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    const auth = req.headers.get('authorization');
    if (auth) headers.set('Authorization', auth);
    
    const backendUrl = process.env.EXPRESS_API_URL || 'http://localhost:3001';
    const res = await fetch(`${backendUrl}/api/ai/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, userId, conversationHistory }), // ✅ Now forwarding conversationHistory
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Backend error ${res.status}:`, errorText);
      return NextResponse.json({ 
        success: false, 
        error: `Backend error: ${res.status} ${res.statusText}` 
      }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('AI Query API Error:', err);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error', 
      details: process.env.NODE_ENV === 'development' ? String(err) : undefined 
    }, { status: 500 });
  }
}
