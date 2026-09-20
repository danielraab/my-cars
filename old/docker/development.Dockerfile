# Set the base image to node:__-alpine
FROM node:16-alpine as build

# Specify where our app will live in the container
WORKDIR /app

# Copy the React App to the container
VOLUME /app

EXPOSE 3000

ENTRYPOINT [ "sh", "./docker/development.entrypoint.sh" ]