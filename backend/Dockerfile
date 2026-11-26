# syntax=docker/dockerfile:1

# Stage 1: Build executable Spring Boot JAR with Maven and Java 21
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app

COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B package -DskipTests

# Stage 2: Lightweight Java 21 runtime
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring

COPY --from=builder /app/target/*.jar app.jar
RUN chown spring:spring app.jar

USER spring:spring

EXPOSE 8080

# server.port=${PORT:8080} in application.properties binds to Render's PORT at runtime
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
