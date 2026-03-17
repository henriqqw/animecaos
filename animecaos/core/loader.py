import importlib
import logging
from abc import ABC, abstractmethod
from collections.abc import Sequence

log = logging.getLogger(__name__)

AVAILABLE_PLUGINS: tuple[str, ...] = ("hinatasoul", "betteranime", "animesonlinecc", "animefire", "animesvision")


class PluginInterface(ABC):
    @staticmethod
    @abstractmethod
    def search_anime(query: str):
        raise NotImplementedError

    @staticmethod
    @abstractmethod
    def search_episodes(anime: str, url: str, params):
        raise NotImplementedError

    @staticmethod
    @abstractmethod
    def search_player_src(url_episode: str) -> str:
        raise NotImplementedError

def load_plugins(languages: set[str], plugins: Sequence[str] | None = None) -> None:
    plugin_names = tuple(plugins) if plugins is not None else AVAILABLE_PLUGINS

    for plugin_name in plugin_names:
        try:
            plugin_module = importlib.import_module(f"animecaos.plugins.{plugin_name}")
            plugin_module.load(languages)
        except Exception as exc:
            log.warning("Plugin '%s' nao carregado: %s", plugin_name, exc)
