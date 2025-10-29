#!/usr/bin/env python3
"""
Script para correlacionar e fazer upload das imagens para o Supabase Storage
Correlaciona as imagens locais com as questões no banco de dados
"""

import os
import json
import sys
from pathlib import Path
from supabase import create_client, Client
from typing import Dict, List, Optional
import logging
from datetime import datetime

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ImageCorrelator:
    """Classe para correlacionar e gerenciar imagens das questões ENEM"""
    
    def __init__(self, supabase_url: str, supabase_key: str):
        """
        Inicializa o correlacionador de imagens
        
        Args:
            supabase_url: URL do projeto Supabase
            supabase_key: Chave de API do Supabase
        """
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.bucket_name = "enem-images"
        self.local_images_dir = Path("output/images")
        self.questions_file = Path("output/enem2024_lc_questions_content.json")
        
    def check_bucket_exists(self) -> bool:
        """Verifica se o bucket existe, cria se necessário"""
        try:
            # Tentar listar buckets
            buckets = self.supabase.storage.list_buckets()
            
            # Verificar se o bucket existe
            bucket_exists = any(bucket.name == self.bucket_name for bucket in buckets)
            
            if not bucket_exists:
                logger.info(f"Criando bucket '{self.bucket_name}'...")
                self.supabase.storage.create_bucket(
                    self.bucket_name,
                    options={
                        "public": True,
                        "allowedMimeTypes": ["image/png", "image/jpeg", "image/gif", "image/webp"],
                        "fileSizeLimit": 10485760  # 10MB
                    }
                )
                logger.info(f"✅ Bucket '{self.bucket_name}' criado com sucesso")
            else:
                logger.info(f"✅ Bucket '{self.bucket_name}' já existe")
                
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro ao verificar/criar bucket: {e}")
            return False
    
    def load_questions_data(self) -> Optional[Dict]:
        """Carrega os dados das questões do arquivo JSON"""
        try:
            if not self.questions_file.exists():
                logger.error(f"❌ Arquivo de questões não encontrado: {self.questions_file}")
                return None
                
            with open(self.questions_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            logger.info(f"✅ Dados das questões carregados: {len(data.get('questions', []))} questões")
            return data
            
        except Exception as e:
            logger.error(f"❌ Erro ao carregar dados das questões: {e}")
            return None
    
    def get_local_images(self) -> List[Path]:
        """Obtém lista de imagens locais"""
        if not self.local_images_dir.exists():
            logger.error(f"❌ Diretório de imagens não encontrado: {self.local_images_dir}")
            return []
            
        images = list(self.local_images_dir.glob("*.png"))
        logger.info(f"✅ Encontradas {len(images)} imagens locais")
        return images
    
    def correlate_images_with_questions(self, questions_data: Dict) -> Dict[str, Dict]:
        """
        Correlaciona imagens com questões
        
        Returns:
            Dict com correlação questão_id -> dados da imagem
        """
        correlation = {}
        questions = questions_data.get('questions', [])
        
        for question in questions:
            question_id = question.get('id')
            images = question.get('images', [])
            
            if images:
                correlation[question_id] = {
                    'question_number': question.get('number'),
                    'theme': question.get('theme'),
                    'images': images
                }
        
        logger.info(f"✅ Correlação criada para {len(correlation)} questões com imagens")
        return correlation
    
    def upload_image_to_supabase(self, image_path: Path, storage_path: str) -> Optional[str]:
        """
        Faz upload de uma imagem para o Supabase Storage
        
        Args:
            image_path: Caminho local da imagem
            storage_path: Caminho no storage do Supabase
            
        Returns:
            URL pública da imagem ou None se falhou
        """
        try:
            # Ler o arquivo
            with open(image_path, 'rb') as f:
                file_data = f.read()
            
            # Fazer upload
            result = self.supabase.storage.from_(self.bucket_name).upload(
                storage_path,
                file_data,
                file_options={
                    "content-type": "image/png",
                    "cache-control": "3600",
                    "upsert": True  # Sobrescrever se já existe
                }
            )
            
            # Obter URL pública
            public_url = self.supabase.storage.from_(self.bucket_name).get_public_url(storage_path)
            
            logger.info(f"✅ Upload realizado: {image_path.name} -> {storage_path}")
            return public_url
            
        except Exception as e:
            logger.error(f"❌ Erro no upload de {image_path.name}: {e}")
            return None
    
    def process_all_images(self) -> Dict[str, str]:
        """
        Processa todas as imagens: correlaciona e faz upload
        
        Returns:
            Dict com mapeamento ref_imagem -> url_publica
        """
        # Verificar/criar bucket
        if not self.check_bucket_exists():
            return {}
        
        # Carregar dados das questões
        questions_data = self.load_questions_data()
        if not questions_data:
            return {}
        
        # Obter imagens locais
        local_images = self.get_local_images()
        if not local_images:
            return {}
        
        # Correlacionar
        correlation = self.correlate_images_with_questions(questions_data)
        
        # Processar uploads
        image_urls = {}
        
        for image_path in local_images:
            image_name = image_path.stem  # Nome sem extensão (ex: ENEM2024_LC_Q001_IMG01)
            
            # Caminho no storage: questoes/2024/LC/ENEM2024_LC_Q001_IMG01.png
            storage_path = f"questoes/2024/LC/{image_path.name}"
            
            # Upload
            public_url = self.upload_image_to_supabase(image_path, storage_path)
            
            if public_url:
                image_urls[image_name] = public_url
        
        logger.info(f"✅ Processamento concluído: {len(image_urls)} imagens uploadadas")
        
        # Salvar mapeamento em arquivo
        mapping_file = Path("output/image_urls_mapping.json")
        with open(mapping_file, 'w', encoding='utf-8') as f:
            json.dump(image_urls, f, indent=2, ensure_ascii=False)
        
        logger.info(f"✅ Mapeamento salvo em: {mapping_file}")
        
        return image_urls
    
    def update_questions_with_urls(self, image_urls: Dict[str, str]) -> bool:
        """
        Atualiza as questões no banco com as URLs das imagens
        
        Args:
            image_urls: Mapeamento ref_imagem -> url_publica
        """
        try:
            # Carregar dados das questões
            questions_data = self.load_questions_data()
            if not questions_data:
                return False
            
            updated_count = 0
            
            for question in questions_data['questions']:
                question_id = question.get('id')
                images = question.get('images', [])
                
                if images:
                    # Atualizar URLs das imagens
                    for image in images:
                        image_ref = image.get('ref')
                        if image_ref in image_urls:
                            image['url'] = image_urls[image_ref]
                            image['uploaded'] = True
                            updated_count += 1
            
            # Salvar dados atualizados
            updated_file = Path("output/enem2024_lc_questions_with_urls.json")
            with open(updated_file, 'w', encoding='utf-8') as f:
                json.dump(questions_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"✅ {updated_count} referências de imagem atualizadas")
            logger.info(f"✅ Dados salvos em: {updated_file}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro ao atualizar questões com URLs: {e}")
            return False
    
    def generate_correlation_report(self) -> None:
        """Gera relatório de correlação"""
        questions_data = self.load_questions_data()
        if not questions_data:
            return
        
        local_images = self.get_local_images()
        correlation = self.correlate_images_with_questions(questions_data)
        
        # Criar relatório
        report = {
            "resumo": {
                "total_questoes": len(questions_data.get('questions', [])),
                "questoes_com_imagens": len(correlation),
                "imagens_locais_encontradas": len(local_images),
                "timestamp": datetime.now().isoformat()
            },
            "correlacao_detalhada": {},
            "imagens_locais": [img.name for img in local_images],
            "questoes_sem_imagens": []
        }
        
        # Detalhes da correlação
        for question_id, data in correlation.items():
            report["correlacao_detalhada"][question_id] = {
                "numero": data['question_number'],
                "tema": data['theme'],
                "imagens": [img['ref'] for img in data['images']]
            }
        
        # Questões sem imagens
        for question in questions_data['questions']:
            if not question.get('images'):
                report["questoes_sem_imagens"].append({
                    "id": question.get('id'),
                    "numero": question.get('number'),
                    "tema": question.get('theme')
                })
        
        # Salvar relatório
        report_file = Path("output/correlation_report.json")
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        logger.info(f"✅ Relatório de correlação salvo em: {report_file}")
        
        # Exibir resumo
        print("\n" + "="*50)
        print("📊 RELATÓRIO DE CORRELAÇÃO DE IMAGENS")
        print("="*50)
        print(f"Total de questões: {report['resumo']['total_questoes']}")
        print(f"Questões com imagens: {report['resumo']['questoes_com_imagens']}")
        print(f"Imagens locais encontradas: {report['resumo']['imagens_locais_encontradas']}")
        print(f"Questões sem imagens: {len(report['questoes_sem_imagens'])}")
        print("="*50)


def main():
    """Função principal"""
    # Configurações do Supabase
    SUPABASE_URL = "https://mskvucuaarutehslvhsp.supabase.co"
    SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1za3Z1Y3VhYXJ1dGVoc2x2aHNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MzQzNDEsImV4cCI6MjA3NTMxMDM0MX0.ZTIrEq9tqpaBUsdgDrg9vwYyvCtXMu_IWyx_EMbMQHQ"
    
    # Criar correlacionador
    correlator = ImageCorrelator(SUPABASE_URL, SUPABASE_KEY)
    
    if len(sys.argv) > 1 and sys.argv[1] == "--report-only":
        # Apenas gerar relatório
        print("📋 Gerando apenas relatório de correlação...")
        correlator.generate_correlation_report()
    else:
        # Processar tudo
        print("🚀 Iniciando correlação e upload de imagens...")
        
        # Gerar relatório primeiro
        correlator.generate_correlation_report()
        
        # Processar uploads
        image_urls = correlator.process_all_images()
        
        if image_urls:
            # Atualizar questões com URLs
            correlator.update_questions_with_urls(image_urls)
            print(f"✅ Processo concluído! {len(image_urls)} imagens processadas.")
        else:
            print("❌ Nenhuma imagem foi processada.")


if __name__ == "__main__":
    main()