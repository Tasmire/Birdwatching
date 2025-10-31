import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, ScrollView, Text, View, ImageBackground } from 'react-native';
import { styles } from "./styles/gameStyles";

const Logbook = () => {
    return (
        <ImageBackground resizeMode="cover" source={require("./assets/bgLogbook.jpg")} style={{ flex: 1 }}>
            <ScrollView>
                <View>
                    <Text style={[styles.title, styles.darkText, styles.topMargin]}>Logbook</Text>
                </View>
            </ScrollView>
        </ImageBackground>
    );
};

export default Logbook;