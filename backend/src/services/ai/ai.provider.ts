export interface AIProvider {
  generateResponse(prompt: string, context?: any): Promise<string>;
  generateJSONResponse<T>(prompt: string, context?: any): Promise<T>;
}
