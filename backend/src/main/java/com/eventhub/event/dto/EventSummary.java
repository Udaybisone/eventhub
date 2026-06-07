package com.eventhub.event.dto;

import com.eventhub.event.Category;
import com.eventhub.event.Event;
import com.eventhub.event.EventStatus;

import java.time.Instant;
import java.util.Set;

/** Compact event representation for list/search results. */
public record EventSummary(
        Long id,
        String title,
        Category category,
        String source,
        String organizer,
        Instant startDateTime,
        Instant endDateTime,
        boolean online,
        String location,
        EventStatus status,
        Set<String> tags
) {
    public static EventSummary from(Event e) {
        return new EventSummary(
                e.getId(),
                e.getTitle(),
                e.getCategory(),
                e.getSource(),
                e.getOrganizer(),
                e.getStartDateTime(),
                e.getEndDateTime(),
                e.isOnline(),
                e.getLocation(),
                e.getStatus(),
                e.getTags()
        );
    }
}
