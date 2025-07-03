# Munim Technologies Filtration Systems

Advanced content filtering solutions for web and mobile applications.

## 📁 Project Structure

### 🌐 Websites

Web-based filtering solutions and admin dashboards.

### 📱 Mobile Apps

Mobile applications and libraries for content filtering.

#### React Native NSFW Filter

A comprehensive React Native library for detecting NSFW (Not Safe For Work) content in images using TensorFlow.js.

**Location:** `Mobile Apps/React Native/`

**Components:**

- **📦 `react-native-nsfw-filter/`** - The main npm package/library
- **📱 `Example Application/`** - Complete example implementation

### 🔧 Installation & Usage

For detailed installation instructions, see [`Mobile Apps/React Native/INSTALLATION.md`](Mobile%20Apps/React%20Native/INSTALLATION.md)

**Quick Start:**

```bash
# Install the package (when published)
npm install react-native-nsfw-filter

# Install required dependencies
npm install @tensorflow/tfjs @tensorflow/tfjs-react-native expo-image-manipulator

# Use in your app
import { NSFWFilter } from 'react-native-nsfw-filter';
```

### 🚀 Features

- **🔍 Image Classification**: Detect and classify NSFW content in images
- **📱 Cross-Platform**: Works on both iOS and Android
- **⚡ Fast**: On-device processing using TensorFlow.js
- **🎯 TypeScript**: Full TypeScript support with type definitions
- **🔧 Customizable**: Configurable thresholds and options

### 🎯 Use Cases

- **Social Media Apps**: Filter user-uploaded content
- **E-commerce**: Moderate product images
- **Dating Apps**: Content moderation for profile pictures
- **Forums & Communities**: Automatic content filtering
- **Enterprise**: Workplace-appropriate content filtering

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For questions and support, please create an issue in the repository.
