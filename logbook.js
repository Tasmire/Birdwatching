import React, { useState, useEffect, useRef } from "react";
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, ScrollView, Text, View, ImageBackground, TouchableOpacity, Image, Modal, Dimensions, ActivityIndicator, DeviceEventEmitter, Alert } from 'react-native';
import { styles } from "./styles/gameStyles";
import { colours } from "./styles/colourScheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiCallGet } from "./operations/ApiCalls";
import Starburst from './components/Starburst';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useIsFocused } from '@react-navigation/native';

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
    const isFocused = useIsFocused();
    const [loading, setLoading] = useState(true);
    const [environments, setEnvironments] = useState([]);
    const [allBirds, setAllBirds] = useState([]);
    const [selectedEnvIndex, setSelectedEnvIndex] = useState(0);
    const [userId, setUserId] = useState(null);
    const [token, setToken] = useState(null);
    const [seenSet, setSeenSet] = useState(new Set());
    const [unlockedMap, setUnlockedMap] = useState({});
    const [modalBird, setModalBird] = useState(null);
    const [modalPhotos, setModalPhotos] = useState([]);
    const [showGalleryModal, setShowGalleryModal] = useState(false);
    const [fullScreenPhoto, setFullScreenPhoto] = useState(null);
    const [placeholderImage] = useState(require("./assets/bird.png"));

    const prevPage = () => setSelectedEnvIndex((i) => (i - 1 + environments.length) % environments.length);
    const nextPage = () => setSelectedEnvIndex((i) => (i + 1) % environments.length);

    const normalizeKey = (s) => (String(s || '').replace(/[^a-z0-9]/gi, '').toLowerCase());

    const fetchUnlockedForUser = async (uid, tkn) => {
        try {
            const unlocked = await apiCallGet(`http://10.0.2.2:5093/api/UserAnimalInfoUnlockedAPI?userId=${uid}`, tkn) || [];
            const map = {};
            (unlocked || []).forEach(u => {
                const aid = String(u.animalId ?? u.AnimalId ?? u.Animal?.animalId ?? u.Animal?.AnimalId);
                const rawInfo = (u.infoType ?? u.InfoType ?? u.infoKey ?? u.InfoKey ?? '').toString();
                const infoKey = normalizeKey(rawInfo);
                const isUnlocked = (u.isUnlocked ?? u.IsUnlocked ?? true);
                if (!aid || !infoKey) return;
                const aKey = String(aid);
                if (!map[aKey]) map[aKey] = new Set();
                if (isUnlocked) map[aKey].add(infoKey);
            });
            setUnlockedMap(map);
            // console.log('fetched unlockedMap keys sample:', Object.keys(map).slice(0,10));
        } catch (e) {
            console.error('fetchUnlockedForUser error', e);
        }
    };

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
                    // normalize unlocked info keys
                    const normalizeKey = (s) => (String(s || '').replace(/[^a-z0-9]/gi, '').toLowerCase());
                    const map = {};
                    (unlocked || []).forEach(u => {
                        const aid = String(u.animalId ?? u.AnimalId ?? u.Animal?.animalId ?? u.Animal?.AnimalId);
                        const rawInfo = (u.infoType ?? u.InfoType ?? u.infoKey ?? u.InfoKey ?? '').toString();
                        const infoKey = normalizeKey(rawInfo);
                        const isUnlocked = (u.isUnlocked ?? u.IsUnlocked ?? true);
                        if (!aid || !infoKey) return;
                        const aKey = String(aid);
                        if (!map[aKey]) map[aKey] = new Set();
                        if (isUnlocked) map[aKey].add(infoKey);
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

    const fetchPhotosForAnimal = async (animalId, uid, tkn) => {
        if (!animalId || !uid) {
            setModalPhotos([]);
            return;
        }
        try {
            const res = await apiCallGet(`http://10.0.2.2:5093/api/UserAnimalPhotosAPI?userId=${uid}&animalId=${animalId}`, tkn) || [];
            // normalize into objects with id and url (preserve other fields if available)
            const photos = (res || []).map(p => ({
                id: p.userAnimalPhotoId ?? p.UserAnimalPhotoId ?? p.UserAnimalPhotoId ?? p.id ?? p.Id ?? null,
                url: p.photoUrl ?? p.PhotoUrl ?? p.photoUri ?? p.PhotoUri ?? '',
                dateUploaded: p.dateUploaded ?? p.DateUploaded ?? null,
            })).filter(x => x.url);
            setModalPhotos(photos);
        } catch (err) {
            console.error('fetchPhotosForAnimal', err);
            setModalPhotos([]);
        }
    };

    const openBirdModal = (bird) => {
        const aid = String(bird.animalId ?? bird.AnimalId ?? bird.AnimalId);
        if (!seenSet.has(aid)) return;
        // find full bird object from allBirds
        const full = (allBirds || []).find(a => String(a.animalId ?? a.AnimalId) === aid) || bird;
        setModalBird(full);
        // fetch photos for this bird
        fetchPhotosForAnimal(aid, userId, token);
    };

    const closeBirdModal = () => {
        setModalBird(null);
        setShowGalleryModal(false);
    };

    // Refresh gallery when a new photo is added for the currently-open bird
    useEffect(() => {
        const sub = DeviceEventEmitter.addListener('photoAdded', (data) => {
            if (!data || !data.animalId) return;
            const addedAid = String(data.animalId);
            const modalAid = String(modalBird?.animalId ?? modalBird?.AnimalId ?? '');
            if (modalAid && modalAid === addedAid) {
                fetchPhotosForAnimal(modalAid, userId, token);
            }
        });
        return () => sub.remove();
    }, [modalBird, userId, token]);

    useEffect(() => {
        if (showGalleryModal && modalBird) {
            const aid = String(modalBird?.animalId ?? modalBird?.AnimalId ?? '');
            if (aid && userId) fetchPhotosForAnimal(aid, userId, token);
        }
    }, [showGalleryModal, modalBird, userId, token]);

    const deletePhoto = async (photoId) => {
        if (!photoId || !token) return;
        Alert.alert(
            'Delete photo',
            'Are you sure you want to delete this photo?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const resp = await fetch(`http://10.0.2.2:5093/api/UserAnimalPhotosAPI/${photoId}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Accept': 'application/json'
                                }
                            });
                            if (!resp.ok) {
                                const txt = await resp.text();
                                console.error('Delete failed', resp.status, txt);
                                Alert.alert('Delete failed', 'Could not delete photo.');
                                return;
                            }
                            // refresh list
                            const aid = String(modalBird?.animalId ?? modalBird?.AnimalId ?? '');
                            if (aid && userId) fetchPhotosForAnimal(aid, userId, token);
                        } catch (err) {
                            console.error('deletePhoto error', err);
                            Alert.alert('Delete failed', 'An error occurred.');
                        }
                    }
                }
            ]
        );
    };

    // re-fetch when screen becomes focused
    useEffect(() => {
        if (isFocused && userId) {
            fetchUnlockedForUser(userId, token);
        }
    }, [isFocused, userId, token]);

    useEffect(() => {
        const sub = DeviceEventEmitter.addListener('userInfoUnlocked', (data) => {
            if (!data || !data.animalId || !userId) return;
            fetchUnlockedForUser(userId, token);
        });
        return () => sub.remove();
    }, [userId, token]);

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
                    <Text style={[styles.logbookTitle, styles.darkText]}>Logbook</Text>
                    <Text style={[styles.logbookSubtitle, styles.darkText]}>{env ? env.name : 'Logbook'}</Text>

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
                            {/* <Text style={styles.logbookPageButtonText}>◀</Text> */}
                            <FontAwesomeIcon icon={['fas', 'chevron-left']} size={16} color={colours.darkGreen} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={nextPage} style={styles.logbookPageButton}>
                            {/* <Text style={styles.logbookPageButtonText}>▶</Text> */}
                            <FontAwesomeIcon icon={['fas', 'chevron-right']} size={16} color={colours.darkGreen} />
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
                                    </View>
                                </View>

                                <View style={styles.modalDetails}>
                                    {infoFields.map(f => {
                                        const rawProp = f.prop;
                                        const aid = String(modalBird?.animalId ?? modalBird?.AnimalId ?? '');
                                        const unlockedSet = unlockedMap[aid] || new Set();
                                        const normalizeKey = (s) => (String(s || '').replace(/[^a-z0-9]/gi, '').toLowerCase());
                                        const propKey = normalizeKey(rawProp);

                                        const isUnlocked = unlockedSet.has(propKey);

                                        const tryKeys = [rawProp, rawProp.charAt(0).toUpperCase() + rawProp.slice(1), rawProp.toLowerCase()];
                                        let val = undefined;
                                        for (let k of tryKeys) {
                                            if (modalBird?.hasOwnProperty(k)) { val = modalBird[k]; break; }
                                        }

                                        const display = isUnlocked ? (val !== undefined && val !== null ? String(val) : '—') : '???';

                                        return (
                                            <View key={rawProp} style={styles.detailRow}>
                                                <Text style={styles.detailLabel}>{f.label}:</Text>
                                                <Text style={styles.detailValue}>{display}</Text>
                                            </View>
                                        );
                                    })}
                                </View>

                                {/* Gallery section */}
                                <View style={{ marginTop: 12 }}>
                                    <Text style={[styles.sectionTitle, { color: colours.lightGreen }]}>Gallery</Text>

                                    <View style={{ marginTop: 12, alignItems: 'flex-end' }}>
                                        <TouchableOpacity
                                            onPress={() => {
                                               const aid = String(modalBird?.animalId ?? modalBird?.AnimalId ?? '');
                                                if (aid && userId) fetchPhotosForAnimal(aid, userId, token);
                                                setShowGalleryModal(true);
                                            }}
                                            style={[styles.closeButton, { paddingHorizontal: 14 }]}
                                        >
                                            <Text style={styles.closeButtonText}>Open gallery</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                
                                <View style={styles.modalActions}>
                                    <TouchableOpacity onPress={() => closeBirdModal()} style={styles.closeButton}>
                                        <Text style={styles.closeButtonText}>Close</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>

                {/* Dedicated Gallery Modal */}
                <Modal visible={showGalleryModal} animationType="slide" transparent>
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <Text style={[styles.modalTitle, { marginTop: 8, marginBottom: 0 }]}>{modalBird ? `${modalBird?.name ?? modalBird?.Name} — Gallery` : 'Gallery'}</Text>
                                </View>

                                {modalPhotos.length === 0 ? (
                                    <Text style={{ color: colours.offWhite }}>No photos yet. Take a photo in the game to add one.</Text>
                                ) : (
                                    <ScrollView style={{ maxHeight: 480 }}>
                                        {(modalPhotos || []).map((p, idx) => (
                                            <View key={String(p.id ?? idx)} style={{ marginBottom: 12 }}>
                                                <TouchableOpacity activeOpacity={0.9} onPress={() => setFullScreenPhoto(p)}>
                                                    <Image source={{ uri: p.url }} style={{ width: '100%', height: 260, borderRadius: 8, backgroundColor: '#000' }} resizeMode="cover" />
                                                </TouchableOpacity>

                                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                                                    <TouchableOpacity onPress={() => deletePhoto(p.id)} style={[styles.closeButton, { paddingHorizontal: 12 }]}>
                                                        <Text style={styles.closeButtonText}>Delete</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        ))}
                                    </ScrollView>
                                )}

                                <View style={styles.modalActions}>
                                    <TouchableOpacity onPress={() => setShowGalleryModal(false)} style={styles.closeButton}>
                                        <Text style={styles.closeButtonText}>Close</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>

                    {/* Full-screen photo modal */}
                    <Modal visible={!!fullScreenPhoto} animationType="fade" transparent>
                        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }]}>
                            <View style={{ width: '96%', maxHeight: '92%' }}>
                                <Image source={{ uri: fullScreenPhoto?.url }} style={{ width: '100%', height: 520, borderRadius: 8, backgroundColor: '#000' }} resizeMode="contain" />
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                                    <TouchableOpacity onPress={() => setFullScreenPhoto(null)} style={[styles.closeButton, { flex: 1, marginRight: 8 }]}>
                                        <Text style={styles.closeButtonText}>Close</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => { if (fullScreenPhoto?.id) deletePhoto(fullScreenPhoto.id); setFullScreenPhoto(null); }} style={[styles.closeButton, { flex: 1 }]}>
                                        <Text style={styles.closeButtonText}>Delete</Text>
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