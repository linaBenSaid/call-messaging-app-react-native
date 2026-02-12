import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect } from "react";
import initApp, { supabase } from "../Config";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";


export default function Add(props) {
  const database = initApp.database();

  const currentUserId = props.route.params.currentUserId;

  const [nom, setNom] = React.useState("");
  const [prenom, setPrenom] = React.useState("");
  const [numero, setNumero] = React.useState("");

  const [imageUri, setImageUri] = React.useState(null);

  const auth = initApp.auth();

  async function getUserProfile(currentUserId) {
    const snapshot = await database
      .ref()
      .child(`profils/${currentUserId}`)
      .once("value");

    if (!snapshot.exists()) return null;
    return snapshot.val();
  }

  useEffect(() => {
    const fetchProfile = async () => {
      const data = await getUserProfile(currentUserId);
      if (data) {
        setNom(data.nom || "");
        setPrenom(data.prenom || "");
        setNumero(data.numero || "");
        setImageUri(data.profilePicture || null);
      }
    };

    fetchProfile();
  }, []);

  const OpenImagePickerAsync1 = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Permission to access media library is required!"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadProfilePicture = async (uri) => {
    try {
      const extension = uri.split(".").pop().toLowerCase();
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      supabase.storage
        .from("images")
        .upload(currentUserId + "." + extension, arrayBuffer, {
          upsert: true,
        });

      const { data } = supabase.storage
        .from("images")
        .getPublicUrl(currentUserId + "." + extension);
      return data.publicUrl;
    } catch (error) {
      console.log("Error uploading profile picture:", error);
      return null;
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete the account ?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: deleteAccount },
      ]
    );
  };

  async function deleteAccount() {
    try {
      const userId = currentUserId;
      const ref = database.ref(`profils/${userId}`);

      await ref.update({ connected: false });

      await ref.update({
        nom: "Deleted",
        prenom: "",
        numero: "",
        profilePicture: null,
        email: "",
        disabled: true,
      });

      const userAuth = auth.currentUser;
      if (userAuth) {
        await userAuth.delete().catch(() => {});
      }

      await auth.signOut();

      alert("Account deleted");
      props.navigation.navigate("Auth");
    } catch (error) {
      console.log("Delete error:", error);
      alert("Error deleting account: " + error.message);
    }
  }

  async function disconnect() {
  try {
    const user = auth.currentUser;

    if (!user) {
      console.log("No user logged in");
      return;
    }

    await database.ref(`profils/${user.uid}`).update({
      connected: false,
    });


    await auth.signOut();

    props.navigation.replace("Auth");
  } catch (err) {
    console.log("Disconnect error:", err);
  }
}


  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <View style={{ height: 40 }}></View>
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          textAlign: "center",
          marginBottom: 20,
        }}
      >
        Add a new user
      </Text>
      <TouchableOpacity onPress={OpenImagePickerAsync1}>
        <Image
          source={
            imageUri ? { uri: imageUri } : require("../assets/profile.png")
          }
          style={{
            reseizeMode: "contain",
            width: 150,
            height: 150,
          }}
        />
      </TouchableOpacity>
      <TextInput
        onChangeText={(text) => {
          setNom(text);
        }}
        value={nom}
        textAlign="center"
        placeholderTextColor="white"

        keyboardType="name-phone-pad"
        style={styles.textinputstyle}
      ></TextInput>
      <TextInput
        onChangeText={(text) => {
          setPrenom(text);
        }}
        textAlign="center"
        value={prenom}
        placeholderTextColor="white"

        keyboardType="name-phone-pad"
        style={styles.textinputstyle}
      ></TextInput>
      <TextInput
        value={numero}
        onChangeText={(text) => {
          setNumero(text);
        }}
        textAlign="center"
        placeholderTextColor="white"

        keyboardType="phone-pad"
        style={styles.textinputstyle}
      ></TextInput>
      <TouchableOpacity
        style={[styles.btnStyle, { backgroundColor: "#549f72ff" }]}

        onPress={async () => {
          let profilePicUrl = null;

          if (imageUri) {
            // profilePicUrl = await uploadProfilePicture(imageUri);
            profilePicUrl = await uploadProfilePicture(imageUri);
            profilePicUrl += "?t=" + Date.now();
            setImageUri(profilePicUrl);
          }

          const ref_profils = database.ref("profils").child(currentUserId);
          ref_profils
            .update({
              nom,
              prenom,
              numero,
              id: currentUserId,
              profilePicture: profilePicUrl || null, 
            })
            .then(() => {
              alert("Updated successfully!");
            })
            .catch((error) => {
              alert(error.message);
            });
        }}
        disabled={false}
        activeOpacity={0.5}
        underlayColor="DDDDDD"
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 24,
          }}
        >
          Save
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btnStyle, { backgroundColor: "#549f72ff" }]}
        onPress={() => {
          disconnect();
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 24,
          }}
        >
          Déconnecter
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btnStyle, { backgroundColor: "#d44f4fff" }]}
        onPress={confirmDeleteAccount}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 24,
          }}
        >
          Supprimer le compte
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  textinputstyle: {
    backgroundColor: "#D9CFFC",
    fontSize: 18,
    color: "#3A2E66",
    width: "85%",
    height: 55,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  textstyle: {
    fontSize: 40,
    fontFamily: "serif",
    color: "#00f",
    fontWeight: "bold",
  },
  container: {
    color: "blue",
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  btnStyle: {
    marginVertical: 5,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: "85%",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#007AFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
