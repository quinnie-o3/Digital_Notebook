package com.uit.studentplanner.controller;

import com.uit.studentplanner.entity.UserProfile;
import com.uit.studentplanner.repository.UserProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/user-profiles")
public class UserProfileController extends CrudController<UserProfile> {

    private final UserProfileRepository repository;

    public UserProfileController(UserProfileRepository repository) {
        super(repository);
        this.repository = repository;
    }

    @Override
    protected void setId(UserProfile entity, Long id) {
        entity.setProfileId(id);
    }

    @GetMapping("/user/{userId}")
    public UserProfile getByUserId(@PathVariable Long userId) {
        return repository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }
}
