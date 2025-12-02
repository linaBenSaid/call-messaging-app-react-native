import {
  View,
  Text,
  TextInput,
  Button,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useState } from "react";
import initApp from "../Config/index";

export default function Auth(props) {
  const database = initApp.database();
  const auth = initApp.auth();
  const [email, setEmail] = useState("linabs@gmail.com");
  const [password, setPassword] = useState("123456");

  return (
    <ImageBackground
      source={require("../assets/imagetest.jpg")}
      style={styles.container}
    >
      <View>
        <Text>Auth</Text>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        ></TextInput>
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        ></TextInput>
        <View>
          <Button
            title="Submit"
            onPress={(e) => {
              auth
                .signInWithEmailAndPassword(email, password)
                .then(() => {
                  props.navigation.navigate("Acceuil", {
                    currentUserId: auth.currentUser.uid,
                  });
                })
                .catch((error) => {
                  alert(error.message);
                });
            }}
          ></Button>
          <Button title="Cancel"></Button>
        </View>
        <TouchableOpacity
          // onPress={() => {
          //   auth
          //     .createUserWithEmailAndPassword(email, password)
          //     .then(() => {
          //       props.navigation.navigate("Acceuil");
          //     })
          //     .catch((error) => {
          //       alert(error.message);
          //     });
          // }}
          onPress={() => {
            auth
              .createUserWithEmailAndPassword(email, password)
              .then((userCredential) => {
                const user = userCredential.user;
                const uid = user.uid;

                // Save profile to Realtime Database
                database
                  .ref("profils/" + uid)
                  .set({
                    id: uid,
                    email: email,
                  })
                  .then(() => {
                    props.navigation.navigate("Acceuil", {
                      currentUserId: auth.currentUser.uid,
                    });
                  })
                  .catch((error) => {
                    alert(error.message);
                  });
              })
              .catch((error) => {
                alert(error.message);
              });
          }}
        >
          <Text>Create new user</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    width: "100%",
    marginBottom: 15,
    borderWidth: 1,
  },
});
