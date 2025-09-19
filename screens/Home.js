import { StyleSheet, Text, View, Dimensions, TouchableOpacity,TextInput, Image,FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';

const { height } = Dimensions.get('window');

const services = [
    { id: 1, name: 'Haircut' },
    { id: 2, name: 'Nails' },
    { id: 3, name: 'Cooking' },
    { id: 4, name: 'Tutoring' },
    { id: 5, name: 'Makeup' },
  ];

  const availableServices = [
  {
    id: '1',
    type: 'Haircut',
    provider: 'Rachel Phan',
    cost: '$25.00',
    image: require('../assets/haircuts.jpg'),
  },
  {
    id: '2',
    type: 'Nails',
    provider: 'Mya Dang',
    cost: '$30.00',
    image: require('../assets/nails.jpg'),
  },
  {
    id: '3',
    type: 'Makeup',
    provider: 'Allyssa Panganiban',
    cost: '$50.00',
    image: require('../assets/makeup.png'),
  },
];


const Home = ({navigation}) => {
    return (
        <View style={styles.container}>

        {/* LINEAR GRADIENT CONTENT */}
            <LinearGradient
                colors={['#F6C484', '#ED7678']}
                style={styles.gradient}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
            >
                <Text style= {styles.helloText}>Hello MyAllRaAby!</Text>
                <TouchableOpacity style ={styles.profileFrame} onPress={() => navigation.navigate('Profile')}></TouchableOpacity>

                {/* FILTERS */}
                <TouchableOpacity style ={styles.filterFrame}>
                    <View style={styles.filterIcon}>
                        <Ionicons name="filter-outline" size={25}/>
                    </View>
                </TouchableOpacity>

                {/* SEARCH BOX */}
                <View style ={styles.textInputBox}>
                    <View style ={styles.searchIcon}>
                        <EvilIcons name="search" size={24}/>
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="Search for services"
                        placeholderTextColor="#646464"
                    />
                </View>
            </LinearGradient>

            {/* SCROLL TOP CATEGORY */}
            <View style={styles.categoryContent}>
                <Text style={styles.topServiceText}>TOP SERVICES</Text>
                <FlatList
                    data={services}
                    keyExtractor={(item) => item.id.toString()}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.carouselContainer}
                    renderItem={({ item }) => (
                    <View style={styles.serviceItem}>
                        <TouchableOpacity
                            style={styles.serviceCircle}
                            onPress={() => console.log('Pressed:', item.name)}
                        >
                        </TouchableOpacity>
                        <Text style={styles.serviceTypeText}>{item.name}</Text>
                    </View>
                )}
                />
            </View>

            {/* SCROLL SERVICES */}
            <View style={styles.serviceContainer}>
                <Text style={styles.servicesText}>SERVICES</Text>
                <View style= {styles.scrollArea}>
                    <FlatList
                        data={availableServices}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.servicesScroll}
                        renderItem={({ item }) => (
                        <View style={styles.serviceCard}>
                            <View style={styles.cardContent}>
                                <Image
                                    source={item.image}
                                    style={styles.serviceImage}
                                />  
                            <View style={styles.serviceInfo}>
                                <Text style={styles.serviceType}>{item.type}</Text>
                                <Text style={styles.providerName}>By {item.provider}</Text>
                                <Text style={styles.serviceCost}>{item.cost}</Text>
                                <TouchableOpacity
                                style={styles.bookButton}
                                onPress={() => navigation.navigate('ServiceDetails', { serviceId: item.id })}
                                >
                                <Text style={styles.bookButtonText}>Book</Text>
                                </TouchableOpacity>
                            </View>
                            </View>
                        </View>
                        )}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            </View>

            {/* NAVIGATION BAR */}
            <View style={styles.navBarContainer}>
                <TouchableOpacity onPress={() => navigation.navigate('MyBookings')}>
                    <Feather name="calendar" size={28} color="#333" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                    <Ionicons name="home-outline" size={28} color="#333" />
                </TouchableOpacity >
                <TouchableOpacity onPress={() => navigation.navigate('SavedServices')}>
                    <Feather name="heart" size={28} color="#333" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                    <Ionicons name="person-outline" size={28} color="#333" />
                </TouchableOpacity>
            </View>


        </View>
      );
    };
    
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    //LINEAR GRADIENT CONTENT
    gradient: {
        height: height * 0.245, 
        width: '100%',
        position: 'relative',
        top: 0,
        left: 0,
        zIndex: 1,
    },
    helloText: {
        position: 'absolute',
        left: '4.6%',
        top: '42.8%',
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'Poppins',
    },
    profileFrame: {
        position: 'absolute',
        right:'4.6%',
        top: '35%',
        height: 50,
        width: 50,
        borderRadius: 50,
        backgroundColor: '#FFFFFF',
    },
    filterFrame: {
        position: 'absolute',
        right:'5.2%',
        top: '63.2%',
        height: 47,
        width: 47,
        borderRadius: 10,
        backgroundColor: '#F6C484',
    },
    filterIcon:{
        position:'absolute',
        left:'23.5%',
        top: '23.5%',
        height: 25,
        width: 25,
    },
    textInputBox: {
        position: 'absolute',
        left:'4.6%',
        top: '63.6%',
        height: 47,
        width: 301,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
    },
    searchIcon:{
        position: 'relative',
        left:'5.4%',
        top: '25%',
        height: 24,
        width: 24,
    },
    input: {
        position: 'absolute',
        left: '18.3%',
        top: '29.8%',
        height: 18,
        width: 227,
        fontFamily: 'Poppins',
        fontSize: 13,
        color: '#000',
        padding: 0, 
    },

    //TOP SERVICES CONTENT
    categoryContent:{
        height: height * 0.20, 
        width: '100%',
        position: 'relative',
        zIndex: 1,
    },
    topServiceText:{
        position: 'absolute',
        left: '4.4%',
        top: '8%',
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'Poppins',
    },
    carouselContainer: {
        paddingLeft: 20,
        paddingRight: 20,
        marginTop: 60, 
        gap: 20,
        flexDirection: 'row',
    },
    serviceItem: {
        alignItems: 'center',
        width: 75,
    },
    serviceCircle: {
        height: 85,
        width: 85,
        borderRadius: 1000,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    serviceTypeText: {
        marginTop: 5,
        textAlign: 'center',
        fontSize: 13,
        fontFamily: 'Poppins',
        color: '#594C46',
    },
    serviceContainer:{
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
        
    },
    servicesText: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'Poppins',
        color: '#000',
        marginBottom: 10,
    },
    scrollArea: {
        flex: 1, 
    },
    servicesScroll: {
        paddingBottom: 90,
        gap: 10,
    },

    //SERVICE CARD CONTENT
    serviceCard: {
        height: 150,
        width: 350,
        borderRadius: 15,
        backgroundColor: '#fff',
        alignSelf: 'center',
        justifyContent: 'center',
        borderBottomColor: '#ccc',
        borderBottomWidth: 2,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    serviceImage: {
        width: 120,
        height: 120,
        borderRadius: 10,
        marginRight: 15,
    },
    serviceInfo: {
        flex: 1,
    },
    serviceType: {
        fontSize: 16,
        fontWeight: 'semibold',
        fontFamily: 'Poppins',
        color: '#1E1E1E',
        marginBottom: 5,
    },
    providerName: {
        fontSize: 13,
        fontWeight: 'medium',
        fontFamily: 'Poppins',
        color: '#555',
        marginBottom: 5,
    },
    serviceCost: {
        fontSize: 18,
        fontFamily: 'Poppins',
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 10,
    },
    bookButton: {
        alignSelf: 'flex-start',
        position: 'absolute',
        right: '5.8%',
        top: '60%',
        backgroundColor: '#ED7678',
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 10,
    },
    bookButtonText: {
        fontFamily: 'Poppins',
        fontSize: 12,
        color: '#FFFFFF',
    },
    
    //NAVIGATION BAR
    navBarContainer: {
        height: '9%',
        width: '100%',
        position: 'absolute',
        bottom: 0,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 10,
      },
    
});

export default Home;

