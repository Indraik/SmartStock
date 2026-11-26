package com.smartstock.backend.dto;

public record CategoryCountResponse(

        String categoryName,

        Long productCount

) {
}