package com.eventhub.ingestion;

import com.eventhub.event.Event;
import com.eventhub.event.EventRepository;
import com.eventhub.event.EventStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Persists one source's {@link RawEvent}s in a single transaction:
 * validate -> dedup -> upsert. Isolated per source so a mid-source failure
 * rolls back only that source's writes.
 */
@Component
public class SourceIngestor {

    private final EventRepository eventRepository;

    public SourceIngestor(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    @Transactional
    public IngestionCounts process(List<RawEvent> rawEvents, Set<String> seenHashesThisRun) {
        IngestionCounts counts = new IngestionCounts();
        Instant now = Instant.now();

        for (RawEvent raw : rawEvents) {
            // Validate.
            if (raw.title() == null || raw.title().isBlank() || raw.startDateTime() == null) {
                continue;
            }
            counts.fetched++;

            String dedupHash = DedupHasher.hash(raw.title(), raw.startDateTime());

            Event existing = eventRepository
                    .findBySourceAndSourceEventId(raw.source(), raw.sourceEventId())
                    .orElse(null);

            if (existing != null) {
                applyFields(existing, raw, dedupHash, now);
                eventRepository.save(existing);
                counts.updated++;
                seenHashesThisRun.add(dedupHash);
                continue;
            }

            // Cross-source duplicate: same event already seen this run or already stored.
            if (seenHashesThisRun.contains(dedupHash) || eventRepository.existsByDedupHash(dedupHash)) {
                counts.skipped++;
                continue;
            }

            Event event = new Event();
            event.setSource(raw.source());
            event.setSourceEventId(raw.sourceEventId());
            applyFields(event, raw, dedupHash, now);
            eventRepository.save(event);
            counts.inserted++;
            seenHashesThisRun.add(dedupHash);
        }
        return counts;
    }

    private void applyFields(Event event, RawEvent raw, String dedupHash, Instant now) {
        event.setTitle(raw.title());
        event.setDescription(raw.description());
        event.setCategory(raw.category());
        event.setOrganizer(raw.organizer());
        event.setStartDateTime(raw.startDateTime());
        event.setEndDateTime(raw.endDateTime());
        event.setRegistrationUrl(raw.registrationUrl());
        event.setLocation(raw.location());
        event.setOnline(raw.online());
        // Defensive mutable copy: sources may pass immutable Set.of(...), which
        // Hibernate cannot manage as an @ElementCollection.
        event.setTags(new LinkedHashSet<>(raw.tags()));
        event.setDedupHash(dedupHash);
        event.setStatus(computeStatus(raw.startDateTime(), raw.endDateTime(), now));
    }

    static EventStatus computeStatus(Instant start, Instant end, Instant now) {
        if (start != null && start.isAfter(now)) {
            return EventStatus.UPCOMING;
        }
        if (end != null && end.isBefore(now)) {
            return EventStatus.PAST;
        }
        // Started, not yet ended (or unknown end while started today).
        return end == null && start.isBefore(now.minusSeconds(86_400))
                ? EventStatus.PAST
                : EventStatus.ONGOING;
    }
}
