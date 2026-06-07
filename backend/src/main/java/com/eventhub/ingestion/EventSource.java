package com.eventhub.ingestion;

import java.util.List;

/**
 * A pluggable external event provider. Each implementation fetches from one
 * upstream system and maps the payload into {@link RawEvent}s.
 *
 * Implementations should throw on a hard failure (network, parse) — the
 * {@link IngestionService} isolates the failure to that source and records it.
 * A source with nothing to contribute (e.g. missing API key) should log and
 * return an empty list rather than throw.
 */
public interface EventSource {

    /** Stable identifier stored on each event and ingestion job, e.g. "CODEFORCES". */
    String name();

    /** Whether this source is configured/enabled; disabled sources are skipped. */
    default boolean enabled() {
        return true;
    }

    List<RawEvent> fetch() throws Exception;
}
