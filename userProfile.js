import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, ScrollView, Text, View, ImageBackground } from 'react-native';
import { styles } from "./styles/gameStyles";

const UserProfile = () => {
    return (
        <ImageBackground resizeMode="cover" source={require("./assets/bgImage.jpg")} style={{ flex: 1 }}>
            <ScrollView>
                <View>
                    <Text style={[styles.title, styles.lighterText, styles.topMargin]}>User Profile</Text>
                </View>
            </ScrollView>
        </ImageBackground>
    );
};

export default UserProfile;