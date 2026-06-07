package com.eventhub.internal;

import com.eventhub.ingestion.IngestionJob;
import com.eventhub.ingestion.IngestionService;
import com.eventhub.notification.NotificationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Trigger endpoints invoked by external cron (GitHub Actions / cron-job.org).
 *
 * Guarded by a shared secret: when app.internal.secret is set, requests must
 * carry a matching X-Internal-Secret header. When unset (local dev) the guard
 * is open.
 */
@RestController
@RequestMapping("/internal")
public class InternalController {

    private final IngestionService ingestionService;
    private final NotificationService notificationService;
    private final String secret;

    public InternalController(IngestionService ingestionService,
                              NotificationService notificationService,
                              @Value("${app.internal.secret:}") String secret) {
        this.ingestionService = ingestionService;
        this.notificationService = notificationService;
        this.secret = secret;
    }

    @PostMapping("/ingest")
    public ResponseEntity<?> ingest(
            @RequestHeader(value = "X-Internal-Secret", required = false) String provided) {
        if (!authorized(provided)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<IngestionJob> jobs = ingestionService.ingestAll();
        return ResponseEntity.ok(jobs.stream().map(JobSummary::from).toList());
    }

    @PostMapping("/notify")
    public ResponseEntity<?> notify(
            @RequestHeader(value = "X-Internal-Secret", required = false) String provided) {
        if (!authorized(provided)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        int sent = notificationService.dispatchDueReminders();
        return ResponseEntity.ok(Map.of("remindersSent", sent));
    }

    private boolean authorized(String provided) {
        if (secret.isBlank()) {
            return true; // dev mode: no secret configured
        }
        return secret.equals(provided);
    }

    private record JobSummary(
            String source,
            String status,
            int fetched,
            int inserted,
            int updated,
            int skipped,
            String errorMessage
    ) {
        static JobSummary from(IngestionJob job) {
            return new JobSummary(
                    job.getSource(),
                    job.getStatus().name(),
                    job.getFetched(),
                    job.getInserted(),
                    job.getUpdated(),
                    job.getSkipped(),
                    job.getErrorMessage()
            );
        }
    }
}
