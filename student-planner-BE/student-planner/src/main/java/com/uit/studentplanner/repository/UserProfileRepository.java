package com.uit.studentplanner.repository;

import com.uit.studentplanner.entity.UserProfile;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserProfileRepository extends MongoRepository<UserProfile, Long> {

    Optional<UserProfile> findByUserId(Long userId);
}
