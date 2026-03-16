from __future__ import annotations

import os
from threading import RLock

import requests
from bs4 import BeautifulSoup

from animecaos.services.watchlist_service import _watchlist_dir

APP_NAME = "AnimeCaos"


class AniListService:
    """Service to fetch anime metadata (covers, synopsis) from AniList GraphQL API."""

    def __init__(self, app_name: str = APP_NAME) -> None:
        self._url = "https://graphql.anilist.co"
        self._cache_dir = _watchlist_dir(app_name) / "cache" / "covers"
        self._cache_dir.mkdir(parents=True, exist_ok=True)
        self._translate_meta = os.getenv("ANIMECAOS_TRANSLATE_META", "1").lower() in {"1", "true", "yes", "on"}
        self._memory_cache: dict[str, dict[str, str | None]] = {}
        self._cache_lock = RLock()
        
        self._query_template = """
        query ($search: String) {
          Media (search: $search, type: ANIME) {
            id
            title {
              romaji
              english
            }
            description
            coverImage {
              large
            }
          }
        }
        """

    def fetch_anime_info(self, query: str) -> dict[str, str | None]:
        """Fetches metadata for a given anime title."""
        if not query:
            return {"description": None, "cover_path": None, "cover_url": None}

        # Light sanitation for better search hits
        clean_query = query.replace("(Dublado)", "").replace("(Legendado)", "").strip()
        cache_key = clean_query.lower()

        with self._cache_lock:
            cached = self._memory_cache.get(cache_key)
            if cached is not None:
                return dict(cached)

        variables = {"search": clean_query}

        try:
            response = requests.post(
                self._url,
                json={"query": self._query_template, "variables": variables},
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()
        except Exception:
            result = {"description": None, "cover_path": None, "cover_url": None}
            with self._cache_lock:
                self._memory_cache[cache_key] = result
            return dict(result)

        media = data.get("data", {}).get("Media")
        if not media:
            result = {"description": None, "cover_path": None, "cover_url": None}
            with self._cache_lock:
                self._memory_cache[cache_key] = result
            return dict(result)

        description = media.get("description", "")
        if description:
            description = BeautifulSoup(description, "html.parser").get_text("\n")
            description = "\n".join(line.strip() for line in description.splitlines() if line.strip())
            if self._translate_meta:
                translated = self._translate_to_ptbr(description)
                description = translated if translated else None

        cover_url = media.get("coverImage", {}).get("large")
        cover_path = None

        if isinstance(cover_url, str):
            import hashlib
            url_hash = hashlib.md5(cover_url.encode()).hexdigest()
            ext = cover_url.split(".")[-1] if "." in cover_url[-6:] else "jpg"
            cover_path = self._cache_dir / f"{url_hash}.{ext}"

            if not cover_path.exists():
                try:
                    img_resp = requests.get(cover_url, timeout=10)
                    img_resp.raise_for_status()
                    cover_path.write_bytes(img_resp.content)
                except Exception:
                    cover_path = None

        result = {
            "description": description,
            "cover_path": str(cover_path) if cover_path else None,
            "cover_url": cover_url if isinstance(cover_url, str) else None,
        }
        with self._cache_lock:
            self._memory_cache[cache_key] = result
        return dict(result)

    def _translate_to_ptbr(self, text: str) -> str | None:
        """Translates the given text to Portuguese (pt-br) using the free Google Translate API endpoint."""
        if not text:
            return None
        try:
            from urllib.parse import quote
            url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=pt&dt=t&q={quote(text)}"
            resp = requests.get(url, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                translated = "".join(sentence[0] for sentence in data[0] if sentence[0])
                return translated.strip() or None
        except Exception:
            pass
        return None
