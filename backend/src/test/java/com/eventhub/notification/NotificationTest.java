package com.eventhub.notification;

import com.eventhub.auth.Role;
import com.eventhub.auth.User;
import com.eventhub.auth.UserRepository;
import com.eventhub.bookmark.Bookmark;
import com.eventhub.bookmark.BookmarkRepository;
import com.eventhub.event.Category;
import com.eventhub.event.EventRepository;
import com.eventhub.support.IntegrationTest;
import com.eventhub.support.RecordingEmailClient;
import com.eventhub.support.TestFixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.Instant;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class NotificationTest extends IntegrationTest {

    @Autowired NotificationService notificationService;
    @Autowired NotificationRepository notifications;
    @Autowired UserRepository users;
    @Autowired EventRepository events;
    @Autowired BookmarkRepository bookmarks;
    @Autowired RecordingEmailClient email;
    @Autowired JdbcTemplate jdbc;

    @BeforeEach
    void setup() {
        jdbc.execute("TRUNCATE events, users, ingestion_jobs RESTART IDENTITY CASCADE");
        email.clear();
    }

    @Test
    void dispatchesBothRemindersOnceForBookmarkedNearFutureEvent() {
        Long userId = users.save(new User("r@test.com", "x", Role.USER)).getId();
        // Starts within the hour -> both 24h and 1h windows include it.
        Long eventId = events.save(TestFixtures.event("CF", "1", "Soon Event",
                Category.CODING_CONTEST, Instant.now().plusSeconds(1800), Set.of("tag"))).getId();
        bookmarks.save(new Bookmark(userId, eventId));

        int firstRun = notificationService.dispatchDueReminders();
        assertThat(firstRun).isEqualTo(2); // REMINDER_24H + REMINDER_1H
        assertThat(email.sent()).hasSize(2);

        int secondRun = notificationService.dispatchDueReminders();
        assertThat(secondRun).isZero(); // idempotent
        assertThat(email.sent()).hasSize(2);

        assertThat(notifications.existsByUserIdAndEventIdAndType(
                userId, eventId, NotificationType.REMINDER_24H)).isTrue();
        assertThat(notifications.existsByUserIdAndEventIdAndType(
                userId, eventId, NotificationType.REMINDER_1H)).isTrue();
    }

    @Test
    void doesNotRemindForUnbookmarkedOrFarFutureEvents() {
        Long userId = users.save(new User("s@test.com", "x", Role.USER)).getId();
        // Far-future event, bookmarked: outside both windows.
        Long farEvent = events.save(TestFixtures.event("CF", "2", "Far Event",
                Category.CODING_CONTEST, Instant.now().plusSeconds(10 * 24 * 3600), Set.of("tag"))).getId();
        bookmarks.save(new Bookmark(userId, farEvent));
        // Near event, NOT bookmarked.
        events.save(TestFixtures.event("CF", "3", "Near Unbookmarked",
                Category.CODING_CONTEST, Instant.now().plusSeconds(1800), Set.of("tag")));

        assertThat(notificationService.dispatchDueReminders()).isZero();
        assertThat(email.sent()).isEmpty();
    }
}
