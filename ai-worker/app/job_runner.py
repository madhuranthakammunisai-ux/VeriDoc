import logging
import traceback
from typing import Dict, Any

from app.supabase_client import supabase_worker
from app.pdf_extractor import DocumentExtractor
from app.classifier import DocumentClassifier
from app.gemini_service import gemini_service
from app.validation import DocumentValidator
from app.chunker import DocumentChunker
from app.summarization import DocumentSummarizer
from app.persistence import ResultPersistence
from app.schemas import (
    InvoiceExtraction,
    BankStatementExtraction,
    PurchaseOrderExtraction
)

logger = logging.getLogger("veridoc-worker")

class JobRunner:
    @staticmethod
    def process_job(job: Dict[str, Any], worker_id: str):
        job_id = job["id"]
        document_id = job["document_id"]
        user_id = job["user_id"]

        logger.info(f"Starting processing job {job_id} for document {document_id}")

        try:
            # 1. Fetch document metadata
            doc_res = supabase_worker.client.table("documents").select("*").eq("id", document_id).single().execute()
            doc_data = doc_res.data
            if not doc_data:
                raise ValueError(f"Document {document_id} not found in database")

            storage_path = doc_data["storage_path"]
            mime_type = doc_data["mime_type"]

            # STEP 1: Download & Heartbeat
            supabase_worker.send_heartbeat(job_id, worker_id, stage="downloading")
            file_bytes = supabase_worker.download_document(storage_path)

            # STEP 2 & 3: Extract text & selective OCR
            supabase_worker.send_heartbeat(job_id, worker_id, stage="extracting_text_ocr")
            pages, total_pages = DocumentExtractor.extract_document(file_bytes, mime_type)

            # STEP 4: Classification
            supabase_worker.send_heartbeat(job_id, worker_id, stage="classifying")
            classification = DocumentClassifier.classify(pages, total_pages)
            category = classification.category
            logger.info(f"Classified document as: {category} (confidence: {classification.confidence})")

            # Combine page texts
            full_text = "\n\n".join([f"=== PAGE {p.page_number} ===\n{p.text}" for p in pages])

            # STEP 5, 6, 7: Gemini Extraction & Pydantic Validation
            supabase_worker.send_heartbeat(job_id, worker_id, stage="extracting_structured_data")
            extraction = gemini_service.extract_structured(full_text, category)

            # STEP 8 & 9: Deterministic Business Validation & Confidence Calculation
            supabase_worker.send_heartbeat(job_id, worker_id, stage="validating_business_rules")
            if category == "invoices" and isinstance(extraction, InvoiceExtraction):
                validation = DocumentValidator.validate_invoice(extraction)
            elif category == "bank_statements" and isinstance(extraction, BankStatementExtraction):
                validation = DocumentValidator.validate_bank_statement(extraction)
            elif category == "purchase_orders" and isinstance(extraction, PurchaseOrderExtraction):
                validation = DocumentValidator.validate_purchase_order(extraction)
            else:
                from app.schemas import ValidationResult
                validation = ValidationResult(
                    is_valid=True,
                    warnings=[],
                    errors=[],
                    confidence_score=classification.confidence
                )

            # STEP 10 & 11: Document Chunking & Summaries
            supabase_worker.send_heartbeat(job_id, worker_id, stage="chunking_and_summarizing")
            chunks = DocumentChunker.chunk_pages(pages)
            summary = DocumentSummarizer.summarize_chunks(chunks)

            # STEP 12 & 13: Persist results, update verification & processing statuses
            supabase_worker.send_heartbeat(job_id, worker_id, stage="persisting")
            ResultPersistence.persist_results(
                document_id=document_id,
                user_id=user_id,
                category=category,
                extraction=extraction,
                validation=validation,
                summary=summary,
                chunks=chunks,
                total_pages=total_pages
            )

            # Mark job completed
            supabase_worker.update_job_status(
                job_id=job_id,
                status="completed",
                current_stage="completed"
            )
            logger.info(f"Job {job_id} completed successfully for document {document_id}")

        except Exception as e:
            err_msg = str(e)
            stack = traceback.format_exc()
            logger.error(f"Job {job_id} failed with error: {err_msg}\n{stack}")

            # Mark job failed
            supabase_worker.update_job_status(
                job_id=job_id,
                status="failed",
                current_stage="failed",
                error_code="PROCESSING_ERROR",
                error_message=err_msg
            )

            # Mark document failed
            try:
                supabase_worker.client.table("documents").update({
                    "processing_status": "failed"
                }).eq("id", document_id).execute()
            except Exception as update_err:
                logger.error(f"Failed to update document status to failed: {update_err}")

