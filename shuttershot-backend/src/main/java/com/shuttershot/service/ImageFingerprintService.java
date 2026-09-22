package com.shuttershot.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.Optional;

/**
 * Fingerprints a portfolio image so re-uploads of pictures already on
 * ShutterShot can be spotted.
 *
 * <p>Two fingerprints, because they catch different things. The SHA-256 of the
 * file bytes catches the common case exactly — someone saves a photo off a
 * profile page and uploads that same file. The perceptual hash (dHash) catches
 * the same picture after it has been re-encoded, resized or re-saved, where
 * every byte differs but the image plainly does not.
 */
@Slf4j
@Service
public class ImageFingerprintService {

    // DCT-based pHash: downsample to 32x32, keep the top-left 8x8 block of
    // low-frequency coefficients, and threshold them at their median.
    // A simpler gradient hash (dHash) was tried first and rejected — on
    // low-detail photos like fog or open sky it collided outright with
    // unrelated images, leaving no threshold that caught copies without
    // also rejecting genuine work.
    private static final int DCT_SIZE = 32;
    private static final int KEPT_COEFFICIENTS = 8;

    public record Fingerprint(String contentHash, long perceptualHash) {
    }

    public Optional<Fingerprint> fingerprint(byte[] imageBytes) {
        try {
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(imageBytes));
            if (image == null) {
                return Optional.empty();
            }
            return Optional.of(new Fingerprint(sha256(imageBytes), perceptualHash(image)));
        } catch (Exception ex) {
            log.warn("Could not fingerprint image", ex);
            return Optional.empty();
        }
    }

    private String sha256(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is required but unavailable", ex);
        }
    }

    public long perceptualHash(BufferedImage source) {
        Image scaled = source.getScaledInstance(DCT_SIZE, DCT_SIZE, Image.SCALE_AREA_AVERAGING);
        BufferedImage small = new BufferedImage(DCT_SIZE, DCT_SIZE, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = small.createGraphics();
        graphics.drawImage(scaled, 0, 0, null);
        graphics.dispose();

        double[][] pixels = new double[DCT_SIZE][DCT_SIZE];
        for (int y = 0; y < DCT_SIZE; y++) {
            for (int x = 0; x < DCT_SIZE; x++) {
                pixels[y][x] = luminance(small.getRGB(x, y));
            }
        }

        double[][] frequencies = dct(pixels);

        // Skip coefficient [0][0]: it is just overall brightness, which says
        // nothing about content and would swamp the median.
        double[] kept = new double[KEPT_COEFFICIENTS * KEPT_COEFFICIENTS - 1];
        int index = 0;
        for (int y = 0; y < KEPT_COEFFICIENTS; y++) {
            for (int x = 0; x < KEPT_COEFFICIENTS; x++) {
                if (x != 0 || y != 0) {
                    kept[index++] = frequencies[y][x];
                }
            }
        }

        double[] sorted = kept.clone();
        Arrays.sort(sorted);
        double median = (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2.0;

        long hash = 0L;
        for (int bit = 0; bit < kept.length; bit++) {
            if (kept[bit] > median) {
                hash |= (1L << bit);
            }
        }
        return hash;
    }

    private static double[][] dct(double[][] input) {
        int n = input.length;
        double[][] cosines = new double[n][n];
        for (int a = 0; a < n; a++) {
            for (int b = 0; b < n; b++) {
                cosines[a][b] = Math.cos((2 * a + 1) * b * Math.PI / (2.0 * n));
            }
        }

        // Separable 2D DCT-II: rows first, then columns.
        double[][] rows = new double[n][n];
        for (int y = 0; y < n; y++) {
            for (int u = 0; u < n; u++) {
                double sum = 0;
                for (int x = 0; x < n; x++) {
                    sum += input[y][x] * cosines[x][u];
                }
                rows[y][u] = sum * (u == 0 ? Math.sqrt(0.5) : 1.0);
            }
        }

        double[][] output = new double[n][n];
        for (int u = 0; u < n; u++) {
            for (int v = 0; v < n; v++) {
                double sum = 0;
                for (int y = 0; y < n; y++) {
                    sum += rows[y][u] * cosines[y][v];
                }
                output[v][u] = sum * (v == 0 ? Math.sqrt(0.5) : 1.0);
            }
        }
        return output;
    }

    private static double luminance(int rgb) {
        return 0.299 * ((rgb >> 16) & 0xFF) + 0.587 * ((rgb >> 8) & 0xFF) + 0.114 * (rgb & 0xFF);
    }

    /** Number of differing bits — 0 means the two images look identical. */
    public static int distance(long left, long right) {
        return Long.bitCount(left ^ right);
    }
}
