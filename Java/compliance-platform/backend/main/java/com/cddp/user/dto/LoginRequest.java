package com.cddp.user.dto;

/** Request body for POST /api/auth/login. */
public record LoginRequest(String username, String password) {
}