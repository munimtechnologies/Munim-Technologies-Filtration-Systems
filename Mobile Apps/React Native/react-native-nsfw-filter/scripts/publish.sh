#!/bin/bash

# React Native NSFW Filter - Publish Script
echo "🚀 Publishing react-native-nsfw-filter..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the react-native-nsfw-filter directory."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Build the package
echo "🔨 Building TypeScript..."
npm run build

# Check if build was successful
if [ ! -d "lib" ]; then
    echo "❌ Error: Build failed. lib directory not found."
    exit 1
fi

echo "✅ Build successful!"

# Optional: Run tests if they exist
if [ -f "package.json" ] && grep -q "\"test\"" package.json; then
    echo "🧪 Running tests..."
    npm test
fi

# Check if user wants to publish
read -p "🚀 Ready to publish to npm? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📤 Publishing to npm..."
    npm publish
    echo "✅ Package published successfully!"
else
    echo "📦 Package built but not published. You can publish later with 'npm publish'"
fi

echo "🎉 Done!" 