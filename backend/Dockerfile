# Multi-stage build: compile the jar with JDK 21, run on a slim JRE 21.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Tests need a Postgres (run in CI, not here), so skip them in the image build.
RUN mvn -B clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
# Render injects PORT; the app already binds to ${PORT:8080}.
EXPOSE 8080
# JAVA_TOOL_OPTIONS (set in render.yaml) caps heap for the 512MB free tier.
ENTRYPOINT ["java", "-jar", "app.jar"]
