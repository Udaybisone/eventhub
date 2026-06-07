package com.eventhub.event;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
}
