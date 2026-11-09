import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from 'react-native';

import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useFaceDetector, type Face } from 'react-native-vision-camera-face-detector';
import RNFS from 'react-native-fs';
import ImageEditor from '@react-native-community/image-editor';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function App() {
  const device = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();
  const cameraRef = useRef<Camera>(null);

  const [faces, setFaces] = useState<Face[]>([]);
  const [capturedFaceUri, setCapturedFaceUri] = useState<string | null>(null);

  // Crop Face
  const cropFace = async (imageUri: string, face: Face): Promise<string | null> => {
    try {
      const { bounds } = face;
      const cropData = {
        offset: { x: Math.round(bounds.x), y: Math.round(bounds.y) },
        size: { width: Math.round(bounds.width), height: Math.round(bounds.height) },
        displaySize: { width: Math.round(bounds.width), height: Math.round(bounds.height) },
        resizeMode: 'stretch' as const,
      };

      const result = await ImageEditor.cropImage(imageUri, cropData);
      return result.uri || result.path || result;
    } catch (e) {
      console.error('Cropping failed:', e);
      return null;
    }
  };

  // Save to local storage
  const saveToLocalStorage = async (croppedUri: string) => {
    try {
      const facesDir = `${RNFS.DocumentDirectoryPath}/faces`;
      const destPath = `${facesDir}/${Date.now()}.jpg`;

      const exists = await RNFS.exists(facesDir);
      if (!exists) await RNFS.mkdir(facesDir);

      await RNFS.copyFile(croppedUri.replace('file://', ''), destPath);

      Alert.alert('✅ Success', `Face saved!\n\n${destPath}`);
      console.log('Saved:', destPath);
    } catch (error) {
      console.error('Save failed:', error);
      Alert.alert('Error', 'Failed to save image');
    }
  };

  // Face Detector
  const frameProcessor = useFaceDetector({
    onFacesDetected: (detectedFaces: Face[]) => {
      setFaces(detectedFaces);
    },
  });

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission]);

  const takePhotoAndCrop = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePhoto({ quality: 95, flash: 'off' });
      const fullImagePath = `file://${photo.path}`;

      if (faces.length === 0) {
        Alert.alert('No Face', 'No face detected. Try again.');
        return;
      }

      const croppedUri = await cropFace(fullImagePath, faces[0]);
      if (croppedUri) {
        setCapturedFaceUri(croppedUri);
        await saveToLocalStorage(croppedUri);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  return (
    <View style={styles.container}>
      {device && hasPermission ? (
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          photo={true}
          frameProcessor={frameProcessor}
        />
      ) : (
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      )}

      {/* Improved Face Bounding Box Overlay */}
      {faces.map((face, index) => (
        <View
          key={index}
          style={[
            styles.faceBox,
            {
              left: (face.bounds.x / face.bounds.width) * SCREEN_WIDTH, // Better scaling
              top: (face.bounds.y / face.bounds.height) * SCREEN_HEIGHT,
              width: (face.bounds.width / face.bounds.width) * SCREEN_WIDTH,
              height: (face.bounds.height / face.bounds.height) * SCREEN_HEIGHT,
            },
          ]}
        />
      ))}

      <TouchableOpacity style={styles.captureButton} onPress={takePhotoAndCrop}>
        <Text style={styles.buttonText}>📸 Capture & Crop Face</Text>
      </TouchableOpacity>

      {capturedFaceUri && <Image source={{ uri: capturedFaceUri }} style={styles.preview} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  faceBox: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#00FF00',
    borderRadius: 10,
  },
  captureButton: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 50,
    elevation: 5,
  },
  buttonText: { color: 'black', fontSize: 18, fontWeight: 'bold' },
  preview: {
    position: 'absolute',
    bottom: 180,
    alignSelf: 'center',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: 'white',
  },
  loadingText: {
    flex: 1,
    color: 'white',
    textAlign: 'center',
    marginTop: 100,
    fontSize: 18,
  },
});