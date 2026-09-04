package com.shuttershot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PhotographerProfileResponse {

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
}
