import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
const { height } = Dimensions.get('window');

const Home = () => {
    return (
        <View style={styles.container}>
          <LinearGradient
            colors={['#F6C484', '#ED7678']}
            style={styles.gradient}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
          />
    

          <View style={styles.content}>
            <Text style={styles.text}></Text>
          </View>
        </View>
      );
    };
    
    const styles = StyleSheet.create({
      container: {
        flex: 1,
      },
      gradient: {
        height: height * 0.3, 
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 1,
      },
      content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: height * 0.3, 
      },
      text: {
        fontSize: 18,
        fontWeight: 'bold',
      },
    });
export default Home;

