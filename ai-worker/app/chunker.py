import logging
from typing import List, Dict, Any
from app.pdf_extractor import ExtractedPage

logger = logging.getLogger("veridoc-worker")

class DocumentChunk:
    def __init__(
        self,
        chunk_index: int,
        page_start: int,
        page_end: int,
        chunk_text: str,
        token_count: int,
        chunk_summary: str = ""
    ):
        self.chunk_index = chunk_index
        self.page_start = page_start
        self.page_end = page_end
        self.chunk_text = chunk_text
        self.token_count = token_count
        self.chunk_summary = chunk_summary

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_index": self.chunk_index,
            "page_start": self.page_start,
            "page_end": self.page_end,
            "chunk_text": self.chunk_text,
            "token_count": self.token_count,
            "chunk_summary": self.chunk_summary,
        }

class DocumentChunker:
    """
    Page-aware token-based document chunker.
    Groups page text while keeping page boundaries explicit and limiting chunk size.
    """

    @staticmethod
    def chunk_pages(
        pages: List[ExtractedPage],
        target_tokens: int = 600,
        overlap_tokens: int = 80
    ) -> List[DocumentChunk]:
        chunks: List[DocumentChunk] = []
        if not pages:
            return chunks

        current_text_parts: List[str] = []
        current_tokens = 0
        current_page_start = pages[0].page_number
        current_page_end = pages[0].page_number
        chunk_idx = 0

        for page in pages:
            # Estimate tokens: roughly 4 chars per token in English
            page_text = page.text.strip()
            if not page_text:
                continue

            page_tokens = max(1, len(page_text) // 4)

            # If single page is already large, split by paragraphs
            if page_tokens > target_tokens * 1.5:
                paragraphs = page_text.split("\n\n")
                for para in paragraphs:
                    para_clean = para.strip()
                    if not para_clean:
                        continue
                    para_tokens = max(1, len(para_clean) // 4)

                    if current_tokens + para_tokens > target_tokens and current_text_parts:
                        full_chunk = "\n\n".join(current_text_parts)
                        chunks.append(DocumentChunk(
                            chunk_index=chunk_idx,
                            page_start=current_page_start,
                            page_end=current_page_end,
                            chunk_text=full_chunk,
                            token_count=current_tokens
                        ))
                        chunk_idx += 1
                        # Retain overlap from last part if available
                        current_text_parts = [current_text_parts[-1]] if len(current_text_parts) > 1 else []
                        current_tokens = len(current_text_parts[0]) // 4 if current_text_parts else 0
                        current_page_start = page.page_number

                    current_text_parts.append(para_clean)
                    current_tokens += para_tokens
                    current_page_end = page.page_number
            else:
                if current_tokens + page_tokens > target_tokens and current_text_parts:
                    full_chunk = "\n\n".join(current_text_parts)
                    chunks.append(DocumentChunk(
                        chunk_index=chunk_idx,
                        page_start=current_page_start,
                        page_end=current_page_end,
                        chunk_text=full_chunk,
                        token_count=current_tokens
                    ))
                    chunk_idx += 1
                    current_text_parts = []
                    current_tokens = 0
                    current_page_start = page.page_number

                current_text_parts.append(f"--- Page {page.page_number} ---\n{page_text}")
                current_tokens += page_tokens
                current_page_end = page.page_number

        # Flush remaining chunk
        if current_text_parts:
            full_chunk = "\n\n".join(current_text_parts)
            chunks.append(DocumentChunk(
                chunk_index=chunk_idx,
                page_start=current_page_start,
                page_end=current_page_end,
                chunk_text=full_chunk,
                token_count=current_tokens
            ))

        return chunks

