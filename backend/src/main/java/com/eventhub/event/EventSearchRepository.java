package com.eventhub.event;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/** Custom repository fragment for dynamic full-text + filter queries. */
public interface EventSearchRepository {

    Page<Event> search(EventSearchCriteria criteria, Pageable pageable);
}
