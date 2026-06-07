package com.eventhub.ingestion;

import jakarta.persistence.*;

import java.time.Instant;

/** Persistent record of a single per-source ingestion run. */
@Entity
@Table(name = "ingestion_jobs")
public class IngestionJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String source;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private IngestionJobStatus status;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "finished_at")
    private Instant finishedAt;

    private int fetched;
    private int inserted;
    private int updated;
    private int skipped;

    @Column(name = "error_message", columnDefinition = "text")
    private String errorMessage;

    protected IngestionJob() {
    }

    public IngestionJob(String source, Instant startedAt) {
        this.source = source;
        this.startedAt = startedAt;
        this.status = IngestionJobStatus.RUNNING;
    }

    public void markSuccess(Instant finishedAt) {
        this.status = IngestionJobStatus.SUCCESS;
        this.finishedAt = finishedAt;
    }

    public void markFailed(Instant finishedAt, String errorMessage) {
        this.status = IngestionJobStatus.FAILED;
        this.finishedAt = finishedAt;
        this.errorMessage = errorMessage;
    }

    public Long getId() { return id; }
    public String getSource() { return source; }
    public IngestionJobStatus getStatus() { return status; }
    public Instant getStartedAt() { return startedAt; }
    public Instant getFinishedAt() { return finishedAt; }
    public int getFetched() { return fetched; }
    public int getInserted() { return inserted; }
    public int getUpdated() { return updated; }
    public int getSkipped() { return skipped; }
    public String getErrorMessage() { return errorMessage; }

    public void setFetched(int fetched) { this.fetched = fetched; }
    public void setInserted(int inserted) { this.inserted = inserted; }
    public void setUpdated(int updated) { this.updated = updated; }
    public void setSkipped(int skipped) { this.skipped = skipped; }
}
