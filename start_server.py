#!/usr/bin/env python3
"""
Servidor web simples para a página principal do BancoEnem
"""

import http.server
import socketserver
import webbrowser
import os
import threading
import time

def start_server():
    """Inicia o servidor web local"""
    PORT = 8000
    
    # Muda para o diretório do projeto
    os.chdir('/Users/fernandodias/Desktop/BancoEnem')
    
    # Configura o servidor
    Handler = http.server.SimpleHTTPRequestHandler
    
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"🌐 Servidor iniciado em: http://localhost:{PORT}")
            print(f"📄 Página principal: http://localhost:{PORT}/index.html")
            print("\n🚀 Abrindo navegador automaticamente...")
            print("⚠️  Pressione Ctrl+C para parar o servidor")
            
            # Abre o navegador após um pequeno delay
            def open_browser():
                time.sleep(2)
                webbrowser.open(f'http://localhost:{PORT}/index.html')
            
            browser_thread = threading.Thread(target=open_browser)
            browser_thread.daemon = True
            browser_thread.start()
            
            # Inicia o servidor
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n\n🛑 Servidor parado pelo usuário")
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"❌ Porta {PORT} já está em uso")
            print(f"💡 Tente acessar: http://localhost:{PORT}/index.html")
        else:
            print(f"❌ Erro ao iniciar servidor: {e}")

if __name__ == "__main__":
    start_server()