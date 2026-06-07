package com.eventhub.ingestion;

/** Mutable tally of one source's ingestion outcome. */
public class IngestionCounts {
    public int fetched;
    public int inserted;
    public int updated;
    public int skipped;
}
