import { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = PropsWithChildren<{
  // You can add additional props here if needed
  headerBackgroundColor?: string;
}>;

export default function AppLayout({ children, headerBackgroundColor }: Props) {
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: headerBackgroundColor || '#FFFFFF' },
      ]}
    >
      <SafeAreaView style={styles.content}>{children}</SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  // You can define styles for the layout here if needed
  container: {
    flex: 1,
    // backgroundColor: '#FFFFFF',
  },
  content: {
    //   ...commonStyles.container_layout,
    flex: 1,
    paddingBottom: 0,
  },
});
