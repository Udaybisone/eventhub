package com.eventhub.ingestion;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Orchestrates ingestion across all registered {@link EventSource}s. Each source
 * runs independently: its work is recorded in an {@link IngestionJob}, and a
 * failure in one source is isolated and does not stop the others.
 *
 * Intentionally NOT transactional so the job log persists even when a source's
 * own (transactional) event upserts roll back.
 */
@Service
public class IngestionService {

    private static final Logger log = LoggerFactory.getLogger(IngestionService.class);

    private final List<EventSource> sources;
    private final SourceIngestor sourceIngestor;
    private final IngestionJobRepository jobRepository;

    public IngestionService(List<EventSource> sources,
                            SourceIngestor sourceIngestor,
                            IngestionJobRepository jobRepository) {
        this.sources = sources;
        this.sourceIngestor = sourceIngestor;
        this.jobRepository = jobRepository;
    }

    public List<IngestionJob> ingestAll() {
        List<IngestionJob> jobs = new ArrayList<>();
        // Shared across sources so a duplicate event from a second source is skipped.
        Set<String> seenHashesThisRun = new HashSet<>();

        for (EventSource source : sources) {
            if (!source.enabled()) {
                log.info("Source {} disabled; skipping", source.name());
                continue;
            }
            jobs.add(ingestOne(source, seenHashesThisRun));
        }
        return jobs;
    }

    private IngestionJob ingestOne(EventSource source, Set<String> seenHashesThisRun) {
        IngestionJob job = jobRepository.save(new IngestionJob(source.name(), Instant.now()));
        try {
            List<RawEvent> raw = source.fetch();
            IngestionCounts counts = sourceIngestor.process(raw, seenHashesThisRun);
            job.setFetched(counts.fetched);
            job.setInserted(counts.inserted);
            job.setUpdated(counts.updated);
            job.setSkipped(counts.skipped);
            job.markSuccess(Instant.now());
            log.info("Source {} OK: fetched={} inserted={} updated={} skipped={}",
                    source.name(), counts.fetched, counts.inserted, counts.updated, counts.skipped);
        } catch (Exception e) {
            String message = e.getClass().getSimpleName() + ": " + e.getMessage();
            job.markFailed(Instant.now(), message);
            log.warn("Source {} FAILED: {}", source.name(), message);
        }
        return jobRepository.save(job);
    }
}
