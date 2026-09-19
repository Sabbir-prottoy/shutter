package com.shuttershot.dto;

import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAccountRequest {

    private String name;

    private String phone;

    private String location;

    @Email(message = "Email must be a valid address")
    private String email;

    private String bio;
}
