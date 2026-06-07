package com.eventhub.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Default email client used when no provider is configured: logs the message
 * instead of sending. Keeps the whole flow testable and runnable for free.
 */
public class LoggingEmailClient implements EmailClient {

    private static final Logger log = LoggerFactory.getLogger(LoggingEmailClient.class);

    @Override
    public void send(String to, String subject, String body) {
        log.info("[EMAIL:noop] to={} subject={} body={}", to, subject, body);
    }
}
