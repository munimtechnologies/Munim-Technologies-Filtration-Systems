import * as tf from "@tensorflow/tfjs";
import { bundleResourceIO } from "@tensorflow/tfjs-react-native";
import { manipulateAsync } from "expo-image-manipulator";
import { decode as atob } from "base-64";
import * as jpeg from "jpeg-js";

export interface NSFWPrediction {
  className: string;
  probability: number;
}

export interface NSFWFilterOptions {
  modelPath?: {
    modelJson: any;
    modelWeights: any[];
  };
  imageSize?: {
    width: number;
    height: number;
  };
  topK?: number;
}

export enum NSFWClass {
  Drawing = "Drawing",
  Hentai = "Hentai",
  Neutral = "Neutral",
  Porn = "Porn",
  Sexy = "Sexy",
}

const NSFW_CLASSES = {
  0: NSFWClass.Drawing,
  1: NSFWClass.Hentai,
  2: NSFWClass.Neutral,
  3: NSFWClass.Porn,
  4: NSFWClass.Sexy,
};

const DEFAULT_IMAGE_SIZE = {
  width: 224,
  height: 224,
};

export class NSFWFilter {
  private model: tf.LayersModel | null = null;
  private imageSize: { width: number; height: number };
  private topK: number;

  constructor(options: NSFWFilterOptions = {}) {
    this.imageSize = options.imageSize || DEFAULT_IMAGE_SIZE;
    this.topK = options.topK || 5;
  }

  /**
   * Load the NSFW detection model
   */
  async loadModel(modelJson: any, modelWeights: any[]): Promise<void> {
    await tf.ready();
    try {
      this.model = await tf.loadLayersModel(
        bundleResourceIO(modelJson, modelWeights)
      );
    } catch (error) {
      console.error("Failed to load NSFW model:", error);
      throw error;
    }
  }

  /**
   * Check if the model is loaded
   */
  isModelLoaded(): boolean {
    return this.model !== null;
  }

  /**
   * Convert image data to tensor
   */
  private imageToTensor(rawImageData: Uint8Array): tf.Tensor {
    const TO_UINT8ARRAY = true;
    const { width, height, data } = jpeg.decode(rawImageData, TO_UINT8ARRAY);

    // Drop the alpha channel info for mobilenet
    const buffer = new Uint8Array(width * height * 3);
    let offset = 0;

    for (let i = 0; i < buffer.length; i += 3) {
      buffer[i] = data[offset];
      buffer[i + 1] = data[offset + 1];
      buffer[i + 2] = data[offset + 2];
      offset += 4;
    }

    // Normalize the pixel values
    return tf.tidy(() => {
      const tensor = tf.tensor4d(buffer, [1, height, width, 3]);
      return tensor.div(255); // Normalize to 0-1
    });
  }

  /**
   * Get top K classes from logits
   */
  private async getTopKClasses(
    logits: tf.Tensor,
    topK: number
  ): Promise<NSFWPrediction[]> {
    const values = await logits.data();

    const valuesAndIndices: Array<{ value: number; index: number }> = [];
    for (let i = 0; i < values.length; i++) {
      valuesAndIndices.push({ value: values[i], index: i });
    }

    valuesAndIndices.sort((a, b) => b.value - a.value);

    const topClassesAndProbs: NSFWPrediction[] = [];
    for (let i = 0; i < Math.min(topK, valuesAndIndices.length); i++) {
      topClassesAndProbs.push({
        className:
          NSFW_CLASSES[valuesAndIndices[i].index as keyof typeof NSFW_CLASSES],
        probability: valuesAndIndices[i].value,
      });
    }

    return topClassesAndProbs;
  }

  /**
   * Classify an image from URI
   */
  async classifyImage(imageUri: string): Promise<NSFWPrediction[]> {
    if (!this.model) {
      throw new Error("Model is not loaded. Call loadModel() first.");
    }

    if (!imageUri) {
      throw new Error("Image URI is required.");
    }

    try {
      // Resize the image to match model expectations
      const resizedPhoto = await manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: this.imageSize.width,
              height: this.imageSize.height,
            },
          },
        ],
        { format: "jpeg", base64: true }
      );

      // Convert base64 to array buffer
      const base64 = resizedPhoto.base64;
      const arrayBuffer = Uint8Array.from(atob(base64!), (c) =>
        c.charCodeAt(0)
      );

      // Convert to tensor and predict
      const imageTensor = this.imageToTensor(arrayBuffer);
      const logits = this.model.predict(imageTensor) as tf.Tensor;
      const predictions = await this.getTopKClasses(logits, this.topK);

      // Clean up tensors
      imageTensor.dispose();
      logits.dispose();

      return predictions;
    } catch (error) {
      console.error("Failed to classify image:", error);
      throw error;
    }
  }

  /**
   * Check if an image is likely NSFW (returns true if Porn, Hentai, or Sexy have high probability)
   */
  async isImageNSFW(
    imageUri: string,
    threshold: number = 0.6
  ): Promise<boolean> {
    const predictions = await this.classifyImage(imageUri);

    const nsfwClasses = [NSFWClass.Porn, NSFWClass.Hentai, NSFWClass.Sexy];
    const topPrediction = predictions[0];

    return (
      nsfwClasses.includes(topPrediction.className as NSFWClass) &&
      topPrediction.probability >= threshold
    );
  }

  /**
   * Get the confidence score for a specific class
   */
  async getClassConfidence(
    imageUri: string,
    className: NSFWClass
  ): Promise<number> {
    const predictions = await this.classifyImage(imageUri);
    const classPrediction = predictions.find((p) => p.className === className);
    return classPrediction ? classPrediction.probability : 0;
  }

  /**
   * Dispose of the model and free memory
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
}

// Export convenience function for quick usage
export const createNSFWFilter = (options?: NSFWFilterOptions): NSFWFilter => {
  return new NSFWFilter(options);
};

export default NSFWFilter;
