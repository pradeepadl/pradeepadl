package com.cddp.ai.crypto;

import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES-256-GCM encryption for LLM provider API keys at rest
 * (tcfg_llm_provider_cfgs.api_key_encrypted). Key comes from the
 * LLM_CONFIG_ENCRYPTION_KEY env var — a base64-encoded 32-byte value,
 * e.g. generated with {@code openssl rand -base64 32}.
 *
 * <p>The key is read lazily on first encrypt/decrypt call, not at bean
 * construction — the app still starts fine without it; only saving or
 * reading an LLM provider config fails, with a clear message, until it's
 * set. Never log or return the decrypted value outside
 * LlmProviderConfigService's internal-only path.
 */
@Component
public class ApiKeyCipher {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH_BYTES = 12;
    private static final int GCM_TAG_LENGTH_BITS = 128;

    private final SecureRandom secureRandom = new SecureRandom();

    public String encrypt(String plaintext) {
        try {
            SecretKeySpec key = loadKey();
            byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            byte[] combined = new byte[iv.length + ciphertext.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(ciphertext, 0, combined, iv.length, ciphertext.length);
            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to encrypt API key", e);
        }
    }

    public String decrypt(String encoded) {
        try {
            SecretKeySpec key = loadKey();
            byte[] combined = Base64.getDecoder().decode(encoded);

            byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
            byte[] ciphertext = new byte[combined.length - GCM_IV_LENGTH_BYTES];
            System.arraycopy(combined, 0, iv, 0, iv.length);
            System.arraycopy(combined, iv.length, ciphertext, 0, ciphertext.length);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
            return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to decrypt API key", e);
        }
    }

    private SecretKeySpec loadKey() {
        String encoded = System.getenv("LLM_CONFIG_ENCRYPTION_KEY");
        if (encoded == null || encoded.isBlank()) {
            throw new IllegalStateException(
                    "LLM_CONFIG_ENCRYPTION_KEY is not set — generate one with `openssl rand -base64 32`");
        }
        byte[] keyBytes = Base64.getDecoder().decode(encoded);
        if (keyBytes.length != 32) {
            throw new IllegalStateException("LLM_CONFIG_ENCRYPTION_KEY must decode to 32 bytes (AES-256)");
        }
        return new SecretKeySpec(keyBytes, "AES");
    }
}