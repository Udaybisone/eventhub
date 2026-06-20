package com.eventhub.event;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long>, EventSearchRepository {

    /** Primary single-source upsert lookup. */
    Optional<Event> findBySourceAndSourceEventId(String source, String sourceEventId);

    /** Cross-source duplicate check. */
    boolean existsByDedupHash(String dedupHash);

    /** Events bookmarked by a user, soonest first. */
    @Query("SELECT e FROM Event e WHERE e.id IN "
            + "(SELECT b.eventId FROM Bookmark b WHERE b.userId = :userId) "
            + "ORDER BY e.startDateTime ASC")
    Page<Event> findBookmarkedBy(@Param("userId") Long userId, Pageable pageable);

    // --- stats aggregates ---

    long countByStatusNot(EventStatus status);

    long countByStartDateTimeBetween(Instant from, Instant to);

    @Query("SELECT e.category, COUNT(e) FROM Event e WHERE e.status <> 'PAST' GROUP BY e.category")
    List<Object[]> countUpcomingByCategory();

    @Query("SELECT DISTINCT e.source FROM Event e ORDER BY e.source")
    List<String> findDistinctSources();
}
