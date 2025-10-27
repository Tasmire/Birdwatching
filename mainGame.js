import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { styles } from "./styles/gameStyles";

const MainGame = () => {
    return (
        <View style={styles.container}>
            <Text>Main Game</Text>
            <StatusBar style="auto" />
        </View>
    );
};

export default MainGame;