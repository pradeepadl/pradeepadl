package com.cddp.user.dto;

/** Response body for POST /api/auth/login — the frontend stores accessToken
 * and sends it as `Authorization: Bearer <accessToken>` on every subsequent
 * /api/** call (see frontend/src/app/lib/apiClient.ts). */
public record LoginResponse(String accessToken, String tokenType, long expiresIn) {
}