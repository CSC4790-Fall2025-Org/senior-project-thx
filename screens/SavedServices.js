import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';


const { height } = Dimensions.get('window');

const SavedServices = () => {
    return (
        <View style = {styles.container}>
            <LinearGradient
                colors={['#F6C484', '#ED7678']}
                style={styles.gradient}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
            >
            </LinearGradient>
            
        </View>
    );
}

export default SavedServices;
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    //LINEAR GRADIENT CONTENT
    gradient: {
        height: height * 0.314, 
        width: '100%',
        position: 'relative',
        top: 0,
        left: 0,
        zIndex: 1,
    },
});