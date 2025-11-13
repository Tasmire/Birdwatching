import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ImageBackground, TouchableOpacity, Button, ScrollView, Dimensions, Image, Alert } from 'react-native';
import { styles } from "./styles/gameStyles";
import { colours } from "./styles/colourScheme";
import { apiCallGet, apiCallPost, apiCallPut } from "./operations/ApiCalls";
import generateRandomQuestions from "./operations/GenerateQuestions";
import takeScreenshot from "./operations/TakeScreenshot";
import { evaluateAchievements } from "./operations/EvaluateAchievements";
import { RandomAnswerOptions } from "./utilities/RandomAnswerOptions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DeviceEventEmitter } from 'react-native';
import Toast from 'react-native-toast-message';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withDecay, withTiming } from 'react-native-reanimated';

library.add(fas, far, fab);

const MainGame = () => {

    /*
    Image sizing
    */
    
    const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);
    const saved = { x: 0, y: 0, s: 1 };

    // intrinsic image size (pixels) and displayed size (pixels)
    const bgIntrinsicWidth = useSharedValue(windowWidth * 7);
    const bgIntrinsicHeight = useSharedValue(windowHeight);
    const bgDisplayWidth = useSharedValue(windowWidth * 7);
    const bgDisplayHeight = useSharedValue(windowHeight);

    // use plain defaults for initial React state
    const [bgDisplayW, setBgDisplayW] = useState(windowWidth * 7);
    const [bgDisplayH, setBgDisplayH] = useState(windowHeight);

    // preserving aspect ratio: displayScale = windowHeight / intrinsicHeight
    const setBgSizesFromSource = (imgSource) => {
        try {
            if (!imgSource) return;
            // bundled asset
            if (typeof imgSource === 'number') {
                const resolved = Image.resolveAssetSource(imgSource);
                if (resolved?.width && resolved?.height) {
                    bgIntrinsicWidth.value = resolved.width;
                    bgIntrinsicHeight.value = resolved.height;
                    const scaleToFitHeight = windowHeight / resolved.height;
                    bgDisplayWidth.value = Math.round(resolved.width * scaleToFitHeight);
                    bgDisplayHeight.value = Math.round(windowHeight);
                    // update React state mirror
                    setBgDisplayW(Math.round(resolved.width * scaleToFitHeight));
                    setBgDisplayH(Math.round(windowHeight));
                    return;
                }
            }
            // remote uri
            const uri = typeof imgSource === 'object' && imgSource.uri ? imgSource.uri : imgSource;
            if (typeof uri === 'string') {
                Image.getSize(uri,
                    (w, h) => {
                        bgIntrinsicWidth.value = w;
                        bgIntrinsicHeight.value = h;
                        const scaleToFitHeight = windowHeight / h;
                        bgDisplayWidth.value = Math.round(w * scaleToFitHeight);
                        bgDisplayHeight.value = Math.round(windowHeight);
                        setBgDisplayW(Math.round(w * scaleToFitHeight));
                        setBgDisplayH(Math.round(windowHeight));
                    },
                    () => {
                        // fallback keep previous values
                        const wval = Math.max(windowWidth, bgDisplayWidth.value);
                        const hval = windowHeight;
                        bgDisplayWidth.value = wval;
                        bgDisplayHeight.value = hval;
                        setBgDisplayW(wval);
                        setBgDisplayH(hval);
                    }
                );
            }
        } catch (e) {
            const wval = Math.max(windowWidth, bgDisplayWidth.value);
            const hval = windowHeight;
            bgDisplayWidth.value = wval;
            bgDisplayHeight.value = hval;
            setBgDisplayW(wval);
            setBgDisplayH(hval);
        }
    };

    const defaultBirdHeight = 80;
    const defaultBirdWidth = 80;
    const [birdSizes, setBirdSizes] = useState({});
    const setBirdSizeForId = (id, size) => {
        setBirdSizes((prev) => ({ ...prev, [id]: size }));
    }

    const loadImageSize = (src, animalId) => {
        if (!src || !animalId) return;

        try {
            if (typeof src === 'number') {
                const resolved = Image.resolveAssetSource(src);
                setBirdSizeForId(animalId, { width: resolved.width || defaultBirdWidth, height: resolved.height || defaultBirdHeight });
                return;
            }
            const uri = typeof src === 'object' && src.uri ? src.uri : src;
            if (!uri) return;
            Image.getSize(uri,
                (width, height) => setBirdSizeForId(animalId, { width, height }),
                () => setBirdSizeForId(animalId, { width: defaultBirdWidth, height: defaultBirdHeight })
            );
        } catch (e) {
            setBirdSizeForId(animalId, { width: defaultBirdWidth, height: defaultBirdHeight });
        }
    };

    const clamp = (v, min, max) => {
        'worklet';
        if (v < min) return min;
        if (v > max) return max;
        return v;
    };

    const getMinScale = () => {
        'worklet';
        // ensure scaled background covers the viewport (use displayed sizes)
        return Math.max(windowWidth / bgDisplayWidth.value, windowHeight / bgDisplayHeight.value, 1);
    };

    /*
    Background movement and zooming
    */

    // pan gesture to move around the background (use display sizes)
    const pan = Gesture.Pan()
        .onStart(() => {
            saved.x = translateX.value;
            saved.y = translateY.value;
        })
        .onUpdate((e) => {
            // compute current bounds based on current scale (worklet) using displayed size
            const scaledW = bgDisplayWidth.value * scale.value;
            const scaledH = bgDisplayHeight.value * scale.value;
            const maxX = Math.max(0, (scaledW - windowWidth) / 2);
            const maxY = Math.max(0, (scaledH - windowHeight) / 2);

            translateX.value = clamp(saved.x + e.translationX, -maxX, maxX);
            translateY.value = clamp(saved.y + e.translationY, -maxY, maxY);
        })
        .onEnd((e) => {
            // recompute bounds for decay clamping
            const scaledW = bgDisplayWidth.value * scale.value;
            const scaledH = bgDisplayHeight.value * scale.value;
            const maxX = Math.max(0, (scaledW - windowWidth) / 2);
            const maxY = Math.max(0, (scaledH - windowHeight) / 2);

            translateX.value = withDecay({ velocity: e.velocityX, clamp: [-maxX, maxX] });
            translateY.value = withDecay({ velocity: e.velocityY, clamp: [-maxY, maxY] });
        });
    
    // pinch gesture to zoom in/out
    const pinch = Gesture.Pinch()
        .onStart(() => { saved.s = scale.value; })
        .onUpdate((e) => {
            const minScale = getMinScale();
            const nextScale = Math.max(minScale, Math.min(3, saved.s * e.scale));
            // compute new bounds based on nextScale using displayed size
            const scaledW = bgDisplayWidth.value * nextScale;
            const scaledH = bgDisplayHeight.value * nextScale;
            const maxX = Math.max(0, (scaledW - windowWidth) / 2);
            const maxY = Math.max(0, (scaledH - windowHeight) / 2);

            scale.value = nextScale;
            translateX.value = clamp(translateX.value, -maxX, maxX);
            translateY.value = clamp(translateY.value, -maxY, maxY);
        })
        .onEnd(() => {
            const minScale = getMinScale();
            if (scale.value < minScale) scale.value = withTiming(minScale);
        });

    const gesture = Gesture.Simultaneous(pan, pinch);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
    }));

    /*
    Data fetching and game state
    */

    const [selectedEnvironment, setSelectedEnvironment] = useState(null);
    const [birds, setBirds] = useState([]);
    const [allBirds, setAllBirds] = useState([]);
    const [currentBirdIndex, setCurrentBirdIndex] = useState(0);
    const [environments, setEnvironments] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [spawnData, setSpawnData] = useState({});
    const [achievementsMap, setAchievementsMap] = useState({});
    const [userId, setUserId] = useState(null);
    const [token, setToken] = useState(null);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isAnsweredCorrectly, setIsAnsweredCorrectly] = useState(null);
    const [isCapturing, setIsCapturing] = useState(false);

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

            // NEW: fetch spawn locations (many-to-many now). We'll build a map animalId => [spawnLocations]
            // try multiple possible endpoints / shapes and log results so we can see what's returned
            let spawnLocationsRaw = await apiCallGet(`http://10.0.2.2:5093/api/SpawnLocationsAPI`, tkn);
            // console.log('spawnFetchAttempt 1 ->', Array.isArray(spawnLocationsRaw) ? `array(${spawnLocationsRaw.length})` : typeof spawnLocationsRaw, spawnLocationsRaw);
            if (!spawnLocationsRaw || (Array.isArray(spawnLocationsRaw) && spawnLocationsRaw.length === 0)) {
                // fallback to alternate route name
                spawnLocationsRaw = await apiCallGet(`http://10.0.2.2:5093/api/SpawnLocations`, tkn);
                // console.log('spawnFetchAttempt 2 ->', Array.isArray(spawnLocationsRaw) ? `array(${spawnLocationsRaw.length})` : typeof spawnLocationsRaw, spawnLocationsRaw);
            }

            // some servers wrap results in { data: [...] } or { value: [...] }
            if (spawnLocationsRaw && !Array.isArray(spawnLocationsRaw)) {
                if (Array.isArray(spawnLocationsRaw.data)) spawnLocationsRaw = spawnLocationsRaw.data;
                else if (Array.isArray(spawnLocationsRaw.value)) spawnLocationsRaw = spawnLocationsRaw.value;
                else if (spawnLocationsRaw.items && Array.isArray(spawnLocationsRaw.items)) spawnLocationsRaw = spawnLocationsRaw.items;
                else spawnLocationsRaw = [];
            }

            // build lookup map from normalized spawnLocationsRaw
            const spawnMap = {};
            (spawnLocationsRaw || []).forEach(sp => {
                 // defensive property names
                 const spId = sp.spawnLocationId ?? sp.SpawnLocationId ?? sp.spawnLocationId;
                 const rawX = sp.xCoordinate ?? sp.XCoordinate ?? sp.x ?? 0;
                 const rawY = sp.yCoordinate ?? sp.YCoordinate ?? sp.y ?? 0;
                 const scale = sp.scale ?? sp.Scale ?? 1;
                 const spawnType = sp.spawnType ?? sp.SpawnType ?? null;
                // the API may include Animals as full objects or as IDs; handle common shapes
                const animalsList = sp.animals ?? sp.Animals ?? sp.AnimalIds ?? sp.animalIds ?? sp.Animal ?? sp.AnimalsList ?? [];
                 // normalize animalsList to array of ids
                const ids = Array.isArray(animalsList)
                    ? animalsList.map(a => (typeof a === 'object' ? (a.animalId ?? a.AnimalId ?? a.id ?? a.Id) : a)).filter(Boolean)
                    : [];
 
                 ids.forEach(aid => {
                    // normalize the key to lowercase string for reliable lookups
                    const key = String(aid).toLowerCase();
                    if (!spawnMap[key]) spawnMap[key] = [];
                    spawnMap[key].push({
                         spawnLocationId: spId,
                         spawnX: rawX,
                         spawnY: rawY,
                         spawnScale: scale,
                         spawnType,
                         raw: sp,
                     });
                 });
             });
 
             // store spawnMap in state so other functions can use it (previous code used spawnData)
             setSpawnData(spawnMap);
 
            // console.log("spawnMap (keys):", Object.keys(spawnMap).slice(0,20), spawnMap);

            const userData = uid ? await apiCallGet(`http://10.0.2.2:5093/api/UsersAPI/${uid}`, tkn) : null;

            const allAnimals = await apiCallGet(`http://10.0.2.2:5093/api/AnimalsAPI`, tkn);
            setAllBirds(allAnimals || []);
            
            // fetch achievement definitions once and store as map by id (for toasts)
            try {
                const allAch = await apiCallGet(`http://10.0.2.2:5093/api/AchievementsAPI`, tkn) || [];
                const map = {};
                (allAch || []).forEach(a => {
                    const id = String(a.achievementId ?? a.AchievementId ?? a.id ?? a.Id);
                    if (id) map[id] = a;
                });
                setAchievementsMap(map);
            } catch (e) { console.warn('Unable to load achievement definitions', e); }

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
                // immediately fetch birds for the initial environment using the spawnMap
                fetchBirds(formattedEnvironments[0].id, tkn, spawnMap);
            }

        } catch (error) {
            console.error("Error fetching game data:", error);
        }
    };

    /*
    Bird fetching per environment
    */

    const IMAGE_BASE_URL = 'http://10.0.2.2:5093/img/animals/';

    // spawnMapOverride: optional map built locally (used to avoid reading stale state immediately after setSpawnData)
    const fetchBirds = async (environmentId, tkn = token, spawnMapOverride = null) => {
        try {
            if (!environmentId) return;
            console.log('fetchBirds called with environmentId:', environmentId, ' token:', !!tkn);
            const birdsData = await apiCallGet(`http://10.0.2.2:5093/api/AnimalsAPI?environmentId=${environmentId}`, tkn);

            const birdsForEnv = (birdsData || []).filter(b => String(b.environmentId ?? b.EnvironmentId) === String(environmentId));

            console.log('birdsData length:', (birdsData || []).length, 'birdsForEnv length:', birdsForEnv.length);

            // normalize spawn locations to fraction [0..1] for left/top percent rendering
            const normalizeSpawn = (sl) => {
                if (!sl) return null;
                const rawX = sl.spawnX ?? sl.xCoordinate ?? sl.XCoordinate ?? sl.raw?.XCoordinate ?? sl.raw?.xCoordinate ?? 0;
                const rawY = sl.spawnY ?? sl.yCoordinate ?? sl.YCoordinate ?? sl.raw?.YCoordinate ?? sl.raw?.yCoordinate ?? 0;
                const spawnScale = sl.spawnScale ?? sl.scale ?? sl.raw?.Scale ?? 1;
                // uses fractions if stored in DB, otherwise converts pixels to fractions
                const intrinsicW = bgIntrinsicWidth.value || bgDisplayWidth.value || windowWidth;
                const intrinsicH = bgIntrinsicHeight.value || bgDisplayHeight.value || windowHeight;

                let spawnX = (rawX >= 0 && rawX <= 1) ? rawX : rawX / intrinsicW;
                let spawnY = (rawY >= 0 && rawY <= 1) ? rawY : rawY / intrinsicH;
                // clamp to [0..1]
                spawnX = Math.min(1, Math.max(0, spawnX));
                spawnY = Math.min(1, Math.max(0, spawnY));
                return { spawnX, spawnY, spawnScale, spawnLocationId: sl.spawnLocationId ?? sl.spawnLocationId ?? sl.raw?.SpawnLocationId, raw: sl.raw };
            };

            const mapped = (birdsForEnv || []).map(b => {
                const birdId = b.animalId ?? b.AnimalId;
                const birdName = b.name ?? b.Name;
                const birdImageRaw = b.imageUrl ?? b.ImageUrl;
                let birdImage;
                const birdEnvId = b.environmentId ?? b.EnvironmentId;

                if (typeof birdImageRaw === 'string') {
                    // create full URL if DB doesn't have it
                    birdImage = (birdImageRaw.startsWith?.('http://') || birdImageRaw.startsWith?.('https://'))
                        ? { uri: birdImageRaw }
                        : { uri: IMAGE_BASE_URL + birdImageRaw };
                } else {
                    birdImage = birdImageRaw;
                }

                // prefer the override map if provided (freshly built), otherwise fall back to state
                const spawnLookup = spawnMapOverride ?? spawnData;
                // normalize bird id when checking the lookup
                const birdKey = String(birdId).toLowerCase();
                const rawSpawns = (spawnLookup && spawnLookup[birdKey]) ? spawnLookup[birdKey] : (b.spawnLocations || []);
                if ((!rawSpawns || rawSpawns.length === 0) && spawnLookup) {
                    // helpful debug when no spawn found
                    console.log('spawn lookup miss for bird:', birdId, 'birdKey:', birdKey, 'availableKeysSample:', Object.keys(spawnLookup).slice(0,10));
                }

                const normalized = (rawSpawns || []).map(normalizeSpawn).filter(Boolean);
                const finalSpawns = (normalized && normalized.length > 0)
                    ? normalized
                    : [{ spawnX: 0.5, spawnY: 0.5, spawnScale: 1 }]; // default center spawn
                
                if (!normalized || normalized.length === 0) {
                    console.log(`No valid spawn locations for bird ${birdName} (${birdId}) in environment ${environmentId}; using default center spawn.`);
                }

                return {    
                    AnimalId: birdId,
                    Name: birdName,
                    ImageUrl: birdImage,
                    environmentId: birdEnvId,
                    //spawnLocations: (rawSpawns || []).map(normalizeSpawn).filter(Boolean),
                    spawnLocations: finalSpawns,
                };
            });

            const shuffled = shuffleArray(mapped);
            // shuffle the mapped array
            setBirds(shuffled);
            (shuffled || []).forEach(b => loadImageSize(b.ImageUrl, b.AnimalId));
            setCurrentBirdIndex(0); // Reset spawn index
            setQuestions([]); // clear any pending questions
        } catch (error) {
            console.error("Error fetching birds:", error);
        }
    };
    useEffect(() => {
        console.log('birds[0]', birds && birds[0]);
    }, [birds]);

    /*
    Adds environment button functionality
    */

    const handleEnvironmentChange = async (environmentId) => {
        const env = environments.find((env) => env.id === environmentId);
        if (env?.background) setBgSizesFromSource(env.background);
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

    // update intrinsic/display background size when environment/background changes
    useEffect(() => {
        const env = environments.find((env) => env.id === selectedEnvironment);
        if (env?.background) {
            setBgSizesFromSource(env.background);
        } else {
            // fallback: update both shared values and React mirror without reading .value in render
            const wval = Math.max(windowWidth, bgDisplayWidth.value);
            const hval = windowHeight;
            bgDisplayWidth.value = wval;
            bgDisplayHeight.value = hval;
            setBgDisplayW(wval);
            setBgDisplayH(hval);
        }
    }, [selectedEnvironment, environments]);

    /*
    Question functionality, sets spotted data
    */

    const currentEnvironment = environments.find((env) => env.id === selectedEnvironment);
    const currentBird = birds && birds.length > 0 ? birds[currentBirdIndex] : null;

    const handleBirdTap = async () => {
        if (!currentBird) return;
        if (!userId || !token) {
            console.warn("Missing userId or token; cannot record spotting.");
        }

        //sends debug log to console showing current bird data
        console.log('DEBUG: handleBirdTap for bird:', currentBird.Name ?? currentBird.name, 'ID:', currentBird.AnimalId ?? currentBird.animalId);

        try {
            // Check if the bird has been spotted before
            const spottedData = userId
                ? await apiCallGet(`http://10.0.2.2:5093/api/UserAnimalsAPI?userId=${userId}&animalId=${currentBird.AnimalId}`, token)
                : [];

            const isSpotted = (spottedData && spottedData.length > 0);

            const fullBird = (allBirds || []).find(a =>
                String(a.animalId ?? a.AnimalId) === String(currentBird.AnimalId)
            ) || currentBird;

            // console.log('DEBUG: fullBird for question generation', { fullBirdId: fullBird?.animalId ?? fullBird?.AnimalId, isSpotted });

            // Prepare questions (use fullBird so non-name fields exist)
            const rawQs = isSpotted
                ? generateRandomQuestions(fullBird, allBirds)
                : [{
                    question: `What is the name of this bird?`,
                    infoType: 'name',
                    correctAnswer: fullBird.Name ?? fullBird.name,
                    answerOptions: RandomAnswerOptions(allBirds, 'name', fullBird.Name ?? fullBird.name, 4) || []
                }];

            // normalize and sanitize options (remove empty/undefined)
            const normalizedAll = (rawQs || []).map(q => {
                let correct = q.correctAnswer ?? q.correct ?? null;
                if ((correct === undefined || correct === null) && q.infoType) {
                    const key = q.infoType;
                    correct = fullBird?.[key] ?? fullBird?.[key.charAt(0).toUpperCase() + key.slice(1)];
                }
                const opts = (q.answerOptions || q.options || [])
                    .filter(v => v !== undefined && v !== null && String(v).trim() !== '')
                    .map(String);

                return {
                    question: q.question,
                    infoType: q.infoType,
                    correctAnswer: correct != null ? String(correct) : undefined,
                    answerOptions: opts,
                };
            }).filter(q => q.correctAnswer && q.answerOptions && q.answerOptions.length > 0);

            // pick one question at random (gives variety) — fallback to first
            const chosen = normalizedAll.length > 1
                ? normalizedAll[Math.floor(Math.random() * normalizedAll.length)]
                : (normalizedAll[0] || null);

            // console.log('DEBUG question selection', { fullBird, questionsFound: normalizedAll.length, chosen });
            setQuestions(chosen ? [chosen] : []);

            setSelectedAnswer(null);
            setIsAnsweredCorrectly(null);

            // Take a screenshot (non-blocking)
            // try {
            //     takeScreenshot(viewRef, userId, currentBird);
            // } catch (sErr) {
            //     console.warn("Screenshot failed:", sErr);
            // }

            // Save to UserAnimals table
            if (userId) {
                const rawSpotted = await apiCallGet(`http://10.0.2.2:5093/api/UserAnimalsAPI?userId=${userId}&animalId=${currentBird.AnimalId}`, token);
                // defensively find a matching record (handle different casing/shapes)
                const existing = (rawSpotted || []).find(s =>
                    String(s.userId ?? s.UserId) === String(userId) &&
                    String(s.animalId ?? s.AnimalId) === String(currentBird.AnimalId)
                );

                if (!existing) {
                    const payload = {
                        UserId: userId,
                        AnimalId: currentBird.AnimalId,
                        TimesSpotted: 1,
                    };
                    await apiCallPost(`http://10.0.2.2:5093/api/UserAnimalsAPI`, token, payload);
                    // checks if any achievements unlocked
                    const awarded = await evaluateAchievements(userId, currentBird.AnimalId, token);
                    if (awarded && awarded.length > 0) {
                        awarded.forEach(ua => {
                            const aid = String(ua.achievementId ?? ua.AchievementId ?? ua.Achievement);
                            const def = achievementsMap[String(aid)] ?? achievementsMap[String(aid).toLowerCase?.()] ?? null;
                            Toast.show({
                                type: 'success',
                                text1: def?.title ?? 'Achievement unlocked!',
                                text2: def?.description ?? 'Check your profile to view it.',
                                position: 'top',
                                visibilityTime: 4000
                            });
                        });
                    }
                } else {
                    const id = existing.userAnimalId ?? existing.UserAnimalId ?? existing.userAnimalID ?? existing.UserAnimalID;
                    await apiCallPut(`http://10.0.2.2:5093/api/UserAnimalsAPI/${id}`, token, {
                        TimesSpotted: (existing.timesSpotted ?? existing.TimesSpotted ?? 0) + 1,
                    });
                    const awarded = await evaluateAchievements(userId, currentBird.AnimalId, token);
                    if (awarded && awarded.length > 0) {
                        awarded.forEach(a => Toast.show({ type: 'success', text1: 'Achievement unlocked!', text2: `Check your profile to view it.`, position: 'top' }));
                    }
                }
            }

            

        } catch (error) {
            console.error("Error handling bird tap:", error);
        }
    };

    /*
    Photo taking functionality
    */
    
    const takePhoto = async () => {
        // guard: ensure we have a native view to capture
        if (!viewRef?.current || !userId || !currentBird) {
            Toast.show({ type: 'error', text1: 'Cannot take photo', text2: 'Missing context', position: 'top' });
            return;
        }

        try {
            // Capture first (do NOT show the overlay while capturing)
            const uri = await takeScreenshot(viewRef.current, userId, currentBird /* cropRect optional, now handled inside */);
            // show short flash/overlay after capture to indicate success
            setIsCapturing(true);

            if (uri) {
                DeviceEventEmitter.emit('photoAdded', { animalId: String(currentBird.AnimalId) });
                Toast.show({ type: 'success', text1: 'Photo saved', text2: 'Added to your logbook gallery', position: 'top' });
            } else {
                Toast.show({ type: 'error', text1: 'Photo failed', text2: 'Unable to capture', position: 'top' });
            }
        } catch (err) {
            console.error('takePhoto error', err);
            Toast.show({ type: 'error', text1: 'Photo failed', text2: err?.message ?? 'Unknown', position: 'top' });
        } finally {
            // keep overlay visible briefly then hide
            setTimeout(() => setIsCapturing(false), 400);
        }
    };

    /*
    Answer functionality
    */

    const handleAnswerSelection = async (option) => {
        if (!questions || questions.length === 0) return;
        const q = questions[0];

        // console.log('DEBUG: answer pressed', { option, question: q });

        setSelectedAnswer(option);
        const correct = String(q.correctAnswer) === String(option);
        setIsAnsweredCorrectly(correct);

        if (correct) {
            // send unlock record to backend
            if (userId) {
                try {
                    const payload = {
                        UserId: userId,
                        AnimalId: currentBird.AnimalId,
                        InfoType: q.infoType,
                        IsUnlocked: true,
                    };
                    console.log('Posting unlock payload:', payload);
                    const res = await apiCallPost(`http://10.0.2.2:5093/api/UserAnimalInfoUnlockedAPI`, token, payload);
                    console.log('UserAnimalInfoUnlocked POST result:', res);
                    // notify other screens
                    DeviceEventEmitter.emit('userInfoUnlocked', { animalId: String(currentBird.AnimalId), infoType: q.infoType });
                    const awarded = await evaluateAchievements(userId, currentBird.AnimalId, token);
                    if (awarded && awarded.length > 0) {
                        awarded.forEach(ua => {
                            const aid = String(ua.achievementId ?? ua.AchievementId ?? ua.Achievement);
                            const def = achievementsMap[String(aid)] ?? achievementsMap[String(aid).toLowerCase?.()] ?? null;
                            Toast.show({
                                type: 'success',
                                text1: def?.title ?? 'Achievement unlocked!',
                                text2: def?.description ?? 'Check your profile to view it.',
                                position: 'top',
                                visibilityTime: 4000
                            });
                        });
                    }
                } catch (err) {
                    console.error("Error posting unlock:", err);
                }
            }
            Toast.show({
                type: 'success',
                text1: 'Congrats!',
                text2: 'You answered correctly!',
                position: 'top'
            });
            // advance after a short delay so toast/animation can show
            setTimeout(advanceBird, 900);
            
        //     Alert.alert('Congrats!', 'You answered correctly!', [
        //         { text: 'Continue', onPress: () => handleQuestionComplete() }
        //     ]);
        // } else {
        //     Alert.alert('Whoops!', 'You answered incorrectly. The bird flew away!', [
        //         { text: 'Continue', onPress: () => { setSelectedAnswer(null); setIsAnsweredCorrectly(null); } }
        //     ]);
        } else {
            Toast.show({
                type: 'error',
                text1: 'Whoops!',
                text2: 'You answered incorrectly. The bird flew away!',
                position: 'top'
            });
            setTimeout(advanceBird, 900);
        }
    };

    // stable advance function: clear question state and advance to the next bird reliably
    const advanceBird = useCallback(() => {
        setQuestions([]);
        setSelectedAnswer(null);
        setIsAnsweredCorrectly(null);
        setCurrentBirdIndex((i) => {
            try {
                const len = Array.isArray(birds) ? birds.length : 0;
                if (len === 0) return 0;
                const next = (typeof i === 'number' ? i : 0) + 1;
                return next >= len ? 0 : next;
            } catch (e) {
                return 0;
            }
        });
    }, [birds]);

    return (
        <View style={styles.containerNoPadding}>
            {currentEnvironment && (
                <View
                    // capture target: attach native ref here and prevent RN from collapsing it
                    ref={viewRef}
                    collapsable={false}
                    style={{ width: windowWidth, height: windowHeight, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}
                >
                     <GestureDetector gesture={gesture}>
                         <Animated.View style={[{ width: bgDisplayW, height: bgDisplayH }, animatedStyle]}>
                             <ImageBackground
                                 source={currentEnvironment.background}
                                 style={{ width: bgDisplayW, height: bgDisplayH }}
                                 resizeMode="cover"
                             >
                                 {/* render bird(s) positioned on the background */}
                                 {currentBird && (currentBird.spawnLocations || []).map((sp, si) => {
                                     const birdSize = birdSizes[currentBird.AnimalId] || { width: defaultBirdWidth, height: defaultBirdHeight };
                                     const spawnScale = (sp && sp.spawnScale) || 1;
                                     const scaledWidth = birdSize.width * spawnScale;
                                     const scaledHeight = birdSize.height * spawnScale;
                                     const leftPx = ((sp && sp.spawnX != null ? sp.spawnX : 0.5) * bgDisplayW) - scaledWidth / 2;
                                     const topPx = ((sp && sp.spawnY != null ? sp.spawnY : 0.5) * bgDisplayH) - scaledHeight;

                                     return (
                                         <TouchableOpacity
                                             key={si}
                                             onPress={handleBirdTap}
                                             style={[
                                                 styles.birdAbsolute,
                                                 {
                                                     position: 'absolute',
                                                     width: scaledWidth,
                                                     height: scaledHeight,
                                                     left: leftPx,
                                                     top: topPx,
                                                 },
                                             ]}
                                         >
                                             <ImageBackground
                                                 source={currentBird.ImageUrl || undefined}
                                                 style={{ width: '100%', height: '100%' }}
                                             >
                                                 <Text>{currentBird.Name}</Text>
                                             </ImageBackground>
                                         </TouchableOpacity>
                                     );
                                 })}
                             </ImageBackground>
                         </Animated.View>
                     </GestureDetector>
                 </View>
             )}
 
         {/* camera overlay (flash + frame) */}
         {isCapturing && (
             <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' }}>
                 <View style={{ width: Math.min(windowWidth, windowHeight) - 40, height: Math.min(windowWidth, windowHeight) - 40, borderWidth: 2, borderColor: colours.offWhite, borderRadius: 8 }} />
                 <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.08)' }} />
             </View>
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
                 <View style={styles.questionAnswerContainer}>
                     <View style={styles.questionContainer}>
                         <Text style={styles.questionText}>{questions[0].question}</Text>
                     </View>
                     <View style={styles.answerContainer}>
                         {questions[0].answerOptions.map((option, idx) => (
                             <TouchableOpacity
                                 key={idx}
                                 style={[
                                     styles.answerButton,
                                     selectedAnswer === option && styles.selectedAnswerButton,
                                     isAnsweredCorrectly === true && selectedAnswer === option && styles.correctAnswerButton,
                                     isAnsweredCorrectly === false && selectedAnswer === option && styles.incorrectAnswerButton
                                 ]}
                                 onPress={() => handleAnswerSelection(option)}
                                 disabled={isAnsweredCorrectly !== null}
                             >
                                 <Text style={styles.answerButtonText}>{option}</Text>
                             </TouchableOpacity>
                         ))}
                     </View>
                 </View>
             )}
         </View>

        {/* Floating camera button — bottom-right */}
        <TouchableOpacity
            onPress={takePhoto}
            accessibilityLabel="Take photo"
            style={{
                position: 'absolute',
                bottom: 24,
                right: 16,
                zIndex: 80,
                width: 56,
                height: 56,
                borderRadius: 28,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colours.lightGreen,
                shadowColor: '#000',
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 6,
            }}
        >
            <FontAwesomeIcon icon={['fas', 'camera']} color="#0b2a12" size={22} />
        </TouchableOpacity>
    </View>
    );
 };
 
 export default MainGame;