import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  Button,
  SafeAreaView,
  StyleSheet,
  Alert,
} from "react-native";
import "@tensorflow/tfjs-react-native";
import * as ImagePicker from "expo-image-picker";
import { NSFWFilter, NSFWPrediction } from "react-native-nsfw-filter";

const modelJson = require("../assets/model/model.json");
const modelWeights = [require("../assets/model/group1-shard1of1.bin")];

const Index = () => {
  const [nsfwFilter, setNsfwFilter] = useState<NSFWFilter | null>(null);
  const [predictions, setPredictions] = useState<NSFWPrediction[] | null>(null);
  const [image, setImage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeFilter = async () => {
      try {
        const filter = new NSFWFilter();
        await filter.loadModel(modelJson, modelWeights);
        setNsfwFilter(filter);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load model:", error);
        Alert.alert("Error", "Failed to load NSFW detection model");
        setIsLoading(false);
      }
    };

    initializeFilter();

    // Cleanup on unmount
    return () => {
      if (nsfwFilter) {
        nsfwFilter.dispose();
      }
    };
  }, []);

  const classifyImage = async (uri: string) => {
    if (!uri || !nsfwFilter) return;

    try {
      setIsLoading(true);
      const predictions = await nsfwFilter.classifyImage(uri);
      setPredictions(predictions);

      // Also check if it's NSFW with a simple boolean
      const isNSFW = await nsfwFilter.isImageNSFW(uri, 0.6);
      if (isNSFW) {
        Alert.alert("Warning", "This image contains NSFW content");
      }

      setIsLoading(false);
      console.log("Predictions:", predictions);
    } catch (error) {
      console.error("Classification error:", error);
      Alert.alert("Error", "Failed to classify image");
      setIsLoading(false);
    }
  };

  const onHandlePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setImage(uri);
        await classifyImage(uri);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>NSFW Image Detector</Text>
        <Text style={styles.subtitle}>
          Pick an image to check if it contains NSFW content
        </Text>

        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Text>No image selected</Text>
          </View>
        )}

        <Button
          title={isLoading ? "Loading..." : "Pick and Analyze Image"}
          onPress={onHandlePick}
          disabled={isLoading || !nsfwFilter}
        />

        {predictions && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Classification Results:</Text>
            {predictions.map((prediction, index) => (
              <View key={index} style={styles.predictionRow}>
                <Text style={styles.predictionText}>
                  {prediction.className}
                </Text>
                <Text style={styles.predictionPercentage}>
                  {(prediction.probability * 100).toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  placeholder: {
    width: 200,
    height: 200,
    marginBottom: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
  },
  resultsContainer: {
    marginTop: 30,
    width: "100%",
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    padding: 15,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  predictionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  predictionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  predictionPercentage: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007AFF",
  },
});

export default Index;
