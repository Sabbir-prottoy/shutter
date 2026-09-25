package com.shuttershot.service;

import java.net.URI;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

// Turns a pasted YouTube link into its 11-character video id. Anything that is
// not a plain video link on YouTube's own domains is rejected, because the id
// is all that is stored and the public page builds the link itself.
public final class YouTubeLinks {

    private static final Pattern VIDEO_ID = Pattern.compile("[A-Za-z0-9_-]{11}");
    private static final Set<String> YOUTUBE_HOSTS =
            Set.of("youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com");
    private static final Set<String> ID_IN_PATH = Set.of("shorts", "embed", "live", "v");

    private YouTubeLinks() {
    }

    public static Optional<String> extractVideoId(String link) {
        if (link == null || link.isBlank()) {
            return Optional.empty();
        }

        URI uri;
        try {
            uri = URI.create(link.trim());
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }

        String scheme = uri.getScheme();
        String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
        if (scheme == null || !(scheme.equalsIgnoreCase("https") || scheme.equalsIgnoreCase("http"))) {
            return Optional.empty();
        }

        String path = uri.getPath() == null ? "" : uri.getPath();

        if (host.equals("youtu.be")) {
            return valid(firstSegment(path));
        }

        if (!YOUTUBE_HOSTS.contains(host)) {
            return Optional.empty();
        }

        if (path.equals("/watch")) {
            return valid(queryParam(uri.getRawQuery(), "v"));
        }

        String[] segments = path.split("/");
        if (segments.length == 3 && ID_IN_PATH.contains(segments[1])) {
            return valid(segments[2]);
        }
        return Optional.empty();
    }

    public static String watchUrl(String videoId) {
        return "https://www.youtube.com/watch?v=" + videoId;
    }

    private static String firstSegment(String path) {
        String trimmed = path.startsWith("/") ? path.substring(1) : path;
        int slash = trimmed.indexOf('/');
        return slash >= 0 ? trimmed.substring(0, slash) : trimmed;
    }

    private static String queryParam(String rawQuery, String name) {
        if (rawQuery == null) {
            return null;
        }
        for (String pair : rawQuery.split("&")) {
            int eq = pair.indexOf('=');
            if (eq > 0 && pair.substring(0, eq).equals(name)) {
                return pair.substring(eq + 1);
            }
        }
        return null;
    }

    private static Optional<String> valid(String candidate) {
        return candidate != null && VIDEO_ID.matcher(candidate).matches()
                ? Optional.of(candidate)
                : Optional.empty();
    }
}
