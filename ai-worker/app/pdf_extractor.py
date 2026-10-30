import logging
import io
from typing import List, Dict, Any, Tuple
import fitz  # PyMuPDF
from app.ocr import perform_ocr_on_pixmap, perform_ocr_on_image_bytes

logger = logging.getLogger("veridoc-worker")

class ExtractedPage:
    def __init__(self, page_number: int, text: str, ocr_applied: bool = False):
        self.page_number = page_number
        self.text = text
        self.ocr_applied = ocr_applied

    def to_dict(self) -> Dict[str, Any]:
        return {
            "page_number": self.page_number,
            "text": self.text,
            "ocr_applied": self.ocr_applied
        }

class DocumentExtractor:
    @staticmethod
    def extract_document(
        file_bytes: bytes,
        mime_type: str,
        max_pages: int = 200,
        min_text_char_threshold: int = 40
    ) -> Tuple[List[ExtractedPage], int]:
        """
        Extracts text from a PDF or image byte stream.
        Applies OCR selectively only on pages where digital text is insufficient.
        """
        pages: List[ExtractedPage] = []

        # If it's a direct image file
        if mime_type.startswith("image/"):
            logger.info("Extracting single image document via OCR...")
            text = perform_ocr_on_image_bytes(file_bytes)
            pages.append(ExtractedPage(page_number=1, text=text, ocr_applied=True))
            return pages, 1

        # Otherwise handle as PDF using PyMuPDF
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            total_pages = len(doc)
            page_limit = min(total_pages, max_pages)

            logger.info(f"Opened PDF with {total_pages} total pages. Processing first {page_limit} pages.")

            for page_idx in range(page_limit):
                page_num = page_idx + 1
                page = doc[page_idx]

                # Attempt fast digital text extraction first
                digital_text = page.get_text("text").strip()

                if len(digital_text) >= min_text_char_threshold:
                    pages.append(ExtractedPage(page_number=page_num, text=digital_text, ocr_applied=False))
                else:
                    # Digital text is insufficient, apply OCR
                    logger.info(f"Page {page_num} text insufficient ({len(digital_text)} chars). Applying OCR...")
                    pix = page.get_pixmap(dpi=200)
                    ocr_text = perform_ocr_on_pixmap(pix)
                    
                    combined_text = (digital_text + "\n" + ocr_text).strip() if digital_text else ocr_text
                    pages.append(ExtractedPage(page_number=page_num, text=combined_text, ocr_applied=True))

            doc.close()
            return pages, total_pages

        except Exception as e:
            logger.error(f"Failed to extract text from PDF: {e}")
            raise

