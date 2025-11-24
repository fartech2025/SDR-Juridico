import questionsData from '../data/questions_with_images.json';

export interface QuestionImage {
  ref: string;
  url: string;
  path: string;
  bbox?: number[];
  available: boolean;
}

export interface EnhancedQuestion {
  id: string;
  number: number;
  page: number;
  theme: string;
  content: any[];
  images: QuestionImage[];
  imagem_url?: string;
  text_full: string;
}

class ImageService {
  private questionsWithImages: EnhancedQuestion[];
  private imageMapping: Record<string, string>;

  constructor() {
    this.questionsWithImages = (questionsData as any).questions;
    this.imageMapping = (questionsData as any).metadata.image_mapping;
  }

  /**
   * Obtém questão com imagens por ID
   */
  getQuestionById(questionId: string): EnhancedQuestion | null {
    return this.questionsWithImages.find(q => q.id === questionId) || null;
  }

  /**
   * Obtém questão com imagens por número (compatível com Supabase)
   */
  getQuestionByNumber(number: number): EnhancedQuestion | null {
    // Tentar encontrar pela propriedade 'number' primeiro
    let question = this.questionsWithImages.find(q => q.number === number);
    
    // Se não encontrar, tentar por ID formatado
    if (!question) {
      const questionId = `ENEM2024_LC_Q${String(number).padStart(3, '0')}`;
      question = this.questionsWithImages.find(q => q.id === questionId);
    }
    
    return question || null;
  }

  /**
   * Obtém URL da imagem principal da questão por número
   */
  getMainImageUrlByNumber(number: number): string | null {
    const question = this.getQuestionByNumber(number);
    if (question?.imagem_url) {
      console.log(`🖼️ Imagem encontrada para questão ${number}: ${question.imagem_url}`);
      return question.imagem_url;
    }
    
    console.log(`❌ Nenhuma imagem encontrada para questão ${number}`);
    return null;
  }

  /**
   * Obtém URL da imagem principal da questão por ID
   */
  getMainImageUrl(questionId: string): string | null {
    const question = this.getQuestionById(questionId);
    return question?.imagem_url || null;
  }

  /**
   * Obtém todas as imagens de uma questão por número
   */
  getQuestionImagesByNumber(number: number): QuestionImage[] {
    const question = this.getQuestionByNumber(number);
    if (question?.images) {
      console.log(`🖼️ ${question.images.length} imagem(ns) encontrada(s) para questão ${number}`);
      return question.images;
    }
    
    console.log(`❌ Nenhuma imagem encontrada para questão ${number}`);
    return [];
  }

  /**
   * Obtém todas as imagens de uma questão
   */
  getQuestionImages(questionId: string): QuestionImage[] {
    const question = this.getQuestionById(questionId);
    return question?.images || [];
  }

  /**
   * Verifica se questão tem imagens por número
   */
  hasImagesByNumber(number: number): boolean {
    const question = this.getQuestionByNumber(number);
    const hasImages = Boolean(question?.imagem_url);
    console.log(`🔍 Questão ${number} tem imagens: ${hasImages}`);
    return hasImages;
  }

  /**
   * Verifica se questão tem imagens por ID
   */
  hasImages(questionId: string): boolean {
    const question = this.getQuestionById(questionId);
    return Boolean(question?.imagem_url);
  }

  /**
   * Obtém estatísticas de imagens
   */
  getImageStats() {
    const total = this.questionsWithImages.length;
    const withImages = this.questionsWithImages.filter(q => q.imagem_url).length;
    
    return {
      totalQuestions: total,
      questionsWithImages: withImages,
      questionsWithoutImages: total - withImages,
      coveragePercentage: Math.round((withImages / total) * 100)
    };
  }

  /**
   * Lista todas as questões com imagens
   */
  getQuestionsWithImages(): EnhancedQuestion[] {
    return this.questionsWithImages.filter(q => q.imagem_url);
  }
}

export const imageService = new ImageService();
export default imageService;
