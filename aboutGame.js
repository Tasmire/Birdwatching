import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, ScrollView, Text, View, ImageBackground } from 'react-native';
import { styles } from "./styles/gameStyles";

const AboutGame = () => {
    return (
        <ImageBackground resizeMode="cover" source={require("./assets/bgImage.jpg")} style={{ flex: 1 }}>
            <ScrollView style={styles.backgroundDarker} contentContainerStyle={styles.scrollViewContainer}>
                <View style={styles.viewContainer}>
                    <Text style={[styles.title, styles.lighterText, styles.topMargin]}>About Game</Text>
                    <Text style={[styles.paragraph, styles.lighterText, styles.topMargin]}>
                        This mobile game aims to teach players about New Zealand birds and where to find them. Players will explore different habitats, search for birds, and answer questions to learn more about each species.
                    </Text>
                    <Text style={[styles.paragraph, styles.lighterText, styles.topMargin]}>
                        To play the game, search the habitat by panning from side to side to look for birds. When you find one, tap on it!
                    </Text>
                    <Text style={[styles.paragraph, styles.lighterText, styles.topMargin]}>
                        You will have to answer a question about its name, habitat, diet or other relevant information. If you answer correctly, the information will be added to your personal logbook. If you choose the wrong answer, the bird will fly away and you will have to try again another time.
                    </Text>
                    <Text style={[styles.paragraph, styles.lighterText, styles.topMargin]}>
                        To move to a different habitat, use the buttons on the top of your screen. Every bird spawns in a different environment, so you will have to search all three habitats to find them all!
                    </Text>
                    <Text style={[styles.paragraph, styles.lighterText, styles.topMargin]}>
                        You can also take a photo of the bird by tapping the camera icon on the bottom right of your screen. This will save a snapshot of the bird to the logbook.
                    </Text>
                    <Text style={[styles.paragraph, styles.lighterText, styles.topMargin]}>
                        To see what birds you have identified, open the “Logbook” tab. Here, you will find every bird you have seen so far. Tap on a single bird to see what information you have learned! Your gallery is also found here. The logbook has a different section for each habitat, so tap the arrows on the bottom corners of the screen to flip to another page.
                    </Text>
                    <Text style={[styles.paragraph, styles.lighterText, styles.topMargin]}>
                        You will earn achievements while playing the game which will be found on your profile.
                    </Text>
                </View>
                <View style={styles.creditsContainer}>
                    <Text style={[styles.creditsTitle, styles.lighterText, styles.topMargin]}>Credits</Text>
                    <Text style={[styles.creditsText, styles.lighterText]}>Bird drawings: Isabella Fickling</Text>
                    <Text style={[styles.creditsText, styles.lighterText]}>Habitat backgrounds: Jamie Fickling</Text>
                </View>
            </ScrollView>
        </ImageBackground>
    );
};

export default AboutGame;