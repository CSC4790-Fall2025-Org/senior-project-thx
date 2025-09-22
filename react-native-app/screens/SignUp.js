import { StyleSheet, Text, View, TouchableOpacity, Image, Dimensions,TextInput, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';


const { height } = Dimensions.get('window');



const SignUp = ({navigation}) => {
    return (
        <KeyboardAvoidingView style = {styles.container}>

            {/*LOGO*/}
            <View style={styles.logoContainer}>
                <Image source={require('../assets/logo.png')} style={styles.logo} />
            </View>

            {/*SIGN UP CONTENT*/}
            <View style={styles.signUpContainer}>
                <LinearGradient
                    colors={['#F6C484A6', '#ED7678A6']}
                    style={[styles.signUpBox]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Text style= {styles.registerText}>Register</Text>
                    <Text style= {styles.descText}>Input the details below to create{'\n'}an account.</Text>

                    {/*EMAIL & PASS CONTENT*/}
                    <View style={styles.emailBox}>
                        <Text style = {styles.emailText}>Email Address</Text>
                        <TextInput style={styles.emailInput}/>
                    </View>
                    <View style={styles.passBox}>
                    <Text style = {styles.passText}>Password</Text>
                        <TextInput style={styles.passInput} secureTextEntry={true}/>
                    </View>

                    <TouchableOpacity style = {styles.signUpButton} onPress={() => navigation.navigate('Home')}>
                        <Text style = {styles.signUpText}>Sign Up</Text>
                    </TouchableOpacity>

                    <View style={styles.loginPrompt}>
                        <Text style={styles.loginText}>
                            Already have an account?{' '}
                            <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
                            Log In
                            </Text>
                        </Text>
                    </View>

                </LinearGradient>
            </View>
        </KeyboardAvoidingView>
    );
}

export default SignUp;

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

    //SIGN UP CONTENT
    signUpContainer:{
        flex: 1,
        alignItems: 'center',
        marginTop: '-15%',
    },
    signUpBox:{
        width: '88%',
        height: '88%',
        backgroundColor: '#fff',
        borderRadius: 35,
        alignItems: 'center',
        paddingTop: '7.5%',
    },
    registerText:{
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
        marginTop: '7.5%',
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
    signUpButton:{
        width: '85%',
        height: '10%',
        backgroundColor: '#EF8C99',
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '15%',
    },
    signUpText:{
        color: '#fff',
        fontSize: 18,
        fontWeight: 'regular',
    },

    loginPrompt: {
        marginTop: '2%',
    },
      
    loginText: {
        fontSize: 16,
        color: '#333',
    },
      
    loginLink: {
        fontWeight: 'bold',
    },

});