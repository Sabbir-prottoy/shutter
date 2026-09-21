package com.shuttershot.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;

// Thin wrapper around ZXing ("Zebra Crossing") — the standard, actively
// maintained Java QR library — used for both booking verification QR codes
// (see BookingService): the in-person "scan to verify" code and the Google
// Authenticator enrollment code.
@Service
public class QrCodeService {

    public String generatePngDataUri(String content, int sizePx) {
        try {
            BitMatrix matrix = new QRCodeWriter().encode(content, BarcodeFormat.QR_CODE, sizePx, sizePx);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", out);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(out.toByteArray());
        } catch (WriterException | IOException ex) {
            throw new IllegalStateException("Could not generate QR code", ex);
        }
    }
}
