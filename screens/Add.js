import {
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
  // const storage = getStorage();

  const currentUserId = props.route.params.currentUserId;

  const [nom, setNom] = React.useState("");
  const [prenom, setPrenom] = React.useState("");
  const [numero, setNumero] = React.useState("");

  const [imageUri, setImageUri] = React.useState(null);

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
    // 1️⃣ Request permission
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

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
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
        // placeholder="Nom"
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
        // placeholder="Prenom"
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
        // placeholder="Numero"
        keyboardType="phone-pad"
        style={styles.textinputstyle}
      ></TextInput>
      <TouchableOpacity
        style={[styles.btnStyle, { backgroundColor: "green" }]}
        // onPress={() => {
        //   const ref_base = database.ref();
        //   const ref_profils = ref_base.child("profils");
        //   // const key = ref_profils.push().key;
        //   // const ref_p = ref_profils.child("profil" + key);
        //   const ref_p = ref_profils.child(currentUserId);
        //   ref_p
        //     .update({
        //       nom: nom,
        //       prenom: prenom,
        //       numero: numero,
        //       id: currentUserId,
        //     })
        //     .then(() => {
        //       alert("Updated with success");
        //     })
        //     .catch((error) => {
        //       alert(error.message);
        //     });
        // }}
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
              profilePicture: profilePicUrl || null, // save the URL
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
      <TouchableOpacity style={[styles.btnStyle, { backgroundColor: "green" }]}>
        <Text
          style={{
            color: "#fff",
            fontSize: 24,
          }}
        >
          Déconnecter
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btnStyle, { backgroundColor: "red" }]}>
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
    backgroundColor: "#cebbf6",
    fontSize: 20,
    color: "white",
    width: "75%",
    height: 50,
    borderRadius: 10,
    margin: 5,
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
    marginBottom: 10,
    // backgroundColor: "#000",
    // borderColor: "#00f",
    borderWidth: 2,
    textstyle: "italic",
    fontSize: 24,
    height: 60,
    width: "50%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    marginTop: 20,
  },
});
