package com.shuttershot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Set;

/**
 * Same shape as PhotographerProfileResponse plus the private contact fields
 * (phone/location/email) — used only by the "my own profile" endpoints,
 * never by the public photographer-profile-view endpoint, so those fields
 * never leak to other users.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OwnPhotographerProfileResponse {

    private Long id;
    private String name;
    private String bio;
    private String profilePhotoUrl;
    private String baseLocation;
    private Set<String> specialties;
    private Integer yearsExperience;
    private Double ratingAvg;
    private Integer totalReviews;
    private boolean verified;

    private String phone;
    private String location;
    private String email;
}
