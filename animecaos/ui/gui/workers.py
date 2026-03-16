from __future__ import annotations

from collections.abc import Callable
from traceback import format_exc
from typing import Any

from PySide6.QtCore import QObject, QRunnable, Signal, Slot


class WorkerSignals(QObject):
    succeeded = Signal(object)
    failed = Signal(str)
    finished = Signal()


class FunctionWorker(QRunnable):
    def __init__(self, fn: Callable[..., Any], *args: Any, **kwargs: Any) -> None:
        super().__init__()
        self._fn = fn
        self._args = args
        self._kwargs = kwargs
        self.signals = WorkerSignals()

    @Slot()
    def run(self) -> None:
        try:
            result = self._fn(*self._args, **self._kwargs)
        except Exception as exc:  # pylint: disable=broad-except
            stack = format_exc(limit=2)
            self.signals.failed.emit(f"{exc}\n{stack}")
        else:
            self.signals.succeeded.emit(result)
        finally:
            self.signals.finished.emit()


class DownloadWorkerSignals(QObject):
    progress = Signal(str)
    succeeded = Signal(str)
    failed = Signal(str)
    finished = Signal()


class DownloadWorker(QRunnable):
    def __init__(self, url: str, output_template: str) -> None:
        super().__init__()
        self._url = url
        self._output_template = output_template
        self.signals = DownloadWorkerSignals()
        self._is_cancelled = False
        self._process = None

    def cancel(self):
        self._is_cancelled = True
        if self._process:
            self._process.terminate()

    @Slot()
    def run(self) -> None:
        import subprocess
        from animecaos.core.paths import get_bin_path
        try:
            flags = 0
            if __import__("os").name == "nt":
                flags = subprocess.CREATE_NO_WINDOW
                
            self._process = subprocess.Popen(
                [get_bin_path("yt-dlp"), "-o", self._output_template, self._url],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                creationflags=flags
            )
            for line in iter(self._process.stdout.readline, ""):
                if self._is_cancelled:
                    break
                if line:
                    self.signals.progress.emit(line.strip())
            self._process.stdout.close()
            return_code = self._process.wait()
            
            if self._is_cancelled:
                 self.signals.failed.emit("Download cancelado.")
            elif return_code == 0:
                self.signals.succeeded.emit(self._output_template)
            else:
                self.signals.failed.emit(f"yt-dlp encerrou com erro {return_code}.")
        except FileNotFoundError:
            self.signals.failed.emit("yt-dlp nao encontrado. Instale-o ou adicione ao PATH.")
        except Exception as exc:
            self.signals.failed.emit(str(exc))
        finally:
            self.signals.finished.emit()


class UpdaterCheckWorkerSignals(QObject):
    succeeded = Signal(bool)
    failed = Signal(str)
    finished = Signal()


class UpdaterCheckWorker(QRunnable):
    def __init__(self, updater_service) -> None:
        super().__init__()
        self._updater_service = updater_service
        self.signals = UpdaterCheckWorkerSignals()

    @Slot()
    def run(self) -> None:
        try:
            has_update = self._updater_service.check_for_updates()
            self.signals.succeeded.emit(has_update)
        except Exception as exc:
            self.signals.failed.emit(str(exc))
        finally:
            self.signals.finished.emit()

