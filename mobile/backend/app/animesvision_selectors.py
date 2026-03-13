"""
Configuração dos seletores CSS para o AnimesVision.

Os seletores podem mudar quando o site atualiza o layout.
Este módulo centraliza os seletores para facilitar manutenção.
"""

# Seletores para busca de animes (search_anime)
ANIME_SEARCH_SELECTORS = [
    # Seletores mais comuns em sites de anime
    "div.film-detail h3 a",
    "div.film-detail h2 a", 
    "div.flw-item h3 a",
    "div.flw-item h2 a",
    "div.item a.name",
    "div.anime-item a.title",
    "a.anime-title",
    "div.card-anime a",
    # AnimesVision específico (observado em 2024-2025)
    "div.row div.col a",
    "div.list-anime a",
]

# Seletores para episódios (search_episodes)
EPISODE_SELECTORS = [
    "a[href*='/episodio/']",
    "a[href*='/ep/']",
    "a.ep-item",
    "ul.listsss a",
    "div.episode a",
    "a.episode-link",
    "button.episode",
]

# Seletores para iframe do player (search_player_src)
IFRAME_SELECTORS = [
    "iframe#playerframe",
    "iframe.player-frame",
    "div.player-frame iframe",
    "iframe[src*='/embed/']",
    "iframe[src*='/player/']",
    "iframe",  # Fallback genérico
]


def get_search_query_url(query: str) -> str:
    """Constrói URL de busca."""
    from urllib.parse import quote
    q = quote(query)
    return f"https://animesvision.biz/search?nome={q}"
