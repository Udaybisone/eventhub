package com.eventhub.bookmark;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {

    boolean existsByUserIdAndEventId(Long userId, Long eventId);

    @Transactional
    long deleteByUserIdAndEventId(Long userId, Long eventId);
}
