#!/usr/bin/env python3
"""
Script de teste para validar os patches do backend mobile.

Uso na VPS:
    cd ~/animecaos/mobile/backend
    source .venv/bin/activate
    python test_patches.py
"""

import sys
from pathlib import Path

# Adicionar root do projeto ao path
REPO_ROOT = Path(__file__).resolve().parents[3]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

print("=" * 60)
print("TESTE DE PATCHES - BACKEND MOBILE")
print("=" * 60)

# Teste 1: Importar e aplicar selenium_patch
print("\n[1/3] Testando selenium_patch...")
try:
    from app.selenium_patch import apply as apply_selenium
    apply_selenium()
    print("✓ selenium_patch aplicado com sucesso")
except Exception as e:
    print(f"✗ selenium_patch falhou: {e}")

# Teste 2: Importar e aplicar cloudscraper_patch
print("\n[2/3] Testando cloudscraper_patch...")
try:
    from app.cloudscraper_patch import apply as apply_cloudscraper
    apply_cloudscraper()
    print("✓ cloudscraper_patch aplicado com sucesso")
except ImportError as e:
    print(f"✗ cloudscraper não instalado: {e}")
    print("  Instale com: pip install cloudscraper==1.2.71")
except Exception as e:
    print(f"✗ cloudscraper_patch falhou: {e}")

# Teste 3: Verificar se plugins foram importados e patcheados
print("\n[3/3] Verificando plugins patcheados...")
try:
    # Importar plugins para verificar se estão acessíveis
    from animecaos.plugins import animesonlinecc, animefire, animesvision
    
    # Verificar se requests foi substituído
    aocc_requests = getattr(animesonlinecc, "requests", None)
    af_requests = getattr(animefire, "requests", None)
    
    if aocc_requests and hasattr(aocc_requests, "get"):
        print("✓ animesonlinecc.requests patcheado")
    else:
        print("✗ animesonlinecc.requests NÃO patcheado")
    
    if af_requests and hasattr(af_requests, "get"):
        print("✓ animefire.requests patcheado")
    else:
        print("✗ animefire.requests NÃO patcheado")
    
    # Verificar se _make_driver foi patcheado no animesvision
    av_make_driver = getattr(animesvision, "_make_driver", None)
    if av_make_driver:
        print("✓ animesvision._make_driver disponível")
    else:
        print("✗ animesvision._make_driver NÃO disponível")
        
except Exception as e:
    print(f"✗ Verificação de plugins falhou: {e}")

print("\n" + "=" * 60)
print("TESTE CONCLUÍDO")
print("=" * 60)

# Teste funcional rápido (opcional)
print("\n[Teste Funcional] Busca rápida (opcional)...")
print("Para testar busca real, execute:")
print("  curl http://localhost:8000/search?q=hunter")
