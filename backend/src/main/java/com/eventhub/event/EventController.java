package com.eventhub.event;

import com.eventhub.common.PageResponse;
import com.eventhub.event.dto.EventDetail;
import com.eventhub.event.dto.EventSummary;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    /**
     * Browse / search events. All filters are optional and combinable:
     *   q (full-text), category, online, from/to (start window), tags (any-match).
     */
    @GetMapping
    public PageResponse<EventSummary> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Category category,
            @RequestParam(defaultValue = "true") boolean upcomingOnly,
            @RequestParam(required = false) Boolean online,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(required = false) List<String> tags,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        var criteria = new EventSearchCriteria(q, category, upcomingOnly, online, from, to, tags);
        return PageResponse.of(eventService.search(criteria, page, size), s -> s);
    }

    @GetMapping("/{id}")
    public EventDetail get(@PathVariable Long id) {
        return eventService.get(id);
    }
}
