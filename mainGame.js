import React, { useState, useEffect, useContext, useRef, useCallback, ImageBackground, TouchableOpacity } from "react";
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { styles } from "./styles/gameStyles";
import apiCallGet from "./operations/ApiCalls";
import generateRandomQuestions from "./operations/GenerateQuestions";
import takeScreenshot from "./operations/TakeScreenshot";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MainGame = () => {
    const [selectedEnvironment, setSelectedEnvironment] = useState("Urban");
    const [birds, setBirds] = useState([]);
    const [currentBirdIndex, setCurrentBirdIndex] = useState(0);
    const [environments, setEnvironments] = useState([]);

    const fetchGameData = async () => {
        try {
            const storedGameData = await AsyncStorage.getItem("gameData");

            if (!storedGameData) {
                throw new Error("No game data found in AsyncStorage.");
            }

            const parsedGameData = JSON.parse(storedGameData);
            const userId = parsedGameData.userId;
            const token = parsedGameData.token;

            const [userData, environmentData, spawnData] = await Promise.all([
                apiCallGet(`http://10.0.2.2:5093/api/UsersAPI/${userId}`, token),
                apiCallGet(`http://10.0.2.2:5093/api/EnvironmentsAPI`, token),
                apiCallGet(`http://10.0.2.2:5093/api/SpawnLocationsAPI`, token),
            ]);

            const imageMapping = {
                "bgUrban.jpg": require("./assets/bgUrban.jpg"),
                "bgForest.jpg": require("./assets/bgForest.jpg"),
                "bgCoastal.jpg": require("./assets/bgCoastal.jpg"),
            };

            const formattedEnvironments = environmentData.map((env) => ({
                id: env.environmentId,
                name: env.name,
                background: imageMapping[env.imageUrl], // Use imageMapping to get background
                icon: env.navigationIcon, // Dynamically load icon
            }));

            setEnvironments(formattedEnvironments);

            if (formattedEnvironments.length > 0) {
                setSelectedEnvironment(formattedEnvironments[0].id);
                fetchBirds(formattedEnvironments[0].id, token);
            }

            setGameData({ userData, environmentData, spawnData });
        } catch (error) {
            console.error("Error fetching game data:", error);
        }
    };

    useEffect(() => {
        const checkGameData = async () => {
            const storedGameData = await AsyncStorage.getItem("gameData");
            console.log("Stored game data:", storedGameData);
        };

        checkGameData();
    }, []);

    // Call to get birds for selected environment
    const fetchBirds = async (environmentId) => {
        try {
            const token = await AsyncStorage.getItem("token");
            const birdsData = await apiCallGet(`http://10.0.2.2:5093/api/AnimalsAPI?environmentId=${environmentId}`, token);
            setBirds(birdsData);
            setCurrentBirdIndex(0); // Reset to the first bird
        } catch (error) {
            console.error("Error fetching birds:", error);
        }
    };

    const handleEnvironmentChange = async (environmentId) => {
        setSelectedEnvironment(environmentId);
        const token = await AsyncStorage.getItem("token");
        fetchBirds(environmentId, token);
    };

    useEffect(() => {
        // Fetch birds for the default environment on mount
        fetchBirds(selectedEnvironment);
        fetchGameData();
    }, []);

    const currentEnvironment = environments.find((env) => env.id === selectedEnvironment);
    const currentBird = birds[currentBirdIndex];

    const handleBirdTap = async () => {
        const token = await AsyncStorage.getItem("token");

        // Check if the bird has been spotted before
        const spottedData = await apiCallGet(`http://10.0.2.2:5093/api/UserAnimalsAPI?userId=${userId}&animalId=${currentBird.AnimalId}`, token);
        const isSpotted = spottedData?.length > 0;

        // Show the first question if not spotted, or random questions if spotted
        const questions = isSpotted
            ? generateRandomQuestions(currentBird)
            : [{ question: "What is the name of this bird?", correctAnswer: currentBird.Name }];

        setQuestions(questions);

        // Take a screenshot
        takeScreenshot(viewRef, userId, currentBird);

        // Save to UserAnimals table
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
    };


    return (
        <View style={styles.container}>
            {/* Environment Buttons */}
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
                        <Text style={styles.environmentButtonText}>{env.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Background Image */}

            {currentEnvironment && (
                <ImageBackground source={currentEnvironment.background} style={styles.background}>
                    <Text style={styles.title}>Current Environment: {currentEnvironment.name}</Text>
                    {currentBird && (
                        <TouchableOpacity onPress={handleBirdTap}>
                            <ImageBackground source={{ uri: currentBird.ImageUrl }} style={styles.birdImage}>
                                <Text style={styles.birdName}>{currentBird.Name}</Text>
                            </ImageBackground>
                        </TouchableOpacity>
                    )}

                    {questions.length > 0 && (
                        <View style={styles.questionContainer}>
                            {questions.map((q, index) => (
                                <Text key={index} style={styles.questionText}>{q.question}</Text>
                            ))}
                        </View>
                    )}
                </ImageBackground>
            )}
        </View>
    );
};

export default MainGame;