package com.shuttershot.service;

import ai.onnxruntime.OnnxTensor;
import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtSession;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.nio.FloatBuffer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.Optional;

/**
 * Runs the local Detectra v3 ONNX model to screen a portfolio upload for
 * AI-generated imagery. Unlike {@link AiImageDetectionService} (the paid
 * aiornot.com "deep check" an admin triggers by hand), this runs offline on
 * every upload and drives the automatic approve/reject decision.
 *
 * <p>The exported graph takes {@code pixel_values} as a single NCHW
 * float32 [1, 3, 384, 384] tensor and returns one {@code logit} — a binary
 * score where a HIGHER value means more likely AI-generated. That polarity,
 * and the ImageNet normalisation below, were both established empirically
 * against a corpus of known-real photographs (median logit -4.4; ImageNet
 * stats separated the classes more cleanly than a 0.5/0.5 rescale).
 */
@Slf4j
@Service
public class DetectraAiDetectionService {

    private static final int INPUT_SIZE = 384;
    private static final float[] MEAN = {0.485f, 0.456f, 0.406f};
    private static final float[] STD = {0.229f, 0.224f, 0.225f};

    @Value("${detectra.model-path}")
    private String modelPath;

    private OrtEnvironment environment;
    private OrtSession session;
    private String inputName;

    /**
     * @param verdict       "ai" or "human"
     * @param probabilityAi sigmoid of the raw logit — 0.0 certainly human, 1.0 certainly AI
     */
    public record DetectraResult(String verdict, double probabilityAi) {
    }

    @PostConstruct
    void load() {
        Path path = Paths.get(modelPath).toAbsolutePath().normalize();
        if (!Files.isRegularFile(path)) {
            // Left unavailable rather than fatal: uploads then fall back to
            // manual admin review instead of the app refusing to start.
            log.warn("Detectra v3 model not found at {} — automatic AI screening is disabled, "
                    + "uploads will wait for manual review", path);
            return;
        }

        try {
            environment = OrtEnvironment.getEnvironment();
            session = environment.createSession(path.toString(), new OrtSession.SessionOptions());
            inputName = session.getInputNames().iterator().next();
            log.info("Detectra v3 loaded from {} (input '{}')", path, inputName);
        } catch (Exception ex) {
            log.error("Detectra v3 failed to load from {} — automatic AI screening is disabled", path, ex);
            session = null;
        }
    }

    @PreDestroy
    void unload() {
        try {
            if (session != null) {
                session.close();
            }
        } catch (Exception ex) {
            log.warn("Detectra v3 session did not close cleanly", ex);
        }
    }

    public boolean isAvailable() {
        return session != null;
    }

    /**
     * @return the model's verdict, or empty when the model is unavailable or the
     * image could not be scored — callers must treat empty as "undecided" and
     * fall back to manual review rather than assuming either outcome.
     */
    public Optional<DetectraResult> check(byte[] imageBytes) {
        if (session == null) {
            return Optional.empty();
        }

        try {
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(imageBytes));
            if (image == null) {
                log.warn("Detectra v3 could not decode the uploaded image");
                return Optional.empty();
            }

            float[] input = preprocess(image);
            long[] shape = {1, 3, INPUT_SIZE, INPUT_SIZE};

            try (OnnxTensor tensor = OnnxTensor.createTensor(environment, FloatBuffer.wrap(input), shape);
                 OrtSession.Result result = session.run(Collections.singletonMap(inputName, tensor))) {

                float[][] output = (float[][]) result.get(0).getValue();
                float logit = output[0][0];
                double probabilityAi = 1.0 / (1.0 + Math.exp(-logit));

                return Optional.of(new DetectraResult(
                        probabilityAi >= 0.5 ? "ai" : "human", probabilityAi));
            }
        } catch (Exception ex) {
            log.error("Detectra v3 inference failed", ex);
            return Optional.empty();
        }
    }

    /** Resize to 384x384, scale to 0..1, apply ImageNet normalisation, emit NCHW. */
    private float[] preprocess(BufferedImage source) {
        // Area averaging rather than a plain bicubic draw: it is the only
        // scaler here that pre-filters, and photos arrive far larger than
        // 384px. Sampling one in every N pixels instead aliases the detail the
        // model reads, which measurably shifted scores away from the reference
        // implementation this model's threshold was calibrated against.
        Image scaled = source.getScaledInstance(INPUT_SIZE, INPUT_SIZE, Image.SCALE_AREA_AVERAGING);
        BufferedImage resized = new BufferedImage(INPUT_SIZE, INPUT_SIZE, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = resized.createGraphics();
        graphics.drawImage(scaled, 0, 0, null);
        graphics.dispose();

        int pixelCount = INPUT_SIZE * INPUT_SIZE;
        float[] chw = new float[3 * pixelCount];
        for (int y = 0; y < INPUT_SIZE; y++) {
            for (int x = 0; x < INPUT_SIZE; x++) {
                int rgb = resized.getRGB(x, y);
                int offset = y * INPUT_SIZE + x;
                chw[offset] = ((((rgb >> 16) & 0xFF) / 255f) - MEAN[0]) / STD[0];
                chw[pixelCount + offset] = ((((rgb >> 8) & 0xFF) / 255f) - MEAN[1]) / STD[1];
                chw[2 * pixelCount + offset] = (((rgb & 0xFF) / 255f) - MEAN[2]) / STD[2];
            }
        }
        return chw;
    }
}
