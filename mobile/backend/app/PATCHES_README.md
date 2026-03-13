# Patches do Backend Mobile

Este diretório contém monkey-patches aplicados no startup do backend mobile para resolver problemas específicos da VPS Ubuntu.

## Patches Ativos

### 1. selenium_patch.py

**Problema:** Firefox ESR e geckodriver instalados em paths não-padrão na VPS (`/usr/bin/firefox-esr`, `/usr/local/bin/geckodriver`).

**Solução:** Monkey-patch que força todos os plugins desktop a usarem os paths explícitos do Firefox ESR e geckodriver.

**Plugins afetados:**
- `animecaos.plugins.animesvision`
- `animecaos.plugins.betteranime`
- `animecaos.plugins.hinatasoul`
- `animecaos.plugins.animesonlinecc` (apenas para Selenium no player)
- `animecaos.plugins.animefire` (apenas para Selenium no player)

### 2. cloudscraper_patch.py

**Problema:** Cloudflare bloqueando requisições HTTP simples nos plugins `animesonlinecc` e `animefire` (erro 403 Forbidden).

**Solução:** Substitui `requests.get()` por `cloudscraper.create_scraper().get()` nos plugins de busca.

**Plugins afetados:**
- `animecaos.plugins.animesonlinecc` (busca)
- `animecaos.plugins.animefire` (busca)

**Nota:** Estes plugins ainda usam Selenium para o player, que não é afetado por este patch.

## Instalação na VPS

```bash
cd ~/animecaos/mobile/backend

# Ativar venv
source .venv/bin/activate

# Instalar cloudscraper
pip install cloudscraper==1.2.71

# Ou atualizar requirements
pip install -r requirements.txt
```

## Testando

```bash
# Iniciar backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# Em outro terminal, testar busca
curl "http://localhost:8000/search?q=hunter"

# Esperado: retornar lista de animes sem erros 403
# Logs devem mostrar:
# - "selenium_patch aplicado — binary=/usr/bin/firefox-esr, geckodriver=/usr/local/bin/geckodriver"
# - "cloudscraper_patch aplicado em 2 módulo(s)"
```

## Troubleshooting

### Erro 403 ainda aparece

1. Verificar se cloudscraper está instalado: `pip show cloudscraper`
2. Verificar logs do startup: deve aparecer "cloudscraper_patch aplicado em 2 módulo(s)"
3. O site pode ter atualizado proteções - testar manualmente com curl:
   ```bash
   curl -H "User-Agent: Mozilla/5.0" "https://animesonlinecc.to/search/hunter"
   ```

### AnimesVision não retorna resultados

Os seletores CSS podem ter mudado. Verificar:

1. Testar busca manual no navegador
2. Inspecionar HTML da página de resultados
3. Atualizar `animesvision_selectors.py` com novos seletores
4. Reiniciar backend

### Firefox/geckodriver error

Verificar paths na VPS:
```bash
which firefox-esr  # Deve retornar /usr/bin/firefox-esr
which geckodriver   # Deve retornar /usr/local/bin/geckodriver
```

Se geckodriver não existir:
```bash
# Download mais recente
wget https://github.com/mozilla/geckodriver/releases/latest/download/geckodriver-linux64.tar.gz
tar -xzf geckodriver-linux64.tar.gz
sudo mv geckodriver /usr/local/bin/
sudo chmod +x /usr/local/bin/geckodriver
```

## Estrutura de Arquivos

```
app/
├── main.py                    # Ponto de entrada, aplica patches no startup
├── selenium_patch.py          # Patch Firefox/geckodriver
├── cloudscraper_patch.py      # Patch Cloudflare bypass
├── animesvision_selectors.py  # Seletores CSS (documentação)
└── ...
```

## Como Funciona o Monkey-Patch

1. **Importação antecipada:** Os patches são aplicados antes de importar `AnimeService`
2. **Substituição de módulos:** O módulo `requests` nos plugins é substituído por um wrapper
3. **Transparência:** O código dos plugins desktop não é modificado
4. **Isolamento:** Apenas o backend mobile usa os patches

## Adicionando Novos Patches

Para adicionar um novo patch:

1. Criar `app/novo_patch.py` com função `apply()`
2. Importar e chamar em `app/main.py`:
   ```python
   from app.novo_patch import apply as _apply_novo_patch
   _apply_novo_patch()
   ```
3. Testar startup e logs
4. Documentar neste README
