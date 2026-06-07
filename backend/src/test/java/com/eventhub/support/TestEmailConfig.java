package com.eventhub.support;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

/** Replaces the real EmailClient with a recording one across integration tests. */
@TestConfiguration
public class TestEmailConfig {

    @Bean
    @Primary
    public RecordingEmailClient recordingEmailClient() {
        return new RecordingEmailClient();
    }
}
