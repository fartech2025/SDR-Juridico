#!/usr/bin/env python3
"""
Script para integrar imagens com questões usando servidor local
Cria um mapeamento e disponibiliza as imagens via URL local
"""

import os
import json
import shutil
from pathlib import Path
from typing import Dict, List

class LocalImageIntegrator:
    """Integrador de imagens local para desenvolvimento"""
    
    def __init__(self):
        self.source_dir = Path("output/images")
        self.public_dir = Path("app/public/images/questoes")
        self.questions_file = Path("output/enem2024_lc_questions_content.json")
        
    def setup_public_directory(self) -> bool:
        """Configura o diretório público para as imagens"""
        try:
            # Criar diretório se não existir
            self.public_dir.mkdir(parents=True, exist_ok=True)
            print(f"✅ Diretório público criado: {self.public_dir}")
            return True
        except Exception as e:
            print(f"❌ Erro ao criar diretório público: {e}")
            return False
    
    def copy_images_to_public(self) -> Dict[str, str]:
        """Copia imagens para o diretório público e retorna mapeamento"""
        if not self.source_dir.exists():
            print(f"❌ Diretório fonte não encontrado: {self.source_dir}")
            return {}
        
        image_mapping = {}
        
        # Listar todas as imagens PNG
        images = list(self.source_dir.glob("*.png"))
        
        for image_path in images:
            try:
                # Caminho de destino
                dest_path = self.public_dir / image_path.name
                
                # Copiar arquivo
                shutil.copy2(image_path, dest_path)
                
                # Criar mapeamento (ref -> URL local)
                image_ref = image_path.stem  # Nome sem extensão
                image_url = f"/images/questoes/{image_path.name}"
                
                image_mapping[image_ref] = image_url
                print(f"✅ Copiado: {image_path.name} -> {image_url}")
                
            except Exception as e:
                print(f"❌ Erro ao copiar {image_path.name}: {e}")
        
        print(f"✅ {len(image_mapping)} imagens processadas")
        return image_mapping
    
    def load_questions_data(self) -> Dict:
        """Carrega dados das questões"""
        try:
            with open(self.questions_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"❌ Erro ao carregar questões: {e}")
            return {}
    
    def create_enhanced_questions_file(self, image_mapping: Dict[str, str]) -> bool:
        """Cria arquivo de questões com URLs das imagens"""
        try:
            questions_data = self.load_questions_data()
            if not questions_data:
                return False
            
            enhanced_questions = []
            
            for question in questions_data.get('questions', []):
                enhanced_question = question.copy()
                
                # Adicionar URLs das imagens
                if question.get('images'):
                    for image in enhanced_question['images']:
                        image_ref = image.get('ref')
                        if image_ref in image_mapping:
                            image['url'] = image_mapping[image_ref]
                            image['available'] = True
                        else:
                            image['available'] = False
                
                # Adicionar campo imagem_url para compatibilidade
                main_image = None
                if enhanced_question.get('images'):
                    for image in enhanced_question['images']:
                        if image.get('available'):
                            main_image = image.get('url')
                            break
                
                if main_image:
                    enhanced_question['imagem_url'] = main_image
                
                enhanced_questions.append(enhanced_question)
            
            # Salvar arquivo aprimorado
            enhanced_file = Path("app/src/data/questions_with_images.json")
            enhanced_file.parent.mkdir(parents=True, exist_ok=True)
            
            with open(enhanced_file, 'w', encoding='utf-8') as f:
                json.dump({
                    'metadata': {
                        'source': str(self.questions_file),
                        'total_questions': len(enhanced_questions),
                        'questions_with_images': sum(1 for q in enhanced_questions if q.get('imagem_url')),
                        'image_mapping': image_mapping
                    },
                    'questions': enhanced_questions
                }, f, indent=2, ensure_ascii=False)
            
            print(f"✅ Arquivo aprimorado salvo: {enhanced_file}")
            return True
            
        except Exception as e:
            print(f"❌ Erro ao criar arquivo aprimorado: {e}")
            return False
    
    def create_image_service(self) -> bool:
        """Cria serviço para gerenciar imagens"""
        service_content = '''import questionsData from '../data/questions_with_images.json';

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
   * Obtém questão com imagens por número
   */
  getQuestionByNumber(number: number): EnhancedQuestion | null {
    return this.questionsWithImages.find(q => q.number === number) || null;
  }

  /**
   * Obtém URL da imagem principal da questão
   */
  getMainImageUrl(questionId: string): string | null {
    const question = this.getQuestionById(questionId);
    return question?.imagem_url || null;
  }

  /**
   * Obtém todas as imagens de uma questão
   */
  getQuestionImages(questionId: string): QuestionImage[] {
    const question = this.getQuestionById(questionId);
    return question?.images || [];
  }

  /**
   * Verifica se questão tem imagens
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
'''
        
        try:
            service_file = Path("app/src/services/imageService.ts")
            service_file.parent.mkdir(parents=True, exist_ok=True)
            
            with open(service_file, 'w', encoding='utf-8') as f:
                f.write(service_content)
            
            print(f"✅ Serviço de imagens criado: {service_file}")
            return True
            
        except Exception as e:
            print(f"❌ Erro ao criar serviço: {e}")
            return False
    
    def generate_integration_report(self) -> None:
        """Gera relatório de integração"""
        questions_data = self.load_questions_data()
        if not questions_data:
            return
        
        questions = questions_data.get('questions', [])
        questions_with_images = [q for q in questions if q.get('images')]
        
        # Contar imagens por questão
        image_count_by_question = {}
        total_images = 0
        
        for question in questions_with_images:
            q_id = question.get('id')
            img_count = len(question.get('images', []))
            image_count_by_question[q_id] = img_count
            total_images += img_count
        
        print("\\n" + "="*60)
        print("📊 RELATÓRIO DE INTEGRAÇÃO DE IMAGENS")
        print("="*60)
        print(f"📚 Total de questões: {len(questions)}")
        print(f"🖼️  Questões com imagens: {len(questions_with_images)}")
        print(f"📷 Total de imagens: {total_images}")
        print(f"📈 Cobertura de imagens: {len(questions_with_images)/len(questions)*100:.1f}%")
        
        print("\\n🔍 Detalhes por questão:")
        for q_id, count in image_count_by_question.items():
            question = next(q for q in questions if q.get('id') == q_id)
            print(f"  • Q{question.get('number'):02d}: {count} imagem(ns) - {question.get('theme')}")
        
        print("="*60)
    
    def process_integration(self) -> bool:
        """Processo completo de integração"""
        print("🚀 Iniciando integração de imagens...")
        
        # 1. Configurar diretório público
        if not self.setup_public_directory():
            return False
        
        # 2. Copiar imagens
        image_mapping = self.copy_images_to_public()
        if not image_mapping:
            print("❌ Nenhuma imagem processada")
            return False
        
        # 3. Criar arquivo aprimorado
        if not self.create_enhanced_questions_file(image_mapping):
            return False
        
        # 4. Criar serviço
        if not self.create_image_service():
            return False
        
        # 5. Gerar relatório
        self.generate_integration_report()
        
        print("\\n✅ Integração concluída com sucesso!")
        print("\\n📋 Próximos passos:")
        print("  1. Importe imageService nos componentes")
        print("  2. Use imageService.getMainImageUrl(questionId) para obter URLs")
        print("  3. As imagens estão disponíveis em /images/questoes/")
        
        return True


def main():
    """Função principal"""
    integrator = LocalImageIntegrator()
    integrator.process_integration()


if __name__ == "__main__":
    main()