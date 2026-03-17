import subprocess
from urllib.parse import urlparse


from animecaos.core.paths import get_bin_path


def _build_referer(url: str) -> str:
    """Derive a Referer header from the video URL's origin."""
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}/"


def play_video(url: str, debug: bool = False) -> dict[str, bool]:
    if debug:
        return {"eof": False}

    if not url or not url.startswith(("http://", "https://")):
        raise RuntimeError(f"URL de video invalida: {url!r}")

    referer = _build_referer(url)

    try:
        result = subprocess.run(
            [
                get_bin_path("mpv"),
                url,
                "--fullscreen",
                "--cursor-autohide-fs-only",
                "--log-file=log.txt",
                "--term-status-msg=PlaybackStatus: ${=eof-reached}",
                f"--referrer={referer}",
                "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )
    except FileNotFoundError as exc:
        raise EnvironmentError("Erro: 'mpv' nao esta instalado ou nao esta no PATH.") from exc

    if result.returncode != 0 and result.returncode != 4:
        stderr = result.stderr.decode("utf-8", errors="replace") if result.stderr else ""
        raise RuntimeError(
            f"mpv encerrou com codigo {result.returncode}.\n{stderr[:300]}"
        )

    out = result.stdout.decode("utf-8", errors="replace") if result.stdout else ""
    eof = "PlaybackStatus: yes" in out

    return {"eof": eof}
