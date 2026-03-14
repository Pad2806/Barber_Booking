import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: Request) {
  const body = await req.json();
  const { message, session_id } = body;

  console.log(`[AI Proxy] Request:`, { message, session_id });

  const makeRequest = async (url: string) => {
    return await axios.post(url, {
      message,
      sessionId: session_id, // Match new API field name
    }, { timeout: 30000 });
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const endpoint = `${apiUrl}/api/ai-assistant/chat`;
  const fallbackEndpoint = endpoint.replace('localhost', '127.0.0.1');

  try {
    let response;
    try {
      response = await makeRequest(endpoint);
    } catch (firstError) {
      console.warn(`[AI Proxy] Attempt with ${endpoint} failed, retrying with fallback...`);
      response = await makeRequest(fallbackEndpoint);
    }

    console.log(`[AI Proxy] Success`);
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('[AI Proxy] Final Error:', error.response?.data || error.message);
    return NextResponse.json(
      { 
        error: 'Failed to communicate with AI Service',
        details: error.response?.data || error.message
      },
      { status: error.response?.status || 500 }
    );
  }
}
