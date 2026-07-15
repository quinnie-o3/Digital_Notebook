package com.uit.studentplanner.controller;

import com.uit.studentplanner.config.AuthContext;
import com.uit.studentplanner.entity.OwnedResource;
import java.util.List;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.server.ResponseStatusException;

public abstract class CrudController<T extends OwnedResource> {

    private final MongoRepository<T, Long> repository;
    private final MongoTemplate mongoTemplate;
    private final Class<T> entityType;

    protected CrudController(
            MongoRepository<T, Long> repository,
            MongoTemplate mongoTemplate,
            Class<T> entityType
    ) {
        this.repository = repository;
        this.mongoTemplate = mongoTemplate;
        this.entityType = entityType;
    }

    protected abstract void setId(T entity, Long id);

    protected void validateReferences(T entity, Long userId) {
        // Controllers with foreign keys override this hook.
    }

    @GetMapping
    public List<T> getAll() {
        return mongoTemplate.find(ownerQuery(currentUserId()), entityType);
    }

    @GetMapping("/{id}")
    public T getById(@PathVariable Long id) {
        return findOwned(id, currentUserId());
    }

    @PostMapping
    public T create(@RequestBody T entity) {
        Long userId = currentUserId();
        setId(entity, null);
        entity.setUserId(userId);
        validateReferences(entity, userId);
        return repository.save(entity);
    }

    @PutMapping("/{id}")
    public T update(@PathVariable Long id, @RequestBody T entity) {
        Long userId = currentUserId();
        findOwned(id, userId);
        setId(entity, id);
        entity.setUserId(userId);
        validateReferences(entity, userId);
        return repository.save(entity);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        Long userId = currentUserId();
        T existing = findOwned(id, userId);
        repository.delete(existing);
    }

    protected Long currentUserId() {
        return AuthContext.require().userId();
    }

    protected T findOwned(Long id, Long userId) {
        T entity = mongoTemplate.findOne(idAndOwnerQuery(id, userId), entityType);
        if (entity == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        return entity;
    }

    protected boolean ownedResourceExists(Class<?> type, Long id, Long userId) {
        return mongoTemplate.exists(idAndOwnerQuery(id, userId), type);
    }

    protected void requireOwnedResource(Class<?> type, Long id, Long userId) {
        if (id == null || !ownedResourceExists(type, id, userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
    }

    protected Query ownerQuery(Long userId) {
        return Query.query(Criteria.where("user_id").is(userId));
    }

    protected Query idAndOwnerQuery(Long id, Long userId) {
        return Query.query(Criteria.where("_id").is(id).and("user_id").is(userId));
    }
}
