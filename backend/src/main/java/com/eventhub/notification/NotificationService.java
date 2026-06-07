package com.eventhub.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * Dispatches event reminders. Intended to be invoked by external cron via the
 * internal endpoint, not an in-app timer (the free-tier host sleeps). Idempotent:
 * the unique (user, event, type) constraint guarantees each reminder sends once,
 * even if a run overlaps or retries.
 */
@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notifications;
    private final NotificationSender sender;

    public NotificationService(NotificationRepository notifications, NotificationSender sender) {
        this.notifications = notifications;
        this.sender = sender;
    }

    /** @return number of reminder emails sent this run. */
    public int dispatchDueReminders() {
        Instant now = Instant.now();
        int sent = 0;
        for (NotificationType type : NotificationType.values()) {
            sent += dispatchForType(type, now);
        }
        log.info("Reminder dispatch sent {} emails", sent);
        return sent;
    }

    private int dispatchForType(NotificationType type, Instant now) {
        Instant until = now.plus(type.leadTime());
        var due = notifications.findDueReminders(now, until, type);
        int sent = 0;
        for (Object[] row : due) {
            Long userId = (Long) row[0];
            Long eventId = (Long) row[1];
            String email = (String) row[2];
            String title = (String) row[3];
            Instant start = (Instant) row[4];
            if (sender.send(userId, eventId, type, email, title, start, now)) {
                sent++;
            }
        }
        return sent;
    }
}
