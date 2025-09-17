import React, { useMemo } from "react";
import { Text, View, FlatList } from "react-native";
import dummyData from "../data/dummyData";

const ServicesList = () => {
    const services = useMemo(() => {
        return dummyData.flatMap((provider) =>
          provider.services.map((s) => ({
            ...s,
            providerId: provider.id,
            providerName: provider.name,
            location: provider.location,
          }))
        );
      }, []);

    const renderItem = ({ item }) => {
        // Render each service item
    }
    return (
        <View>
            <Text>Services List</Text>
            <FlatList
                data={services}
                renderItem={renderItem}
                keyExtractor={(item) => `${item.providerId}-${item.service_id}`}
            />
        </View>
    );
}

    export default ServicesList;