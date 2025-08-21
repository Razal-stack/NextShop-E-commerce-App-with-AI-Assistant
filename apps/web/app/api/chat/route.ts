import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const aiServerUrl = process.env.AI_SERVER_URL ?? 'http://127.0.0.1:8009/chat';
    
    const upstreamResponse = await fetch(aiServerUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!upstreamResponse.ok) {
      throw new Error(`AI Server responded with status: ${upstreamResponse.status}`);
    }

    const data = await upstreamResponse.json();
    
    return Response.json(data);
  } catch (error) {
    console.error('Chat proxy error:', error);
    return Response.json(
      { 
        error: 'Failed to communicate with AI server',
        response: "I'm having trouble connecting right now. Please try again later."
      }, 
      { status: 500 }
    );
  }
}
