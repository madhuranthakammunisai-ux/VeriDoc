import logging
import io
from PIL import Image

logger = logging.getLogger("veridoc-worker")

try:
    import pytesseract
    PYTESSERACT_AVAILABLE = True
except ImportError:
    PYTESSERACT_AVAILABLE = False
    logger.warning("pytesseract is not installed or available.")

def perform_ocr_on_image_bytes(image_bytes: bytes) -> str:
    """Performs Tesseract OCR on raw image bytes."""
    if not PYTESSERACT_AVAILABLE:
        logger.warning("pytesseract unavailable; skipping OCR on image bytes")
        return ""
    try:
        image = Image.open(io.BytesIO(image_bytes))
        # Convert to grayscale / RGB if needed
        if image.mode not in ("L", "RGB"):
            image = image.convert("RGB")
        text = pytesseract.image_to_string(image)
        return text.strip()
    except Exception as e:
        logger.warning(f"OCR execution failed: {e}")
        return ""

def perform_ocr_on_pixmap(pixmap) -> str:
    """Performs OCR directly on a PyMuPDF pixmap."""
    if not PYTESSERACT_AVAILABLE:
        return ""
    try:
        # Convert pixmap to PNG bytes
        img_bytes = pixmap.tobytes("png")
        return perform_ocr_on_image_bytes(img_bytes)
    except Exception as e:
        logger.warning(f"OCR on pixmap failed: {e}")
        return ""

