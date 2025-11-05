import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, ScrollView, Text, View, ImageBackground } from 'react-native';
import { styles } from "./styles/gameStyles";

const AboutGame = () => {
    return (
        <ImageBackground resizeMode="cover" source={require("./assets/bgImage.jpg")} style={{ flex: 1 }}>
            <ScrollView style={styles.backgroundDark}>
                <View>
                    <Text style={[styles.title, styles.lighterText, styles.topMargin]}>About Game</Text>
                </View>
            </ScrollView>
        </ImageBackground>
    );
};

export default AboutGame;