package com.eventhub.ingestion.sources;

import com.eventhub.event.Category;
import com.eventhub.ingestion.EventSource;
import com.eventhub.ingestion.RawEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * clist.by aggregator API (free with a registered account, rate-limited).
 * Requires app.clist.username + app.clist.api-key; when unset this source is
 * disabled and skipped (no error), matching the "free, optional" design.
 */
@Component
public class ClistSource implements EventSource {

    private static final Logger log = LoggerFactory.getLogger(ClistSource.class);

    private static final String NAME = "CLIST";

    private final RestClient restClient;
    private final String username;
    private final String apiKey;

    public ClistSource(RestClient ingestionRestClient,
                       @Value("${app.clist.username:}") String username,
                       @Value("${app.clist.api-key:}") String apiKey) {
        this.restClient = ingestionRestClient;
        this.username = username;
        this.apiKey = apiKey;
    }

    @Override
    public String name() {
        return NAME;
    }

    @Override
    public boolean enabled() {
        return !username.isBlank() && !apiKey.isBlank();
    }

    @Override
    public List<RawEvent> fetch() {
        if (!enabled()) {
            log.info("CLIST disabled (no credentials configured); skipping");
            return List.of();
        }
        String url = "https://clist.by/api/v4/contest/?upcoming=true&limit=200"
                + "&username=" + username + "&api_key=" + apiKey;

        ClistResponse response = restClient.get().uri(url).retrieve().body(ClistResponse.class);
        if (response == null || response.objects() == null) {
            throw new IllegalStateException("Empty clist response");
        }
        List<RawEvent> events = new ArrayList<>();
        for (ClistContest c : response.objects()) {
            if (c.event() == null || c.start() == null) {
                continue;
            }
            Instant start;
            Instant end;
            try {
                start = LocalDateTime.parse(c.start()).toInstant(ZoneOffset.UTC);
                end = c.end() != null ? LocalDateTime.parse(c.end()).toInstant(ZoneOffset.UTC) : null;
            } catch (Exception e) {
                continue;
            }
            String host = c.host() == null ? "clist" : c.host();
            events.add(new RawEvent(
                    NAME,
                    String.valueOf(c.id()),
                    c.event(),
                    "Contest on " + host + ".",
                    Category.CODING_CONTEST,
                    host,
                    start,
                    end,
                    c.href(),
                    null,
                    true,
                    Set.of("competitive-programming", host.toLowerCase())
            ));
        }
        return events;
    }

    private record ClistResponse(List<ClistContest> objects) {
    }

    private record ClistContest(
            Long id,
            String event,
            String href,
            String host,
            String start,
            String end
    ) {
    }
}
