package com.cddp.config;

import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

import static org.springframework.security.config.Customizer.withDefaults;

/**
 * Closes the auth gap flagged repeatedly across earlier sessions: this app
 * had spring-security-oauth2-authorization-server + oauth2-client on the
 * classpath but zero configuration, so Spring Boot's default in-memory-user
 * autoconfiguration backed off (it defers to OAuth2 client machinery once
 * those classes are present) while nothing else filled the gap — every
 * {@code /api/**} request 401'd with no way to ever authenticate.
 *
 * <p>Two identities now exist:
 * <ul>
 *   <li><b>Service-to-service</b> (Python agent service): OAuth2
 *       client-credentials grant against {@code /oauth2/token}, registered
 *       via {@code spring.security.oauth2.authorizationserver.client.*} in
 *       application.properties — that registration is what activates Spring
 *       Boot's Authorization Server auto-configuration in the first place
 *       (see {@link #authorizationServerSecurityFilterChain}).
 *   <li><b>Frontend user</b>: {@code POST /api/auth/login} (see
 *       com.cddp.user.controller.AuthController) authenticates a demo admin
 *       user and mints a JWT signed with the same key the Authorization
 *       Server already auto-configures ({@link JwtEncoder}), so one
 *       resource-server config validates tokens from both paths.
 * </ul>
 *
 * <p>Three ordered {@link SecurityFilterChain}s, modeled directly on
 * Spring Boot's own {@code OAuth2AuthorizationServerWebSecurityConfiguration}
 * (read from its sources — defining any SecurityFilterChain bean ourselves
 * makes Boot's version back off entirely via
 * {@code @ConditionalOnDefaultWebSecurity}, so once we take over we must
 * cover everything that class would have):
 * <ol>
 *   <li>{@link #authorizationServerSecurityFilterChain} — the AS's own
 *       endpoints ({@code /oauth2/token}, {@code /oauth2/jwks}, etc.),
 *       matched via {@code getEndpointsMatcher()}.
 *   <li>{@link #apiSecurityFilterChain} — {@code /api/**}: stateless JWT
 *       resource server. {@code /api/internal/**} additionally requires the
 *       {@code internal.read} scope, which only the client-credentials
 *       grant above ever issues — a login-JWT can reach case/admin
 *       endpoints but never the decrypted-API-key internal endpoint.
 *   <li>{@link #defaultSecurityFilterChain} — everything else, JWT
 *       resource server too except {@code /actuator/health} (permitAll,
 *       matches the pre-existing TCP healthcheck expectation documented in
 *       the root Dockerfile).
 * </ol>
 */
@Configuration
public class SecurityConfig {

    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
        http.oauth2AuthorizationServer(authorizationServer -> {
            http.securityMatcher(authorizationServer.getEndpointsMatcher());
            authorizationServer.oidc(withDefaults());
        });
        // Not a resource server here, deliberately: the /oauth2/token
        // request itself authenticates via HTTP Basic client credentials
        // (client_id/client_secret), not a bearer JWT — layering
        // oauth2ResourceServer() on this chain (as Boot's own template
        // does) would reject that handshake before it runs.
        http.authorizeHttpRequests(authorize -> authorize.anyRequest().authenticated());
        return http.build();
    }

    @Bean
    @Order(Ordered.LOWEST_PRECEDENCE - 1)
    public SecurityFilterChain apiSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/api/**")
                .csrf(csrf -> csrf.disable()) // stateless bearer-token API, no cookies to forge
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers("/api/internal/**").hasAuthority("SCOPE_internal.read")
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(withDefaults()));
        return http.build();
    }

    @Bean
    @Order(Ordered.LOWEST_PRECEDENCE)
    public SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/actuator/health").permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(withDefaults()));
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        // Delegating, not a raw BCryptPasswordEncoder: the client secret
        // registered via spring.security.oauth2.authorizationserver.client.*
        // in application.properties is stored with a {noop} prefix (Spring
        // Security's {id}encodedPassword convention), and Spring
        // Authorization Server's client-secret matching goes through this
        // same bean. A raw BCryptPasswordEncoder doesn't understand that
        // prefix at all, so client-credentials auth always fails with
        // invalid_client until this delegates correctly.
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    /**
     * Single hardcoded demo user backing {@code POST /api/auth/login}.
     * Placeholder until the (currently empty) com.cddp.user package grows
     * a real User entity/repository — swap this bean for one backed by
     * that table without touching the filter chains above.
     */
    @Bean
    public UserDetailsService userDetailsService(
            PasswordEncoder passwordEncoder,
            @Value("${cddp.demo-admin.username}") String username,
            @Value("${cddp.demo-admin.password}") String rawPassword) {
        return new InMemoryUserDetailsManager(
                User.withUsername(username)
                        .password(passwordEncoder.encode(rawPassword))
                        .roles("ADMIN")
                        .build());
    }

    @Bean
    public AuthenticationManager authenticationManager(UserDetailsService userDetailsService, PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(provider);
    }

    /**
     * Reuses the RSA key Spring Boot's Authorization Server
     * auto-configuration already generates ({@code JWKSource<SecurityContext>}
     * — active because of the client registration in application.properties)
     * so tokens minted by AuthController and tokens issued by
     * {@code /oauth2/token} are both verifiable by the same resource-server
     * JwtDecoder, with no separate key management of our own.
     */
    @Bean
    public JwtEncoder jwtEncoder(JWKSource<SecurityContext> jwkSource) {
        return new NimbusJwtEncoder(jwkSource);
    }
}