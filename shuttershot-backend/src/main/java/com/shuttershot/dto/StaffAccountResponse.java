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
public class StaffAccountResponse {

    private Long id;
    private Role role;
    private String name;
    private String email;

    // Shown once, right after creation, so the admin can hand it to the new
    // staff member directly if the credentials email doesn't land (e.g. mail
    // isn't configured in this environment) — never re-served afterward.
    private String generatedPassword;
}
