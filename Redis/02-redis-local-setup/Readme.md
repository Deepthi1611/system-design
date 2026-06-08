# Redis Local Setup

This folder contains a `docker-compose.yml` file for running Redis locally with Docker Compose.

Docker Compose lets you define containers, ports, commands, and storage volumes in one YAML file.

## What the file contains

```yml
services:
  redis:
    image: redis:7-alpine
    container_name: redis-demo
    ports:
      - "6379:6379"
    command: ["redis-server", "--appendonly", "yes"]
    volumes:
      - redis-data:/data
```

This defines a Redis container.

## Redis service

```yml
redis:
```

This is the service name. Docker Compose uses this name to identify the Redis service.

## Redis image

```yml
image: redis:7-alpine
```

This tells Docker to use the official Redis image.

`redis:7-alpine` means:

- `redis`: use the Redis image.
- `7`: use Redis version 7.
- `alpine`: use a smaller Linux-based image.

Alpine images are lightweight, so they are commonly used for local development and simple deployments.

## Container name

```yml
container_name: redis-demo
```

This sets the container name to `redis-demo`.

Without this, Docker Compose generates a name automatically.

## Port mapping

```yml
ports:
  - "6379:6379"
```

This maps port `6379` on your machine to port `6379` inside the Redis container.

Redis uses port `6379` by default.

Because of this mapping, applications running on your machine can connect to Redis at:

```txt
localhost:6379
```

## Redis command

```yml
command: ["redis-server", "--appendonly", "yes"]
```

This starts Redis with Append Only File persistence enabled.

AOF means Append Only File.

It records write operations so Redis can restore data after the container restarts.

Simple idea:

```txt
Redis receives write command
Redis stores it in memory
Redis also appends the command to a file
If Redis restarts, it replays the file
```

This is useful because Redis is mainly in-memory, and AOF helps preserve data.

## Volumes

```yml
volumes:
  - redis-data:/data
```

This mounts a Docker volume called `redis-data` to `/data` inside the Redis container.

Redis stores persistent data inside `/data`.

The volume helps data survive container restarts.

At the bottom of the file:

```yml
volumes:
  redis-data:
  mongo-data:
```

This declares named Docker volumes.

A named volume is storage managed by Docker.

## Mongo section note

The file also contains this section:

```yml
mongo:
  image: mongo:7
  container_name: mongo-demo
  ports:
    - "27017:27017"
  environment:
    MONGO_INITDB_DATABASE: redis_demo
  volumes:
    - mongo-data:/data/db
```

This looks like it is meant to define a MongoDB service.

```yml
services:
  redis:
    ...

  mongo:
    ...
```

## Mongo service meaning

```yml
image: mongo:7
```

Use MongoDB version 7.

```yml
container_name: mongo-demo
```

Name the container `mongo-demo`.

```yml
ports:
  - "27017:27017"
```

Expose MongoDB on:

```txt
localhost:27017
```

```yml
MONGO_INITDB_DATABASE: redis_demo
```

Create an initial database named `redis_demo`.

```yml
volumes:
  - mongo-data:/data/db
```

Store MongoDB data in the `mongo-data` Docker volume.

## How to start Redis

From this folder, run:

```bash
docker compose up
```

To run it in the background:

```bash
docker compose up -d
```

## How to stop it

```bash
docker compose down
```

This stops and removes the containers.

The named volumes remain, so data can survive.

## How to stop and remove stored data

```bash
docker compose down -v
```

The `-v` flag removes the named volumes too.

Use this when you want a clean reset.

## How to connect to Redis

If the container is running, connect using:

```bash
docker exec -it redis-demo redis-cli
```

Then test Redis:

```txt
SET name Deepthi
GET name
```

Expected result:

```txt
"Deepthi"
```

## Usage in an application

An application running on your machine can connect to Redis using:

```txt
host: localhost
port: 6379
```

Example connection URL:

```txt
redis://localhost:6379
```

## Summary

- The Compose file starts Redis locally.
- Redis runs on port `6379`.
- Redis uses AOF persistence with `--appendonly yes`.
- Redis data is stored in the `redis-data` Docker volume.
- The file also includes a MongoDB section, but its current indentation should be checked if you want Mongo to run as a separate service.
