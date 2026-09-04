package com.shuttershot.dto;

import com.shuttershot.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUserResponse {

    private Long id;
    private Role role;
    private String name;
    private String email;
    private String phone;
    private String location;
    private boolean verified;
    private boolean enabled;
    private LocalDateTime createdAt;
}
