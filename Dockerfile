# =====================================================================
# Multi-Stage Dockerfile for PDF Document Generator
#
# Stage 1 (node-builder):  Build React frontend  → dist/
# Stage 2 (maven-builder): Build Spring Boot JAR (copies dist/ inside)
# Stage 3 (runtime):       Minimal JRE image to run the JAR
#
# Build: docker build -t docgen-app .
# Run:   docker run -p 8080:8080 -e DATABASE_URL="..." docgen-app
# =====================================================================

# ---- Stage 1: Build React Frontend ----
FROM node:20-alpine AS node-builder

WORKDIR /app/frontend

# Copy only dependency files first for better layer caching
COPY frontend/package.json frontend/package-lock.json ./

# Clean install (respects package-lock.json exactly)
RUN npm ci

# Copy the rest of the frontend source and build
COPY frontend/ ./
RUN npm run build
# Output: /app/frontend/dist/


# ---- Stage 2: Build Spring Boot JAR ----
FROM eclipse-temurin:17-jdk-alpine AS maven-builder

WORKDIR /app/backend

# Copy Maven wrapper and pom first (dependency caching)
COPY backend/mvnw backend/pom.xml ./
COPY backend/.mvn .mvn/

# Pre-download Maven dependencies
RUN ./mvnw dependency:go-offline -q

# Copy the built React assets from Stage 1
COPY --from=node-builder /app/frontend/dist src/main/resources/static/

# Copy the backend source
COPY backend/src src/

# Build the JAR, skipping tests and skipping the frontend-maven-plugin
# (the React app is already built and copied above)
RUN ./mvnw package -DskipTests \
    -Dfrontend.skip=true \
    -Dmaven.test.skip=true \
    -q

# Output: /app/backend/target/backend-0.0.1-SNAPSHOT.jar


# ---- Stage 3: Minimal Runtime Image ----
FROM eclipse-temurin:17-jre-alpine AS runtime

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy the JAR from the build stage
COPY --from=maven-builder /app/backend/target/backend-0.0.1-SNAPSHOT.jar app.jar

# Create the PDF storage directory and set permissions
RUN mkdir -p /app/generated_pdfs && chown -R appuser:appgroup /app

USER appuser

# Expose the production port
EXPOSE 8080

# Health check — calls the templates API to verify the app is up
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:8080/api/templates || exit 1

# Start the application with the production profile
ENTRYPOINT ["java", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-Dspring.profiles.active=prod", \
  "-Dpdf.storage.dir=/app/generated_pdfs", \
  "-jar", "app.jar"]
