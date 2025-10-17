#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Installing dependencies..."
npm ci

echo "Building application..."
npm run build

echo "Build complete. Checking dist directory..."
ls -la dist/

echo "Checking main.js exists..."
if [ -f "dist/main.js" ]; then
    echo "✅ dist/main.js found!"
else
    echo "❌ dist/main.js NOT found!"
    exit 1
fi
