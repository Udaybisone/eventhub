package com.eventhub.internal;

import com.eventhub.support.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Verifies the shared-secret guard on cron-triggered endpoints. */
@TestPropertySource(properties = "app.internal.secret=test-secret")
class InternalControllerTest extends IntegrationTest {

    @Autowired MockMvc mvc;

    @Test
    void notifyRejectsMissingOrWrongSecret() throws Exception {
        mvc.perform(post("/internal/notify"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/internal/notify").header("X-Internal-Secret", "wrong"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void notifyAcceptsCorrectSecret() throws Exception {
        mvc.perform(post("/internal/notify").header("X-Internal-Secret", "test-secret"))
                .andExpect(status().isOk());
    }
}
