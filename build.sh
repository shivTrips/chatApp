#!/bin/bash

# Install frontend dependencies and build
echo "Building frontend..."
cd client
npm install
npx vite build
cd ..

# Install backend dependencies
echo "Building backend..."
cd server
npm install
cd ..

echo "Build complete!" 