package com.eventhub.event;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Builds a parameterized native query combining Postgres full-text search
 * (search_vector @@ websearch_to_tsquery) with optional structured filters.
 * Results are ranked by ts_rank when a query term is present, otherwise by
 * start time. All user input is bound as parameters (no string concatenation
 * of values) to avoid SQL injection.
 */
public class EventSearchRepositoryImpl implements EventSearchRepository {

    @PersistenceContext
    private EntityManager em;

    @Override
    public Page<Event> search(EventSearchCriteria c, Pageable pageable) {
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        Map<String, Object> params = new java.util.HashMap<>();

        if (c.hasText()) {
            where.append(" AND e.search_vector @@ websearch_to_tsquery('english', :q)");
            params.put("q", c.q());
        }
        if (c.category() != null) {
            where.append(" AND e.category = :category");
            params.put("category", c.category().name());
        }
        if (c.upcomingOnly()) {
            where.append(" AND e.status <> 'PAST'");
        }
        if (c.online() != null) {
            where.append(" AND e.online = :online");
            params.put("online", c.online());
        }
        if (c.from() != null) {
            where.append(" AND e.start_date_time >= :from");
            params.put("from", java.sql.Timestamp.from(c.from()));
        }
        if (c.to() != null) {
            where.append(" AND e.start_date_time <= :to");
            params.put("to", java.sql.Timestamp.from(c.to()));
        }
        if (c.hasTags()) {
            where.append(" AND EXISTS (SELECT 1 FROM event_tags t"
                    + " WHERE t.event_id = e.id AND t.tag IN (:tags))");
            params.put("tags", c.tags());
        }

        String orderBy = c.hasText()
                ? " ORDER BY ts_rank(e.search_vector, websearch_to_tsquery('english', :q)) DESC,"
                  + " e.start_date_time ASC"
                : " ORDER BY e.start_date_time ASC";

        Query dataQuery = em.createNativeQuery(
                "SELECT e.* FROM events e" + where + orderBy, Event.class);
        Query countQuery = em.createNativeQuery(
                "SELECT count(*) FROM events e" + where);

        params.forEach((k, v) -> {
            dataQuery.setParameter(k, v);
            countQuery.setParameter(k, v);
        });

        dataQuery.setFirstResult((int) pageable.getOffset());
        dataQuery.setMaxResults(pageable.getPageSize());

        @SuppressWarnings("unchecked")
        List<Event> content = dataQuery.getResultList();
        long total = ((Number) countQuery.getSingleResult()).longValue();

        return new PageImpl<>(new ArrayList<>(content), pageable, total);
    }
}
