import Groq from 'groq-sdk';
import { AIProvider } from './ai.provider';
import { env } from '../../config/env.config';

export class GroqProvider implements AIProvider {
  private client: Groq;

  constructor() {
    this.client = new Groq({
      apiKey: env.GROQ_API_KEY || process.env.GROQ_API_KEY,
    });
  }

  async generateResponse(prompt: string, context?: any): Promise<string> {
    const messages: any[] = [];
    
    if (context) {
      messages.push({
        role: 'system',
        content: `You are Leo, the Frincy AI Business Assistant. Use the following context about the business to answer queries accurately:\n${JSON.stringify(context, null, 2)}`
      });
    } else {
      messages.push({
        role: 'system',
        content: 'You are Leo, the Frincy AI Business Assistant.'
      });
    }

    messages.push({ role: 'user', content: prompt });

    const completion = await this.client.chat.completions.create({
      messages,
      model: 'llama3-70b-8192', // or any preferred fast Groq model
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || '';
  }

  async generateJSONResponse<T>(prompt: string, context?: any): Promise<T> {
    const messages: any[] = [];
    
    if (context) {
      messages.push({
        role: 'system',
        content: `You are Leo, an AI assistant analyzing business data. ALWAYS return a valid, raw JSON object. Do not include markdown formatting like \`\`\`json. Context:\n${JSON.stringify(context)}`
      });
    } else {
      messages.push({
        role: 'system',
        content: 'You are an AI generating valid JSON. Always return pure JSON.'
      });
    }

    messages.push({ role: 'user', content: prompt });

    const completion = await this.client.chat.completions.create({
      messages,
      model: 'llama3-70b-8192',
      temperature: 0.2, // lower temp for more deterministic JSON
    });

    const content = completion.choices[0]?.message?.content || '{}';
    
    // Clean up potential markdown formatting if the model disobeys
    const cleanedContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      return JSON.parse(cleanedContent) as T;
    } catch (e) {
      console.error('Failed to parse AI JSON response:', cleanedContent);
      throw new Error('Invalid JSON format returned by AI');
    }
  }
}
