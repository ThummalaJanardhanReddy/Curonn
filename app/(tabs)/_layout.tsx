import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ffd33d',
        headerShadowVisible: false,
        headerTintColor: '#fff',
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Home',
          headerBackButtonDisplayMode: 'generic',
          headerStatusBarHeight: 0,
          headerShown: false,
          headerStyle: { backgroundColor: '#1060c2ff' },
          tabBarStyle: { backgroundColor: '#7c9bc0ff' },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name='about'
        options={{
          title: 'About',
          headerStyle: { backgroundColor: '#d11717ff' },
          tabBarStyle: { backgroundColor: '#d11717ff' },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'information-circle' : 'information-circle-outline'} color={color} size={24}/>
          ),
        }}
      />
    </Tabs>
  );
}
