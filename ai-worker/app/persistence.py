import datetime
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.supabase_client import supabase_worker
from app.config import settings
from app.chunker import DocumentChunk
from app.validation import ValidationResult
from app.schemas import (
    InvoiceExtraction,
    BankStatementExtraction,
    PurchaseOrderExtraction
)

logger = logging.getLogger("veridoc-worker")

class ResultPersistence:
    @staticmethod
    def persist_results(
        document_id: str,
        user_id: str,
        category: str,
        extraction: BaseModel,
        validation: ValidationResult,
        summary: str,
        chunks: List[DocumentChunk],
        total_pages: int
    ):
        """
        Atomically saves extraction, line items/transactions, chunks, and updates document status.
        """
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        client = supabase_worker.client

        try:
            # 1. Upsert document_extractions
            extraction_dict = extraction.model_dump()
            client.table("document_extractions").upsert({
                "document_id": document_id,
                "user_id": user_id,
                "category": category,
                "extracted_data": extraction_dict,
                "schema_version": "1.0",
                "model_name": settings.GEMINI_MODEL,
                "confidence_score": validation.confidence_score,
                "updated_at": now_iso,
            }, on_conflict="document_id").execute()

            # 2. Persist line items for invoices or purchase orders
            if isinstance(extraction, InvoiceExtraction) and extraction.line_items:
                # Clear any existing line items for idempotence
                client.table("document_line_items").delete().eq("document_id", document_id).execute()

                line_items_data = [
                    {
                        "document_id": document_id,
                        "user_id": user_id,
                        "item_type": "invoice",
                        "product_code": None,
                        "description": item.description,
                        "quantity": item.quantity,
                        "unit_price": item.unit_price,
                        "line_total": item.line_total,
                        "source_page": item.source_page,
                    }
                    for item in extraction.line_items
                ]
                client.table("document_line_items").insert(line_items_data).execute()

            elif isinstance(extraction, PurchaseOrderExtraction) and extraction.line_items:
                client.table("document_line_items").delete().eq("document_id", document_id).execute()

                po_items_data = [
                    {
                        "document_id": document_id,
                        "user_id": user_id,
                        "item_type": "purchase_order",
                        "product_code": item.product_code,
                        "description": item.description,
                        "quantity": item.quantity,
                        "unit_price": item.unit_price,
                        "line_total": item.line_total,
                        "source_page": item.source_page,
                    }
                    for item in extraction.line_items
                ]
                client.table("document_line_items").insert(po_items_data).execute()

            # 3. Persist transactions for bank statements
            elif isinstance(extraction, BankStatementExtraction) and extraction.transactions:
                client.table("document_transactions").delete().eq("document_id", document_id).execute()

                tx_data = [
                    {
                        "document_id": document_id,
                        "user_id": user_id,
                        "transaction_date": tx.transaction_date,
                        "description": tx.description,
                        "reference_number": tx.reference_number,
                        "debit_amount": tx.debit_amount,
                        "credit_amount": tx.credit_amount,
                        "running_balance": tx.running_balance,
                        "source_page": tx.source_page,
                    }
                    for tx in extraction.transactions
                ]
                client.table("document_transactions").insert(tx_data).execute()

            # 4. Persist chunks
            if chunks:
                client.table("document_chunks").delete().eq("document_id", document_id).execute()

                chunks_data = [
                    {
                        "document_id": document_id,
                        "user_id": user_id,
                        "chunk_index": c.chunk_index,
                        "page_start": c.page_start,
                        "page_end": c.page_end,
                        "chunk_text": c.chunk_text,
                        "chunk_summary": c.chunk_summary,
                        "token_count": c.token_count,
                    }
                    for c in chunks
                ]
                client.table("document_chunks").insert(chunks_data).execute()

            # 5. Upsert verification_records (status: pending)
            client.table("verification_records").upsert({
                "document_id": document_id,
                "user_id": user_id,
                "status": "pending",
                "original_data": extraction_dict,
                "corrected_data": {},
                "reviewer_notes": "\n".join(validation.warnings) if validation.warnings else "Ready for verification",
                "updated_at": now_iso,
            }, on_conflict="document_id").execute()

            # 6. Update documents table
            client.table("documents").update({
                "category": category,
                "processing_status": "completed",
                "verification_status": "pending",
                "confidence_score": validation.confidence_score,
                "summary": summary,
                "page_count": total_pages,
                "processed_at": now_iso,
                "updated_at": now_iso,
            }).eq("id", document_id).execute()

            # 7. Audit log
            client.table("audit_logs").insert({
                "user_id": user_id,
                "document_id": document_id,
                "action": "DOCUMENT_PROCESSED",
                "details": {
                    "category": category,
                    "confidence_score": validation.confidence_score,
                    "page_count": total_pages,
                    "chunks_count": len(chunks),
                    "warnings_count": len(validation.warnings),
                }
            }).execute()

            logger.info(f"Successfully persisted all results for document {document_id}")

        except Exception as e:
            logger.error(f"Error persisting processing results for {document_id}: {e}")
            raise

