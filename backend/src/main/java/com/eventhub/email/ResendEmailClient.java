package com.eventhub.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Sends email via the Resend HTTP API (free tier: 3k/month). Activated only when
 * app.email.resend.api-key is set; otherwise {@link LoggingEmailClient} is used.
 */
public class ResendEmailClient implements EmailClient {

    private static final Logger log = LoggerFactory.getLogger(ResendEmailClient.class);

    private final RestClient restClient;
    private final String apiKey;
    private final String from;

    public ResendEmailClient(RestClient restClient, String apiKey, String from) {
        this.restClient = restClient;
        this.apiKey = apiKey;
        this.from = from;
    }

    @Override
    public void send(String to, String subject, String body) {
        try {
            restClient.post()
                    .uri("https://api.resend.com/emails")
                    .header("Authorization", "Bearer " + apiKey)
                    .body(Map.of(
                            "from", from,
                            "to", to,
                            "subject", subject,
                            "html", body))
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            // Don't fail the caller's transaction on a delivery hiccup; reminders retry next run.
            log.warn("Resend delivery failed to {}: {}", to, e.getMessage());
        }
    }
}
