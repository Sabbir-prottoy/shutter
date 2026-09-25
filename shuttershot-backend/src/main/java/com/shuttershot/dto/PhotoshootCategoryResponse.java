package com.shuttershot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PhotoshootCategoryResponse {

    private Long id;
    private String name;
    private String summary;
    private String details;
    private List<String> goodFor;
    private String lookFor;

    // The ?category= value photographer search uses; null for added categories.
    private String searchValue;

    // Built-in categories can be edited but not removed.
    private boolean builtIn;
}
