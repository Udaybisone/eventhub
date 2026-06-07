package com.eventhub.bookmark;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "bookmarks",
        uniqueConstraints = @UniqueConstraint(name = "uq_bookmark_user_event",
                columnNames = {"user_id", "event_id"}))
public class Bookmark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Bookmark() {
    }

    public Bookmark(Long userId, Long eventId) {
        this.userId = userId;
        this.eventId = eventId;
    }

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public Long getEventId() { return eventId; }
}
