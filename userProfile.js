import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, ScrollView, Text, View, ImageBackground, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { styles } from "./styles/gameStyles";
import { colours } from "./styles/colourScheme";
import { apiCallGet, apiCallPost, apiCallPut } from "./operations/ApiCalls";
import Starburst from './components/Starburst';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

const UserProfile = ({ onLogout }) => {

    const [userData, setUserData] = useState([]);
    const [userAchievements, setUserAchievements] = useState([]);
    const [allAchievements, setAllAchievements] = useState([]);
    const [achievementPercentages, setAchievementPercentages] = useState({});
    const [totalUsers, setTotalUsers] = useState(0);
    const navigation = useNavigation();

    const fetchUserData = async () => {
        try {
            const storedUserData = await AsyncStorage.getItem("userData");
            const parsedUserData = JSON.parse(storedUserData);

            if (!parsedUserData || !parsedUserData.userId) {
                throw new Error("No user data found in AsyncStorage.");
            }

            const userId = parsedUserData.userId; // Get the userId of the logged-in user
            const token = parsedUserData.token;

            const data = await apiCallGet(`http://10.0.2.2:5093/api/UsersAPI/${userId}`, token);
            console.log(data);

            setUserData(data);
            await fetchAchievementsForProfile(userId, token, setUserAchievements, setAllAchievements);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem("userData"); // Clear user data
            Alert.alert("Logged Out", "You have been logged out successfully.");
            onLogout(); // Update isLoggedIn state in App.js
        } catch (error) {
            console.error("Error during logout:", error);
        }
    };

    // fetch achievements + stats
    const fetchAchievementsForProfile = async (uid, token, setUserAchievements, setMasterAchievements) => {
        try {
            const userAch = await apiCallGet(`http://10.0.2.2:5093/api/UserAchievementsAPI?userId=${uid}`, token);
            const allAch = await apiCallGet(`http://10.0.2.2:5093/api/AchievementsAPI`, token);
            setUserAchievements(userAch || []);
            setMasterAchievements(allAch || []);

            // fetch stats: all user achievements (no userId) and user count
            const allUserAch = await apiCallGet(`http://10.0.2.2:5093/api/UserAchievementsAPI`, token) || [];
            const users = await apiCallGet(`http://10.0.2.2:5093/api/UsersAPI`, token) || [];
            const uCount = Array.isArray(users) ? users.length : 0;
            setTotalUsers(uCount);

            const counts = {};
            (allUserAch || []).forEach(x => {
                const aid = x.achievementId ?? x.AchievementId;
                if (!aid) return;
                counts[aid] = (counts[aid] || 0) + 1;
            });

            const percentages = {};
            if (uCount > 0) {
                Object.keys(counts).forEach(k => {
                    percentages[k] = Math.round((counts[k] / uCount) * 100);
                });
            }
            setAchievementPercentages(percentages);
        } catch (err) {
            console.error('Error loading achievements', err);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    const mergedAchievements = (userAchievements || []).map((ua, idx) => {
        const def = (allAchievements || []).find(a =>
            String(a.achievementId ?? a.AchievementId) === String(ua.achievementId ?? ua.AchievementId ?? ua.AchievementId)
        );
        return {
            key: String(ua.userAchievementId ?? ua.UserAchievementId ?? ua.id ?? idx),
            awarded: ua,
            definition: def || {},
        };
    });

    const sortedAchievements = [...mergedAchievements].sort((a, b) => {
        // sorts by date achieved - oldest to newest
        const aDate = new Date(a.awarded.DateAchieved ?? a.awarded.dateAchieved ?? a.awarded.AchievedAt ?? a.awarded.achievedAt ?? 0);
        const bDate = new Date(b.awarded.DateAchieved ?? b.awarded.dateAchieved ?? b.awarded.AchievedAt ?? b.awarded.achievedAt ?? 0);
        return aDate - bDate;
    });

    // helper to format award date
    const formatAwardDate = (award) => {
        const raw = award.DateAchieved ?? award.dateAchieved ?? award.AchievedAt ?? award.achievedAt ?? award.DateAwarded ?? null;
        if (!raw) return '—';
        try { return new Date(raw).toLocaleDateString(); } catch { return String(raw); }
    };

    return (
        <ImageBackground resizeMode="cover" source={require("./assets/bgImage.jpg")} style={{ flex: 1 }}>
            <ScrollView style={styles.backgroundDark} contentContainerStyle={styles.scrollViewContainer}>
                <View style={styles.viewContainer}>
                    <View>
                        <Text style={[styles.title, styles.lighterText, styles.topMargin]}>Profile</Text>
                        <Text style={[styles.subtitle, styles.lighterText]}>{userData.username}</Text>
                        {/* <Text style={[styles.subtitle, styles.lighterText]}>Achievements:</Text> */}
                        <View>
                            {sortedAchievements.length === 0 ? (
                                <Text style={styles.lighterText}>No achievements earned yet. Start playing to earn some!</Text>
                            ) : (
                                sortedAchievements.map((m) => {
                                    const def = m.definition || {};
                                    const aid = String(def.achievementId ?? def.AchievementId ?? '');
                                    const percent = achievementPercentages[aid] ?? 0;
                                    const dateText = formatAwardDate(m.awarded);
                                    const iconName = def.iconUrl ?? 'star';
                                    return (
                                        <View key={m.key} style={styles.achievementItem}>
                                            <View style={styles.achievementTopRow}>
                                                <View style={styles.achievementBadge}>
                                                    {/* starburst background */}
                                                    <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                                                        <Starburst size={60} spikes={20} inner={0.85} fill={colours.mediumGreen} />
                                                    </View>

                                                    {/* icon on top */}
                                                    <View style={{ position: 'absolute', alignSelf: 'center', justifyContent: 'center', alignItems: 'center', width: 60, height: 60 }}>
                                                        <FontAwesomeIcon icon={['fas', iconName]} size={28} color={colours.lightGreen} />
                                                    </View>
                                                </View>

                                                <View style={styles.achievementTextContainer}>
                                                    <Text style={styles.achievementTitle}>{def.title ?? 'Achievement'}</Text>
                                                    <Text style={styles.achievementDescription}>{def.description ?? ''}</Text>
                                                </View>
                                            </View>

                                            <View style={styles.achievementStatsRow}>
                                                <Text style={styles.achievementDate}>Earned on {dateText}</Text>
                                                <Text style={styles.achievementPercent}>{percent}% of players have this achievement.</Text>
                                            </View>
                                        </View>
                                    );
                                })
                            )}
                        </View>
                    </View>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutButtonText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </ImageBackground>
    );
};

export default UserProfile;