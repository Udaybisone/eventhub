package com.eventhub.ingestion;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class DedupHasherTest {

    @Test
    void sameTitleAndHourProduceSameHash() {
        Instant a = Instant.parse("2026-06-07T10:15:00Z");
        Instant b = Instant.parse("2026-06-07T10:59:59Z"); // same hour bucket
        assertThat(DedupHasher.hash("Codeforces Round 1", a))
                .isEqualTo(DedupHasher.hash("codeforces round 1", b));
    }

    @Test
    void differentHourProducesDifferentHash() {
        Instant a = Instant.parse("2026-06-07T10:15:00Z");
        Instant b = Instant.parse("2026-06-07T11:15:00Z");
        assertThat(DedupHasher.hash("Same Title", a))
                .isNotEqualTo(DedupHasher.hash("Same Title", b));
    }

    @Test
    void differentTitleProducesDifferentHash() {
        Instant t = Instant.parse("2026-06-07T10:00:00Z");
        assertThat(DedupHasher.hash("Title A", t))
                .isNotEqualTo(DedupHasher.hash("Title B", t));
    }
}
