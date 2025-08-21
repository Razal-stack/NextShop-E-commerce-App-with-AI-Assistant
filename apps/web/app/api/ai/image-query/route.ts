import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const aiServerUrl = process.env.AI_SERVER_URL ?? 'http://127.0.0.1:8009/describe-image';

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
    return NextResponse.json(data);
  } catch (error) {
    console.error('Image query proxy error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process image',
        caption: 'Unable to analyze image at this time'
      }, 
      { status: 500 }
    );
  }
}
