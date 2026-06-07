package com.eventhub.ingestion;

import com.eventhub.event.Category;
import com.eventhub.event.EventRepository;
import com.eventhub.support.IntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class IngestionTest extends IntegrationTest {

    @Autowired SourceIngestor sourceIngestor;
    @Autowired IngestionJobRepository jobRepository;
    @Autowired EventRepository eventRepository;
    @Autowired JdbcTemplate jdbc;

    private static final Instant FUTURE = Instant.now().plusSeconds(7 * 24 * 3600);

    @BeforeEach
    void clean() {
        jdbc.execute("TRUNCATE events, ingestion_jobs RESTART IDENTITY CASCADE");
    }

    private RawEvent raw(String source, String id, String title, Instant start) {
        Instant end = start == null ? null : start.plusSeconds(3600);
        return new RawEvent(source, id, title, "desc", Category.CODING_CONTEST, "Org",
                start, end, "https://x", null, true, Set.of("tag"));
    }

    @Test
    void insertsThenUpdatesOnReingest_noDuplicates() {
        Set<String> seen = new HashSet<>();
        var first = sourceIngestor.process(List.of(raw("CF", "1", "Round 1", FUTURE)), seen);
        assertThat(first.inserted).isEqualTo(1);
        assertThat(first.updated).isZero();

        // Re-ingest same source event id -> update, not insert.
        var second = sourceIngestor.process(List.of(raw("CF", "1", "Round 1", FUTURE)), new HashSet<>());
        assertThat(second.inserted).isZero();
        assertThat(second.updated).isEqualTo(1);

        assertThat(eventRepository.count()).isEqualTo(1);
    }

    @Test
    void skipsCrossSourceDuplicateByDedupHash() {
        Set<String> seen = new HashSet<>();
        // Same title + same hour from two different sources -> second is skipped.
        var counts = sourceIngestor.process(List.of(
                raw("CF", "1", "Weekly Contest", FUTURE),
                raw("KONTESTS", "k1", "weekly contest", FUTURE)), seen);

        assertThat(counts.inserted).isEqualTo(1);
        assertThat(counts.skipped).isEqualTo(1);
        assertThat(eventRepository.count()).isEqualTo(1);
    }

    @Test
    void validationDropsEventsMissingTitleOrStart() {
        Set<String> seen = new HashSet<>();
        var counts = sourceIngestor.process(List.of(
                raw("CF", "1", "  ", FUTURE),          // blank title
                raw("CF", "2", "Valid", null)),         // null start
                seen);
        assertThat(counts.inserted).isZero();
        assertThat(eventRepository.count()).isZero();
    }

    @Test
    void orchestratorIsolatesFailingSourceAndLogsJobs() {
        EventSource ok = new EventSource() {
            public String name() { return "OK"; }
            public List<RawEvent> fetch() { return List.of(raw("OK", "1", "Good Event", FUTURE)); }
        };
        EventSource boom = new EventSource() {
            public String name() { return "BOOM"; }
            public List<RawEvent> fetch() { throw new RuntimeException("upstream down"); }
        };

        var service = new IngestionService(List.of(ok, boom), sourceIngestor, jobRepository);
        var jobs = service.ingestAll();

        assertThat(jobs).hasSize(2);
        assertThat(jobs).anyMatch(j -> j.getSource().equals("OK")
                && j.getStatus() == IngestionJobStatus.SUCCESS && j.getInserted() == 1);
        assertThat(jobs).anyMatch(j -> j.getSource().equals("BOOM")
                && j.getStatus() == IngestionJobStatus.FAILED
                && j.getErrorMessage().contains("upstream down"));
        // The good source still persisted despite the other failing.
        assertThat(eventRepository.count()).isEqualTo(1);
    }
}
