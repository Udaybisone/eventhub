package com.eventhub.ingestion.sources;

import com.eventhub.event.Category;
import com.eventhub.ingestion.EventSource;
import com.eventhub.ingestion.RawEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.time.Year;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * confs.tech open conference data, hosted as JSON in the tech-conferences/conference-data
 * GitHub repo (free, no key). One file per topic per year. Each topic file is fetched
 * independently; a missing file (404) for a topic/year is skipped, not fatal.
 */
@Component
public class ConfsTechSource implements EventSource {

    private static final Logger log = LoggerFactory.getLogger(ConfsTechSource.class);

    private static final String NAME = "CONFSTECH";
    private static final String BASE =
            "https://raw.githubusercontent.com/tech-conferences/conference-data/main/conferences/";

    // Representative topic set; "opensource" maps to the OPEN_SOURCE_EVENT category.
    private static final List<String> TOPICS = List.of(
            "general", "javascript", "typescript", "python", "java", "kotlin",
            "devops", "security", "data", "rust", "php", "android", "ios",
            "opensource", "testing", "api", "graphql"
    );

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public ConfsTechSource(RestClient ingestionRestClient, ObjectMapper objectMapper) {
        this.restClient = ingestionRestClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return NAME;
    }

    @Override
    public List<RawEvent> fetch() {
        int currentYear = Year.now().getValue();
        int[] years = {currentYear, currentYear + 1};
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        List<RawEvent> events = new ArrayList<>();
        int successfulFetches = 0;

        for (int year : years) {
            for (String topic : TOPICS) {
                String url = BASE + year + "/" + topic + ".json";
                try {
                    // raw.githubusercontent.com serves .json as text/plain, so parse explicitly.
                    String json = restClient.get().uri(url).retrieve().body(String.class);
                    Conf[] confs = json == null ? null : objectMapper.readValue(json, Conf[].class);
                    successfulFetches++;
                    if (confs == null) {
                        continue;
                    }
                    Category category = "opensource".equals(topic)
                            ? Category.OPEN_SOURCE_EVENT
                            : Category.CONFERENCE;
                    for (Conf c : confs) {
                        RawEvent raw = toRawEvent(c, topic, year, category, today);
                        if (raw != null) {
                            events.add(raw);
                        }
                    }
                } catch (Exception e) {
                    // Missing topic file for this year, or transient error: skip this file.
                    log.debug("confs.tech skip {}: {}", url, e.getMessage());
                }
            }
        }

        if (successfulFetches == 0) {
            throw new IllegalStateException("No confs.tech topic files could be fetched");
        }
        return events;
    }

    private RawEvent toRawEvent(Conf c, String topic, int year, Category category, LocalDate today) {
        if (c.name() == null || c.startDate() == null) {
            return null;
        }
        LocalDate startDate;
        try {
            startDate = LocalDate.parse(c.startDate());
        } catch (Exception e) {
            return null;
        }
        // Forward-looking feed only.
        if (startDate.isBefore(today)) {
            return null;
        }
        LocalDate endDate = c.endDate() != null ? safeParse(c.endDate()) : startDate;

        String sourceEventId = (topic + ":" + year + ":" + c.name());
        if (sourceEventId.length() > 255) {
            sourceEventId = sourceEventId.substring(0, 255);
        }

        String location = c.online()
                ? null
                : joinLocation(c.city(), c.country());

        Set<String> tags = new LinkedHashSet<>();
        tags.add(topic);
        if (c.locales() != null && !c.locales().isBlank()) {
            for (String locale : c.locales().split(",")) {
                tags.add(locale.trim().toLowerCase());
            }
        }

        return new RawEvent(
                NAME,
                sourceEventId,
                c.name(),
                null,
                category,
                null,
                startDate.atStartOfDay(ZoneOffset.UTC).toInstant(),
                (endDate != null ? endDate : startDate).atStartOfDay(ZoneOffset.UTC).toInstant(),
                c.url(),
                location,
                c.online(),
                tags
        );
    }

    private static LocalDate safeParse(String date) {
        try {
            return LocalDate.parse(date);
        } catch (Exception e) {
            return null;
        }
    }

    private static String joinLocation(String city, String country) {
        if (city != null && country != null) {
            return city + ", " + country;
        }
        return country != null ? country : city;
    }

    private record Conf(
            String name,
            String url,
            String startDate,
            String endDate,
            String city,
            String country,
            boolean online,
            String locales
    ) {
    }
}
