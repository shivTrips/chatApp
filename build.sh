#!/bin/bash
set -e  # Exit on any error

echo "=== Starting build process ==="
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

echo "=== Installing dependencies ==="
yarn install --frozen-lockfile

echo "=== Building frontend ==="
cd client
echo "Client directory contents:"
ls -la

# Create .env file for the client
echo "VITE_API_URL=https://chat-app.onrender.com" > .env

# Install client dependencies explicitly
echo "Installing client dependencies..."
yarn install

# Build with explicit NODE_ENV
echo "Building frontend..."
NODE_ENV=production yarn build

# Verify the build
echo "Verifying build output..."
if [ ! -d "dist" ]; then
    echo "ERROR: dist directory not created!"
    exit 1
fi

echo "Dist directory contents:"
ls -la dist/

if [ ! -f "dist/index.html" ]; then
    echo "ERROR: index.html not found in dist directory!"
    exit 1
fi

cd ..

echo "=== Building backend ==="
cd server
echo "Server directory contents:"
ls -la

# Install server dependencies explicitly
echo "Installing server dependencies..."
yarn install

cd ..

echo "=== Final directory structure ==="
ls -la
echo "Client dist contents:"
ls -la client/dist/

echo "=== Build complete ===" 