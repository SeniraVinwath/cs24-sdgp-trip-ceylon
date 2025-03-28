import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, FlatList, TouchableOpacity, Alert, BackHandler, Platform } from "react-native";
import ScreenWrapper from "../components/ScreenWrapper";
import Button from '../components/Button';
import { wp, hp } from '../helpers/common';
import { useAuth } from "../contexts/AuthContext";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import baseApiUrl from "../constants/baseApiUrl";
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from "../constants/theme";

const LuggageDashboard = () => {
  const horizontalPadding = wp(5);
  const { user } = useAuth();
  const userId = user?.id;
  const router = useRouter();
  const [registeredLuggage, setRegisteredLuggage] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const platformSpacing = { 
    paddingBottom: Platform.select({ 
      ios: Math.max(insets.bottom, hp(4)), 
      android: Math.max(insets.bottom, hp(4)), 
    }), 
  };

  const fetchRegisteredLuggage = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${baseApiUrl}/api/registered-luggage?userId=${userId}`
      );
      const data = await response.json();
      if (data.success) {
        setRegisteredLuggage(data.luggage);
      }
    } catch (error) {
      console.error("Error fetching luggage:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        router.push('/home');
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [router])
  );

  useFocusEffect(
    React.useCallback(() => {
      console.log("Dashboard screen focused - fetching latest data");
      fetchRegisteredLuggage();
      return () => {};
    }, [userId])
  );

  useEffect(() => {
    fetchRegisteredLuggage();
  }, []);

  const handleLuggageRegistered = (newLuggage) => {
    setRegisteredLuggage(prev => [...prev, newLuggage]);
  };

  const handleDelete = async (luggageId) => {
    if (!luggageId) {
      console.error("Invalid luggageId:", luggageId);
      Alert.alert("Error", "Invalid luggage ID");
      return;
    }

    try {
      const response = await fetch(
        `${baseApiUrl}/api/registered-luggage/${luggageId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        Alert.alert("Success", "Luggage deleted successfully");
        fetchRegisteredLuggage();
      } else {
        Alert.alert("Error", "Failed to delete luggage");
      }
    } catch (error) {
      console.error("Error deleting luggage:", error);
      Alert.alert("Error", "Something went wrong while deleting");
    }
  };

  const renderLuggageItem = ({ item }) => (
    <View style={styles.luggageCard}>
      <View style={styles.luggageInfo}>
        <View style={styles.row}>
          <FontAwesome5 name="suitcase-rolling" size={wp(5)} color="black" />
          <Text style={styles.luggageName}>{item.luggage_name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.luggageDetails}>IMEI: {item.imei}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="person" size={wp(5)} color="green" />
          <Text style={styles.luggageDetails}>Account: {item.account}</Text>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => router.push({ pathname: 'TrackDevice', params: item })}
        >
          <Text style={styles.buttonText}>More Details</Text>
          <Ionicons name="arrow-forward-circle" size={wp(5)} color="black" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            Alert.alert(
              "Confirm Delete",
              "Are you sure you want to delete this luggage?",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", onPress: () => handleDelete(item.luggage_id), style: "destructive" },
              ]
            );
          }}
        >
          <Ionicons name="trash" size={wp(5)} color="white" />
          <Text style={styles.deleteButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenWrapper bg="#303030">
      <View style={[styles.container, { paddingHorizontal: horizontalPadding }]}>
        <View style={styles.headContainer}>
          <View style={styles.backButton}>
            <TouchableOpacity
              onPress={() => router.push('/home')}
              style={styles.backButtonTouchable}
            >
              <Ionicons name="chevron-back" size={wp(6)} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>Luggage Dashboard</Text>
        </View>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollViewContent,
            { paddingBottom: hp(10) } // Extra padding to ensure content isn't hidden behind fixed button
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.luggageListContainer}>
            {registeredLuggage.length === 0 ? (
              <Text style={styles.noLuggageText}>
                You haven't registered any luggage yet
              </Text>
            ) : (
              <View>
                <Text style={styles.luggageCount}>
                  Total Registered: {registeredLuggage.length}
                </Text>
                <FlatList
                  data={registeredLuggage}
                  renderItem={renderLuggageItem}
                  keyExtractor={(item, index) => {
                    return item.id?.toString() || item.luggage_id?.toString() || item.imei || index.toString();
                  }}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
              </View>
            )}
          </View>
        </ScrollView>
        
        {/* Fixed position button at the bottom of the screen */}
        <View style={[styles.fixedButtonContainer, platformSpacing]}>
          <Button
            title="Register New Luggage"
            onPress={() => router.push('LuggageRegistrationForm')}
            style={styles.registerLinkButton}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#303030",
  },
  headContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(1.5),
    paddingVertical: hp(1),
    position: 'relative',
  },
  title: {
    fontSize: hp(2.7),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    borderRadius: theme.radius.sm,
    backgroundColor: 'rgba(255,255,255,0.07)',
    zIndex: 1,
  },
  backButtonTouchable: {
    padding: wp(1.5),
    borderRadius: theme.radius.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingTop: hp(2),
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#303030',
    paddingTop: hp(2),
    paddingHorizontal: wp(5),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  registerLinkButton: {
    backgroundColor: "#9DD900",
    borderRadius: wp(2),
    paddingVertical: hp(1.5),
  },
  luggageListContainer: {
    marginHorizontal: wp(1),
    marginBottom: hp(2),
  },
  luggageCard: {
    backgroundColor: "white",
    padding: wp(4),
    borderRadius: wp(2.5),
    marginBottom: hp(1.2),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  luggageInfo: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(2.5),
    marginBottom: hp(0.6),
  },
  luggageName: {
    fontSize: hp(2.2),
    fontWeight: "bold",
    color: "black",
    flex: 1,
  },
  luggageDetails: {
    fontSize: hp(1.7),
    color: "black",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: hp(1.5),
  },
  detailsButton: {
    backgroundColor: "#9DD900",
    padding: wp(2.5),
    borderRadius: wp(2),
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: wp(1),
    flex: 1,
    marginRight: wp(1.2),
    height: hp(5),
  },
  deleteButton: {
    backgroundColor: "#FF4444",
    padding: wp(2.5),
    borderRadius: wp(2),
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: wp(1),
    flex: 1,
    marginLeft: wp(1.2),
    height: hp(5),
  },
  buttonText: {
    color: "black",
    fontWeight: "bold",
    fontSize: hp(1.6),
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: hp(1.6),
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: hp(2.4),
    fontWeight: 'bold',
    marginBottom: hp(2),
  },
  separator: {
    height: hp(1),
  },
  noLuggageText: {
    color: "#A0A0A0",
    fontSize: hp(1.7),
    textAlign: 'center',
    padding: hp(3),
    borderRadius: wp(2),
    marginVertical: hp(2),
  },
  luggageCount: {
    color: "#E0E0E0",
    fontSize: hp(1.8),
    marginBottom: hp(2),
    marginLeft: wp(1),
  },
});

export default LuggageDashboard;