import logging
from typing import List
from app.chunker import DocumentChunk
from app.gemini_service import gemini_service

logger = logging.getLogger("veridoc-worker")

class DocumentSummarizer:
    @staticmethod
    def summarize_chunks(chunks: List[DocumentChunk]) -> str:
        """
        Summarizes individual chunks and combines their insights into an overall document summary.
        """
        if not chunks:
            return "No content to summarize."

        # Summarize each chunk concisely
        for chunk in chunks:
            first_lines = [l.strip() for l in chunk.chunk_text.split("\n") if len(l.strip()) > 25]
            snippet = " ".join(first_lines[:2])
            chunk.chunk_summary = f"Pages {chunk.page_start}-{chunk.page_end}: {snippet[:200]}"

        # Combine chunk summaries into an overall summary
        combined_chunk_summaries = "\n".join([f"- {c.chunk_summary}" for c in chunks[:10]])
        overall_summary = gemini_service.generate_summary(combined_chunk_summaries)

        return overall_summary

