import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

export class CameraService {
  /**
   * Launch device camera to capture an image
   */
  static async takePicture(): Promise<string | null> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Camera permissions not granted');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // Simple built-in crop
      quality: 1, // Capture at high quality, compress later
    });

    if (result.canceled) return null;
    
    return await this.compressImage(result.assets[0].uri);
  }

  /**
   * Pick an image from device gallery
   */
  static async pickImage(): Promise<string | null> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Media library permissions not granted');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (result.canceled) return null;

    return await this.compressImage(result.assets[0].uri);
  }

  /**
   * Pick a document (PDF, etc.)
   */
  static async pickDocument(): Promise<{ uri: string, type: string, name: string } | null> {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled) return null;
    const file = result.assets[0];

    return {
      uri: file.uri,
      type: file.mimeType ?? 'application/octet-stream',
      name: file.name,
    };
  }

  /**
   * Compress and normalize image for optimal storage & upload
   */
  static async compressImage(uri: string): Promise<string> {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1280 } }], // Resize max width to 1280px (preserves aspect ratio)
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG } // 70% JPEG compression
    );
    return manipResult.uri;
  }
}
