package com.eventhub.notification;

import com.eventhub.email.EmailClient;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Sends a single reminder in its own transaction (separate bean so the
 * transaction boundary is honored — self-invocation would bypass the proxy).
 */
@Component
public class NotificationSender {

    private final NotificationRepository notifications;
    private final EmailClient emailClient;

    public NotificationSender(NotificationRepository notifications, EmailClient emailClient) {
        this.notifications = notifications;
        this.emailClient = emailClient;
    }

    /** @return true if a reminder was recorded and sent; false if already sent. */
    @Transactional
    public boolean send(Long userId, Long eventId, NotificationType type,
                        String email, String title, Instant start, Instant now) {
        // Cheap pre-check; the unique constraint is the real guard against races.
        if (notifications.existsByUserIdAndEventIdAndType(userId, eventId, type)) {
            return false;
        }
        try {
            notifications.saveAndFlush(new Notification(userId, eventId, type, now));
        } catch (DataIntegrityViolationException race) {
            return false; // another run already recorded it
        }
        String lead = type == NotificationType.REMINDER_24H ? "24 hours" : "1 hour";
        emailClient.send(email,
                "Reminder: " + title + " starts in " + lead,
                "Your bookmarked event \"" + title + "\" starts at " + start + ".");
        return true;
    }
}
