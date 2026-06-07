package com.eventhub.admin;

import com.eventhub.event.Event;
import com.eventhub.event.EventRepository;
import com.eventhub.event.dto.EventDetail;
import com.eventhub.event.dto.EventSummary;
import com.eventhub.ingestion.IngestionJob;
import com.eventhub.ingestion.IngestionJobRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashSet;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class AdminService {

    private static final int MAX_PAGE_SIZE = 100;

    private final EventRepository events;
    private final IngestionJobRepository jobs;

    public AdminService(EventRepository events, IngestionJobRepository jobs) {
        this.events = events;
        this.jobs = jobs;
    }

    /** All events including past ones, newest start first, for management. */
    @Transactional(readOnly = true)
    public Page<EventSummary> listEvents(int page, int size) {
        var pageable = PageRequest.of(Math.max(page, 0), clampSize(size),
                Sort.by(Sort.Direction.DESC, "startDateTime"));
        return events.findAll(pageable).map(EventSummary::from);
    }

    @Transactional
    public EventDetail updateEvent(Long id, AdminEventUpdate update) {
        Event event = events.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Event not found"));

        if (update.title() != null) event.setTitle(update.title());
        if (update.description() != null) event.setDescription(update.description());
        if (update.category() != null) event.setCategory(update.category());
        if (update.organizer() != null) event.setOrganizer(update.organizer());
        if (update.startDateTime() != null) event.setStartDateTime(update.startDateTime());
        if (update.endDateTime() != null) event.setEndDateTime(update.endDateTime());
        if (update.registrationUrl() != null) event.setRegistrationUrl(update.registrationUrl());
        if (update.location() != null) event.setLocation(update.location());
        if (update.online() != null) event.setOnline(update.online());
        if (update.tags() != null) event.setTags(new LinkedHashSet<>(update.tags()));

        return EventDetail.from(events.save(event));
    }

    @Transactional
    public void deleteEvent(Long id) {
        if (!events.existsById(id)) {
            throw new ResponseStatusException(NOT_FOUND, "Event not found");
        }
        events.deleteById(id);
    }

    @Transactional(readOnly = true)
    public Page<IngestionJob> listIngestionJobs(int page, int size) {
        return jobs.findAllByOrderByStartedAtDesc(
                PageRequest.of(Math.max(page, 0), clampSize(size)));
    }

    private int clampSize(int size) {
        return Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
    }
}
