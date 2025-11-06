import { StyleSheet } from 'react-native';
import { colours } from './colourScheme';

export const styles = StyleSheet.create({
    topMargin: { marginTop: 50 },
    mb4: { marginBottom: 16 },
    row: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginVertical: 8, },
    //text styles
    rowCenter: { alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 32, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
    subtitle: { fontSize: 24, marginBottom: 16, textAlign: 'center' },
    heading: { fontWeight: 'bold' },
    sectionTitle: { fontWeight: 'bold', marginBottom: 8 },
    bold: { fontWeight: 'bold' },
    darkText: { color: colours.darkGreen },
    lightText: { color: colours.lightGreen },
    lighterText: { color: colours.offWhite },
    //button styles
    button: { backgroundColor: colours.accentBrown, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6, alignItems: "center", },
    buttonText: { color: colours.lightGreen, fontSize: 16, fontWeight: "bold", },
    submitButton: { backgroundColor: colours.mediumGreen, padding: 10, borderRadius: 5, width: '50%', },
    submitButtonText: { color: colours.offWhite, fontWeight: "bold", textAlign: "center", },
    logoutButton: { backgroundColor: colours.accentRed, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6, alignItems: "center", marginTop: 20, width: '75%', marginLeft: 'auto', marginRight: 'auto', },
    logoutButtonText: { color: colours.offWhite, fontSize: 16, fontWeight: "bold", },
    //page/view styles
    image: { flex: 1, width: '100%', height: '100%', },
    card: { width: '100%', backgroundColor: colours.darkGreen, borderRadius: 8, padding: 16, marginBottom: 16 },
    container: { flex: 1, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', padding: 20, },
    backgroundDark: { backgroundColor: colours.darkOverlay },
    backgroundLight: { backgroundColor: colours.lightOverlay },
    scrollViewContainer: { flexGrow: 1, },
    viewContainer: { flex: 1, padding: 16, justifyContent: 'space-between', },
    //login screen and registration screen styles
    input: { width: "90%", padding: 10, borderWidth: 2, borderRadius: 5, marginBottom: 10, borderColor: colours.mediumGreen, color: colours.darkGreen, backgroundColor: colours.offWhite, },
    link: { color: colours.mediumGreen, marginTop: 10 },
    //environment selection styles
    environmentButton: { backgroundColor: colours.mediumGreen, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 6, marginHorizontal: 5, },
    selectedEnvironmentButton: { backgroundColor: colours.accentBrown, },
    environmentButtonText: { color: colours.offWhite, fontWeight: "bold", },
});