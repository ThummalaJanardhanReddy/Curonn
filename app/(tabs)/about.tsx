import { StyleSheet, Text, View } from 'react-native';

export default function AboutScreen() {

  // useEffect(() => {
  //   // Set navigation bar color to match header
  //   navigationBar.setBackgroundColorAsync('#ce1ab6ff');
  //   navigationBar.setButtonStyleAsync('dark');
  //   (async () => {

  //   // await navigationBar.setVisibilityAsync('hidden');
  //   })();
  // }, []);

  return (
    <View style={styles.container}>
      {/* <StatusBar barStyle="default" backgroundColor="#d11717ff" /> */}
      
      <Text style={styles.text}>About screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
  },
});
