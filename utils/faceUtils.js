// utils/faceUtils.js
import { loadTensorflowModel } from 'react-native-fast-tflite';
import * as RNFS from 'react-native-fs';

export const MODEL_PATHS = {
    pnet: require('../assets/models/pnet.tflite'),
    rnet: require('../assets/models/rnet.tflite'),
    onet: require('../assets/models/onet.tflite'),
    mobileFaceNet: require('../assets/models/MobileFaceNet.tflite'),
};

export class MTCNNDetector {
    constructor() {
        this.pModel = null;
        this.rModel = null;
        this.oModel = null;
        this.loaded = false;
    }

    async loadModels() {
        try {
            console.log('Loading MTCNN models...');

            // Use raw require for assets - this should work after rebuild
            this.pModel = await loadTensorflowModel(MODEL_PATHS.pnet);
            this.rModel = await loadTensorflowModel(MODEL_PATHS.rnet);
            this.oModel = await loadTensorflowModel(MODEL_PATHS.onet);

            this.loaded = true;
            console.log('✅ All MTCNN models loaded successfully');
        } catch (error) {
            console.error('❌ MTCNN load failed:', error);
            throw error;
        }
    }

    async detectFaces(imageUri, minFaceSize = 80) {
        if (!this.loaded) {
            throw new Error('MTCNN models not loaded. Call loadModels() first.');
        }

        // TODO: Full implementation (simplified version for now)
        // For production, implement full P-Net → R-Net → O-Net pipeline
        console.log('Detecting faces in:', imageUri);

        // Placeholder: Return a full-face box for testing
        // Replace with real detection later
        return [{
            x1: 0,
            y1: 0,
            x2: 300,   // Adjust based on image size
            y2: 300,
            score: 0.95,
            landmarks: [] // 5 points if available from O-Net
        }];
    }
}

// Preprocess image for MobileFaceNet (112x112, RGB, [-1, 1])
export async function preprocessForMobileFaceNet(imageUri) {
    // This is a critical part - needs proper resizing + normalization
    // For now, placeholder. We'll improve it below.
    console.log('Preprocessing:', imageUri);

    // Recommended: Use a library like react-native-image-resizer + jpeg-js
    // Or implement pixel buffer conversion

    // Dummy tensor for testing (replace this!)
    const tensor = new Float32Array(112 * 112 * 3);
    for (let i = 0; i < tensor.length; i += 3) {
        tensor[i] = 0;     // R
        tensor[i + 1] = 0; // G
        tensor[i + 2] = 0; // B
    }
    return tensor; // Shape expected: [1, 112, 112, 3] or flat
}

export async function cropAndAlignFace(imageUri, box) {
    // Crop logic here (using coordinates from MTCNN)
    // Then call preprocessForMobileFaceNet
    return await preprocessForMobileFaceNet(imageUri);
}