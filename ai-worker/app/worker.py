import time
import signal
import sys
import logging
from app.config import settings
from app.supabase_client import supabase_worker
from app.job_runner import JobRunner

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='{"time":"%(asctime)s", "level":"%(levelname)s", "worker":"%(name)s", "message":"%(message)s"}',
    datefmt="%Y-%m-%dT%H:%M:%SZ"
)
logger = logging.getLogger("veridoc-worker")

class WorkerDaemon:
    def __init__(self):
        self.running = True
        self.worker_id = settings.WORKER_ID
        self.poll_interval = settings.JOB_POLL_INTERVAL_SECONDS

        # Register termination signal handlers
        signal.signal(signal.SIGTERM, self._handle_termination)
        signal.signal(signal.SIGINT, self._handle_termination)

    def _handle_termination(self, signum, frame):
        logger.info(f"Termination signal {signum} received. Finishing active cycles and shutting down gracefully...")
        self.running = False

    def run(self):
        logger.info(f"Starting VeriDoc AI Background Worker [{self.worker_id}]")
        logger.info(f"Polling interval: {self.poll_interval}s, Storage bucket: {settings.SUPABASE_STORAGE_BUCKET}")

        consecutive_errors = 0

        while self.running:
            try:
                # Attempt to atomically claim one available job
                job = supabase_worker.claim_job(self.worker_id)

                if job:
                    consecutive_errors = 0
                    logger.info(f"Claimed job {job['id']} for document {job['document_id']} (attempt #{job['attempt_count']})")
                    JobRunner.process_job(job, self.worker_id)
                else:
                    # No pending job; sleep for configured interval
                    time.sleep(self.poll_interval)

            except Exception as e:
                consecutive_errors += 1
                logger.error(f"Worker main loop error: {e}")
                backoff = min(30, self.poll_interval * (2 ** min(consecutive_errors, 4)))
                time.sleep(backoff)

        logger.info(f"Worker [{self.worker_id}] terminated cleanly.")
        sys.exit(0)

if __name__ == "__main__":
    worker = WorkerDaemon()
    worker.run()

