package com.shuttershot.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreatePhotoshootCategoryRequest {

    @NotBlank(message = "Category name is required")
    @Size(max = 60, message = "Category name must be at most 60 characters")
    private String name;

    @Size(max = 160, message = "Short summary must be at most 160 characters")
    private String summary;

    @NotBlank(message = "Details are required")
    @Size(max = 2000, message = "Details must be at most 2000 characters")
    private String details;

    private List<String> goodFor;

    @Size(max = 400, message = "\"What to look for\" must be at most 400 characters")
    private String lookFor;
}
