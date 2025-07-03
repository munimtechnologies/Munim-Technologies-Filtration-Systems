# Installation Guide - React Native NSFW Filter

This guide will help you install and integrate the React Native NSFW Filter into your existing or new React Native applications.

## Quick Start

### 1. Install the Package

Currently, the package is not published to npm. You can install it directly from the source:

```bash
# If the package is published to npm (future):
npm install react-native-nsfw-filter

# For now, you can use it as a local package:
# Copy the react-native-nsfw-filter folder to your project and install it locally
npm install ./react-native-nsfw-filter
```

### 2. Install Required Dependencies

```bash
npm install @tensorflow/tfjs @tensorflow/tfjs-react-native expo-image-manipulator base-64 jpeg-js
```

For Expo projects:

```bash
expo install expo-image-manipulator
```

### 3. Setup TensorFlow.js

Add this import to your app's entry point (usually `App.js` or `App.tsx`):

```javascript
import "@tensorflow/tfjs-react-native";
```

### 4. Add Model Files

1. Create an `assets/model/` directory in your project
2. Copy the model files:
   - `model.json` - Model architecture
   - `group1-shard1of1.bin` - Model weights

You can find these files in the `react-native-nsfw-filter/assets/model/` directory.

### 5. Basic Implementation

```typescript
import React, { useEffect, useState } from "react";
import { View, Button, Text, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { NSFWFilter, NSFWPrediction } from "react-native-nsfw-filter";

// Import your model files
const modelJson = require("./assets/model/model.json");
const modelWeights = [require("./assets/model/group1-shard1of1.bin")];

const MyComponent = () => {
  const [nsfwFilter, setNsfwFilter] = useState<NSFWFilter | null>(null);

  useEffect(() => {
    const initializeFilter = async () => {
      const filter = new NSFWFilter();
      await filter.loadModel(modelJson, modelWeights);
      setNsfwFilter(filter);
    };

    initializeFilter();

    // Cleanup
    return () => {
      if (nsfwFilter) {
        nsfwFilter.dispose();
      }
    };
  }, []);

  const analyzeImage = async () => {
    if (!nsfwFilter) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const isNSFW = await nsfwFilter.isImageNSFW(result.assets[0].uri);
      Alert.alert("Result", isNSFW ? "NSFW Content Detected" : "Safe Content");
    }
  };

  return (
    <View>
      <Button
        title="Analyze Image"
        onPress={analyzeImage}
        disabled={!nsfwFilter}
      />
    </View>
  );
};
```

## Publishing the Package (For Maintainers)

### 1. Build the Package

```bash
cd react-native-nsfw-filter
npm install
npm run build
```

### 2. Test Locally

```bash
# In a test project
npm install /path/to/react-native-nsfw-filter
```

### 3. Publish to npm

```bash
# Make sure you're logged in to npm
npm login

# Publish the package
npm publish
```

## Integration with Existing Apps

### For Expo Projects

1. Install dependencies with `expo install`
2. Add the TensorFlow.js import to your App.js
3. Follow the basic implementation guide above

### For React Native CLI Projects

1. Install dependencies with `npm install`
2. For iOS: Run `cd ios && pod install`
3. Add the TensorFlow.js import to your index.js or App.js
4. Follow the basic implementation guide above

### For TypeScript Projects

The package includes full TypeScript support. Make sure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  }
}
```

## Troubleshooting

### Common Issues

1. **"Module not found" errors**

   - Make sure all peer dependencies are installed
   - Check that the import paths are correct

2. **Model loading fails**

   - Verify model files are in the correct location
   - Check that the files are properly included in your bundle
   - Ensure TensorFlow.js is initialized before loading the model

3. **Performance issues**

   - Consider resizing images before classification
   - Always call `dispose()` on the filter when done
   - Use the filter instance across multiple classifications instead of recreating it

4. **TypeScript errors**
   - Make sure `@types/react` and `@types/react-native` are installed
   - Update your tsconfig.json as shown above

### Platform-Specific Notes

#### iOS

- Make sure CocoaPods are installed and updated
- Run `pod install` after installing dependencies

#### Android

- Ensure your Android build tools are up to date
- Check that metro bundler is properly configured

## Example Application

Check out the complete example application in the `Example Application` folder to see a full implementation with UI, error handling, and best practices.

## Support

If you encounter issues:

1. Check this troubleshooting guide
2. Review the example application code
3. Create an issue on the GitHub repository

## Next Steps

- Customize the detection threshold based on your needs
- Implement proper error handling for production use
- Consider caching the model for better performance
- Add logging and analytics as needed
