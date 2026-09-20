# syntax = docker/dockerfile:1

ARG NODE_VERSION=22.14.0
FROM node:${NODE_VERSION}-slim as base

LABEL fly_launch_runtime="Node.js"

WORKDIR /app


# Build stage
FROM base as build
ENV NODE_ENV="development"
RUN apt-get update -qq && \
    apt-get install -y build-essential pkg-config python-is-python3
COPY --link package-lock.json package.json ./
RUN npm ci
COPY --link . .
RUN npm run build


# Production stage
FROM base
ENV NODE_ENV="production"
COPY --from=build /app /app
EXPOSE 3000
CMD [ "npm", "run", "start" ]
