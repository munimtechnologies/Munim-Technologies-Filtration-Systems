declare module "@tensorflow/tfjs" {
  export interface LayersModel {
    predict(inputs: any): any;
    dispose(): void;
  }

  export interface Tensor {
    data(): Promise<Float32Array>;
    dispose(): void;
    div(value: number): Tensor;
  }

  export function ready(): Promise<void>;
  export function loadLayersModel(path: any): Promise<LayersModel>;
  export function tidy<T>(fn: () => T): T;
  export function tensor4d(values: any, shape: number[]): Tensor;
}

declare module "@tensorflow/tfjs-react-native" {
  export function bundleResourceIO(modelJson: any, modelWeights: any[]): any;
}

declare module "expo-image-manipulator" {
  export function manipulateAsync(
    uri: string,
    actions: any[],
    options: any
  ): Promise<any>;
}

declare module "base-64" {
  export function decode(str: string): string;
}

declare module "jpeg-js" {
  interface DecodeOptions {
    useTArray?: boolean;
    colorTransform?: boolean;
    formatAsRGBA?: boolean;
    tolerantDecoding?: boolean;
    maxResolutionInMP?: number;
    maxMemoryUsageInMB?: number;
  }

  interface DecodeResult {
    width: number;
    height: number;
    data: Uint8Array;
  }

  export function decode(
    jpegData: Uint8Array,
    options?: DecodeOptions
  ): DecodeResult;
}
