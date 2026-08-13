FROM node:24-alpine AS web
WORKDIR /workspace/apps/web
COPY apps/web/package*.json ./
RUN npm ci
COPY apps/web ./
RUN npm run build

FROM maven:3.9.11-eclipse-temurin-21 AS api
WORKDIR /workspace
COPY apps/api/pom.xml apps/api/pom.xml
RUN mvn -f apps/api/pom.xml dependency:go-offline
COPY apps/api apps/api
COPY --from=web /workspace/apps/web/dist apps/web/dist
RUN mvn -f apps/api/pom.xml -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=api /workspace/apps/api/target/narratiaa-api-1.0.0.jar app.jar
ENV PORT=3107
EXPOSE 3107
ENTRYPOINT ["java", "-jar", "app.jar"]
