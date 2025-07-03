# 🚀 Quick Start - React Native NSFW Filter

Get up and running with NSFW content detection in your React Native app in just a few minutes!

## ⚡ 5-Minute Setup

### 1. Install the Package

```bash
# Install from npm
npm install react-native-nsfw-filter

# Install required dependencies
npm install @tensorflow/tfjs @tensorflow/tfjs-react-native expo-image-manipulator
```

### 2. Initialize TensorFlow

Add to your `App.js` or `App.tsx`:

```javascript
import "@tensorflow/tfjs-react-native";
```

### 3. Copy Model Files

The model files are included with the npm package. Copy them to your project:

```bash
# Create assets directory
mkdir -p assets/model

# Copy model files from node_modules
cp node_modules/react-native-nsfw-filter/assets/model/* assets/model/
```

### 4. Use in Your Component

```typescript
import React, { useEffect, useState } from "react";
import { View, Button, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { NSFWFilter } from "react-native-nsfw-filter";

const modelJson = require("./assets/model/model.json");
const modelWeights = [require("./assets/model/group1-shard1of1.bin")];

export default function App() {
  const [filter, setFilter] = useState(null);

  useEffect(() => {
    const init = async () => {
      const nsfwFilter = new NSFWFilter();
      await nsfwFilter.loadModel(modelJson, modelWeights);
      setFilter(nsfwFilter);
    };
    init();
  }, []);

  const checkImage = async () => {
    if (!filter) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) {
      const isNSFW = await filter.isImageNSFW(result.assets[0].uri);
      Alert.alert(isNSFW ? "🚫 NSFW Detected" : "✅ Safe Content");
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Button title="Test Image" onPress={checkImage} disabled={!filter} />
    </View>
  );
}
```

## 🎯 That's It!

Your app now has NSFW detection capabilities. The example above shows the simplest possible implementation.

## 📖 Next Steps

- Check out the [full example app](Example%20Application/) for a complete implementation
- Read the [detailed installation guide](INSTALLATION.md) for advanced usage
- Explore the [API documentation](react-native-nsfw-filter/README.md) for all available methods

## 🔧 Common Use Cases

### Basic NSFW Check

```typescript
const isNSFW = await filter.isImageNSFW(imageUri);
```

### Get Detailed Classifications

```typescript
const predictions = await filter.classifyImage(imageUri);
// Returns: [{ className: 'Neutral', probability: 0.95 }, ...]
```

### Custom Threshold

```typescript
const isNSFW = await filter.isImageNSFW(imageUri, 0.8); // 80% threshold
```

### Check Specific Category

```typescript
const pornConfidence = await filter.getClassConfidence(
  imageUri,
  NSFWClass.Porn
);
```

## ⚠️ Important Notes

- Always call `filter.dispose()` when done to free memory
- Load the model once and reuse the filter instance
- The initial model load may take a few seconds
- Larger images are automatically resized for processing

## 🆘 Need Help?

- Check the [troubleshooting guide](INSTALLATION.md#troubleshooting)
- Look at the [example application](Example%20Application/)
- Create an issue if you're stuck

## 🙏 Credits

Built upon [Infinite Red's NSFWJS](https://github.com/infinitered/nsfwjs) with fixes for React Native. Please star their original repository!
