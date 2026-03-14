import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, session_id } = body;

    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/ai-chat`, {
      message,
      session_id,
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('AI Proxy Error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to communicate with AI Service' },
      { status: error.response?.status || 500 }
    );
  }
}
