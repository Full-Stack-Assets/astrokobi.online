#!/bin/bash

# Build script that handles TinaCMS configuration gracefully
# If TinaCMS credentials are not provided, we skip the TinaCMS cloud build

# Check if TinaCMS credentials are set
if [ -z "$NEXT_PUBLIC_TINA_CLIENT_ID" ] || [ -z "$TINA_TOKEN" ]; then
  echo "⚠️  TinaCMS credentials not found. Skipping TinaCMS cloud build..."
  echo "ℹ️  TinaCMS will run in self-hosted mode (local filesystem editing)"
else
  echo "ℹ️  TinaCMS credentials found. Building with cloud support..."

  # Run TinaCMS build when credentials are provided
  echo "🔨 Building TinaCMS admin..."
  npx tinacms build
fi

# Run Next.js build — and propagate its exit code. Without this the script
# always exited 0 and printed success, letting a failed `next build` (e.g. a
# post with malformed MDX aborting prerender) masquerade as a green build.
echo "🔨 Building Next.js app..."
if ! npx next build; then
  echo "❌ next build failed"
  exit 1
fi

echo "✅ Build completed successfully!"
