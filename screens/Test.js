import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const Test = ({ navigation }) => {
    const screens = [
        'Login',
        'SignUp',
        'Home',
        'BookingInfo',
        'MyBookings',
        'Profile',
        'EditServices',
        'AddServices',
        'ServiceDetails',
        'SavedServices'
    ];

    return (
        <View style={styles.container}>
            {screens.map((screenName) => (
                <TouchableOpacity
                    key={screenName}
                    style={styles.button}
                    onPress={() => navigation.navigate(screenName)}
                >
                    <Text style={styles.textB}>{screenName}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    button: {
        marginVertical: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 5,
        backgroundColor: '#eee',
    },
    textB: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
});


export default Test;