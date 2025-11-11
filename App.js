import React from "react";
import Logbook from "./logbook";
import MainGame from "./mainGame";
import UserProfile from "./userProfile";
import AboutGame from "./aboutGame";
import LoginScreen from "./components/LoginScreen";
import RegistrationScreen from "./components/RegistrationScreen";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserProvider } from "./operations/UserContext";
//import { styles } from "./styles/gameStyles";
import { colours } from "./styles/colourScheme";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import PropTypes from 'prop-types';

library.add(fas, far, fab);

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const MainTabs = ({ onLogout }) => {
  return (
    <Tab.Navigator
      initialRouteName="Game"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colours.mediumGreen,
        tabBarInactiveTintColor: colours.lightGreen,
        tabBarStyle: { backgroundColor: colours.darkGreen },
      }}
    >
      <Tab.Screen
        name="Logbook"
        component={Logbook}
        options={{
          tabBarLabel: "Logbook",
          tabBarIcon: ({ color, size }) => (
            <FontAwesomeIcon icon={['fas', 'book-bookmark']} color={colours.lightGreen} size={20} />
          ),
        }}
      />
      <Tab.Screen
        name="Game"
        component={MainGame}
        options={{
          tabBarLabel: "Main Game",
          tabBarIcon: ({ color, size }) => (
            <FontAwesomeIcon icon={['fas', 'gamepad']} color={colours.lightGreen} size={20} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        children={(props) => <UserProfile {...props} onLogout={onLogout} />}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => (
            <FontAwesomeIcon icon={['fas', 'user']} color={colours.lightGreen} size={20} />
          ),
        }}
      />
      <Tab.Screen
        name="About"
        component={AboutGame}
        options={{
          tabBarLabel: "About Game",
          tabBarIcon: ({ color, size }) => (
            <FontAwesomeIcon icon={['fas', 'circle-info']} color={colours.lightGreen} size={20} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

MainTabs.propTypes = {
  onLogout: PropTypes.func,
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const userData = await AsyncStorage.getItem("userData");
      setIsLoggedIn(!!userData); // If userData exists, user is logged in
      setLoading(false); // Stop loading once login status is determined
    };

    checkLoginStatus();
  }, []);

  if (loading) {
    return null;
  }

  console.log("isLoggedIn:", isLoggedIn);

  return (
    <UserProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isLoggedIn ? (
            <>
              <Stack.Screen name="MainTabs">
                {(props) => <MainTabs {...props} onLogout={() => setIsLoggedIn(false)} />}
              </Stack.Screen>
            </>
          ) : (
            <>
              <Stack.Screen name="Login">
                {(props) => (
                  <LoginScreen
                    {...props}
                    onLogin={() => setIsLoggedIn(true)} // Pass a callback to update isLoggedIn
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="Register" component={RegistrationScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
};

export default App;