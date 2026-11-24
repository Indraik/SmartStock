package com.smartstock.backend.config;

import com.smartstock.backend.entity.Role;
import com.smartstock.backend.enums.RoleName;
import com.smartstock.backend.repository.RoleRepository;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;

    public DataInitializer(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Override
    public void run(String... args) {

        for (RoleName roleName : RoleName.values()) {

            if (!roleRepository.existsByName(roleName)) {

                Role role = new Role(roleName);

                roleRepository.save(role);

                System.out.println("Role created: " + roleName);
            }
        }
    }
}