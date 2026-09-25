package com.shuttershot.service;

import java.util.Set;

// The illustrations the frontend can draw on a product tile when the product
// has no photo. Kept in sync with ProductArt.jsx.
public final class ProductIcons {

    public static final Set<String> KEYS = Set.of(
            "tripod", "bag", "memory-card", "card-reader", "battery", "charger", "blower", "cloth", "bottle",
            "swab", "flash", "softbox", "led-panel", "filter", "lens", "rig", "gimbal", "strap", "drive",
            "tape", "microphone", "recorder", "software", "cloud", "color-swatch", "business-cards",
            "headlamp", "multitool", "pouch", "remote");

    private ProductIcons() {
    }
}
