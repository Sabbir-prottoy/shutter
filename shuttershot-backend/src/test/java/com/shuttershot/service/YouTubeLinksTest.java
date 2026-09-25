package com.shuttershot.service;

import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;

class YouTubeLinksTest {

    private static final String ID = "2Vv-BfVoq4g";

    @Test
    void acceptsCommonYouTubeVideoLinks() {
        assertEquals(Optional.of(ID), YouTubeLinks.extractVideoId("https://www.youtube.com/watch?v=" + ID));
        assertEquals(Optional.of(ID), YouTubeLinks.extractVideoId("  https://www.youtube.com/watch?v=" + ID + "  "));
        assertEquals(Optional.of(ID), YouTubeLinks.extractVideoId("https://youtube.com/watch?v=" + ID + "&t=42s"));
        assertEquals(Optional.of(ID), YouTubeLinks.extractVideoId("https://www.youtube.com/watch?list=PL123&v=" + ID));
        assertEquals(Optional.of(ID), YouTubeLinks.extractVideoId("https://m.youtube.com/watch?v=" + ID));
        assertEquals(Optional.of(ID), YouTubeLinks.extractVideoId("https://music.youtube.com/watch?v=" + ID));
        assertEquals(Optional.of(ID), YouTubeLinks.extractVideoId("https://youtu.be/" + ID));
        assertEquals(Optional.of(ID), YouTubeLinks.extractVideoId("https://youtu.be/" + ID + "?si=abc"));
        assertEquals(Optional.of(ID), YouTubeLinks.extractVideoId("https://www.youtube.com/shorts/" + ID));
        assertEquals(Optional.of(ID), YouTubeLinks.extractVideoId("https://www.youtube.com/embed/" + ID));
        assertEquals(Optional.of(ID), YouTubeLinks.extractVideoId("http://www.youtube.com/watch?v=" + ID));
    }

    @Test
    void rejectsAnythingThatIsNotASingleYouTubeVideo() {
        assertEquals(Optional.empty(), YouTubeLinks.extractVideoId(null));
        assertEquals(Optional.empty(), YouTubeLinks.extractVideoId(""));
        assertEquals(Optional.empty(), YouTubeLinks.extractVideoId("   "));
        assertEquals(Optional.empty(), YouTubeLinks.extractVideoId("not a link"));
        assertEquals(Optional.empty(), YouTubeLinks.extractVideoId(ID));
        assertEquals(Optional.empty(), YouTubeLinks.extractVideoId("https://www.youtube.com/watch"));
        assertEquals(Optional.empty(), YouTubeLinks.extractVideoId("https://www.youtube.com/watch?v=short"));
        assertEquals(Optional.empty(), YouTubeLinks.extractVideoId("https://www.youtube.com/playlist?list=PL123"));
        assertEquals(Optional.empty(), YouTubeLinks.extractVideoId("https://www.youtube.com/@somechannel"));
        assertEquals(Optional.empty(), YouTubeLinks.extractVideoId("https://www.youtube.com/"));
    }

    @Test
    void rejectsLookAlikeAndNonYouTubeHosts() {
        assertEquals(Optional.empty(), YouTubeLinks.extractVideoId("https://evil.com/watch?v=" + ID));
        assertEquals(Optional.empty(), YouTubeLinks.extractVideoId("https://youtube.com.evil.com/watch?v=" + ID));
        assertEquals(Optional.empty(), YouTubeLinks.extractVideoId("https://notyoutube.com/watch?v=" + ID));
        assertEquals(Optional.empty(), YouTubeLinks.extractVideoId("https://evil.com/?u=https://www.youtube.com/watch?v=" + ID));
        assertEquals(Optional.empty(), YouTubeLinks.extractVideoId("https://user@evil.com/watch?v=" + ID));
        assertEquals(Optional.empty(), YouTubeLinks.extractVideoId("javascript:alert(1)"));
        assertEquals(Optional.empty(), YouTubeLinks.extractVideoId("ftp://www.youtube.com/watch?v=" + ID));
        assertEquals(Optional.empty(), YouTubeLinks.extractVideoId("//www.youtube.com/watch?v=" + ID));
    }

    @Test
    void buildsTheWatchUrlFromAnId() {
        assertEquals("https://www.youtube.com/watch?v=" + ID, YouTubeLinks.watchUrl(ID));
    }
}
