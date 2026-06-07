package com.eventhub.notification;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * Records that a specific reminder was sent. The unique (user, event, type)
 * constraint is what guarantees a reminder is sent at most once.
 */
@Entity
@Table(name = "notifications",
        uniqueConstraints = @UniqueConstraint(name = "uq_notification_user_event_type",
                columnNames = {"user_id", "event_id", "type"}))
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationType type;

    @Column(name = "sent_at", nullable = false)
    private Instant sentAt;

    public Notification() {
    }

    public Notification(Long userId, Long eventId, NotificationType type, Instant sentAt) {
        this.userId = userId;
        this.eventId = eventId;
        this.type = type;
        this.sentAt = sentAt;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public Long getEventId() { return eventId; }
    public NotificationType getType() { return type; }
    public Instant getSentAt() { return sentAt; }
}
