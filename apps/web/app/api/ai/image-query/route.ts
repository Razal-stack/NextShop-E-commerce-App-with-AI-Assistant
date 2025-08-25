import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, imageData, userId, conversationHistory } = body;
    
    // Validate required fields
    if (!query || !imageData) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: query and imageData' 
        }, 
        { status: 400 }
      );
    }

    // Forward to backend AI service
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const backendResponse = await fetch(`${backendUrl}/api/ai/query-image`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        imageData,
        userId: userId || 1,
        conversationHistory: conversationHistory || []
      }),
    });
    
    if (!backendResponse.ok) {
      throw new Error(`Backend responded with status: ${backendResponse.status}`);
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Image query proxy error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process image query',
        details: 'Image query processing failed'
      }, 
      { status: 500 }
    );
  }
}
