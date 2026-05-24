package com.uit.studentplanner.controller;

import com.uit.studentplanner.entity.AppUser;
import com.uit.studentplanner.repository.AppUserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/app-users")
public class AppUserController extends CrudController<AppUser> {

    private final AppUserRepository repository;

    public AppUserController(AppUserRepository repository) {
        super(repository);
        this.repository = repository;
    }

    @Override
    protected void setId(AppUser entity, Long id) {
        entity.setUserId(id);
    }

    @GetMapping("/username/{username}")
    public AppUser getByUsername(@PathVariable String username) {
        return repository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }
}
