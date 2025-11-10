import { Text, View, Image, TouchableOpacity, StyleSheet } from "react-native"; 
import { useNavigation } from "@react-navigation/native"; 

const Service = ({ item }) => {  
  const navigation = useNavigation();

  let imageSource = null;

  if (Array.isArray(item.imageUrl) && item.imageUrl.length > 0) {
    const firstImage = item.imageUrl[0];
    imageSource =
      typeof firstImage === "string"
        ? { uri: firstImage }
        : firstImage.url
        ? { uri: firstImage.url }
        : null;
  } else if (typeof item.imageUrl === "string") {
    imageSource = { uri: item.imageUrl };
  } else if (item.imageUrl?.uri) {
    imageSource = { uri: item.imageUrl.uri };
  } else if (item.imageUri?.uri) {
    imageSource = { uri: item.imageUri.uri };
  }
  
  return ( 
    <View style={styles.serviceCard}> 
      <View style={styles.cardContent}> 
        {imageSource ? (
          <Image source={imageSource} style={styles.serviceImage} />
        ) : (
          <View style={styles.serviceImage} />
        )}
        <View style={styles.serviceInfo}> 
          <Text style={styles.serviceType}>{item.service}</Text> 
          <Text style={styles.providerName}>By {item.provider}</Text> 
          <Text style={styles.serviceCost}>${item.price}</Text>
          <TouchableOpacity 
            style={styles.bookButton} 
            onPress={() => 
              navigation.navigate("ServiceDetails", { 
                id: item.id,
                type: item.type, 
                provider: item.provider_name, 
                cost: item.price, 
                image: imageSource, 
              }) 
            } 
          > 
            <Text style={styles.bookButtonText}>Book</Text> 
          </TouchableOpacity> 
        </View> 
        </View> 
    </View> 
  ); 
}; 

const styles = StyleSheet.create({ 

  // SERVICE CARD CONTENT 
  serviceCard: { 
    height: 150, 
    width: '100%', 
    borderRadius: 15, 
    backgroundColor: "#fff", 
    alignSelf: "center", 
    justifyContent: "center", 
    borderBottomColor: "#ccc", 
    borderBottomWidth: 2, 
  }, 

  cardContent: { 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 15, 
  }, 

  serviceImage: { 
    width: 120, 
    height: 120, 
    borderRadius: 10, 
    marginRight: 15, 
    backgroundColor: '#EEE' 
  }, 

  serviceInfo: { 
    flex: 1, 
  }, 

  serviceType: { 
    fontSize: 16, 
    fontWeight: "600", // semibold 
    fontFamily: "Poppins", 
    color: "#1E1E1E",
    marginBottom: 5, 
  }, 

  providerName: { 
    fontSize: 13, 
    fontWeight: "500", // medium 
    fontFamily: "Poppins", 
    color: "#555", 
    marginBottom: 5, 
  }, 

  serviceCost: { 
    fontSize: 18, 
    fontFamily: "Poppins", 
    fontWeight: "bold", 
    color: "#000000", 
    marginBottom: 10, 
  }, 

  bookButton: { 
    alignSelf: "flex-start", 
    position: "absolute", 
    right: "5.8%", 
    top: "60%", 
    backgroundColor: "#ED7678", 
    paddingHorizontal: 15, 
    paddingVertical: 5, 
    borderRadius: 10, 
  }, 

  bookButtonText: { 
    fontFamily: "Poppins", 
    fontSize: 12, 
    color: "#FFFFFF", 
  }, 
}); 

export default Service; 