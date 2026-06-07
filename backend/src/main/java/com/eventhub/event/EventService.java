package com.eventhub.event;

import com.eventhub.event.dto.EventDetail;
import com.eventhub.event.dto.EventSummary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@Transactional(readOnly = true)
public class EventService {

    private static final int MAX_PAGE_SIZE = 100;

    private final EventRepository eventRepository;

    public EventService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    public Page<EventSummary> search(EventSearchCriteria criteria, int page, int size) {
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        var pageable = PageRequest.of(Math.max(page, 0), safeSize);
        return eventRepository.search(criteria, pageable).map(EventSummary::from);
    }

    public EventDetail get(Long id) {
        return eventRepository.findById(id)
                .map(EventDetail::from)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Event not found"));
    }
}
