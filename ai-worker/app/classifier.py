import re
import logging
from typing import List
from app.schemas import DocumentClassificationResult
from app.pdf_extractor import ExtractedPage

logger = logging.getLogger("veridoc-worker")

class DocumentClassifier:
    """
    Classifies documents into:
    - 'invoices'
    - 'bank_statements'
    - 'purchase_orders'
    - 'large_pdf_documents'
    - 'unknown'
    """

    @staticmethod
    def classify(pages: List[ExtractedPage], total_pages: int) -> DocumentClassificationResult:
        # If document has more than 10 pages, classify as large_pdf_documents
        if total_pages >= 10:
            return DocumentClassificationResult(
                category="large_pdf_documents",
                confidence=0.98,
                reasoning=f"Document has {total_pages} pages, which exceeds the threshold for large PDF multi-page document processing."
            )

        full_text = " ".join([p.text.lower() for p in pages[:3]])

        # Bank Statement indicators
        bank_keywords = [
            "statement of account", "bank statement", "account summary",
            "opening balance", "closing balance", "deposits", "withdrawals",
            "transaction history", "current account", "savings account",
            "running balance", "cheque number"
        ]
        bank_score = sum(1 for kw in bank_keywords if kw in full_text)

        # Purchase Order indicators
        po_keywords = [
            "purchase order", "po number", "p.o. number", "order date",
            "vendor copy", "buyer:", "shipping method", "ship via",
            "requisition number", "delivery terms", "fob"
        ]
        po_score = sum(1 for kw in po_keywords if kw in full_text)

        # Invoice indicators
        invoice_keywords = [
            "tax invoice", "commercial invoice", "invoice number", "invoice date",
            "bill to:", "sold to:", "due date", "amount due", "remit to:",
            "subtotal", "vat reg", "tax id", "payment terms"
        ]
        invoice_score = sum(1 for kw in invoice_keywords if kw in full_text)

        # Check explicit title patterns first
        if re.search(r"\bpurchase\s+order\b", full_text):
            po_score += 3
        if re.search(r"\b(tax\s+)?invoice\b", full_text) and not re.search(r"\binvoice\s+statement\b", full_text):
            invoice_score += 3
        if re.search(r"\b(bank\s+)?statement\b", full_text) and bank_score >= 2:
            bank_score += 3

        logger.info(f"Classification scores - Bank: {bank_score}, PO: {po_score}, Invoice: {invoice_score}")

        scores = [
            ("bank_statements", bank_score),
            ("purchase_orders", po_score),
            ("invoices", invoice_score)
        ]
        scores.sort(key=lambda x: x[1], reverse=True)
        top_category, top_score = scores[0]

        if top_score >= 3:
            confidence = min(0.99, 0.65 + (top_score * 0.06))
            return DocumentClassificationResult(
                category=top_category,
                confidence=round(confidence, 2),
                reasoning=f"High match for {top_category.replace('_', ' ')} based on key financial markers (score: {top_score})."
            )

        # Fallback to Large PDF if multi-page report or general business document
        if total_pages >= 4:
            return DocumentClassificationResult(
                category="large_pdf_documents",
                confidence=0.80,
                reasoning="Multi-page general business document processed under comprehensive document analysis."
            )

        return DocumentClassificationResult(
            category="unknown",
            confidence=0.50,
            reasoning="Document text does not match standard invoice, bank statement, or purchase order patterns."
        )

