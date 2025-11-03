import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, ScrollView, Text, View, ImageBackground, TouchableOpacity } from 'react-native';
import { styles } from "./styles/gameStyles";

const UserProfile = () => {

    const [userData, setUserData] = useState([]);

    const fetchUserData = async () => {
        try {
            const response = await fetch('https://localhost:7097/api/UsersAPI', {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                }
            });
            const data = await response.json();
            console.log(data);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }

        const data = await response.json();
        const transformedData = data.map(user => ({
            userId: user.userId,
            username: user.username,
            email: user.email,
            passwordHash: user.passwordHash,
        }));

        setUserData(transformedData);
    }

    const handleLogout = async () => {
        await AsyncStorage.removeItem("userData");
        navigation.replace("Login");
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    return (
        <ImageBackground resizeMode="cover" source={require("./assets/bgImage.jpg")} style={{ flex: 1 }}>
            <ScrollView>
                <View>
                    <Text style={[styles.title, styles.lighterText, styles.topMargin]}>User Profile</Text>

                    <TouchableOpacity onPress={handleLogout}>
                        <Text style={{ color: "red" }}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </ImageBackground>
    );
};

export default UserProfile;