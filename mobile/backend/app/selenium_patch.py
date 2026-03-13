"""
Monkey-patch para forçar os plugins desktop a usarem Firefox ESR + geckodriver
explícitos na VPS Ubuntu. Aplicado no startup do mobile backend.

Alvo: todos os módulos em animecaos.plugins que criam instâncias Selenium Firefox.
"""

from __future__ import annotations

import sys

from selenium import webdriver
from selenium.webdriver.firefox.service import Service as FirefoxService
from selenium.common.exceptions import WebDriverException

# ---------------------------------------------------------------------------
# Paths da VPS (Firefox ESR via apt, geckodriver manual)
# ---------------------------------------------------------------------------
FIREFOX_BINARY = "/usr/bin/firefox-esr"
GECKODRIVER_PATH = "/usr/local/bin/geckodriver"


def _patched_build_firefox_options() -> webdriver.FirefoxOptions:
    """Substitui build_firefox_options() dos plugins — inclui binary_location."""
    options = webdriver.FirefoxOptions()
    options.add_argument("--headless")
    options.binary_location = FIREFOX_BINARY

    # Cloudflare DNS-over-HTTPS (mantido do original).
    options.set_preference("network.trr.mode", 2)
    options.set_preference("network.trr.uri", "https://1.1.1.1/dns-query")
    options.set_preference("network.trr.bootstrapAddress", "1.1.1.1")

    return options


def _patched_is_firefox_installed_as_snap() -> bool:
    """Snap foi removido da VPS — sempre retorna False."""
    return False


def _patched_make_driver() -> webdriver.Firefox:
    """Substitui _make_driver() dos plugins — usa paths explícitos."""
    options = _patched_build_firefox_options()
    try:
        service = FirefoxService(executable_path=GECKODRIVER_PATH)
        return webdriver.Firefox(service=service, options=options)
    except WebDriverException as exc:
        raise RuntimeError(
            f"Firefox/geckodriver nao encontrado. "
            f"binary={FIREFOX_BINARY}, geckodriver={GECKODRIVER_PATH}"
        ) from exc


def apply() -> None:
    """Aplica os patches em todos os módulos de plugins já importados."""

    # Módulos com _make_driver() próprio
    _MODULES_WITH_MAKE_DRIVER = (
        "animecaos.plugins.animesvision",
        "animecaos.plugins.betteranime",
        "animecaos.plugins.hinatasoul",
    )

    # Módulos que usam build_firefox_options / is_firefox_installed_as_snap inline
    _MODULES_WITH_INLINE_DRIVER = (
        "animecaos.plugins.animesonlinecc",
        "animecaos.plugins.animefire",
    )

    # Patch no utils central
    utils_mod = sys.modules.get("animecaos.plugins.utils")
    if utils_mod is not None:
        utils_mod.build_firefox_options = _patched_build_firefox_options  # type: ignore[attr-defined]
        utils_mod.is_firefox_installed_as_snap = _patched_is_firefox_installed_as_snap  # type: ignore[attr-defined]

    # Patch nos módulos que têm _make_driver()
    for mod_name in _MODULES_WITH_MAKE_DRIVER:
        mod = sys.modules.get(mod_name)
        if mod is None:
            continue
        mod._make_driver = _patched_make_driver  # type: ignore[attr-defined]
        # Também sobrescrever referências locais importadas do utils
        if hasattr(mod, "build_firefox_options"):
            mod.build_firefox_options = _patched_build_firefox_options  # type: ignore[attr-defined]
        if hasattr(mod, "is_firefox_installed_as_snap"):
            mod.is_firefox_installed_as_snap = _patched_is_firefox_installed_as_snap  # type: ignore[attr-defined]

    # Patch nos módulos que criam driver inline (animesonlinecc, animefire)
    for mod_name in _MODULES_WITH_INLINE_DRIVER:
        mod = sys.modules.get(mod_name)
        if mod is None:
            continue
        if hasattr(mod, "build_firefox_options"):
            mod.build_firefox_options = _patched_build_firefox_options  # type: ignore[attr-defined]
        if hasattr(mod, "is_firefox_installed_as_snap"):
            mod.is_firefox_installed_as_snap = _patched_is_firefox_installed_as_snap  # type: ignore[attr-defined]

    print(
        f"Info: selenium_patch aplicado — "
        f"binary={FIREFOX_BINARY}, geckodriver={GECKODRIVER_PATH}"
    )
