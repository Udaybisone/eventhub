package com.eventhub.email;

/** Sends transactional email (password resets, event reminders). */
public interface EmailClient {

    void send(String to, String subject, String body);
}
