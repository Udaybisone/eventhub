package com.eventhub.notification;

import java.time.Duration;

/** Reminder lead times before an event starts (PRD FR-8). */
public enum NotificationType {
    REMINDER_24H(Duration.ofHours(24)),
    REMINDER_1H(Duration.ofHours(1));

    private final Duration leadTime;

    NotificationType(Duration leadTime) {
        this.leadTime = leadTime;
    }

    public Duration leadTime() {
        return leadTime;
    }
}
