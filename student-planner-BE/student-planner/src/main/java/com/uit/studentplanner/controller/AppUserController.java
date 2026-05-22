package com.uit.studentplanner.controller;

import com.uit.studentplanner.entity.AppUser;
import com.uit.studentplanner.repository.AppUserRepository;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/app-users")
public class AppUserController extends CrudController<AppUser> {

    public AppUserController(AppUserRepository repository) {
        super(repository);
    }

    @Override
    protected void setId(AppUser entity, Long id) {
        entity.setUserId(id);
    }
}
