import { captureRef } from "react-native-view-shot";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiCallPost } from "./ApiCalls";

const takeScreenshot = async (viewRef, userId, currentBird) => {
    try {
        const uri = await captureRef(viewRef, {
            format: "jpg",
            quality: 0.8,
        });

        // Save the screenshot to the database
        const token = await AsyncStorage.getItem("token");
        await apiCallPost(`http://10.0.2.2:5093/api/UserAnimalPhotosAPI`, token, {
            UserId: userId,
            AnimalId: currentBird.AnimalId,
            PhotoUri: uri,
        });
    } catch (error) {
        console.error("Error taking screenshot:", error);
    }
    const response = await fetch(url, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
};

export default takeScreenshot;