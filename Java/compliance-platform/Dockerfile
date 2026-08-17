# ── Build stage ──────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app

COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B dependency:go-offline

COPY backend ./backend
RUN ./mvnw -B clean package -DskipTests

# ── Run stage ────────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

# The app runs behind Spring Security (no custom SecurityConfig yet), so every
# HTTP path — including /actuator/health — currently answers 401 rather than
# 200. A TCP-level check confirms the JVM is up and listening without needing
# credentials; swap for a real HTTP healthcheck once endpoints are unlocked.
HEALTHCHECK --interval=15s --timeout=3s --start-period=45s --retries=5 \
  CMD bash -c 'exec 3<>/dev/tcp/127.0.0.1/8080' || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]