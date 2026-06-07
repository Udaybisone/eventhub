package com.eventhub.ingestion.sources;

import com.eventhub.event.Category;
import com.eventhub.ingestion.EventSource;
import com.eventhub.ingestion.RawEvent;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Codeforces public API (free, no key): https://codeforces.com/api/contest.list
 * Only upcoming (BEFORE) and ongoing (CODING) contests are ingested.
 */
@Component
public class CodeforcesSource implements EventSource {

    private static final String NAME = "CODEFORCES";
    private static final String URL = "https://codeforces.com/api/contest.list?gym=false";

    private final RestClient restClient;

    public CodeforcesSource(RestClient ingestionRestClient) {
        this.restClient = ingestionRestClient;
    }

    @Override
    public String name() {
        return NAME;
    }

    @Override
    public List<RawEvent> fetch() {
        CfResponse response = restClient.get()
                .uri(URL)
                .retrieve()
                .body(CfResponse.class);

        if (response == null || !"OK".equals(response.status()) || response.result() == null) {
            throw new IllegalStateException("Unexpected Codeforces response status");
        }

        List<RawEvent> events = new ArrayList<>();
        for (CfContest c : response.result()) {
            if (c.startTimeSeconds() == null) {
                continue;
            }
            // Forward-looking feed: keep only upcoming and in-progress contests.
            if (!"BEFORE".equals(c.phase()) && !"CODING".equals(c.phase())) {
                continue;
            }
            Instant start = Instant.ofEpochSecond(c.startTimeSeconds());
            Instant end = c.durationSeconds() != null
                    ? start.plusSeconds(c.durationSeconds())
                    : null;
            events.add(new RawEvent(
                    NAME,
                    String.valueOf(c.id()),
                    c.name(),
                    "Codeforces " + (c.type() == null ? "" : c.type()) + " contest.",
                    Category.CODING_CONTEST,
                    "Codeforces",
                    start,
                    end,
                    "https://codeforces.com/contests/" + c.id(),
                    null,
                    true,
                    Set.of("codeforces", "competitive-programming")
            ));
        }
        return events;
    }

    private record CfResponse(String status, List<CfContest> result) {
    }

    private record CfContest(
            Long id,
            String name,
            String type,
            String phase,
            Long durationSeconds,
            Long startTimeSeconds
    ) {
    }
}
