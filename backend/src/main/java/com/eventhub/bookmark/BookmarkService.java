package com.eventhub.bookmark;

import com.eventhub.event.EventRepository;
import com.eventhub.event.dto.EventSummary;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class BookmarkService {

    private static final int MAX_PAGE_SIZE = 100;

    private final BookmarkRepository bookmarks;
    private final EventRepository events;

    public BookmarkService(BookmarkRepository bookmarks, EventRepository events) {
        this.bookmarks = bookmarks;
        this.events = events;
    }

    /** Idempotent: saving an already-saved event is a no-op. */
    @Transactional
    public void add(Long userId, Long eventId) {
        if (!events.existsById(eventId)) {
            throw new ResponseStatusException(NOT_FOUND, "Event not found");
        }
        if (bookmarks.existsByUserIdAndEventId(userId, eventId)) {
            return;
        }
        try {
            bookmarks.save(new Bookmark(userId, eventId));
        } catch (DataIntegrityViolationException race) {
            // Concurrent insert hit the unique constraint; the bookmark exists, which is the goal.
        }
    }

    @Transactional
    public void remove(Long userId, Long eventId) {
        bookmarks.deleteByUserIdAndEventId(userId, eventId);
    }

    @Transactional(readOnly = true)
    public Page<EventSummary> list(Long userId, int page, int size) {
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        return events.findBookmarkedBy(userId, PageRequest.of(Math.max(page, 0), safeSize))
                .map(EventSummary::from);
    }
}
