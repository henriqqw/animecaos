from __future__ import annotations


def build_stylesheet() -> str:
    return """
    QWidget {
        background: transparent;
        color: #F2F3F5;
        font-family: "Segoe UI", "Helvetica Neue", sans-serif;
        font-size: 13px;
    }

    QWidget#RootContainer {
        background: qlineargradient(
            x1: 0, y1: 0, x2: 0, y2: 1,
            stop: 0 #101218,
            stop: 1 #0B0C0F
        );
    }

    QFrame#GlassPanel {
        background-color: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 12px;
    }

    QLabel {
        background: transparent;
    }

    QLabel#AppTitle {
        font-size: 24px;
        font-weight: 600;
        color: #F2F3F5;
    }

    QLabel#SectionTitle {
        font-size: 16px;
        font-weight: 600;
        color: #E6E7EA;
    }

    QLabel#MutedText, QTextEdit#MutedText {
        color: #A7ACB5;
        font-size: 12px;
    }
    
    QTextEdit#MutedText {
        background: transparent;
        border: none;
    }

    QLineEdit, QPlainTextEdit, QListWidget {
        background-color: rgba(255, 255, 255, 0.07);
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 10px;
        padding: 8px;
        selection-background-color: rgba(212, 66, 66, 0.65);
        selection-color: #F2F3F5;
    }

    QLineEdit:focus, QPlainTextEdit:focus, QListWidget:focus {
        border: 1px solid #D44242;
    }

    QListWidget::item {
        padding: 7px 8px;
        border-radius: 6px;
    }

    QListWidget::item:selected {
        background-color: rgba(212, 66, 66, 0.55);
    }

    QPushButton {
        background-color: rgba(255, 255, 255, 0.10);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 10px;
        padding: 8px 12px;
    }

    QPushButton:hover {
        background-color: rgba(255, 255, 255, 0.14);
    }

    QPushButton:pressed {
        background-color: rgba(255, 255, 255, 0.08);
    }

    QPushButton:disabled {
        color: #7F848D;
        background-color: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.10);
    }

    QPushButton#PrimaryButton {
        border: 1px solid #D44242;
        background-color: rgba(212, 66, 66, 0.22);
    }

    QPushButton#PrimaryButton:hover {
        background-color: rgba(224, 82, 82, 0.30);
        border: 1px solid #E05252;
    }

    QPushButton#PrimaryButton:pressed {
        background-color: rgba(182, 56, 56, 0.34);
        border: 1px solid #B63838;
    }

    QProgressBar {
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 8px;
        text-align: center;
        background-color: rgba(255, 255, 255, 0.06);
    }

    QProgressBar::chunk {
        background-color: #D44242;
        border-radius: 7px;
    }

    QSplitter::handle {
        background-color: rgba(255, 255, 255, 0.08);
    }

    QDialog#UpdateDialog {
        background-color: #0B0C0F;
        border: 1px solid rgba(255, 255, 255, 0.15);
    }
    """
