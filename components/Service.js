import React, { useMemo } from "react";
import { Text, View, FlatList } from "react-native";
import dummyData from "../data/dummyData";
import { useNavigation } from "@react-navigation/native";

const Service = ({service_id, name, description, price, tag, availability, image}) => {
    const navigation = useNavigation();
    return (
        <View>
            <Text>Service</Text>

        </View>
    );
}

    export default Service;