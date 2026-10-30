import logging
from typing import Optional, Dict, Any, List
from supabase import create_client, Client
from app.config import settings

logger = logging.getLogger("veridoc-worker")

class SupabaseWorkerClient:
    def __init__(self):
        self.client: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY
        )
        self.bucket = settings.SUPABASE_STORAGE_BUCKET

    def download_document(self, storage_path: str) -> bytes:
        """Downloads document file from private Supabase Storage bucket."""
        try:
            res = self.client.storage.from_(self.bucket).download(storage_path)
            return res
        except Exception as e:
            logger.error(f"Error downloading document from storage '{storage_path}': {e}")
            raise

    def claim_job(self, worker_id: str) -> Optional[Dict[str, Any]]:
        """Invokes RPC claim_next_document_job atomically."""
        try:
            res = self.client.rpc("claim_next_document_job", {
                "p_worker_id": worker_id,
                "p_stale_minutes": settings.JOB_STALE_AFTER_MINUTES
            }).execute()

            if res.data and len(res.data) > 0:
                return res.data[0]
            return None
        except Exception as e:
            logger.error(f"Error calling claim_next_document_job: {e}")
            return None

    def send_heartbeat(self, job_id: str, worker_id: str, stage: Optional[str] = None) -> bool:
        """Sends heartbeat for active job."""
        try:
            res = self.client.rpc("update_job_heartbeat", {
                "p_job_id": job_id,
                "p_worker_id": worker_id,
                "p_current_stage": stage
            }).execute()
            return bool(res.data)
        except Exception as e:
            logger.warning(f"Failed to update job heartbeat: {e}")
            return False

    def update_job_status(
        self,
        job_id: str,
        status: str,
        current_stage: str,
        error_code: Optional[str] = None,
        error_message: Optional[str] = None
    ):
        """Updates document job status and error if failed."""
        payload: Dict[str, Any] = {
            "status": status,
            "current_stage": current_stage,
        }
        if status == "completed":
            import datetime
            payload["completed_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        if error_code:
            payload["last_error_code"] = error_code
        if error_message:
            payload["last_error_message"] = error_message[:1000]

        try:
            self.client.table("document_jobs").update(payload).eq("id", job_id).execute()
        except Exception as e:
            logger.error(f"Failed to update job {job_id} status: {e}")

supabase_worker = SupabaseWorkerClient()

