import { apiClient } from './client';

interface TranslationResponse {
  translations: string[];
}

export const translationApi = {
  async translate(texts: string[]): Promise<string[]> {
    const response = await apiClient.post<TranslationResponse>('/api/translate', {
      texts
    });
    if (
      response.translations.length !== texts.length ||
      response.translations.some((translation) => typeof translation !== 'string')
    ) {
      throw new Error('Translation service returned an invalid response.');
    }
    return response.translations;
  }
};
