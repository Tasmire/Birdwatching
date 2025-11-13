import React, { useState, useEffect, useRef } from "react";
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, ScrollView, Text, View, ImageBackground, TouchableOpacity, Image, Modal, Dimensions, ActivityIndicator } from 'react-native';
import { styles } from "./styles/gameStyles";
import { colours } from "./styles/colourScheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiCallGet } from "./operations/ApiCalls";
import Starburst from './components/Starburst';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

const infoFields = [
    { prop: 'name', label: 'Name' },
    { prop: 'maoriName', label: 'Maori name' },
    { prop: 'scientificName', label: 'Scientific name' },
    { prop: 'averageSize', label: 'Average size' },
    { prop: 'habitat', label: 'Habitat' },
    { prop: 'diet', label: 'Diet' },
    { prop: 'origin', label: 'Origin' },
];

const Logbook = () => {
    const [loading, setLoading] = useState(true);
    const [environments, setEnvironments] = useState([]);
    const [allBirds, setAllBirds] = useState([]);
    const [selectedEnvIndex, setSelectedEnvIndex] = useState(0); // page index
    const [userId, setUserId] = useState(null);
    const [token, setToken] = useState(null);
    const [seenSet, setSeenSet] = useState(new Set()); // animalId set
    const [unlockedMap, setUnlockedMap] = useState({}); // animalId -> Set(infoType)
    const [modalBird, setModalBird] = useState(null);
    const [placeholderImage] = useState(require("./assets/bird.png"));

    useEffect(() => {
        (async () => {
            try {
                const storedGameData = await AsyncStorage.getItem("gameData");
                const parsed = storedGameData ? JSON.parse(storedGameData) : null;
                const uid = parsed?.userId ?? null;
                const tkn = parsed?.token ?? (await AsyncStorage.getItem("token")) ?? null;
                setUserId(uid);
                setToken(tkn);

                // load environments and animals
                const envs = await apiCallGet(`http://10.0.2.2:5093/api/EnvironmentsAPI`, tkn) || [];
                setEnvironments(envs.map(e => ({ id: e.environmentId ?? e.id ?? e.EnvironmentId, name: e.name ?? e.Name ?? '', raw: e })));

                const animals = await apiCallGet(`http://10.0.2.2:5093/api/AnimalsAPI`, tkn) || [];
                setAllBirds(animals);

                // load user seen birds (UserAnimals)
                if (uid) {
                    const userAnimals = await apiCallGet(`http://10.0.2.2:5093/api/UserAnimalsAPI?userId=${uid}`, tkn) || [];
                    const seen = new Set((userAnimals || []).filter(u => (u.timesSpotted ?? u.TimesSpotted ?? u.TimesSpotted ?? 0) > 0).map(u => String(u.animalId ?? u.AnimalId)));
                    setSeenSet(seen);

                    // load unlocked info
                    const unlocked = await apiCallGet(`http://10.0.2.2:5093/api/UserAnimalInfoUnlockedAPI?userId=${uid}`, tkn) || [];
                    const map = {};
                    (unlocked || []).forEach(u => {
                        const aid = String(u.animalId ?? u.AnimalId ?? u.Animal?.animalId ?? u.Animal?.AnimalId);
                        const info = (u.infoType ?? u.InfoType ?? u.infoKey ?? u.InfoKey ?? '').toString();
                        const isUnlocked = (u.isUnlocked ?? u.IsUnlocked ?? true);
                        if (!aid) return;
                        if (!map[aid]) map[aid] = new Set();
                        if (isUnlocked && info) map[aid].add(info);
                    });
                    setUnlockedMap(map);
                }

            } catch (err) {
                console.error("Error loading logbook data:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // helpers
    const animalsForEnvironment = (env) => {
        if (!env) return [];
        return (allBirds || []).filter(a => {
            const envId = a.environmentId ?? a.EnvironmentId ?? a.environment?.environmentId ?? a.environment?.EnvironmentId;
            return String(envId) === String(env.id);
        }).sort((x, y) => (String(x.name ?? x.Name ?? '')).localeCompare(String(y.name ?? y.Name ?? '')));
    };

    const openBirdModal = (bird) => {
        const aid = String(bird.animalId ?? bird.AnimalId ?? bird.AnimalId);
        if (!seenSet.has(aid)) return;
        // find full bird object from allBirds (names/fields may be PascalCase)
        const full = (allBirds || []).find(a => String(a.animalId ?? a.AnimalId) === aid) || bird;
        setModalBird(full);
    };

    const closeBirdModal = () => setModalBird(null);

    const prevPage = () => setSelectedEnvIndex((i) => (i - 1 + environments.length) % environments.length);
    const nextPage = () => setSelectedEnvIndex((i) => (i + 1) % environments.length);

    if (loading) {
        return (
            <ImageBackground resizeMode="cover" source={require("./assets/bgLogbook.jpg")} style={{ flex: 1 }}>
                <View style={[styles.viewContainer, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color={colours.mediumGreen} />
                </View>
            </ImageBackground>
        );
    }

    const env = environments[selectedEnvIndex] || null;
    const birdsInEnv = animalsForEnvironment(env);

    return (
        <ImageBackground resizeMode="cover" source={require("./assets/bgLogbook.jpg")} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scrollViewContainer}>
                <View style={styles.viewContainer}>
                    <Text style={[styles.title, styles.darkText, styles.topMargin]}>Logbook</Text>
                    <Text style={[styles.subtitle, styles.darkText]}>{env ? env.name : 'Logbook'}</Text>

                    <View style={styles.logbookBirdGrid}>
                        {(birdsInEnv || []).map((b) => {
                            const aid = String(b.animalId ?? b.AnimalId);
                            const seen = seenSet.has(aid);
                            const displayName = seen ? (b.name ?? b.Name ?? 'Unknown') : '???';
                            const imageSrc = seen ? ((typeof (b.imageUrl ?? b.ImageUrl) === 'string') ? { uri: (b.imageUrl ?? b.ImageUrl).startsWith('http') ? (b.imageUrl ?? b.ImageUrl) : `http://10.0.2.2:5093/img/animals/${b.imageUrl ?? b.ImageUrl}` } : (b.imageUrl ?? b.ImageUrl)) : placeholderImage;

                            return (
                                <TouchableOpacity
                                    key={aid}
                                    style={styles.logbookBirdCard}
                                    onPress={() => openBirdModal(b)}
                                    disabled={!seen}
                                    activeOpacity={0.8}
                                >
                                    <Image source={imageSrc} style={styles.logbookBirdImage} resizeMode="cover" />
                                    <Text style={styles.logbookBirdName}>{displayName}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* page buttons bottom left / right */}
                    <View style={styles.logbookPageControls}>
                        <TouchableOpacity onPress={prevPage} style={styles.logbookPageButton}>
                            <Text style={styles.logbookPageButtonText}>◀</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={nextPage} style={styles.logbookPageButton}>
                            <Text style={styles.logbookPageButtonText}>▶</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Modal for bird details */}
                    <Modal visible={!!modalBird} animationType="slide" transparent>
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <View style={styles.modalTop}>
                                    <Image source={typeof (modalBird?.imageUrl ?? modalBird?.ImageUrl) === 'string' ? { uri: (modalBird.imageUrl ?? modalBird.ImageUrl).startsWith('http') ? (modalBird.imageUrl ?? modalBird.ImageUrl) : `http://10.0.2.2:5093/img/animals/${modalBird.imageUrl ?? modalBird.ImageUrl}` } : (modalBird?.imageUrl ?? (modalBird?.ImageUrl || placeholderImage))} style={styles.modalImage} />
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={styles.modalTitle}>{modalBird?.name ?? modalBird?.Name}</Text>
                                        <Text style={styles.modalSubtitle}>{modalBird?.scientificName ?? modalBird?.ScientificName ?? ''}</Text>
                                    </View>
                                </View>

                                <View style={styles.modalDetails}>
                                    {infoFields.map(f => {
                                        const key = f.prop;
                                        const aid = String(modalBird?.animalId ?? modalBird?.AnimalId);
                                        const unlockedSet = unlockedMap[aid] || new Set();
                                        // support both casings in unlockedMap
                                        const isUnlocked = unlockedSet.has(key) || unlockedSet.has(key.charAt(0).toUpperCase() + key.slice(1)) || unlockedSet.has(key.toLowerCase());
                                        if (!isUnlocked) return null;
                                        // resolve value from modalBird (handle PascalCase)
                                        const val = modalBird?.[key] ?? modalBird?.[key.charAt(0).toUpperCase() + key.slice(1)];
                                        if (!val && val !== 0) return null;
                                        return (
                                            <View key={key} style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>{f.label}:</Text>
                                                <Text style={styles.detailValue}>{String(val)}</Text>
                                            </View>
                                        );
                                    })}
                                </View>

                                <View style={styles.modalActions}>
                                    <TouchableOpacity onPress={() => setModalBird(null)} style={styles.closeButton}>
                                        <Text style={styles.closeButtonText}>Close</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>

                </View>
            </ScrollView>
        </ImageBackground>
    );
};

export default Logbook;