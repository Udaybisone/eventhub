package com.eventhub.common;

import org.springframework.boot.web.client.ClientHttpRequestFactorySettings;
import org.springframework.boot.web.client.ClientHttpRequestFactories;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

import java.time.Duration;

/**
 * Shared {@link RestClient} used by ingestion sources, with conservative
 * timeouts and an identifying User-Agent (some upstreams reject blank UAs).
 */
@Configuration
public class RestClientConfig {

    @Bean
    public RestClient ingestionRestClient() {
        var settings = ClientHttpRequestFactorySettings.DEFAULTS
                .withConnectTimeout(Duration.ofSeconds(10))
                .withReadTimeout(Duration.ofSeconds(20));
        return RestClient.builder()
                .requestFactory(ClientHttpRequestFactories.get(settings))
                .defaultHeader("User-Agent", "EventHub/0.1 (+https://github.com/eventhub)")
                .build();
    }
}
