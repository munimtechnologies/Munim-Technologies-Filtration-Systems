/**
 * NSFW Detection for Chrome Extension
 * Adapted from react-native-nsfw-filter for web browsers
 */

class NSFWDetector {
  constructor() {
    this.model = null;
    this.isLoading = false;
    this.isLoaded = false;
    this.imageSize = { width: 224, height: 224 };
    this.classes = {
      0: "Drawing",
      1: "Hentai",
      2: "Neutral",
      3: "Porn",
      4: "Sexy",
    };
  }

  /**
   * Load the NSFW detection model
   */
  async loadModel() {
    if (this.isLoaded || this.isLoading) {
      return;
    }

    try {
      this.isLoading = true;
      console.log("🤖 Loading NSFW detection model...");

      // Load TensorFlow.js model
      this.model = await tf.loadLayersModel(
        chrome.runtime.getURL("model/model.json")
      );

      this.isLoaded = true;
      this.isLoading = false;
      console.log("✅ NSFW model loaded successfully");
    } catch (error) {
      this.isLoading = false;
      console.error("❌ Failed to load NSFW model:", error);
      throw error;
    }
  }

  /**
   * Check if model is ready
   */
  isModelReady() {
    return this.isLoaded && this.model !== null;
  }

  /**
   * Preprocess image for model input
   */
  async preprocessImage(imageElement) {
    return tf.tidy(() => {
      // Convert image to tensor
      let tensor = tf.browser.fromPixels(imageElement);

      // Resize to model input size (224x224)
      tensor = tf.image.resizeBilinear(tensor, [
        this.imageSize.height,
        this.imageSize.width,
      ]);

      // Normalize pixel values to 0-1
      tensor = tensor.div(255.0);

      // Add batch dimension
      tensor = tensor.expandDims(0);

      return tensor;
    });
  }

  /**
   * Get top predictions from model logits
   */
  async getTopPredictions(logits, topK = 5) {
    const values = await logits.data();
    const predictions = [];

    for (let i = 0; i < values.length; i++) {
      predictions.push({
        className: this.classes[i],
        probability: values[i],
      });
    }

    // Sort by probability descending
    predictions.sort((a, b) => b.probability - a.probability);

    return predictions.slice(0, topK);
  }

  /**
   * Classify an image element
   */
  async classifyImage(imageElement) {
    if (!this.isModelReady()) {
      throw new Error("Model not loaded. Call loadModel() first.");
    }

    try {
      console.log("🔍 Analyzing image for NSFW content...");

      // Preprocess image
      const imageTensor = await this.preprocessImage(imageElement);

      // Run prediction
      const logits = this.model.predict(imageTensor);

      // Get predictions
      const predictions = await this.getTopPredictions(logits);

      // Clean up tensors
      imageTensor.dispose();
      logits.dispose();

      console.log("📊 NSFW predictions:", predictions);
      return predictions;
    } catch (error) {
      console.error("❌ Error classifying image:", error);
      throw error;
    }
  }

  /**
   * Check if image is likely NSFW
   */
  async isImageNSFW(imageElement, threshold = 0.6) {
    const predictions = await this.classifyImage(imageElement);
    const topPrediction = predictions[0];

    const nsfwClasses = ["Porn", "Hentai", "Sexy"];
    const isNSFW =
      nsfwClasses.includes(topPrediction.className) &&
      topPrediction.probability >= threshold;

    console.log(
      `🔞 Image NSFW check: ${isNSFW ? "NSFW" : "Safe"} (${
        topPrediction.className
      }: ${(topPrediction.probability * 100).toFixed(1)}%)`
    );

    return {
      isNSFW: isNSFW,
      topPrediction: topPrediction,
      allPredictions: predictions,
    };
  }

  /**
   * Analyze multiple images on a page
   */
  async analyzePageImages(options = {}) {
    const {
      threshold = 0.6,
      maxImages = 10,
      skipSmallImages = true,
      minImageSize = 100,
    } = options;

    if (!this.isModelReady()) {
      await this.loadModel();
    }

    console.log("🖼️ Starting page image analysis...");

    const images = document.querySelectorAll("img");
    const results = [];
    let processed = 0;

    for (const img of images) {
      if (processed >= maxImages) break;

      // Skip small images if option is enabled
      if (
        skipSmallImages &&
        (img.width < minImageSize || img.height < minImageSize)
      ) {
        continue;
      }

      // Skip if image not loaded
      if (!img.complete || img.naturalWidth === 0) {
        continue;
      }

      try {
        const analysis = await this.isImageNSFW(img, threshold);

        results.push({
          element: img,
          src: img.src,
          alt: img.alt || "",
          width: img.width,
          height: img.height,
          ...analysis,
        });

        processed++;
      } catch (error) {
        console.warn("⚠️ Could not analyze image:", img.src, error);
      }
    }

    const nsfwCount = results.filter((r) => r.isNSFW).length;
    console.log(
      `✅ Analyzed ${results.length} images, found ${nsfwCount} potentially NSFW`
    );

    return {
      totalAnalyzed: results.length,
      nsfwFound: nsfwCount,
      results: results,
    };
  }

  /**
   * Dispose of the model
   */
  dispose() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.isLoaded = false;
      console.log("🗑️ NSFW model disposed");
    }
  }
}

// Create global instance
window.nsfwDetector = new NSFWDetector();
