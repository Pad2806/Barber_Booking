import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';

async function listModels() {
  // Load .env from api app
  dotenv.config({ path: path.join(process.cwd(), 'apps/api/.env') });
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in .env');
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // There is no direct listModels in the simple SDK, we have to use the fetch API or a known one
    // But we can try to "reach" the models endpoint
    console.log('Testing models...');
    
    const models = [
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.0-pro',
      'gemini-pro'
    ];

    for (const m of models) {
      try {
        const model = genAI.getGenerativeModel({ model: m });
        await model.generateContent('ping');
        console.log(`✅ Model ${m} is AVAILABLE`);
      } catch (e: any) {
        console.log(`❌ Model ${m} is NOT available (${e.message})`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

listModels();
