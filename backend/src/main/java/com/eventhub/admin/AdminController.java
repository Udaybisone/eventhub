package com.eventhub.admin;

import com.eventhub.common.PageResponse;
import com.eventhub.event.dto.EventDetail;
import com.eventhub.event.dto.EventSummary;
import com.eventhub.ingestion.IngestionJob;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

/**
 * Admin-only management API. Access is restricted to ROLE_ADMIN by SecurityConfig
 * (/api/admin/**).
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/events")
    public PageResponse<EventSummary> listEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return PageResponse.of(adminService.listEvents(page, size), s -> s);
    }

    @PutMapping("/events/{id}")
    public EventDetail updateEvent(@PathVariable Long id, @RequestBody AdminEventUpdate update) {
        return adminService.updateEvent(id, update);
    }

    @DeleteMapping("/events/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEvent(@PathVariable Long id) {
        adminService.deleteEvent(id);
    }

    @GetMapping("/ingestion-jobs")
    public PageResponse<IngestionJobView> listIngestionJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return PageResponse.of(adminService.listIngestionJobs(page, size), IngestionJobView::from);
    }

    public record IngestionJobView(
            Long id,
            String source,
            String status,
            Instant startedAt,
            Instant finishedAt,
            int fetched,
            int inserted,
            int updated,
            int skipped,
            String errorMessage
    ) {
        static IngestionJobView from(IngestionJob j) {
            return new IngestionJobView(
                    j.getId(), j.getSource(), j.getStatus().name(),
                    j.getStartedAt(), j.getFinishedAt(),
                    j.getFetched(), j.getInserted(), j.getUpdated(), j.getSkipped(),
                    j.getErrorMessage());
        }
    }
}
