package com.eventhub.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class EmailConfig {

    private static final Logger log = LoggerFactory.getLogger(EmailConfig.class);

    /**
     * Uses Resend when an API key is configured, otherwise logs (free tier / dev / tests).
     * Selection is done in code rather than via @ConditionalOnProperty, because the
     * property is always present (defined empty in application.yml) and a conditional
     * would wrongly activate Resend with a blank key.
     */
    @Bean
    public EmailClient emailClient(
            @Value("${app.email.resend.api-key:}") String apiKey,
            @Value("${app.email.from}") String from) {
        if (apiKey != null && !apiKey.isBlank()) {
            log.info("Email: using Resend provider");
            return new ResendEmailClient(RestClient.create(), apiKey, from);
        }
        log.info("Email: no provider configured, logging messages instead");
        return new LoggingEmailClient();
    }
}
