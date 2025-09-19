import { StyleSheet, Text, View } from 'react-native';
console.log("Login screen loaded");
const Login = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Login</Text>
        </View>
    );
};

export default Login;

const styles = StyleSheet.create({
    container: {
        flex: 1, // Make sure the screen fills the viewport
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff', // Optional: white background
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
    },
});