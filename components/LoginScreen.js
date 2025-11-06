import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ImageBackground } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { styles } from "../styles/gameStyles";

const LoginScreen = ({ navigation, onLogin }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {
        try {
            const response = await fetch("http://10.0.2.2:5093/api/UsersAPI/login", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ usernameOrEmail: username, password }),
            });

            if (response.ok) {
                const userData = await response.json();
                await AsyncStorage.setItem("userData", JSON.stringify(userData)); // Save user data locally
                onLogin(); // Update isLoggedIn state in App.js
            } else {
                Alert.alert("Login Failed", "Invalid username or password. Please try again.");
            }
        } catch (error) {
            console.log("Error logging in:", error, error?.message, error?.name);
            Alert.alert("Error", error?.message || "Unable to log in. Please try again later.");
        }
    };

    return (
        <ImageBackground resizeMode="cover" source={require("../assets/bgImage.jpg")} style={{ flex: 1 }}>
            <View style={[styles.container, styles.backgroundLight]}>
                <Text style={[styles.title, styles.darkText]}>Login</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Username"
                    value={username}
                    onChangeText={setUsername}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
                <TouchableOpacity style={styles.submitButton} onPress={handleLogin}>
                    <Text style={styles.submitButtonText}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.replace("Register")}>
                    <Text style={styles.link}>Don't have an account? Register</Text>
                </TouchableOpacity>
            </View>
        </ImageBackground>
    );
};

export default LoginScreen;