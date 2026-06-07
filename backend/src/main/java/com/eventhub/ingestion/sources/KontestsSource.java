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
 * kontests.net aggregator (free, no key): https://kontests.net/api/v1/all
 *
 * This upstream is historically flaky; when it is unreachable this source
 * throws and the {@link com.eventhub.ingestion.IngestionService} records a
 * FAILED job for it without affecting other sources.
 */
@Component
public class KontestsSource implements EventSource {

    private static final String NAME = "KONTESTS";
    private static final String URL = "https://kontests.net/api/v1/all";

    private final RestClient restClient;

    public KontestsSource(RestClient ingestionRestClient) {
        this.restClient = ingestionRestClient;
    }

    @Override
    public String name() {
        return NAME;
    }

    @Override
    public List<RawEvent> fetch() {
        Contest[] contests = restClient.get().uri(URL).retrieve().body(Contest[].class);
        if (contests == null) {
            throw new IllegalStateException("Empty kontests response");
        }
        List<RawEvent> events = new ArrayList<>();
        for (Contest c : contests) {
            if (c.name() == null || c.start_time() == null) {
                continue;
            }
            Instant start;
            Instant end;
            try {
                start = Instant.parse(c.start_time());
                end = c.end_time() != null ? Instant.parse(c.end_time()) : null;
            } catch (Exception e) {
                continue;
            }
            String site = c.site() == null ? "kontests" : c.site();
            String sourceEventId = trim(site + ":" + c.name() + ":" + c.start_time());
            events.add(new RawEvent(
                    NAME,
                    sourceEventId,
                    c.name(),
                    "Contest on " + site + ".",
                    Category.CODING_CONTEST,
                    site,
                    start,
                    end,
                    c.url(),
                    null,
                    true,
                    Set.of("competitive-programming", site.toLowerCase())
            ));
        }
        return events;
    }

    private static String trim(String value) {
        return value.length() > 255 ? value.substring(0, 255) : value;
    }

    private record Contest(
            String name,
            String url,
            String start_time,
            String end_time,
            String site
    ) {
    }
}
