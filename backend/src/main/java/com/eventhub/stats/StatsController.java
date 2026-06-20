package com.eventhub.stats;

import com.eventhub.event.EventRepository;
import com.eventhub.event.EventStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Public, honest platform stats derived from real data — total events, how many
 * start in the next 7 days, the live source list, and per-category counts.
 */
@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final EventRepository events;

    public StatsController(EventRepository events) {
        this.events = events;
    }

    @GetMapping
    public StatsResponse stats() {
        Instant now = Instant.now();
        long upcoming = events.countByStatusNot(EventStatus.PAST);
        long thisWeek = events.countByStartDateTimeBetween(now, now.plus(Duration.ofDays(7)));

        Map<String, Long> byCategory = new LinkedHashMap<>();
        for (Object[] row : events.countUpcomingByCategory()) {
            byCategory.put(((Enum<?>) row[0]).name(), (Long) row[1]);
        }
        List<String> sources = events.findDistinctSources();

        return new StatsResponse(upcoming, thisWeek, sources.size(), sources, byCategory);
    }

    public record StatsResponse(
            long upcomingEvents,
            long startingThisWeek,
            int sourceCount,
            List<String> sources,
            Map<String, Long> categoryCounts
    ) {
    }
}
