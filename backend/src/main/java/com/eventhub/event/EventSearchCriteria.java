package com.eventhub.event;

import java.time.Instant;
import java.util.List;

/**
 * Bundles the optional search/filter parameters for an event query.
 * Any null/blank field is treated as "no constraint".
 */
public record EventSearchCriteria(
        String q,
        Category category,
        boolean upcomingOnly,
        Boolean online,
        Instant from,
        Instant to,
        List<String> tags
) {
    public boolean hasText() {
        return q != null && !q.isBlank();
    }

    public boolean hasTags() {
        return tags != null && !tags.isEmpty();
    }
}
