import { GroqProvider } from './ai/groq.provider';
import { AIProvider } from './ai/ai.provider';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AIService {
  private provider: AIProvider;

  constructor() {
    this.provider = new GroqProvider(); // Easily swappable later
  }

  async buildBusinessContext(businessId: string, groupId: string) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        ledgers: {
          where: {
            customer: {
              groupId: groupId
            }
          },
          include: {
            transactions: {
              orderBy: { date: 'desc' },
              take: 50 // Last 50 transactions for context
            }
          }
        },
        customers: {
          where: { groupId }
        },
      }
    });

    if (!business) return null;

    // Calculate basic metrics for the prompt context
    let totalIncome = 0;
    let totalExpense = 0;
    
    business.ledgers.forEach(ledger => {
      ledger.transactions.forEach(t => {
        if (t.type === 'INCOME' || t.type === 'GOT') {
          totalIncome += Number(t.amount);
        } else if (t.type === 'EXPENSE' || t.type === 'GAVE') {
          totalExpense += Number(t.amount);
        }
      });
    });

    return {
      businessName: business.name,
      currency: business.currency,
      totalCustomers: business.customers.length,
      recentMetrics: {
        totalIncome,
        totalExpense,
        cashFlow: totalIncome - totalExpense
      },
      currentDate: new Date().toISOString()
    };
  }

  async chat(businessId: string, groupId: string, message: string) {
    const context = await this.buildBusinessContext(businessId, groupId);
    return this.provider.generateResponse(message, context);
  }

  async getBusinessInsights(businessId: string, groupId: string) {
    const context = await this.buildBusinessContext(businessId, groupId);
    const prompt = `Based on the provided business context, generate a comprehensive JSON summary. Return ONLY valid JSON with this exact structure:
    {
      "healthScore": number (0-100),
      "cashFlowScore": number (0-100),
      "growthScore": number (0-100),
      "summary": string (1-2 sentences),
      "recommendations": string[] (3 actionable business tips based on the data)
    }`;

    return this.provider.generateJSONResponse(prompt, context);
  }
}
