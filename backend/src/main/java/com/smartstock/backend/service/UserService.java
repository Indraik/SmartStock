package com.smartstock.backend.service;

import com.smartstock.backend.dto.PageResponse;
import com.smartstock.backend.dto.UserResponse;

import com.smartstock.backend.entity.User;
import com.smartstock.backend.entity.Role;

import com.smartstock.backend.enums.RoleName;

import com.smartstock.backend.exception.ResourceNotFoundException;

import com.smartstock.backend.repository.UserRepository;
import com.smartstock.backend.repository.RoleRepository;

import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public UserService(
            UserRepository userRepository,
            RoleRepository roleRepository) {

        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    // GET ALL USERS

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<UserResponse> getUsers(
            Pageable pageable) {

        return PageResponse.from(
                userRepository.findAll(pageable)
                        .map(this::mapToResponse)
        );
    }

    // GET USER BY ID

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse getUserById(Long id) {

        return mapToResponse(findUser(id));
    }

    // GET CURRENT USER

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found"));

        return mapToResponse(user);
    }

    // ENABLE OR DISABLE USER

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse updateStatus(
            Long id,
            boolean enabled,
            String adminEmail) {

        User user = findUserForUpdate(id);

        validateManagementAccess(user, adminEmail);

        user.setEnabled(enabled);

        userRepository.flush();

        return mapToResponse(user);
    }

    // UPDATE USER ROLE

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse updateRole(
            Long id,
            RoleName roleName,
            String adminEmail) {

        User user = findUserForUpdate(id);

        validateManagementAccess(user, adminEmail);

        if (roleName == RoleName.ADMIN) {

            throw new AccessDeniedException(
                    "ADMIN role cannot be assigned through this API");
        }

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Role not found"));

        user.setRole(role);

        userRepository.flush();

        return mapToResponse(user);
    }

    // VALIDATE MANAGEMENT ACCESS

    private void validateManagementAccess(
            User user,
            String adminEmail) {

        if (user.getEmail().equals(adminEmail)) {

            throw new AccessDeniedException(
                    "Cannot modify your own account");
        }

        if (user.getRole().getName() == RoleName.ADMIN) {

            throw new AccessDeniedException(
                    "Cannot modify an ADMIN account");
        }
    }

    // FIND USER

    private User findUser(Long id) {

        return userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with id: " + id));
    }

    // FIND USER WITH LOCK

    private User findUserForUpdate(Long id) {

        return userRepository.findByIdForUpdate(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with id: " + id));
    }

    // MAP RESPONSE

    private UserResponse mapToResponse(User user) {

        return new UserResponse(

                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().getName(),
                user.isEnabled(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}