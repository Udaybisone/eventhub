package com.eventhub.auth;

import com.eventhub.event.Category;
import com.eventhub.event.EventRepository;
import com.eventhub.support.IntegrationTest;
import com.eventhub.support.RecordingEmailClient;
import com.eventhub.support.TestFixtures;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AuthApiTest extends IntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired EventRepository events;
    @Autowired RecordingEmailClient email;
    @Autowired JdbcTemplate jdbc;

    private Long eventId;

    @BeforeEach
    void setup() {
        jdbc.execute("TRUNCATE events, users, ingestion_jobs RESTART IDENTITY CASCADE");
        email.clear();
        eventId = events.save(TestFixtures.event("CF", "1", "Test Event",
                Category.CODING_CONTEST, Instant.now().plusSeconds(86400), Set.of("tag"))).getId();
    }

    private JsonNode register(String email, String password) throws Exception {
        MvcResult res = mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        return json.readTree(res.getResponse().getContentAsString());
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    @Test
    void registerLoginRefreshRotationFlow() throws Exception {
        JsonNode reg = register("a@test.com", "password123");
        String refresh = reg.get("refreshToken").asText();
        assertThat(reg.get("role").asText()).isEqualTo("USER");

        // Duplicate registration is rejected.
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"a@test.com\",\"password\":\"password123\"}"))
                .andExpect(status().isConflict());

        // Wrong password.
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"a@test.com\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized());

        // Refresh rotates: the new token works, the old one is now revoked.
        MvcResult refreshed = mvc.perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refresh + "\"}"))
                .andExpect(status().isOk()).andReturn();
        String newRefresh = json.readTree(refreshed.getResponse().getContentAsString())
                .get("refreshToken").asText();
        assertThat(newRefresh).isNotEqualTo(refresh);

        mvc.perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refresh + "\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void bookmarksRequireAuthAndAreIdempotent() throws Exception {
        mvc.perform(get("/api/bookmarks")).andExpect(status().isUnauthorized());

        String token = register("b@test.com", "password123").get("accessToken").asText();

        mvc.perform(put("/api/bookmarks/" + eventId).header("Authorization", bearer(token)))
                .andExpect(status().isNoContent());
        // Idempotent second add.
        mvc.perform(put("/api/bookmarks/" + eventId).header("Authorization", bearer(token)))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/bookmarks").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));

        mvc.perform(delete("/api/bookmarks/" + eventId).header("Authorization", bearer(token)))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/bookmarks").header("Authorization", bearer(token)))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void adminEndpointsRequireAdminRole() throws Exception {
        String userToken = register("u@test.com", "password123").get("accessToken").asText();
        // Plain user is forbidden.
        mvc.perform(get("/api/admin/events").header("Authorization", bearer(userToken)))
                .andExpect(status().isForbidden());

        // Promote to ADMIN and re-login to get a token carrying the admin role.
        var user = users.findByEmail("u@test.com").orElseThrow();
        user.setRole(Role.ADMIN);
        users.save(user);

        MvcResult login = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"u@test.com\",\"password\":\"password123\"}"))
                .andExpect(status().isOk()).andReturn();
        String adminToken = json.readTree(login.getResponse().getContentAsString())
                .get("accessToken").asText();

        mvc.perform(get("/api/admin/events").header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk());
        mvc.perform(delete("/api/admin/events/" + eventId).header("Authorization", bearer(adminToken)))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/events/" + eventId)).andExpect(status().isNotFound());
    }

    @Test
    void passwordResetHappyPathAndInvalidTokenRejected() throws Exception {
        register("c@test.com", "password123");

        // Request reset (always 202, even if the email doesn't exist).
        mvc.perform(post("/api/auth/password-reset/request").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"c@test.com\"}"))
                .andExpect(status().isAccepted());

        // The reset link (with the plaintext token) was emailed; extract the token.
        String body = email.sent().stream()
                .filter(s -> s.to().equals("c@test.com"))
                .reduce((a, b) -> b).orElseThrow().body();
        String token = body.substring(body.indexOf("token=") + "token=".length()).trim();

        // Invalid token is rejected.
        mvc.perform(post("/api/auth/password-reset/confirm").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"bogus\",\"newPassword\":\"newpassword123\"}"))
                .andExpect(status().isBadRequest());

        // Valid token resets the password.
        mvc.perform(post("/api/auth/password-reset/confirm").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + token + "\",\"newPassword\":\"newpassword123\"}"))
                .andExpect(status().isNoContent());

        // Old password no longer works; new one does.
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"c@test.com\",\"password\":\"password123\"}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"c@test.com\",\"password\":\"newpassword123\"}"))
                .andExpect(status().isOk());
    }
}
