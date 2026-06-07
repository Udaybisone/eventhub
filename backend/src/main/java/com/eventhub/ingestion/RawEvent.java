package com.eventhub.ingestion;

import com.eventhub.event.Category;

import java.time.Instant;
import java.util.Set;

/**
 * Source-agnostic intermediate representation produced by an {@link EventSource}
 * before validation, dedup, and persistence. Sources are responsible only for
 * mapping their native payload into this shape.
 */
public record RawEvent(
        String source,
        String sourceEventId,
        String title,
        String description,
        Category category,
        String organizer,
        Instant startDateTime,
        Instant endDateTime,
        String registrationUrl,
        String location,
        boolean online,
        Set<String> tags
) {
}
