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
    if (this.isLoaded) {
      console.log("✅ NSFW model already loaded");
      return;
    }

    if (this.isLoading) {
      console.log("⏳ NSFW model already loading, waiting...");
      // Wait for current loading to complete
      while (this.isLoading) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return;
    }

    try {
      this.isLoading = true;
      console.log("🤖 Loading NSFW detection model...");

      // Update global status
      if (window.nsfwDetectorStatus) {
        window.nsfwDetectorStatus.isLoading = true;
        window.nsfwDetectorStatus.error = null;
      }

      // Verify TensorFlow.js is available and fully loaded
      if (typeof tf === "undefined") {
        throw new Error("TensorFlow.js is not available");
      }

      // Wait for TensorFlow.js to be fully initialized
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds maximum wait

      while (attempts < maxAttempts) {
        if (tf.version && typeof tf.loadLayersModel === "function") {
          console.log("📍 TensorFlow.js version:", tf.version);
          break;
        }

        console.log(
          `⏳ Waiting for TensorFlow.js to fully initialize... (${
            attempts + 1
          }/${maxAttempts})`
        );
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (attempts >= maxAttempts) {
        throw new Error(
          "TensorFlow.js failed to fully initialize after 5 seconds"
        );
      }

      // Verify required functions are available
      if (typeof tf.loadLayersModel !== "function") {
        throw new Error(
          "tf.loadLayersModel is not available - TensorFlow.js may be incomplete"
        );
      }

      console.log(
        "✅ TensorFlow.js fully initialized with version:",
        tf.version
      );

      // Get model URL and verify it's accessible
      const modelUrl = chrome.runtime.getURL("model/model.json");
      console.log("📂 Model URL:", modelUrl);

      // Try to fetch the model with extended timeout
      console.log("📥 Loading TensorFlow model from:", modelUrl);
      const loadPromise = tf.loadLayersModel(modelUrl);

      // Add timeout to model loading (increased to 30 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Model loading timeout after 30 seconds")),
          30000
        );
      });

      this.model = await Promise.race([loadPromise, timeoutPromise]);

      // Verify model loaded correctly
      if (!this.model) {
        throw new Error("Model loaded but is null/undefined");
      }

      console.log("📊 Model structure:", {
        inputs: this.model.inputs.map((input) => ({
          name: input.name,
          shape: input.shape,
        })),
        outputs: this.model.outputs.map((output) => ({
          name: output.name,
          shape: output.shape,
        })),
      });

      this.isLoaded = true;
      this.isLoading = false;
      console.log("✅ NSFW model loaded successfully");

      // Update global status
      if (window.nsfwDetectorStatus) {
        window.nsfwDetectorStatus.isLoaded = true;
        window.nsfwDetectorStatus.isLoading = false;
        window.nsfwDetectorStatus.error = null;
      }
    } catch (error) {
      this.isLoading = false;
      this.isLoaded = false;
      console.error("❌ Failed to load NSFW model:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        modelUrl: chrome.runtime.getURL("model/model.json"),
        tfAvailable: typeof tf !== "undefined",
      });

      // Update global status
      if (window.nsfwDetectorStatus) {
        window.nsfwDetectorStatus.isLoaded = false;
        window.nsfwDetectorStatus.isLoading = false;
        window.nsfwDetectorStatus.error = error.message;
      }

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
console.log("🚀 Creating global NSFW detector instance...");
window.nsfwDetector = new NSFWDetector();

// Helper function to get detailed status
window.getNSFWDetectorStatus = function () {
  return {
    isLoaded: window.nsfwDetector?.isLoaded || false,
    isLoading: window.nsfwDetector?.isLoading || false,
    modelExists: window.nsfwDetector?.model !== null,
    detectorExists: !!window.nsfwDetector,
    tfAvailable: typeof tf !== "undefined",
    tfVersion: typeof tf !== "undefined" ? tf.version : null,
    timestamp: Date.now(),
  };
};

// Auto-initialize the detector - try multiple approaches
let hasAttemptedInit = false;

function performAutoInitialization() {
  if (hasAttemptedInit) {
    console.log("🔄 Auto-initialization already attempted, skipping...");
    return;
  }

  hasAttemptedInit = true;
  console.log("✅ TensorFlow.js ready, starting auto-initialization...");

  // Update global status
  if (window.nsfwDetectorStatus) {
    window.nsfwDetectorStatus.isLoading = true;
    window.nsfwDetectorStatus.error = null;
  }

  window.nsfwDetector
    .loadModel()
    .then(() => {
      console.log("✅ NSFW detector auto-initialized successfully");
      // Update global status
      if (window.nsfwDetectorStatus) {
        window.nsfwDetectorStatus.isLoaded = true;
        window.nsfwDetectorStatus.isLoading = false;
        window.nsfwDetectorStatus.error = null;
      }
    })
    .catch((error) => {
      console.error("❌ Auto-initialization failed:", error);
      hasAttemptedInit = false; // Allow retry
      // Update global status
      if (window.nsfwDetectorStatus) {
        window.nsfwDetectorStatus.isLoaded = false;
        window.nsfwDetectorStatus.isLoading = false;
        window.nsfwDetectorStatus.error = error.message;
      }
    });
}

// Method 1: Listen for TensorFlow ready event
window.addEventListener("tensorflowReady", (event) => {
  console.log("📡 Received TensorFlow ready event:", event.detail);
  performAutoInitialization();
});

// Method 2: Check if TensorFlow is already available
if (
  (typeof tf !== "undefined" &&
    tf.version &&
    typeof tf.loadLayersModel === "function") ||
  window.tensorflowReady
) {
  console.log("✅ TensorFlow.js already fully available");
  setTimeout(performAutoInitialization, 1000);
} else if (typeof tf !== "undefined") {
  console.log("⏳ TensorFlow.js detected but not fully loaded, waiting...");
  setTimeout(attemptAutoInitialization, 2000);
}

// Method 3: Simplified fallback with better error handling
let initAttempts = 0;
const maxInitAttempts = 10; // Reduced to 10 attempts

function attemptAutoInitialization() {
  if (hasAttemptedInit) {
    return; // Don't continue if we already succeeded
  }

  initAttempts++;
  console.log(
    `🔄 Auto-initialization attempt ${initAttempts}/${maxInitAttempts}...`
  );

  // Check if we've exceeded maximum attempts
  if (initAttempts >= maxInitAttempts) {
    console.warn(
      "⚠️ Auto-initialization gave up after",
      maxInitAttempts,
      "attempts"
    );
    console.log("🔍 Final debug info:", {
      tfExists: typeof tf !== "undefined",
      tfVersion: typeof tf !== "undefined" ? tf.version : "N/A",
      tfLoadLayersModel:
        typeof tf !== "undefined" ? typeof tf.loadLayersModel : "N/A",
      tfKeys: typeof tf !== "undefined" ? Object.keys(tf).slice(0, 10) : "N/A",
      tfKeysCount: typeof tf !== "undefined" ? Object.keys(tf).length : 0,
    });
    hasAttemptedInit = true; // Prevent further attempts
    return;
  }

  // Check if TensorFlow.js is available
  if (typeof tf === "undefined") {
    console.log("⚠️ TensorFlow.js not loaded yet, retrying in 2 seconds...");
    setTimeout(attemptAutoInitialization, 2000);
    return;
  }

  // Check if TensorFlow.js is fully functional
  if (tf.version && typeof tf.loadLayersModel === "function") {
    console.log("✅ TensorFlow.js ready, starting initialization");
    performAutoInitialization();
  } else {
    console.log("⏳ TensorFlow.js partially loaded, retrying in 1 second...");
    console.log("🔍 Current tf state:", {
      version: tf.version,
      loadLayersModel: typeof tf.loadLayersModel,
      keys: Object.keys(tf).slice(0, 10),
      tfType: typeof tf,
      tfKeysCount: Object.keys(tf).length,
    });
    setTimeout(attemptAutoInitialization, 1000);
  }
}

// Start fallback auto-initialization after initial delay
setTimeout(attemptAutoInitialization, 3000);

console.log("✅ Global NSFW detector instance created");
console.log("📊 Initial status:", window.getNSFWDetectorStatus());
