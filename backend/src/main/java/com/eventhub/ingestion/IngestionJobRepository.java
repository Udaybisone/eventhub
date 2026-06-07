package com.eventhub.ingestion;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IngestionJobRepository extends JpaRepository<IngestionJob, Long> {

    Page<IngestionJob> findAllByOrderByStartedAtDesc(Pageable pageable);
}
