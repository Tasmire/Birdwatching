import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ImageBackground } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { styles } from "../styles/gameStyles";
import { apiUrl } from "../operations/ApiConfig";

const RegistrationScreen = ({ navigation }) => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleRegister = async () => {
        try {
            const response = await fetch(apiUrl("/api/UsersAPI/register"), {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, email, password }),
            });

            if (response.ok) {
                Alert.alert("Success", "Account created successfully!");
                navigation.replace("Login"); // Navigate to the login screen
            } else {
                const errorData = await response.json();
                Alert.alert("Registration Failed", errorData.message || "Please try again.");
            }
        } catch (error) {
            console.error("Error registering user:", error);
            Alert.alert("Error", "Unable to register. Please try again later.");
        }
    };

    return (
        <ImageBackground resizeMode="cover" source={require("../assets/bgImage.jpg")} style={{ flex: 1 }}>
            <View style={[styles.container, styles.backgroundLight]}>
                <Text style={[styles.title, styles.darkText]}>Register</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Username"
                    value={username}
                    onChangeText={setUsername}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
                <TouchableOpacity style={styles.submitButton} onPress={handleRegister}>
                    <Text style={styles.submitButtonText}>Register</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.replace("Login")}>
                    <Text style={styles.link}>Already have an account? Log in</Text>
                </TouchableOpacity>
            </View>
        </ImageBackground>
    );
};

export default RegistrationScreen;