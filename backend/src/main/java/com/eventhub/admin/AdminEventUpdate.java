package com.eventhub.admin;

import com.eventhub.event.Category;

import java.time.Instant;
import java.util.Set;

/** Partial update for an event; null fields are left unchanged. */
public record AdminEventUpdate(
        String title,
        String description,
        Category category,
        String organizer,
        Instant startDateTime,
        Instant endDateTime,
        String registrationUrl,
        String location,
        Boolean online,
        Set<String> tags
) {
}
