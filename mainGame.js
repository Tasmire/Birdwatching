import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ImageBackground, TouchableOpacity, Button, ScrollView } from 'react-native';
import { styles } from "./styles/gameStyles";
import { colours } from "./styles/colourScheme";
import { apiCallGet, apiCallPost, apiCallPut } from "./operations/ApiCalls";
import generateRandomQuestions from "./operations/GenerateQuestions";
import takeScreenshot from "./operations/TakeScreenshot";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';

library.add(fas, far, fab);

const MainGame = () => {

    const [selectedEnvironment, setSelectedEnvironment] = useState(null);
    const [birds, setBirds] = useState([]);
    const [currentBirdIndex, setCurrentBirdIndex] = useState(0);
    const [environments, setEnvironments] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [userId, setUserId] = useState(null);
    const [token, setToken] = useState(null);

    const viewRef = useRef(null);

    const shuffleArray = (arr) => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };

    const fetchGameData = async () => {
        try {
            const storedGameData = await AsyncStorage.getItem("gameData");
            const storedToken = await AsyncStorage.getItem("token");
            console.log({ storedGameData, storedToken });

            if (!storedGameData && !storedToken) {
                throw new Error("No game data found in AsyncStorage.");
            }

            const parsedGameData = storedGameData ? JSON.parse(storedGameData) : null;
            const uid = parsedGameData?.userId ?? null;
            const tkn = storedToken ?? parsedGameData?.token ?? null;

            setUserId(uid);
            setToken(tkn);

            const environmentData = await apiCallGet(`http://10.0.2.2:5093/api/EnvironmentsAPI`, tkn);
            const spawnData = await apiCallGet(`http://10.0.2.2:5093/api/SpawnLocationsAPI`, tkn);
            const userData = uid ? await apiCallGet(`http://10.0.2.2:5093/api/UsersAPI/${uid}`, tkn) : null;

            const imageMapping = {
                "bgUrban.jpg": require("./assets/bgUrban.jpg"),
                "bgForest.jpg": require("./assets/bgForest.jpg"),
                "bgCoastal.jpg": require("./assets/bgCoastal.jpg"),
            };

            const formattedEnvironments = (environmentData || []).map((env) => ({
                id: env.environmentId,
                name: env.name,
                background: imageMapping[env.imageUrl] || null,
                icon: env.navigationIcon,
            }));

            setEnvironments(formattedEnvironments);

            if (formattedEnvironments.length > 0) {
                setSelectedEnvironment(formattedEnvironments[0].id);
            }

        } catch (error) {
            console.error("Error fetching game data:", error);
        }
    };

    const fetchBirds = async (environmentId, tkn = token) => {
        try {
            if (!environmentId) return;
            const birdsData = await apiCallGet(`http://10.0.2.2:5093/api/AnimalsAPI?environmentId=${environmentId}`, tkn);
            const shuffled = shuffleArray(birdsData || []);
            setBirds(shuffled);
            setCurrentBirdIndex(0); // Reset spawn index
            setQuestions([]); // clear any pending questions
        } catch (error) {
            console.error("Error fetching birds:", error);
        }
    };

    const handleEnvironmentChange = async (environmentId) => {
        setSelectedEnvironment(environmentId);
        fetchBirds(environmentId, token);
    };

    useEffect(() => {
        fetchGameData();
    }, []);

    useEffect(() => {
        if (selectedEnvironment) {
            fetchBirds(selectedEnvironment, token);
        }
    }, [selectedEnvironment, token]);

    const currentEnvironment = environments.find((env) => env.id === selectedEnvironment);
    const currentBird = birds && birds.length > 0 ? birds[currentBirdIndex] : null;

    const handleBirdTap = async () => {
        if (!currentBird) return;
        if (!userId || !token) {
            console.warn("Missing userId or token; cannot record spotting.");
        }

        try {
            // Check if the bird has been spotted before
            const spottedData = userId
                ? await apiCallGet(`http://10.0.2.2:5093/api/UserAnimalsAPI?userId=${userId}&animalId=${currentBird.AnimalId}`, token)
                : [];

            const isSpotted = (spottedData && spottedData.length > 0);

            // Prepare questions
            const qs = isSpotted
                ? generateRandomQuestions(currentBird)
                : [{ question: "What is the name of this bird?", correctAnswer: currentBird.Name }];

            setQuestions(qs);

            // Take a screenshot (non-blocking)
            // try {
            //     takeScreenshot(viewRef, userId, currentBird);
            // } catch (sErr) {
            //     console.warn("Screenshot failed:", sErr);
            // }

            // Save to UserAnimals table
            if (userId) {
                if (!isSpotted) {
                    await apiCallPost(`http://10.0.2.2:5093/api/UserAnimalsAPI`, token, {
                        UserId: userId,
                        AnimalId: currentBird.AnimalId,
                        TimesSpotted: 1,
                    });
                } else {
                    await apiCallPut(`http://10.0.2.2:5093/api/UserAnimalsAPI/${spottedData[0].UserAnimalId}`, token, {
                        TimesSpotted: spottedData[0].TimesSpotted + 1,
                    });
                }
            }

            

        } catch (error) {
            console.error("Error handling bird tap:", error);
        }
    };

    const handleQuestionComplete = () => {
        // Move to next bird
        setQuestions([]);
        setCurrentBirdIndex((i) => {
            if (!birds || birds.length === 0) return 0;
            const next = i + 1;
            return next >= birds.length ? 0 : next;
        });
    };

    return (
        <View style={styles.containerNoPadding} ref={viewRef}>

            {currentEnvironment && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.backgroundScrollContainer}
                    contentContainerStyle={[styles.backgroundContent, { flexGrow: 1 }]}
                    nestedScrollEnabled={true}
                >
                    <ImageBackground source={currentEnvironment.background} style={styles.backgroundWide} resizeMode="cover">
                        {/* render bird(s) positioned on the background */}
                        {currentBird && (
                            <TouchableOpacity
                                onPress={handleBirdTap}
                                // use percent coordinates if available, fallback to center
                                style={[
                                    styles.birdAbsolute,
                                    {
                                        left: currentBird.spawnX != null ? `${currentBird.spawnX * 100}%` : '50%',
                                        top: currentBird.spawnY != null ? `${currentBird.spawnY * 100}%` : '50%',
                                    },
                                ]}
                            >
                                <ImageBackground source={{ uri: currentBird.ImageUrl }} style={styles.birdImage}>
                                    <Text>{currentBird.Name}</Text>
                                </ImageBackground>
                            </TouchableOpacity>
                        )}
                    </ImageBackground>
                </ScrollView>
            )}
            <View style={styles.overlayContent} pointerEvents="box-none">
                <View style={styles.environmentButtons}>
                    {environments.map((env) => (
                        <TouchableOpacity
                            key={env.id}
                            style={[
                                styles.environmentButton,
                                selectedEnvironment === env.id && styles.selectedEnvironmentButton,
                            ]}
                            onPress={() => handleEnvironmentChange(env.id)}
                        >
                            <FontAwesomeIcon icon={['fas', env.icon]} color={colours.lightGreen} size={20} />
                        </TouchableOpacity>
                    ))}
                </View>

                {questions.length > 0 && (
                    <View style={styles.questionContainer}>
                        <Text style={styles.questionText}>{questions[0].question}</Text>
                        {/* temporary completion UI */}
                        <Button title="Complete" onPress={handleQuestionComplete} />
                    </View>
                )}
            </View>
        </View>
    );
};

export default MainGame;