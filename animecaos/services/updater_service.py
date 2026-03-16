import os
import sys
import json
import urllib.request
import urllib.error
import zipfile
import shutil
import subprocess
from pathlib import Path
from animecaos import __version__


class UpdaterService:
    """Servico para checar atualizacoes usando a API do GitHub Releases."""
    
    API_URL = "https://api.github.com/repos/henriqqw/animecaos/releases/latest"
    
    def __init__(self):
        self.current_version = __version__
        self.latest_version = __version__
        self.download_url = None
        self.release_notes = ""

    def check_for_updates(self) -> bool:
        """Verifica se existe uma versao mais recente no GitHub. Return True se houver update."""
        try:
            req = urllib.request.Request(self.API_URL)
            req.add_header("User-Agent", "Animecaos-Updater")
            req.add_header("Accept", "application/vnd.github.v3+json")
            
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())
                
                tag_name = data.get("tag_name", "") # ex: "v0.1.1"
                if tag_name.startswith("v"):
                    tag_name = tag_name[1:]
                    
                self.latest_version = tag_name
                self.release_notes = data.get("body", "")
                
                assets = data.get("assets", [])
                for asset in assets:
                    if asset.get("name", "").endswith(".zip"):
                        self.download_url = asset.get("browser_download_url")
                        break
                        
                return self._is_newer_version(self.latest_version, self.current_version)
        except Exception as e:
            print(f"Erro ao checar atualizacoes: {e}")
            return False

    def _is_newer_version(self, latest: str, current: str) -> bool:
        """Compara duas strings de versao semantica ex: 0.1.1 vs 0.1.0."""
        try:
            l_parts = [int(p) for p in latest.split(".")]
            c_parts = [int(p) for p in current.split(".")]
            
            for l, c in zip(l_parts, c_parts):
                if l > c:
                    return True
                elif l < c:
                    return False
            
            # se latest tem mais partes, e a primeira extra eh maior que 0
            return len(l_parts) > len(c_parts)
        except Exception:
            return False

    def perform_update(self, callback_progress=None) -> bool:
        """Baixa o arquivo .zip, extrai, gera .bat e reabre o app atualizado."""
        if not self.download_url:
            return False
            
        try:
            if getattr(sys, 'frozen', False):
                base_dir = Path(sys.executable).parent
            else:
                base_dir = Path(os.path.abspath("."))
                
            temp_dir = base_dir / "update_temp"
            if temp_dir.exists():
                shutil.rmtree(temp_dir)
            temp_dir.mkdir(parents=True)
            
            zip_path = temp_dir / "update.zip"
            
            # Download con callback progressivo
            if callback_progress:
                def hook(count, block_size, total_size):
                    percent = int(count * block_size * 100 / total_size) if total_size > 0 else 0
                    percent = min(percent, 100)
                    callback_progress(percent)
                urllib.request.urlretrieve(self.download_url, zip_path, reporthook=hook)
            else:
                urllib.request.urlretrieve(self.download_url, zip_path)
                
            if callback_progress:
                callback_progress("Extracao")
                
            # Extracts everything inside a subfolder /extracted/
            extract_dir = temp_dir / "extracted"
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)
                
            # Geralmente as releases zipadas do github criam uma pasta com o nome do repo
            # Vamos encontrar a raiz do projeto extraido
            new_app_dir = extract_dir
            for item in extract_dir.iterdir():
                if item.is_dir() and (item / "Animecaos.exe").exists():
                    new_app_dir = item
                    break

            # Cria script batch
            bat_path = base_dir / "update.bat"
            exe_name = Path(sys.executable).name if getattr(sys, 'frozen', False) else "main.py"
            is_frozen = getattr(sys, 'frozen', False)
            
            with open(bat_path, "w", encoding="utf-8") as f:
                f.write("@echo off\n")
                f.write('echo Atualizando Animecaos...\n')
                f.write('timeout /t 2 /nobreak > NUL\n') # Wait for app to close
                
                # Copying new files logic
                f.write(f'xcopy "{new_app_dir}\\*" "{base_dir}" /E /Y /C /R /Q\n')
                
                # Removing temp files
                f.write(f'rmdir /s /q "{temp_dir}"\n')
                
                # Restart
                if is_frozen:
                    f.write(f'start "" "{base_dir}\\{exe_name}"\n')
                else:
                    f.write(f'start "" python "{base_dir}\\main.py"\n')
                
                # Self destruct
                f.write('del "%~f0"\n')

            # Launch bat and exit
            subprocess.Popen([str(bat_path)], shell=True, creationflags=subprocess.CREATE_NO_WINDOW)
            return True
            
        except Exception as e:
            print(f"Erro efetuando update: {e}")
            if callback_progress:
                callback_progress(-1) # Error code
            return False
