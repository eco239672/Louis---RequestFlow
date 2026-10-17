ALTER TABLE work_requests
    DROP CONSTRAINT work_requests_status_check;

ALTER TABLE work_requests
    ADD CONSTRAINT work_requests_status_check
    CHECK (status IN ('new', 'approved', 'rejected', 'in_progress', 'waiting', 'resolved', 'completed', 'cancelled'));
