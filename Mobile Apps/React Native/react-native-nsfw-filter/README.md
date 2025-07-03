# React Native NSFW Filter

A React Native library for detecting NSFW (Not Safe For Work) content in images using TensorFlow.js. This package provides an easy-to-use interface for classifying images into categories like Drawing, Hentai, Neutral, Porn, and Sexy.

## Features

- 🔍 **Image Classification**: Classify images into 5 categories (Drawing, Hentai, Neutral, Porn, Sexy)
- 🚫 **NSFW Detection**: Simple boolean check for NSFW content with customizable threshold
- 📱 **React Native Compatible**: Works with both iOS and Android
- 🎯 **TypeScript Support**: Full TypeScript support with type definitions
- ⚡ **Optimized**: Built on TensorFlow.js for fast, on-device inference
- 🔧 **Customizable**: Configurable image size, top-K results, and detection thresholds

## Installation

```bash
npm install react-native-nsfw-filter
```

> **✅ Now Available on npm!** The package has been published and is ready for use.

### Required Peer Dependencies

You'll need to install these dependencies if they're not already in your project:

```bash
npm install @tensorflow/tfjs @tensorflow/tfjs-react-native expo-image-manipulator expo-gl @react-native-async-storage/async-storage react-native-fs
```

For Expo projects:

```bash
npx expo install expo-image-manipulator expo-gl @react-native-async-storage/async-storage react-native-fs
```

> **Note**: For React Native CLI projects, you may need to run `cd ios && pod install` after installing `react-native-fs`.

### Additional Setup

1. **Configure Metro** to handle `.bin` model files by creating/updating `metro.config.js` in your project root:

```javascript
// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add .bin to the asset extensions
config.resolver.assetExts.push("bin");

module.exports = config;
```

2. **Initialize TensorFlow.js** in your app's entry point (usually `App.js` or `App.tsx`):

```javascript
import "@tensorflow/tfjs-react-native";
```

3. **Download the model files**: You'll need the NSFW detection model files. You can use the ones provided in this package or train your own.

## Usage

### Basic Usage

```typescript
import React, { useEffect, useState } from "react";
import { View, Button, Image, Text } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { NSFWFilter, NSFWPrediction } from "react-native-nsfw-filter";

// Import your model files
const modelJson = require("./assets/model/model.json");
const modelWeights = [require("./assets/model/group1-shard1of1.bin")];

const App = () => {
  const [nsfwFilter, setNsfwFilter] = useState<NSFWFilter | null>(null);
  const [predictions, setPredictions] = useState<NSFWPrediction[]>([]);
  const [imageUri, setImageUri] = useState<string>("");

  useEffect(() => {
    const initializeFilter = async () => {
      const filter = new NSFWFilter();
      await filter.loadModel(modelJson, modelWeights);
      setNsfwFilter(filter);
    };

    initializeFilter();
  }, []);

  const pickAndAnalyzeImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && nsfwFilter) {
      const uri = result.assets[0].uri;
      setImageUri(uri);

      // Get detailed predictions
      const predictions = await nsfwFilter.classifyImage(uri);
      setPredictions(predictions);

      // Or just check if it's NSFW
      const isNSFW = await nsfwFilter.isImageNSFW(uri, 0.6);
      console.log("Is NSFW:", isNSFW);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button title="Pick and Analyze Image" onPress={pickAndAnalyzeImage} />

      {imageUri && (
        <Image source={{ uri: imageUri }} style={{ width: 200, height: 200 }} />
      )}

      {predictions.map((prediction, index) => (
        <Text key={index}>
          {prediction.className}: {(prediction.probability * 100).toFixed(2)}%
        </Text>
      ))}
    </View>
  );
};

export default App;
```

### Advanced Usage

```typescript
import { NSFWFilter, NSFWClass } from "react-native-nsfw-filter";

// Create filter with custom options
const nsfwFilter = new NSFWFilter({
  imageSize: { width: 224, height: 224 },
  topK: 3, // Only return top 3 predictions
});

// Load model
await nsfwFilter.loadModel(modelJson, modelWeights);

// Get specific class confidence
const pornConfidence = await nsfwFilter.getClassConfidence(
  imageUri,
  NSFWClass.Porn
);

// Check with custom threshold
const isNSFW = await nsfwFilter.isImageNSFW(imageUri, 0.8); // 80% threshold

// Clean up when done
nsfwFilter.dispose();
```

## API Reference

### `NSFWFilter`

The main class for NSFW content detection.

#### Constructor

```typescript
new NSFWFilter(options?: NSFWFilterOptions)
```

**Options:**

- `imageSize?: { width: number; height: number }` - Image size for model input (default: 224x224)
- `topK?: number` - Number of top predictions to return (default: 5)

#### Methods

##### `loadModel(modelJson: any, modelWeights: any[]): Promise<void>`

Load the NSFW detection model.

##### `isModelLoaded(): boolean`

Check if the model is loaded and ready for inference.

##### `classifyImage(imageUri: string): Promise<NSFWPrediction[]>`

Classify an image and return predictions with probabilities.

##### `isImageNSFW(imageUri: string, threshold?: number): Promise<boolean>`

Check if an image is likely NSFW. Default threshold is 0.6 (60%).

##### `getClassConfidence(imageUri: string, className: NSFWClass): Promise<number>`

Get the confidence score for a specific class.

##### `dispose(): void`

Clean up the model and free memory.

### Types

#### `NSFWPrediction`

```typescript
interface NSFWPrediction {
  className: string;
  probability: number;
}
```

#### `NSFWClass`

```typescript
enum NSFWClass {
  Drawing = "Drawing",
  Hentai = "Hentai",
  Neutral = "Neutral",
  Porn = "Porn",
  Sexy = "Sexy",
}
```

## Model Files

You'll need to include the model files in your project. The model consists of:

- `model.json` - Model architecture
- `group1-shard1of1.bin` - Model weights

Place these files in your `assets/model/` directory and import them as shown in the usage examples.

## Performance Considerations

- **Memory Management**: Always call `dispose()` when you're done with the filter to free up memory
- **Image Size**: Larger images will be automatically resized, but consider resizing before classification for better performance
- **Model Loading**: Load the model once and reuse the filter instance for multiple classifications

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Credits

This library is built upon the excellent work by [Infinite Red](https://infinite.red/) and their [NSFWJS](https://github.com/infinitered/nsfwjs) project. Special thanks to:

- **[NSFWJS](https://github.com/infinitered/nsfwjs)** - The original JavaScript library for NSFW content detection
- **[NSFWJS Mobile](https://github.com/infinitered/nsfwjs-mobile)** - Mobile implementation that served as inspiration
- **[Infinite Red](https://infinite.red/)** - For creating and maintaining the foundational NSFW detection technology

This React Native implementation builds upon their work, with fixes and optimizations specifically for React Native environments using TensorFlow.js React Native.
