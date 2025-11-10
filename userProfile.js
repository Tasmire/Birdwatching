import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, ScrollView, Text, View, ImageBackground, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { styles } from "./styles/gameStyles";
import { colours } from "./styles/colourScheme";
import { apiCallGet, apiCallPost, apiCallPut } from "./operations/ApiCalls";

const UserProfile = ({ onLogout }) => {

    const [userData, setUserData] = useState([]);
    const navigation = useNavigation();

    const fetchUserData = async () => {
        try {
            const storedUserData = await AsyncStorage.getItem("userData");
            const parsedUserData = JSON.parse(storedUserData);

            if (!parsedUserData || !parsedUserData.userId) {
                throw new Error("No user data found in AsyncStorage.");
            }

            const userId = parsedUserData.userId; // Get the userId of the logged-in user
            const token = parsedUserData.token;

            const data = await apiCallGet(`http://10.0.2.2:5093/api/UsersAPI/${userId}`, token);
            console.log(data);

            setUserData(data);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem("userData"); // Clear user data
            Alert.alert("Logged Out", "You have been logged out successfully.");
            onLogout(); // Update isLoggedIn state in App.js
        } catch (error) {
            console.error("Error during logout:", error);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    return (
        <ImageBackground resizeMode="cover" source={require("./assets/bgImage.jpg")} style={{ flex: 1 }}>
            <ScrollView style={styles.backgroundDark} contentContainerStyle={styles.scrollViewContainer}>
                <View style={styles.viewContainer}>
                    <View>
                        <Text style={[styles.title, styles.lighterText, styles.topMargin]}>Profile</Text>
                        <Text style={[styles.subtitle, styles.lighterText]}>{userData.username}</Text>
                        {/* Add other user details here */}
                    </View>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutButtonText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </ImageBackground>
    );
};

export default UserProfile;