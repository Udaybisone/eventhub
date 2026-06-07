package com.eventhub.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    boolean existsByUserIdAndEventIdAndType(Long userId, Long eventId, NotificationType type);

    /**
     * Bookmarked events starting within (now, until] for which the given reminder
     * type has not yet been recorded. Returns rows of
     * [userId, eventId, email, title, startDateTime] — typed via the mapped entities.
     */
    @Query("""
            SELECT b.userId, b.eventId, u.email, e.title, e.startDateTime
            FROM Bookmark b, Event e, User u
            WHERE e.id = b.eventId AND u.id = b.userId
              AND e.startDateTime > :now AND e.startDateTime <= :until
              AND NOT EXISTS (
                  SELECT 1 FROM Notification n
                  WHERE n.userId = b.userId AND n.eventId = b.eventId AND n.type = :type)
            """)
    List<Object[]> findDueReminders(@Param("now") Instant now,
                                    @Param("until") Instant until,
                                    @Param("type") NotificationType type);
}
