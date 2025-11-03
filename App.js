import Logbook from "./logbook";
import MainGame from "./mainGame";
import UserProfile from "./userProfile";
import AboutGame from "./aboutGame";
import LoginScreen from "./components/LoginScreen";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { UserProvider } from "./operations/UserContext";
import { styles } from "./styles/gameStyles";
import MaterialIcons from '@react-native-vector-icons/material-icons';

const Tab = createBottomTabNavigator();
const App = () => {

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const userData = await AsyncStorage.getItem("userData");
      setIsLoggedIn(!!userData); // If userData exists, user is logged in
    };

    checkLoginStatus();
  }, []);

  return (
    <UserProvider>
      <NavigationContainer>
        <Tab.Navigator
          initialRouteName="Game"
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: "#356227",
            tabBarInactiveTintColor: "#96A990",
            tabBarStyle: { backgroundColor: "#0c1908ff" },
          }}
        >
          <Tab.Screen name="Logbook" component={Logbook} options={{
            tabBarLabel: "Logbook",
            tabBarIcon: ({ color, size }) => (<MaterialIcons name="book" color={"#96A990"} size={20} />)
          }} />
          <Tab.Screen name="Game" component={MainGame} options={{
            tabBarLabel: "Main Game",
            tabBarIcon: ({ color, size }) => (<MaterialIcons name="videogame-asset" color={"#96A990"} size={20} />)
          }} />
          <Tab.Screen name="Profile" component={UserProfile} options={{
            tabBarLabel: "User Profile",
            tabBarIcon: ({ color, size }) => (<MaterialIcons name="person" color={"#96A990"} size={20} />)
          }} />
          <Tab.Screen name="About" component={AboutGame} options={{
            tabBarLabel: "About Game",
            tabBarIcon: ({ color, size }) => (<MaterialIcons name="info" color={"#96A990"} size={20} />)
          }} />
        </Tab.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
};
export default App;