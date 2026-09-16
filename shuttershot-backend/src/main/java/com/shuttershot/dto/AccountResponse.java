package com.shuttershot.dto;

import com.shuttershot.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String location;
    private String profilePhotoUrl;
    private String bio;
    private Role role;
}
