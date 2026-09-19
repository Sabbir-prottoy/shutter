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
public class StaffAccountResponse {

    private Long id;
    private Role role;
    private String name;
    private String email;

    // The password the main admin set for this account, kept viewable in the
    // staff list so it can be looked back up later. Null if the account
    // holder has since changed their own password, since the stored value
    // would no longer be accurate.
    private String password;

    private LocalDateTime createdAt;
}
