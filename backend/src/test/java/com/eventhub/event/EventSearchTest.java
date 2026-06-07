package com.eventhub.event;

import com.eventhub.support.IntegrationTest;
import com.eventhub.support.TestFixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.Instant;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class EventSearchTest extends IntegrationTest {

    @Autowired EventRepository events;
    @Autowired JdbcTemplate jdbc;

    private static final Instant FUTURE = Instant.now().plusSeconds(7 * 24 * 3600);
    private static final Instant PAST = Instant.now().minusSeconds(7 * 24 * 3600);

    @BeforeEach
    void seed() {
        jdbc.execute("TRUNCATE events RESTART IDENTITY CASCADE");
        events.save(TestFixtures.event("CF", "1", "Codeforces Round 1000",
                Category.CODING_CONTEST, FUTURE, Set.of("competitive-programming")));
        events.save(TestFixtures.event("CONFSTECH", "2", "PyCon Europe",
                Category.CONFERENCE, FUTURE, Set.of("python")));
        events.save(TestFixtures.event("CONFSTECH", "3", "RustConf",
                Category.CONFERENCE, FUTURE.plusSeconds(86400), Set.of("rust")));
        var past = TestFixtures.event("CONFSTECH", "4", "Old PyCon",
                Category.CONFERENCE, PAST, Set.of("python"));
        past.setStatus(EventStatus.PAST);
        events.save(past);
    }

    private EventSearchCriteria criteria(String q, Category category, boolean upcomingOnly,
                                         Boolean online, Instant from, Instant to, List<String> tags) {
        return new EventSearchCriteria(q, category, upcomingOnly, online, from, to, tags);
    }

    @Test
    void fullTextSearchMatchesTitleTokens() {
        var page = events.search(criteria("pycon", null, true, null, null, null, null),
                PageRequest.of(0, 20));
        assertThat(page.getContent()).extracting(Event::getTitle).containsExactly("PyCon Europe");
    }

    @Test
    void categoryFilter() {
        var page = events.search(criteria(null, Category.CODING_CONTEST, true, null, null, null, null),
                PageRequest.of(0, 20));
        assertThat(page.getTotalElements()).isEqualTo(1);
        assertThat(page.getContent().get(0).getTitle()).isEqualTo("Codeforces Round 1000");
    }

    @Test
    void upcomingOnlyExcludesPastEvents() {
        long upcoming = events.search(criteria(null, null, true, null, null, null, null),
                PageRequest.of(0, 20)).getTotalElements();
        long all = events.search(criteria(null, null, false, null, null, null, null),
                PageRequest.of(0, 20)).getTotalElements();
        assertThat(upcoming).isEqualTo(3);
        assertThat(all).isEqualTo(4);
    }

    @Test
    void tagFilterAnyMatch() {
        var page = events.search(criteria(null, null, true, null, null, null, List.of("python")),
                PageRequest.of(0, 20));
        assertThat(page.getContent()).extracting(Event::getTitle).containsExactly("PyCon Europe");
    }

    @Test
    void dateRangeFilter() {
        var page = events.search(
                criteria(null, null, true, null, FUTURE.plusSeconds(3600), null, null),
                PageRequest.of(0, 20));
        // Only the event starting a day later than FUTURE.
        assertThat(page.getContent()).extracting(Event::getTitle).containsExactly("RustConf");
    }

    @Test
    void combinedFiltersCompose() {
        var page = events.search(
                criteria("pycon", Category.CONFERENCE, true, true, null, null, List.of("python")),
                PageRequest.of(0, 20));
        assertThat(page.getContent()).extracting(Event::getTitle).containsExactly("PyCon Europe");
    }
}
