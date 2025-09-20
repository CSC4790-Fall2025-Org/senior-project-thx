import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions,Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { Ionicons } from '@expo/vector-icons';


const { height } = Dimensions.get('window');

const ServiceDetails = ({route, navigation}) => {
    const { type, provider, cost, image } = route.params;
    const [activeTab, setActiveTab] = useState('About');

    return (
        <View style = {styles.container}>
            {/* LINEAR GRADIENT CONTENT */}
            <LinearGradient
                colors={['#F6C484A6', '#ED7678A6']}
                style={styles.gradient}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
            >
                {/* BACK BUTTON */}
                <TouchableOpacity style= {styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={30} color="#333" />
                </TouchableOpacity>

                {/* SERVICE INFO */}
                <View style={styles.textDetails}>
                    <Text style={styles.type}>{type}</Text>
                    <Text style={styles.provider}>By {provider}</Text>
                    <Text style={styles.cost}>{cost}</Text>
                    <TouchableOpacity style= {styles.favButton}>
                        <Feather name="heart" size={25} color="#333" />
                    </TouchableOpacity>
                </View>
                <Image source={image} style={styles.serviceImage} />
            </LinearGradient>

            {/* MORE DETAILS */}
            <View style={styles.extraButtonsContainer}>
                <TouchableOpacity style={styles.square}>
                    <FontAwesome name = 'map-o' size = {30}/>
                    <Text style={styles.squareLabel}>Direction</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.square}>
                    <AntDesign name="message" size={30} />
                    <Text style={styles.squareLabel}>Message</Text>
                </TouchableOpacity> 

                <TouchableOpacity style={styles.square}>
                    <Feather name="share-2" size={30} />
                    <Text style={styles.squareLabel}>Share</Text>
                </TouchableOpacity>
            </View>

            {/* ABOUT & REVIEWS TABS */}
            <View style = {styles.aboutReviewsContainer}>
                <View style = {styles.aboutReviewsBox}>
                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                            activeTab === 'About' && styles.activeTabButton,
                        ]}
                        onPress={() => setActiveTab('About')}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === 'About' && styles.activeTabText,
                            ]}
                        >
                            About
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                            activeTab === 'Review' && styles.activeTabButton,
                        ]}
                        onPress={() => setActiveTab('Review')}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === 'Review' && styles.activeTabText,
                            ]}
                        >
                            Review
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* WHEN PRESSED */}
            <View style={styles.tabContentWrapper}>
                {activeTab === 'About' ? (
                    <View style={styles.aboutScrollContainer}>
                        <ScrollView
                        style={styles.tabContentScroll}
                        showsVerticalScrollIndicator={false}
                        >
                        <Text style={styles.tabContentText}>
                            I am amazing at haircuts and have tons of great reviews, pls trust me and pick me choose me.
                            I promise I will give you the best haircut known in the universe that no one will call it chopped.
                            I am amazing at haircuts and have tons of great reviews, pls trust me and pick me choose me.
                            I promise I will give you the best haircut known in the universe that no one will call it chopped.
                            I am amazing at haircuts and have tons of great reviews, pls trust me and pick me choose me.
                            I promise I will give you the best haircut known in the universe that no one will call it chopped.
                            I am amazing at haircuts and have tons of great reviews, pls trust me and pick me choose me.
                            I promise I will give you the best haircut known in the universe that no one will call it chopped.
                        </Text>
                        </ScrollView>
                    </View>
                ) : (
                    <Text style={styles.tabContentText}>
                        No reviews yet. Be the first to leave a review!
                    </Text>

                )}
            </View>

            {/* RECENT WORKS */}
            <View style={styles.recentWorksContainer}>
                <Text style={styles.recentWorksTitle}>Recent Works</Text>
                <View style={styles.recentWorksRow}>
                    <Image source = {require('../assets/haircuts.jpg')} style = {styles.recentWorkItem} />
                    <Image source = {require('../assets/haircuts.jpg')}style={styles.recentWorkItem} />
                    <Image source = {require('../assets/haircuts.jpg')}style={styles.recentWorkItem} />
                </View>
            </View>

            {/* BOOK APPOINTMENT BUTTON */}
            <TouchableOpacity style = {styles.appointmentButton} onPress={() => navigation.navigate('BookingInfo')} >
                <Text style = {styles.appointmentText}>Book Appointment</Text>
            </TouchableOpacity>

        </View>
    );
}

export default ServiceDetails;
const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingBottom: 10,
    },
    //GRADIENT CONTENT
    gradient: {
      height: height * 0.29,
      width: '100%',
    },
    backButton: {
        position: 'absolute',
        top: '20%',
        left: '3.6%',
        fontFamily:'Poppins',
        fontSize: 18,
    },
    textDetails: {
        position: 'absolute',
        top: '28.7%',
        left: '5%',
    },
    serviceImage: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 10,
        top:'28.7%', 
        right: '5%'
    },
    type: {
      fontSize: 35,
      fontWeight: 'bold',
      marginBottom: 1,
      marginTop: 25,
      color: '#3C1E10',
    },
    provider: {
      fontSize: 15,
      color: '#3C1E10',
      marginBottom: 10,
    },
    cost: {
      fontSize: 25,
      fontWeight: 'bold',
      color: '#3C1E10',
    },

    // MORE DETAILS BUTTON CONTENT
    extraButtonsContainer:{
        width: '100%',
        height: height * 0.17,
        flexDirection: 'row',
        justifyContent: 'space-around', 
        alignItems: 'center',
    },
    square: {
        width: 120,
        height: 120,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    squareLabel: {
        fontSize: 15,
        fontWeight:'light',
        color: '#333',
        marginTop: 6,
        fontFamily: 'Poppins', 
        textAlign: 'center',
    },

    // ABOUT & REVIEWS CONTENT
    aboutReviewsContainer:{
        height: 60,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    aboutReviewsBox:{
        height: 50,
        width: 347,
        backgroundColor: '#F6C484',
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
    },
    tabButton: {
        paddingVertical: 8,     
        minWidth: 150,              
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',     
    },
    tabText: {
        fontSize: 16,
        color: '#3C1E10',
        fontFamily: 'Poppins',
    },
    activeTabButton: {
        backgroundColor: '#fff',
    },
    activeTabText: {
        color: '#3C1E10',
    },
    tabContentContainer: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        flex: 1,
    },
    tabContentWrapper: {
        alignItems: 'center',
        flex: 1,
    },
    aboutScrollContainer: {
        height: height * 0.20, 
    },

    tabContentScroll: {
        width: 347, 
        paddingHorizontal: 5,
        paddingVertical: 10,
    },
    tabContentText: {
        fontSize: 20,
        color: '#3C1E10',
        fontFamily: 'Poppins',
        lineHeight: 30,
    },

    //RECENT WORKS CONTENT
    recentWorksContainer: {
        height: 230,
        width: '100%',
        paddingHorizontal: 20,
        paddingTop: 10,
        backgroundColor: '#fff',
        position: 'absolute',
        bottom: 0,
    },
    recentWorksTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'Poppins',
        color: '#000',
        marginBottom: 10,
    },
    recentWorksRow: {
        flexDirection: 'row',
        justifyContent: 'space-between', 
        alignItems: 'center',
    },
    recentWorkItem: {
        width: 110,
        height: 96,
        backgroundColor: '#F6C484',
        borderRadius: 10,
    },
    appointmentButton: {
        position: 'absolute',
        bottom: '3%',
        left: '5%',
        width: '90%',
        height: 50,
        backgroundColor: '#ED7678',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    appointmentText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'medium',
        fontFamily: 'Poppins',
    },
  });