import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Dimensions,TextInput, KeyboardAvoidingView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_HOST } from '../src/config';
import { api } from '../src/api';


const { height } = Dimensions.get('window');



const Login = ({navigation}) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const handleLogin = async () => {
        try {
          const data = await api('/auth/login/', {
            method: 'POST',
            body: JSON.stringify({email, password }), // or email if backend supports it
          });
      
          console.log('✅ LOGIN SUCCESS', data);
      
          await AsyncStorage.setItem('access_token', data.access);
          await AsyncStorage.setItem('refresh_token', data.refresh);
      
          navigation.navigate('Home');
        } catch (err) {
          console.log('❌ LOGIN FAILED', err.message);
          Alert.alert('Login Error', err.message);
        }
      };
    // const handleLogin = async () => {
    //     try {
    //       const response = await fetch(`${API_HOST}/api/auth/login/`, {
    //         method: 'POST',
    //         headers: {
    //           'Content-Type': 'application/json',
    //         },
    //         // Use the right key your backend expects (probably 'username' or 'email')
    //         body: JSON.stringify({ email, password }),
    //       });
    
    //       if (response.ok) {
    //         const data = await response.json();
    //         // Save tokens in AsyncStorage if your backend returns them
    //         await AsyncStorage.setItem('access_token', data.access);
    //         await AsyncStorage.setItem('refresh_token', data.refresh);
    
    //         // Navigate to Home screen on success
    //         navigation.navigate('Home');
    //       } else {
    //         const errorData = await response.json();
    //         Alert.alert('Login Failed', JSON.stringify(errorData));
    //       }
    //     } catch (error) {
    //         console.log(error.message)
    //         Alert.alert('Error', error.message);
    //     }
    //   };

    return (
        <KeyboardAvoidingView style = {styles.container}>

            {/*LOGO*/}
            <View style={styles.logoContainer}>
                <Image source={require('../assets/logo.png')} style={styles.logo} />
            </View>

            {/*LOGIN CONTENT*/}
            <View style={styles.loginContainer}>
                <LinearGradient
                    colors={['#F6C484A6', '#ED7678A6']}
                    style={[styles.loginBox]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Text style= {styles.welcomeText}>Welcome Back!</Text>
                    <Text style= {styles.descText}>Enter your login details below.</Text>

                    {/*EMAIL & PASS CONTENT*/}
                    <View style={styles.emailBox}>
                        <Text style = {styles.emailText}>Email Address</Text>
                        <TextInput 
                            style={styles.emailInput}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>
                    <View style={styles.passBox}>
                    <Text style = {styles.passText}>Password</Text>
                        <TextInput 
                            style={styles.passInput}
                            secureTextEntry={true}
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>

                    <TouchableOpacity style = {styles.loginButton} onPress={handleLogin}>
                        <Text style = {styles.loginText}>Login</Text>
                    </TouchableOpacity>

                    <View style={styles.signUpPrompt}>
                        <Text style={styles.signUpText}>
                            Dont't have an account?{' '}
                            <Text style={styles.signUpLink} onPress={() => navigation.navigate('SignUp')}>
                            Sign Up Here
                            </Text>
                        </Text>
                    </View>

                </LinearGradient>
            </View>
        </KeyboardAvoidingView>
    );
}

export default Login;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    //LOGO
    logoContainer:{
        position:'relative',
        height: height * 0.38,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 285,
        height: 200,
    },

    //LOGIN CONTENT
    loginContainer:{
        flex: 1,
        alignItems: 'center',
        marginTop: '-15%',
    },
    loginBox:{
        width: '88%',
        height: '88%',
        backgroundColor: '#fff',
        borderRadius: 35,
        alignItems: 'center',
        paddingTop: '7.5%',
    },
    welcomeText:{
        fontSize: 25,
        fontWeight: 'bold',
    },
    descText:{
        fontSize: 18,
        marginTop: '5%',
        textAlign: 'center',
    },
    
    emailBox:{
        width: '85%',
        height: '12%',
        marginTop: '15%',
        backgroundColor: '#fff',
        borderRadius: 10,
        borderBottomColor: '#ccc',
        borderBottomWidth: 1,
    },
    emailText:{
        fontSize: 12,
        left: '5%',
        top:'20%',
        color: '#646464',
    },
    emailInput:{
        paddingLeft: '5%',
        paddingTop: '5%',
        width: '95%',
    },
    passBox:{
        width: '85%',
        height: '12%',
        marginTop: '7.5%',
        backgroundColor: '#fff',
        borderRadius: 10,
        borderBottomColor: '#ccc',
        borderBottomWidth: 1,
    },
    passText:{
        fontSize: 12,
        left: '5%',
        top:'20%',
        color: '#646464',
    },
    passInput:{
        paddingLeft: '5%',
        paddingTop: '5%',
        width: '95%',
    },
    loginButton:{
        width: '85%',
        height: '10%',
        backgroundColor: '#EF8C99',
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '15%',
    },
    loginText:{
        color: '#fff',
        fontSize: 18,
        fontWeight: 'regular',
    },

    signUpPrompt: {
        marginTop: '2%',
    },
      
    signUpText: {
        fontSize: 16,
        color: '#333',
    },
      
    signUpLink: {
        fontWeight: 'bold',
    },

});