package com.eventhub.support;

import com.eventhub.email.EmailClient;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/** Test EmailClient that records sent messages instead of delivering them. */
public class RecordingEmailClient implements EmailClient {

    public record Sent(String to, String subject, String body) {
    }

    private final List<Sent> sent = new CopyOnWriteArrayList<>();

    @Override
    public void send(String to, String subject, String body) {
        sent.add(new Sent(to, subject, body));
    }

    public List<Sent> sent() {
        return sent;
    }

    public void clear() {
        sent.clear();
    }
}
