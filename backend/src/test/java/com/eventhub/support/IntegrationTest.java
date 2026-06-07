package com.eventhub.support;

import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

/**
 * Base for integration tests: runs against a real Postgres (the 'eventhub_test'
 * database locally; a Postgres service in CI) with the actual Flyway migrations
 * applied, plus MockMvc through the full security filter chain. Email is replaced
 * with a recording client so tests can assert on sent messages.
 *
 * Each test class truncates the tables it uses in @BeforeEach for isolation.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestEmailConfig.class)
public abstract class IntegrationTest {
}
