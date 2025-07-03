/**
 * React Native NSFW Filter
 *
 * Built upon the excellent work by Infinite Red and their NSFWJS project:
 * - NSFWJS: https://github.com/infinitered/nsfwjs
 * - NSFWJS Mobile: https://github.com/infinitered/nsfwjs-mobile
 *
 * This implementation fixes compatibility issues and enhances the API
 * for modern React Native applications.
 *
 * @author Munim Technologies
 * @license MIT
 */
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
export declare enum NSFWClass {
    Drawing = "Drawing",
    Hentai = "Hentai",
    Neutral = "Neutral",
    Porn = "Porn",
    Sexy = "Sexy"
}
export declare class NSFWFilter {
    private model;
    private imageSize;
    private topK;
    constructor(options?: NSFWFilterOptions);
    /**
     * Load the NSFW detection model
     */
    loadModel(modelJson: any, modelWeights: any[]): Promise<void>;
    /**
     * Check if the model is loaded
     */
    isModelLoaded(): boolean;
    /**
     * Convert image data to tensor
     */
    private imageToTensor;
    /**
     * Get top K classes from logits
     */
    private getTopKClasses;
    /**
     * Classify an image from URI
     */
    classifyImage(imageUri: string): Promise<NSFWPrediction[]>;
    /**
     * Check if an image is likely NSFW (returns true if Porn, Hentai, or Sexy have high probability)
     */
    isImageNSFW(imageUri: string, threshold?: number): Promise<boolean>;
    /**
     * Get the confidence score for a specific class
     */
    getClassConfidence(imageUri: string, className: NSFWClass): Promise<number>;
    /**
     * Dispose of the model and free memory
     */
    dispose(): void;
}
export declare const createNSFWFilter: (options?: NSFWFilterOptions) => NSFWFilter;
export default NSFWFilter;
//# sourceMappingURL=index.d.ts.map