package com.eventhub.ingestion;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;

/**
 * Computes a cross-source duplicate-detection key: a SHA-256 hash of the
 * normalized title plus the start time rounded to the hour. The same contest
 * surfaced by two different sources (e.g. Codeforces API and kontests) collapses
 * to one hash so the second arrival can be skipped.
 */
public final class DedupHasher {

    private DedupHasher() {
    }

    public static String hash(String title, Instant startDateTime) {
        String normalizedTitle = title == null ? "" : title.trim().toLowerCase();
        long startHour = startDateTime == null
                ? 0L
                : startDateTime.truncatedTo(ChronoUnit.HOURS).getEpochSecond();
        String input = normalizedTitle + "|" + startHour;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
