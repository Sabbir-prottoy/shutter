package com.shuttershot.util;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

// All 64 districts of Bangladesh, grouped by division in the order they're
// shown wherever a photographer picks their district (registration form,
// search filter). Used to validate that a photographer's location is one of
// these on registration, and to back the district dropdown on the frontend
// (see shuttershot-frontend/src/constants.js — keep the two lists in sync).
public final class BangladeshDistricts {

    public static final List<String> ALL = List.of(
            // Dhaka division
            "Dhaka", "Faridpur", "Gazipur", "Gopalganj", "Kishoreganj", "Madaripur",
            "Manikganj", "Munshiganj", "Narayanganj", "Narsingdi", "Rajbari", "Shariatpur", "Tangail",
            // Chattogram division
            "Bandarban", "Brahmanbaria", "Chandpur", "Chattogram", "Cumilla", "Cox's Bazar",
            "Feni", "Khagrachhari", "Lakshmipur", "Noakhali", "Rangamati",
            // Rajshahi division
            "Bogura", "Chapainawabganj", "Joypurhat", "Naogaon", "Natore", "Pabna", "Rajshahi", "Sirajganj",
            // Khulna division
            "Bagerhat", "Chuadanga", "Jashore", "Jhenaidah", "Khulna", "Kushtia",
            "Magura", "Meherpur", "Narail", "Satkhira",
            // Barishal division
            "Barguna", "Barishal", "Bhola", "Jhalokati", "Patuakhali", "Pirojpur",
            // Sylhet division
            "Habiganj", "Moulvibazar", "Sunamganj", "Sylhet",
            // Rangpur division
            "Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari", "Panchagarh", "Rangpur", "Thakurgaon",
            // Mymensingh division
            "Jamalpur", "Mymensingh", "Netrokona", "Sherpur"
    );

    private static final Set<String> LOOKUP =
            ALL.stream().map(String::toLowerCase).collect(Collectors.toUnmodifiableSet());

    public static boolean isValid(String district) {
        return district != null && LOOKUP.contains(district.toLowerCase());
    }

    private BangladeshDistricts() {
    }
}
