# NSFW Detection Feature

## Overview

The Website Info Tool now includes advanced NSFW (Not Safe For Work) content detection using machine learning. This feature analyzes images on web pages to identify potentially explicit content.

## How It Works

### Technology Stack

- **TensorFlow.js**: Machine learning framework for browser-based inference
- **MobileNetV2**: Pre-trained neural network optimized for mobile/web deployment
- **Custom NSFW Model**: Trained to classify images into 5 categories:
  - 🎨 **Drawing**: Artistic/illustrated content
  - 🔞 **Hentai**: Explicit animated/illustrated content
  - ✅ **Neutral**: Safe/appropriate content
  - 🔞 **Porn**: Explicit photographic content
  - 🔞 **Sexy**: Suggestive/revealing content

### Analysis Process

1. **Image Collection**: Scans all images on the current webpage
2. **Preprocessing**: Resizes images to 224x224 pixels and normalizes pixel values
3. **ML Inference**: Runs images through the trained neural network
4. **Classification**: Assigns confidence scores for each category
5. **Safety Assessment**: Determines if content is NSFW based on threshold

## Features

### Automatic Analysis

- Quick scan of up to 3 large images (>150px) during page load
- Threshold set to 70% confidence for initial analysis
- Results displayed in the Content Safety section

### Manual Analysis

- **🔞 Analyze Images** button for comprehensive analysis
- Scans up to 20 images with lower size threshold (>50px)
- Uses 60% confidence threshold for broader detection
- Real-time progress indication

### Safety Scoring

- **Green (90%+ Safe)**: Minimal NSFW content detected
- **Orange (70-89% Safe)**: Some potentially inappropriate content
- **Red (<70% Safe)**: Significant NSFW content detected

## Usage

### Basic Usage

1. Open the Website Info Tool on any webpage
2. The extension automatically performs a quick NSFW scan
3. View results in the "🔞 Content Safety" section

### Detailed Analysis

1. Click the "🔞 Analyze Images" button
2. Wait for the analysis to complete (indicated by button state)
3. Review detailed results including:
   - Number of NSFW images found
   - Total images analyzed
   - Overall safety percentage

### Copy to Clipboard

The NSFW analysis results are included when copying website information, providing a complete safety report.

## Privacy & Security

### Local Processing

- All image analysis happens locally in your browser
- No images or analysis results are sent to external servers
- Complete privacy protection for sensitive content

### Model Loading

- TensorFlow.js model loaded from your React Native project
- Approximately 5MB model size
- One-time download per browser session

### Permissions

- Only requires access to the current tab
- No persistent storage of analysis results
- No network requests to external ML services

## Technical Details

### Model Specifications

- **Input**: 224x224x3 RGB images
- **Output**: 5-class probability distribution
- **Architecture**: MobileNetV2 with custom classification head
- **Size**: ~5MB compressed

### Performance

- **Analysis Speed**: ~200ms per image on modern hardware
- **Memory Usage**: ~50MB during analysis
- **Accuracy**: >90% on test datasets

### Configuration Options

```javascript
// Analysis settings
{
  threshold: 0.6,        // Confidence threshold (0-1)
  maxImages: 20,         // Maximum images to analyze
  skipSmallImages: true, // Skip images smaller than minImageSize
  minImageSize: 50       // Minimum image size in pixels
}
```

## Limitations

### Content Types

- Only analyzes static images (JPG, PNG, GIF frames)
- Does not analyze video content or dynamic media
- Text-based content not evaluated

### Accuracy Considerations

- AI model may have false positives/negatives
- Cultural and contextual nuances may not be captured
- Artistic or medical content may be misclassified

### Performance

- Analysis time increases with number of images
- Large images require more processing time
- Older devices may experience slower performance

## Troubleshooting

### Common Issues

**"Model not loaded" Error**

- Ensure internet connection for initial TensorFlow.js download
- Refresh the page and try again
- Check browser console for detailed error messages

**Slow Analysis**

- Reduce maxImages setting for faster processing
- Close other browser tabs to free up memory
- Check if browser supports WebGL acceleration

**Inaccurate Results**

- Adjust threshold settings (higher = more strict)
- Consider cultural/contextual factors in classification
- Report persistent issues for model improvement

### Debug Mode

Enable debug logging by opening browser developer tools (F12) to view:

- Model loading progress
- Image analysis details
- Performance metrics
- Error diagnostics

## Changelog

### Version 1.0

- Initial NSFW detection implementation
- Integration with Website Info Tool
- Automatic and manual analysis modes
- Safety scoring system
- Privacy-focused local processing

## Credits

Based on the excellent work by:

- **Infinite Red**: Original NSFWJS project
- **TensorFlow.js Team**: Browser ML framework
- **MobileNet**: Efficient neural network architecture
- **Munim Technologies**: Chrome extension integration

## Support

For issues, suggestions, or improvements:

1. Check browser developer console for error details
2. Verify TensorFlow.js compatibility with your browser
3. Ensure sufficient memory and processing power
4. Report bugs with specific webpage URLs and browser version
