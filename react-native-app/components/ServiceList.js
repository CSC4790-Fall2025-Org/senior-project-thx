import React, { useMemo } from "react"; 

import { Text, View, FlatList, StyleSheet } from "react-native"; 

import Service from "../components/Service"; 

 

const ServiceList = ( {services} ) => { 

  return ( 

    <FlatList 

      data={services} 

      keyExtractor={(item) => item.id} 

      contentContainerStyle={styles.servicesScroll} 

      renderItem={({ item }) => ( 

        <Service item = {item}/> 

      )} 

      showsVerticalScrollIndicator={false} 

    /> 

  ); 

}; 

 

const styles = StyleSheet.create ( { 

      servicesScroll: { 

        paddingBottom: 90, 

        gap: 10, 

    }, 

 

}); 

 

export default ServiceList; 