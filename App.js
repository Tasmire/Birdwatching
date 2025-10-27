import Logbook from "./logbook";
import MainGame from "./mainGame";
import UserProfile from "./userProfile";
import AboutGame from "./aboutGame";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { UserProvider } from "./operations/UserContext";
import { styles } from "./styles/gameStyles";
import MaterialIcons from '@react-native-vector-icons/material-icons';

const Tab = createBottomTabNavigator();
const App = () => {
  return (
    <UserProvider>
      <NavigationContainer>
        <Tab.Navigator
          initialRouteName="Game"
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: "#1976d2",
            tabBarInactiveTintColor: "#888",
            tabBarStyle: { backgroundColor: "#e3f2fd" },
          }}
        >
          <Tab.Screen name="Logbook" component={Logbook} options={{
            tabBarLabel: "Logbook",
            tabBarIcon: ({ color, size }) => (<MaterialIcons name="list-alt" color={"#b1c5db"} size={20} />)
          }} />
          <Tab.Screen name="Game" component={MainGame} options={{
            tabBarLabel: "Main Game",
            tabBarIcon: ({ color, size }) => (<MaterialIcons name="videogame-asset" color={"#b1c5db"} size={20} />)
          }} />
          <Tab.Screen name="Profile" component={UserProfile} options={{
            tabBarLabel: "User Profile",
            tabBarIcon: ({ color, size }) => (<MaterialIcons name="person" color={"#b1c5db"} size={20} />)
          }} />
          <Tab.Screen name="About" component={AboutGame} options={{
            tabBarLabel: "About Game",
            tabBarIcon: ({ color, size }) => (<MaterialIcons name="info" color={"#b1c5db"} size={20} />)
          }} />
        </Tab.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
};
export default App;