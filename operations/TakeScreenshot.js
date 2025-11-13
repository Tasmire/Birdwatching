import { captureRef } from "react-native-view-shot";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiCallPost } from "./ApiCalls";
import * as FileSystem from 'expo-file-system/legacy';

const takeScreenshot = async (viewRef, userId, currentBird) => {
  try {
    // small delay in case UI just changed
    await new Promise((r) => setTimeout(r, 40));

    // capture the provided view (viewport container)
    const tmpUri = await captureRef(viewRef, { format: "jpg", quality: 0.9, result: "tmpfile" });
    if (!tmpUri) throw new Error("captureRef returned no uri");
    // console.debug("[takeScreenshot] captureRef tmpUri", tmpUri);

    // persist unique file
    const destDir = `${FileSystem.documentDirectory}birdphotos/`;
    try {
      const info = await FileSystem.getInfoAsync(destDir);
      if (!info.exists) await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
    } catch (e) {
      console.warn("[takeScreenshot] ensure dest dir failed", e);
    }

    const filename = `bird_${Date.now()}_${Math.floor(Math.random() * 1e6)}.jpg`;
    const destUri = `${destDir}${filename}`;
    try {
      await FileSystem.copyAsync({ from: tmpUri, to: destUri });
      //console.debug("[takeScreenshot] copied to", destUri);
    } catch (copyErr) {
      console.warn("[takeScreenshot] copyAsync failed, using tmpUri", copyErr);
      return tmpUri;
    }

    // Save record to backend (use relative path; apiCallPost will call apiUrl)
    const token = await AsyncStorage.getItem("token");
    const payload = {
      UserId: userId,
      AnimalId: currentBird?.AnimalId ?? currentBird?.animalId,
      PhotoUrl: destUri,
      DateUploaded: new Date().toISOString(),
    };
    await apiCallPost(`/api/UserAnimalPhotosAPI`, token, payload);

    return destUri;
  } catch (error) {
    console.error("Error taking screenshot:", error);
    return null;
  }
};

export default takeScreenshot;