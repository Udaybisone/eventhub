package com.eventhub.support;

import com.eventhub.event.Category;
import com.eventhub.event.Event;
import com.eventhub.event.EventStatus;
import com.eventhub.ingestion.DedupHasher;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

/** Builders for test events. */
public final class TestFixtures {

    private TestFixtures() {
    }

    public static Event event(String source, String sourceEventId, String title,
                              Category category, Instant start, Set<String> tags) {
        Event e = new Event();
        e.setSource(source);
        e.setSourceEventId(sourceEventId);
        e.setTitle(title);
        e.setCategory(category);
        e.setOrganizer("Test Org");
        e.setStartDateTime(start);
        e.setEndDateTime(start.plusSeconds(3600));
        e.setOnline(true);
        e.setTags(new LinkedHashSet<>(tags));
        e.setDedupHash(DedupHasher.hash(title, start));
        e.setStatus(start.isAfter(Instant.now()) ? EventStatus.UPCOMING : EventStatus.ONGOING);
        return e;
    }
}
