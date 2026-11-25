package com.smartstock.backend.service;

import com.smartstock.backend.dto.CategoryRequest;
import com.smartstock.backend.dto.CategoryResponse;
import com.smartstock.backend.entity.Category;
import com.smartstock.backend.exception.DuplicateResourceException;
import com.smartstock.backend.exception.ResourceNotFoundException;
import com.smartstock.backend.repository.CategoryRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(
            CategoryRepository categoryRepository) {

        this.categoryRepository = categoryRepository;
    }

    // CREATE CATEGORY

    @Transactional
    public CategoryResponse createCategory(
            CategoryRequest request) {

        String name = request.getName().trim();

        if (categoryRepository.existsByNameIgnoreCase(name)) {

            throw new DuplicateResourceException(
                    "Category already exists");
        }

        Category category = new Category();

        category.setName(name);
        category.setDescription(request.getDescription());
        category.setActive(true);

        Category savedCategory =
                categoryRepository.save(category);

        return mapToResponse(savedCategory);
    }

    // GET CATEGORIES

    @Transactional(readOnly = true)
    public List<CategoryResponse> getCategories(
            boolean includeInactive) {

        List<Category> categories;

        if (includeInactive) {

            categories =
                    categoryRepository.findAllByOrderByNameAsc();

        } else {

            categories =
                    categoryRepository
                            .findAllByActiveTrueOrderByNameAsc();
        }

        return categories.stream()
                .map(this::mapToResponse)
                .toList();
    }

    // UPDATE CATEGORY

    @Transactional
    public CategoryResponse updateCategory(
            Long id,
            CategoryRequest request) {

        Category category = findCategory(id);

        String name = request.getName().trim();

        if (categoryRepository
                .existsByNameIgnoreCaseAndIdNot(name, id)) {

            throw new DuplicateResourceException(
                    "Category already exists");
        }

        category.setName(name);
        category.setDescription(request.getDescription());

        return mapToResponse(category);
    }

    // UPDATE ACTIVE STATUS

    @Transactional
    public CategoryResponse updateStatus(
            Long id,
            boolean active) {

        Category category = findCategory(id);

        category.setActive(active);

        return mapToResponse(category);
    }

    // FIND CATEGORY

    private Category findCategory(Long id) {

        return categoryRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Category not found with id: " + id));
    }

    // ENTITY TO DTO MAPPING

    private CategoryResponse mapToResponse(Category category) {

        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.isActive()
        );
    }
}