import React, { useEffect, useState } from "react";
import {
  View,
  Button,
  Image,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { NSFWFilter, NSFWPrediction } from "react-native-nsfw-filter";

// Import your model files
const modelJson = require("../assets/model/model.json");
const modelWeights = [require("../assets/model/group1-shard1of1.bin")];

const Index = () => {
  const [nsfwFilter, setNsfwFilter] = useState<NSFWFilter | null>(null);
  const [predictions, setPredictions] = useState<NSFWPrediction[]>([]);
  const [imageUri, setImageUri] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [modelLoaded, setModelLoaded] = useState<boolean>(false);

  useEffect(() => {
    const initializeFilter = async () => {
      try {
        setIsLoading(true);
        const filter = new NSFWFilter();
        await filter.loadModel(modelJson, modelWeights);
        setNsfwFilter(filter);
        setModelLoaded(true);
        console.log(
          "🚀 NSFW Filter model loaded successfully! Ready to analyze images."
        );
      } catch (error) {
        console.error("Failed to load NSFW Filter model:", error);
        Alert.alert("Error", "Failed to load NSFW detection model");
      } finally {
        setIsLoading(false);
      }
    };

    initializeFilter();
  }, []);

  const pickAndAnalyzeImage = async () => {
    try {
      // Request permission
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant camera roll permissions to use this feature."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && nsfwFilter) {
        setIsLoading(true);
        const uri = result.assets[0].uri;
        setImageUri(uri);

        // Get detailed predictions
        const predictions = await nsfwFilter.classifyImage(uri);
        setPredictions(predictions);

        // Log detailed predictions with percentages
        console.log("\n" + "=".repeat(50));
        console.log(
          `🔍 NSFW Analysis Results (Gallery) - ${new Date().toLocaleTimeString()}`
        );
        console.log("=".repeat(50));
        predictions.forEach((prediction, index) => {
          console.log(
            `${index + 1}. ${prediction.className}: ${(
              prediction.probability * 100
            ).toFixed(2)}%`
          );
        });

        // Check if it's NSFW with 60% threshold
        const isNSFW = await nsfwFilter.isImageNSFW(uri, 0.6);
        console.log(`🚨 Is NSFW (>60% threshold): ${isNSFW}`);
        console.log("=".repeat(50) + "\n");

        if (isNSFW) {
          Alert.alert("⚠️ Warning", "This image contains NSFW content!");
        } else {
          Alert.alert("✅ Safe", "This image appears to be safe for work.");
        }
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
      Alert.alert("Error", "Failed to analyze image");
    } finally {
      setIsLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant camera permissions to use this feature."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && nsfwFilter) {
        setIsLoading(true);
        const uri = result.assets[0].uri;
        setImageUri(uri);

        // Get detailed predictions
        const predictions = await nsfwFilter.classifyImage(uri);
        setPredictions(predictions);

        // Log detailed predictions with percentages
        console.log("\n" + "=".repeat(50));
        console.log(
          `🔍 NSFW Analysis Results (Camera) - ${new Date().toLocaleTimeString()}`
        );
        console.log("=".repeat(50));
        predictions.forEach((prediction, index) => {
          console.log(
            `${index + 1}. ${prediction.className}: ${(
              prediction.probability * 100
            ).toFixed(2)}%`
          );
        });

        // Check if it's NSFW with 60% threshold
        const isNSFW = await nsfwFilter.isImageNSFW(uri, 0.6);
        console.log(`🚨 Is NSFW (>60% threshold): ${isNSFW}`);
        console.log("=".repeat(50) + "\n");

        if (isNSFW) {
          Alert.alert("⚠️ Warning", "This image contains NSFW content!");
        } else {
          Alert.alert("✅ Safe", "This image appears to be safe for work.");
        }
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
      Alert.alert("Error", "Failed to analyze image");
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (probability: number) => {
    if (probability > 0.7) return "#e74c3c"; // Red for high confidence
    if (probability > 0.4) return "#f39c12"; // Orange for medium confidence
    return "#27ae60"; // Green for low confidence
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔍 NSFW Content Filter</Text>
      <Text style={styles.subtitle}>
        Detect inappropriate content in images using AI
      </Text>

      {isLoading && (
        <Text style={styles.loadingText}>
          {modelLoaded ? "Analyzing image..." : "Loading AI model..."}
        </Text>
      )}

      {!modelLoaded && !isLoading && (
        <Text style={styles.errorText}>Model not loaded yet...</Text>
      )}

      {modelLoaded && (
        <View style={styles.buttonContainer}>
          <Button
            title="📷 Take Photo"
            onPress={takePhoto}
            disabled={isLoading}
          />
          <View style={styles.buttonSpacer} />
          <Button
            title="🖼️ Pick from Gallery"
            onPress={pickAndAnalyzeImage}
            disabled={isLoading}
          />
        </View>
      )}

      {imageUri && (
        <View style={styles.imageContainer}>
          <Text style={styles.sectionTitle}>Selected Image:</Text>
          <Image source={{ uri: imageUri }} style={styles.image} />
        </View>
      )}

      {predictions.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.sectionTitle}>Analysis Results:</Text>
          {predictions.map((prediction, index) => (
            <View key={index} style={styles.predictionRow}>
              <Text style={styles.className}>{prediction.className}:</Text>
              <Text
                style={[
                  styles.probability,
                  { color: getConfidenceColor(prediction.probability) },
                ]}
              >
                {(prediction.probability * 100).toFixed(1)}%
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>How it works:</Text>
        <Text style={styles.infoText}>
          • Uses TensorFlow.js AI model to analyze images{"\n"}• Classifies
          content into 5 categories: Drawing, Hentai, Neutral, Porn, Sexy{"\n"}•
          Images with &gt;60% confidence in inappropriate categories are flagged
          {"\n"}• All processing happens on your device for privacy
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 40,
    marginBottom: 10,
    color: "#2c3e50",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#7f8c8d",
  },
  loadingText: {
    textAlign: "center",
    fontSize: 16,
    color: "#3498db",
    marginVertical: 20,
  },
  errorText: {
    textAlign: "center",
    fontSize: 16,
    color: "#e74c3c",
    marginVertical: 20,
  },
  buttonContainer: {
    marginVertical: 20,
  },
  buttonSpacer: {
    height: 10,
  },
  imageContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  image: {
    width: 250,
    height: 250,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#bdc3c7",
  },
  resultsContainer: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#2c3e50",
  },
  predictionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  className: {
    fontSize: 16,
    fontWeight: "500",
    color: "#34495e",
  },
  probability: {
    fontSize: 16,
    fontWeight: "bold",
  },
  infoContainer: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#2c3e50",
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#7f8c8d",
  },
});

export default Index;
