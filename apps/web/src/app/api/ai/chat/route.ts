import { NextResponse } from 'next/server';
import axios from 'axios';

// Simple per-IP rate limiter (max 8 requests per minute)
const rateLimitMap = new Map<string, number[]>();
const MAX_REQUESTS_PER_MIN = 8;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(ip) || []).filter(t => now - t < 60_000);
  rateLimitMap.set(ip, timestamps);

  if (timestamps.length >= MAX_REQUESTS_PER_MIN) return true;
  timestamps.push(now);
  return false;
}

export async function POST(req: Request) {
  // Rate limit check
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { response: '⏳ Anh đang hỏi nhanh quá, vui lòng đợi một chút rồi thử lại nhé!', error: true },
      { status: 429 }
    );
  }

  const body = await req.json();
  const { message, session_id } = body;

  const makeRequest = async (url: string) => {
    return await axios.post(url, {
      message,
      sessionId: session_id,
    }, { timeout: 25000 });
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const endpoint = `${apiUrl}/api/ai-assistant/chat`;
  const fallbackEndpoint = endpoint.replace('localhost', '127.0.0.1');

  try {
    let response;
    try {
      response = await makeRequest(endpoint);
    } catch (firstError) {
      response = await makeRequest(fallbackEndpoint);
    }

    return NextResponse.json(response.data);
  } catch (error: any) {
    const status = error.response?.status || 500;

    // Pass through 429 from backend
    if (status === 429) {
      return NextResponse.json(
        { response: '⏳ Hệ thống AI đang bận, anh vui lòng đợi 30 giây rồi thử lại nhé!', error: true },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to communicate with AI Service',
        response: 'Xin lỗi, em đang gặp sự cố. Anh vui lòng thử lại sau nhé! 🙏',
        details: error.response?.data || error.message
      },
      { status }
    );
  }
}
