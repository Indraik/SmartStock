package com.smartstock.backend.service;

import com.smartstock.backend.dto.SupplierRequest;
import com.smartstock.backend.dto.SupplierResponse;
import com.smartstock.backend.entity.Supplier;
import com.smartstock.backend.exception.ResourceNotFoundException;
import com.smartstock.backend.repository.SupplierRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;

    public SupplierService(
            SupplierRepository supplierRepository) {

        this.supplierRepository = supplierRepository;
    }

    // CREATE SUPPLIER

    @Transactional
    public SupplierResponse createSupplier(
            SupplierRequest request) {

        Supplier supplier = new Supplier();

        updateSupplierFields(supplier, request);

        supplier.setActive(true);

        Supplier savedSupplier =
                supplierRepository.save(supplier);

        return mapToResponse(savedSupplier);
    }

    // GET ALL SUPPLIERS

    @Transactional(readOnly = true)
    public List<SupplierResponse> getSuppliers() {

        return supplierRepository
                .findAllByOrderByCompanyNameAsc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // UPDATE SUPPLIER

    @Transactional
    public SupplierResponse updateSupplier(
            Long id,
            SupplierRequest request) {

        Supplier supplier = findSupplier(id);

        updateSupplierFields(supplier, request);

        return mapToResponse(supplier);
    }

    // UPDATE STATUS

    @Transactional
    public SupplierResponse updateStatus(
            Long id,
            boolean active) {

        Supplier supplier = findSupplier(id);

        supplier.setActive(active);

        return mapToResponse(supplier);
    }

    // FIND SUPPLIER

    private Supplier findSupplier(Long id) {

        return supplierRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Supplier not found with id: " + id));
    }

    // UPDATE COMMON FIELDS

    private void updateSupplierFields(
            Supplier supplier,
            SupplierRequest request) {

        supplier.setCompanyName(
                request.getCompanyName().trim());

        supplier.setContactName(request.getContactName());
        supplier.setEmail(request.getEmail());
        supplier.setPhone(request.getPhone());
        supplier.setAddress(request.getAddress());
    }

    // MAP ENTITY TO RESPONSE DTO

    private SupplierResponse mapToResponse(
            Supplier supplier) {

        return new SupplierResponse(
                supplier.getId(),
                supplier.getCompanyName(),
                supplier.getContactName(),
                supplier.getEmail(),
                supplier.getPhone(),
                supplier.getAddress(),
                supplier.isActive(),
                supplier.getCreatedAt()
        );
    }
}