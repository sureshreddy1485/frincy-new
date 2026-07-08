export interface OcrResult {
  merchantName?: string;
  date?: Date;
  amount?: number;
  tax?: number;
  currency?: string;
  invoiceNumber?: string;
  notes?: string;
}

export class OcrService {
  /**
   * Pluggable OCR interface. 
   * Currently uses a simulated local parsing engine. 
   * Can be swapped out for Google Vision API or ML Kit in production.
   */
  static async processImage(uri: string): Promise<OcrResult> {
    // Simulate network/processing delay for OCR
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulated OCR extraction logic (returns mock data for demonstration)
    // In a real implementation, this would either call an on-device ML model or a secure backend endpoint.
    
    // Randomize output slightly for testing realism
    const isExpense = Math.random() > 0.5;
    
    return {
      merchantName: isExpense ? 'Office Supplies Co.' : 'Client A',
      date: new Date(),
      amount: parseFloat((Math.random() * 500 + 10).toFixed(2)),
      tax: parseFloat((Math.random() * 20).toFixed(2)),
      currency: 'USD',
      invoiceNumber: `INV-${Math.floor(Math.random() * 10000)}`,
      notes: 'Captured via Auto-OCR',
    };
  }

  /**
   * AI Expense Classification Suggestion (Offline-ready logic)
   */
  static suggestClassification(ocrResult: OcrResult): { type: 'INCOME' | 'EXPENSE', categoryId?: string } {
    // If merchant name matches known expense keywords
    const expenseKeywords = ['supplies', 'mart', 'store', 'restaurant', 'fuel', 'gas'];
    const name = ocrResult.merchantName?.toLowerCase() || '';
    
    const isExpense = expenseKeywords.some(kw => name.includes(kw)) || (ocrResult.amount && ocrResult.amount < 1000);
    
    return {
      type: isExpense ? 'EXPENSE' : 'INCOME',
    };
  }
}
