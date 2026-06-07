package com.eventhub.bookmark;

import com.eventhub.auth.security.CurrentUser;
import com.eventhub.common.PageResponse;
import com.eventhub.event.dto.EventSummary;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookmarks")
public class BookmarkController {

    private final BookmarkService bookmarkService;

    public BookmarkController(BookmarkService bookmarkService) {
        this.bookmarkService = bookmarkService;
    }

    @GetMapping
    public PageResponse<EventSummary> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return PageResponse.of(bookmarkService.list(CurrentUser.id(), page, size), s -> s);
    }

    @PutMapping("/{eventId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void add(@PathVariable Long eventId) {
        bookmarkService.add(CurrentUser.id(), eventId);
    }

    @DeleteMapping("/{eventId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@PathVariable Long eventId) {
        bookmarkService.remove(CurrentUser.id(), eventId);
    }
}
