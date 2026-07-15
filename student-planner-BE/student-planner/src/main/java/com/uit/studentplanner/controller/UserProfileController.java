package com.uit.studentplanner.controller;

import com.uit.studentplanner.config.AuthContext;
import com.uit.studentplanner.entity.UserProfile;
import com.uit.studentplanner.repository.UserProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/user-profiles")
public class UserProfileController {

    private final UserProfileRepository repository;

    public UserProfileController(UserProfileRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/me")
    public UserProfile getCurrentProfile() {
        Long userId = AuthContext.require().userId();
        return repository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }
}
