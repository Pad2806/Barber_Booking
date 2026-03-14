import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: Request) {
  const body = await req.json();
  const { message, session_id } = body;

  console.log(`[AI Proxy] Request:`, { message, session_id });

  const makeRequest = async () => {
    return await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/ai-chat`, {
      message,
      session_id,
    }, { timeout: 30000 });
  };

  try {
    let response;
    try {
      response = await makeRequest();
    } catch (firstError) {
      console.warn(`[AI Proxy] First attempt failed, retrying...`);
      response = await makeRequest();
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
