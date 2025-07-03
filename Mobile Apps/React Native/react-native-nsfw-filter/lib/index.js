"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNSFWFilter = exports.NSFWFilter = exports.NSFWClass = void 0;
const tf = __importStar(require("@tensorflow/tfjs"));
const tfjs_react_native_1 = require("@tensorflow/tfjs-react-native");
const expo_image_manipulator_1 = require("expo-image-manipulator");
const base_64_1 = require("base-64");
const jpeg = __importStar(require("jpeg-js"));
var NSFWClass;
(function (NSFWClass) {
    NSFWClass["Drawing"] = "Drawing";
    NSFWClass["Hentai"] = "Hentai";
    NSFWClass["Neutral"] = "Neutral";
    NSFWClass["Porn"] = "Porn";
    NSFWClass["Sexy"] = "Sexy";
})(NSFWClass || (exports.NSFWClass = NSFWClass = {}));
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
class NSFWFilter {
    constructor(options = {}) {
        this.model = null;
        this.imageSize = options.imageSize || DEFAULT_IMAGE_SIZE;
        this.topK = options.topK || 5;
    }
    /**
     * Load the NSFW detection model
     */
    async loadModel(modelJson, modelWeights) {
        await tf.ready();
        try {
            this.model = await tf.loadLayersModel((0, tfjs_react_native_1.bundleResourceIO)(modelJson, modelWeights));
        }
        catch (error) {
            console.error("Failed to load NSFW model:", error);
            throw error;
        }
    }
    /**
     * Check if the model is loaded
     */
    isModelLoaded() {
        return this.model !== null;
    }
    /**
     * Convert image data to tensor
     */
    imageToTensor(rawImageData) {
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
    async getTopKClasses(logits, topK) {
        const values = await logits.data();
        const valuesAndIndices = [];
        for (let i = 0; i < values.length; i++) {
            valuesAndIndices.push({ value: values[i], index: i });
        }
        valuesAndIndices.sort((a, b) => b.value - a.value);
        const topClassesAndProbs = [];
        for (let i = 0; i < Math.min(topK, valuesAndIndices.length); i++) {
            topClassesAndProbs.push({
                className: NSFW_CLASSES[valuesAndIndices[i].index],
                probability: valuesAndIndices[i].value,
            });
        }
        return topClassesAndProbs;
    }
    /**
     * Classify an image from URI
     */
    async classifyImage(imageUri) {
        if (!this.model) {
            throw new Error("Model is not loaded. Call loadModel() first.");
        }
        if (!imageUri) {
            throw new Error("Image URI is required.");
        }
        try {
            // Resize the image to match model expectations
            const resizedPhoto = await (0, expo_image_manipulator_1.manipulateAsync)(imageUri, [
                {
                    resize: {
                        width: this.imageSize.width,
                        height: this.imageSize.height,
                    },
                },
            ], { format: "jpeg", base64: true });
            // Convert base64 to array buffer
            const base64 = resizedPhoto.base64;
            const arrayBuffer = Uint8Array.from((0, base_64_1.decode)(base64), (c) => c.charCodeAt(0));
            // Convert to tensor and predict
            const imageTensor = this.imageToTensor(arrayBuffer);
            const logits = this.model.predict(imageTensor);
            const predictions = await this.getTopKClasses(logits, this.topK);
            // Clean up tensors
            imageTensor.dispose();
            logits.dispose();
            return predictions;
        }
        catch (error) {
            console.error("Failed to classify image:", error);
            throw error;
        }
    }
    /**
     * Check if an image is likely NSFW (returns true if Porn, Hentai, or Sexy have high probability)
     */
    async isImageNSFW(imageUri, threshold = 0.6) {
        const predictions = await this.classifyImage(imageUri);
        const nsfwClasses = [NSFWClass.Porn, NSFWClass.Hentai, NSFWClass.Sexy];
        const topPrediction = predictions[0];
        return (nsfwClasses.includes(topPrediction.className) &&
            topPrediction.probability >= threshold);
    }
    /**
     * Get the confidence score for a specific class
     */
    async getClassConfidence(imageUri, className) {
        const predictions = await this.classifyImage(imageUri);
        const classPrediction = predictions.find((p) => p.className === className);
        return classPrediction ? classPrediction.probability : 0;
    }
    /**
     * Dispose of the model and free memory
     */
    dispose() {
        if (this.model) {
            this.model.dispose();
            this.model = null;
        }
    }
}
exports.NSFWFilter = NSFWFilter;
// Export convenience function for quick usage
const createNSFWFilter = (options) => {
    return new NSFWFilter(options);
};
exports.createNSFWFilter = createNSFWFilter;
exports.default = NSFWFilter;
//# sourceMappingURL=index.js.map