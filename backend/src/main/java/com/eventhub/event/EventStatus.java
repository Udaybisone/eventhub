package com.eventhub.event;

/**
 * Lifecycle status of an event relative to the current time.
 * Recomputed by the ingestion job and on read.
 */
public enum EventStatus {
    UPCOMING,
    ONGOING,
    PAST
}
