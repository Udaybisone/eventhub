package com.eventhub.event.dto;

import com.eventhub.event.Category;
import com.eventhub.event.Event;
import com.eventhub.event.EventStatus;

import java.time.Instant;
import java.util.Set;

/** Full event representation for the details page. */
public record EventDetail(
        Long id,
        String title,
        String description,
        Category category,
        String source,
        String organizer,
        Instant startDateTime,
        Instant endDateTime,
        String registrationUrl,
        boolean online,
        String location,
        EventStatus status,
        Set<String> tags,
        Instant createdAt,
        Instant updatedAt
) {
    public static EventDetail from(Event e) {
        return new EventDetail(
                e.getId(),
                e.getTitle(),
                e.getDescription(),
                e.getCategory(),
                e.getSource(),
                e.getOrganizer(),
                e.getStartDateTime(),
                e.getEndDateTime(),
                e.getRegistrationUrl(),
                e.isOnline(),
                e.getLocation(),
                e.getStatus(),
                e.getTags(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }
}
