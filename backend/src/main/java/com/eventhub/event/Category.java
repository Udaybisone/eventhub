package com.eventhub.event;

/**
 * Supported technical event categories (PRD section 8).
 * Used both as the "category" and the "event type" filter dimension.
 */
public enum Category {
    HACKATHON,
    CODING_CONTEST,
    WORKSHOP,
    WEBINAR,
    MEETUP,
    CONFERENCE,
    OPEN_SOURCE_EVENT
}
