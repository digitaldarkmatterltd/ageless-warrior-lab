#!/bin/bash
set -e

echo "Installing dependencies..."
pnpm install

echo "Running database migrations..."
pnpm db:push

echo "Building application..."
pnpm build

echo "Build complete!"
