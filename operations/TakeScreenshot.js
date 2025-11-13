import { captureRef } from "react-native-view-shot";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiCallPost } from "./ApiCalls";
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';

const takeScreenshot = async (viewRef, userId, currentBird, cropRect = null) => {
    try {
        // Capture full view first (avoid providing rect to view-shot — we'll crop reliably with ImageManipulator)
        const options = {
            format: "jpg",
            quality: 0.9,
            result: "tmpfile",
        };

        const tmpUri = await captureRef(viewRef, options);
        if (!tmpUri) throw new Error('captureRef returned no uri');

        // Determine crop area: prefer explicit cropRect if you passed one (assumed in view pixels),
        // otherwise crop the center square of the captured image.
        // Use Image.getSize to obtain captured image pixel dimensions.
        const sizeInfo = await new Promise((resolve, reject) => {
            Image.getSize(tmpUri, (w, h) => resolve({ w, h }), (err) => reject(err));
        }).catch((e) => {
            console.warn('Could not get image size, skipping crop', e);
            return null;
        });

        let croppedUri = tmpUri;
        if (sizeInfo) {
            const imgW = sizeInfo.w;
            const imgH = sizeInfo.h;

            if (cropRect && typeof cropRect === 'object' && cropRect.width && cropRect.height) {
                // cropRect is assumed in view pixels; map directly to image pixels when both use same scale.
                // If coordinates don't match, fallback to center-square.
                const originX = Math.max(0, Math.round(cropRect.x));
                const originY = Math.max(0, Math.round(cropRect.y));
                const cropW = Math.min(Math.round(cropRect.width), imgW - originX);
                const cropH = Math.min(Math.round(cropRect.height), imgH - originY);
                try {
                    const manipResult = await ImageManipulator.manipulateAsync(
                        tmpUri,
                        [{ crop: { originX, originY, width: cropW, height: cropH } }],
                        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
                    );
                    croppedUri = manipResult.uri;
                } catch (e) {
                    console.warn('crop with cropRect failed, falling back to center crop', e);
                }
            }

            // If still not cropped (or no cropRect), do center square crop
            if (croppedUri === tmpUri) {
                const s = Math.min(imgW, imgH);
                const originX = Math.round((imgW - s) / 2);
                const originY = Math.round((imgH - s) / 2);
                const manipResult = await ImageManipulator.manipulateAsync(
                    tmpUri,
                    [{ crop: { originX, originY, width: s, height: s } }],
                    { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
                );
                croppedUri = manipResult.uri;
            }
        }

        // Ensure destination directory exists and copy cropped file to a unique persistent file
        const destDir = `${FileSystem.documentDirectory}birdphotos/`;
        try {
            const info = await FileSystem.getInfoAsync(destDir);
            if (!info.exists) {
                await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
            }
        } catch (e) {
            console.warn('Could not ensure dest dir', e);
        }

        const filename = `bird_${Date.now()}_${Math.floor(Math.random() * 1e6)}.jpg`;
        const destUri = `${destDir}${filename}`;

        let finalUri = croppedUri;
        try {
            await FileSystem.copyAsync({ from: croppedUri, to: destUri });
            finalUri = destUri; // only use destUri if copy succeeded
        } catch (copyErr) {
            console.warn('Failed to copy screenshot to persistent store, using cropped tmpUri', copyErr);
            // finalUri remains croppedUri
        }

        // Save the screenshot record to the backend
        const token = await AsyncStorage.getItem("token");

        const payload = {
            UserId: userId,
            AnimalId: currentBird?.AnimalId ?? currentBird?.animalId,
            PhotoUrl: finalUri,
            DateUploaded: new Date().toISOString(),
        };

        await apiCallPost(`http://10.0.2.2:5093/api/UserAnimalPhotosAPI`, token, payload);
        return finalUri;
    } catch (error) {
        console.error("Error taking screenshot:", error);
        return null;
    }
};

export default takeScreenshot;