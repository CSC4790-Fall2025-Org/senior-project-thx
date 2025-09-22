import { StyleSheet, Text, View, TouchableOpacity, Image, Dimensions,TextInput, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';


const { height } = Dimensions.get('window');



const Login = ({navigation}) => {
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
                        <TextInput style={styles.emailInput}/>
                    </View>
                    <View style={styles.passBox}>
                    <Text style = {styles.passText}>Password</Text>
                        <TextInput style={styles.passInput} secureTextEntry={true}/>
                    </View>

                    <TouchableOpacity style = {styles.loginButton} onPress={() => navigation.navigate('Home')}>
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