import { router } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import commonStyles, { colors } from '../app/shared/styles/commonStyles';
import { images } from '../assets';
import ProfileModal from './shared/components/ProfileModal';
const { width: screenWidth } = Dimensions.get('window');

export default function LandingScreen() {
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [faqVisible, setFaqVisible] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    name: '',
    email: '',
    message: '',
  });
  const slideAnim = useRef(new Animated.Value(screenWidth)).current;
  const bottomSlideAnim = useRef(new Animated.Value(400)).current;
  const [profileVisible, setProfileVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Tab configuration
  const tabs = useMemo(
    () => [
      { key: 'home', title: 'Home', image: images.tabs.home },
      { key: 'lab-tests', title: 'Lab Tests', image: images.tabs.labTests },
      { key: 'my-doctor', title: 'My Doctor', image: images.tabs.myDoctor },
      { key: 'medicines', title: 'Medicines', image: images.tabs.medicines },
      { key: 'orders', title: 'Orders', image: images.tabs.orders },
    ],
    []
  );

  // Dummy services data (would come from API)
  const services = useMemo(
    () => [
    {
      id: 1,
      title: 'Consult a Doctor',
        image:
          'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=60&h=60&fit=crop',
        route: '/consult-doctor',
    },
    {
      id: 2,
      title: 'Order Medicine',
        image:
          'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=60&h=60&fit=crop',
        route: '/order-medicine',
    },
    {
      id: 3,
      title: 'Health Checkup',
        image:
          'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=60&h=60&fit=crop',
        route: '/health-checkup',
    },
    {
      id: 4,
      title: 'Lab Tests',
        image:
          'https://images.unsplash.com/photo-1581595219315-a187dd40c322?w=60&h=60&fit=crop',
        route: '/lab-tests',
      },
    ],
    []
  );

  // Health articles data
  const articles = [
    {
      id: 1,
      title: '10 Essential Vitamins for Daily Health',
      excerpt:
        'Discover the most important vitamins your body needs and how to get them naturally.',
      image:
        'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=150&fit=crop',
      readTime: '5 min read',
    },
    {
      id: 2,
      title: 'Mental Health: Breaking the Stigma',
      excerpt:
        "Understanding mental health and why it's crucial to talk about it openly.",
      image:
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=300&h=150&fit=crop',
      readTime: '7 min read',
    },
    {
      id: 3,
      title: 'Exercise: The Natural Medicine',
      excerpt:
        'How regular physical activity can prevent diseases and improve your quality of life.',
      image:
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=150&fit=crop',
      readTime: '6 min read',
    },
  ];

  // FAQ data
  const faqs = [
    {
      id: 1,
      question: 'How do I book an appointment?',
      answer:
        'You can book an appointment through our app by selecting the "Consult a Doctor" service and choosing your preferred time slot.',
    },
    {
      id: 2,
      question: 'Is my medical information secure?',
      answer:
        'Yes, we use industry-standard encryption and follow HIPAA guidelines to ensure your medical information is completely secure.',
    },
    {
      id: 3,
      question: 'How long does medicine delivery take?',
      answer:
        'Medicine delivery typically takes 2-4 hours in urban areas and 24-48 hours in rural areas.',
    },
    {
      id: 4,
      question: 'Can I cancel my appointment?',
      answer:
        'Yes, you can cancel your appointment up to 2 hours before the scheduled time without any cancellation fees.',
    },
  ];

  // Dummy notifications
  const notifications = [
    {
      id: 1,
      title: 'Appointment Reminder',
      message: 'Your doctor appointment is scheduled for tomorrow at 2:00 PM',
      time: '2 hours ago',
      type: 'appointment',
    },
    {
      id: 2,
      title: 'Medicine Delivery',
      message: 'Your medicine order has been delivered successfully',
      time: '1 day ago',
      type: 'delivery',
    },
    {
      id: 3,
      title: 'Health Tips',
      message: 'New health tips available for your wellness journey',
      time: '2 days ago',
      type: 'tips',
    },
    {
      id: 4,
      title: 'Lab Results Ready',
      message: 'Your recent lab test results are now available',
      time: '3 days ago',
      type: 'results',
    },
  ];

  const showNotificationModal = useCallback(() => {
    setNotificationVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const hideNotificationModal = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: screenWidth,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setNotificationVisible(false);
    });
  }, [slideAnim]);

  const showBottomModal = useCallback(
    (type: 'faq' | 'feedback') => {
    if (type === 'faq') setFaqVisible(true);
    else setFeedbackVisible(true);
    
    Animated.timing(bottomSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    },
    [bottomSlideAnim]
  );

  const hideBottomModal = useCallback(() => {
    Animated.timing(bottomSlideAnim, {
      toValue: 400,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setFaqVisible(false);
      setFeedbackVisible(false);
    });
  }, [bottomSlideAnim]);

  const handleFeedbackSubmit = useCallback(() => {
    // Handle feedback submission
    console.log('Feedback submitted:', feedbackForm);
    hideBottomModal();
    setFeedbackForm({ name: '', email: '', message: '' });
  }, [feedbackForm, hideBottomModal]);

  const handleTabPress = useCallback((index: number) => {
    setActiveTab(index);
    const tab = tabs[index];
    
    // Navigate to respective screens based on tab
    switch (tab.key) {
      case 'home':
        // Already on home, no navigation needed
        break;
      case 'lab-tests':
        router.push('/lab-tests');
        break;
      case 'my-doctor':
        // Navigate to my doctor screen (create this later)
        console.log('Navigate to My Doctor');
        break;
      case 'medicines':
        // Navigate to medicines screen (create this later)
        console.log('Navigate to Medicines');
        break;
      case 'orders':
        // Navigate to orders screen (create this later)
        console.log('Navigate to Orders');
        break;
      default:
        break;
    }
  }, [tabs]);


  const renderServiceCard = useCallback(
    ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.serviceCard}
      onPress={() => router.push(item.route)}
      accessibilityLabel={`${item.title} service`}
      accessibilityRole="button"
      accessibilityHint={`Tap to access ${item.title}`}
    >
      <Text style={styles.serviceCardTitle}>{item.title}</Text>
        <View style={styles.serviceCardBottom}>
        <Image 
          source={{ uri: item.image }} 
          style={styles.serviceImage}
          accessibilityLabel={`${item.title} icon`}
        />
        <View style={styles.arrowContainer}>
          <IconButton 
            icon="arrow-right" 
            size={20} 
            iconColor="#6200ee"
            style={styles.rotatedArrow}
            accessibilityLabel="Navigate to service"
          />
        </View>
      </View>
    </TouchableOpacity>
    ),
    []
  );

  const renderArticleCard = useCallback(
    ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.articleCard}
      accessibilityLabel={`${item.title} article`}
      accessibilityRole="button"
      accessibilityHint={`Tap to read ${item.title}`}
    >
      <Image 
        source={{ uri: item.image }} 
        style={styles.articleImage}
        accessibilityLabel={`${item.title} article image`}
      />
      <View style={styles.articleContent}>
        <Text style={styles.articleTitle}>{item.title}</Text>
        <Text style={styles.articleExcerpt}>{item.excerpt}</Text>
        <Text style={styles.articleReadTime}>{item.readTime}</Text>
      </View>
    </TouchableOpacity>
    ),
    []
  );

  const renderNotification = useCallback(({ item }: { item: any }) => {
    const getIconName = () => {
      switch (item.type) {
        case 'appointment':
          return 'calendar';
        case 'delivery':
          return 'package-variant';
        case 'results':
          return 'file-document';
        default:
          return 'lightbulb';
      }
    };

    return (
      <View style={styles.notificationItem}>
        <View style={styles.notificationItemIcon}>
          <IconButton 
            icon={getIconName()} 
            size={20} 
            iconColor={colors.secondary}
            accessibilityLabel={`${item.type} notification icon`}
          />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          <Text style={styles.notificationTime}>{item.time}</Text>
        </View>
      </View>
    );
  }, []);

  const renderFAQ = useCallback(
    ({ item }: { item: any }) => (
    <View style={styles.faqItem}>
      <Text style={styles.faqQuestion}>{item.question}</Text>
      <Text style={styles.faqAnswer}>{item.answer}</Text>
    </View>
    ),
    []
  );

  return (
    <View style={[commonStyles.container, styles.container]}>
      <Image
        source={images.panels.landingPage}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg_primary} />
      
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.profileButton} 
            onPress={() => setProfileVisible(true)}
            accessibilityLabel="Open profile"
            accessibilityRole="button"
            accessibilityHint="Tap to view your profile"
          >
            {/* <Image
              source={images.profile}
              style={styles.profileIcon}
              resizeMode="contain"
            /> */}
          </TouchableOpacity>
          <View style={styles.locationInfo}>
            <Text style={styles.locationText}>📍 New York, NY</Text>
            <Text style={styles.locationSubtext}>Current Location</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={showNotificationModal}
          accessibilityLabel="View notifications"
          accessibilityRole="button"
          accessibilityHint="Tap to view your notifications"
        >
          {/* <Image
            source={images.notification}
            style={styles.notificationIcon}
            resizeMode="contain"
          /> */}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        accessibilityLabel="Main content"
      >
        {/* Main Heading Section */}
        <View style={styles.headingSection}>
          <Text style={styles.mainHeading}>Transform Your Life</Text>
          <Text style={styles.subHeading}>with Curonn.health</Text>
        </View>

        {/* Yoga Lady Image Section */}
        <View style={styles.yogaImageSection}>
          <Image
            source={images.yogaLady}
            style={styles.yogaImage}
            resizeMode="contain"
          />
        </View>

        {/* Services Section */}
        <View style={styles.servicesSection}>
          {/* <Text style={styles.sectionTitle}>Available Services</Text> */}
          <View
            style={styles.servicesGrid}
            accessibilityRole="list"
            accessibilityLabel="Available health services"
          >
            {services.map((service: any) => (
              <View key={service.id} style={styles.serviceCardWrapper}>
                {renderServiceCard({ item: service })}
              </View>
            ))}
          </View>
        </View>

        {/* Lab Test Booking Section */}
        <View style={styles.section}>
          <View style={styles.featureCard}>
            <Image
              source={images.panels.labTest}
              style={styles.featureBackground}
              resizeMode="cover"
            />
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: 'black' }]}>Book your lab test</Text>
              <Text style={styles.featureSubtitle}>at your doorstep</Text>
              <Button 
                mode="contained" 
                style={[styles.featureButton, { backgroundColor: '#5479F7' }]}
                onPress={() => router.push('/lab-tests')}
              >
                Book Now
              </Button>
            </View>
            {/* <Image
              source={images.labtest}
              style={styles.featureImage}
              resizeMode="contain"
            /> */}
          </View>
        </View>

        {/* Wellness Program Section */}
        <View style={styles.section}>
          <View style={styles.featureCard}>
            <Image
              source={images.panels.wellness}
              style={styles.featureBackground}
              resizeMode="cover"
            />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Wellness Program</Text>
              <Text style={styles.featureSubtitle}>at your doorstep</Text>
              <Button 
                mode="contained" 
                style={[styles.featureButton, { backgroundColor: '#EFBC73', height:29, alignItems: 'center', justifyContent: 'center', }]}
                onPress={() => router.push('/')}
              >
                Get Now
              </Button>
            </View>
          </View>
        </View>

        {/* Ambulance Booking Section */}
        <View style={styles.section}>
          <View style={styles.ambulanceCard}>
            <Image 
              source={images.panels.ambulance}
              style={styles.ambulanceBackground}
              resizeMode="cover"
            />
            <View style={styles.ambulanceContent}>
              <Text style={styles.ambulanceTitle}>Book Ambulance</Text>
              <Text style={styles.ambulanceSubtitle}>
                get a call from the providers
              </Text>
              <Button 
                mode="contained" 
                style={styles.ambulanceButton}
                onPress={() => router.push('/')}
              >
                Book Now
              </Button>
            </View>
          </View>
        </View>

        {/* Health Articles Section */}
        <View style={styles.section}>
          <View style={styles.divider}>
            <Text style={styles.dividerText}>Health Articles</Text>
          </View>
          <FlatList
            data={articles}
            renderItem={renderArticleCard}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.articlesContainer}
          />
        </View>

        {/* FAQ & Feedback Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: 'white' }]}>You can also</Text>
          <View style={styles.actionButtons}>
            <Button 
              mode="outlined" 
              style={[styles.actionButton, { backgroundColor: 'white' }]}
              labelStyle={{ color: 'black' }}
              onPress={() => showBottomModal('faq')}
            >
              FAQs
            </Button>
            <Button 
              mode="outlined" 
              style={[styles.actionButton, { backgroundColor: 'white' }]}
              labelStyle={{ color: 'black' }}
              onPress={() => showBottomModal('feedback')}
            >
              Send us Feedback
            </Button>
          </View>
        </View>

        {/* Final Quote Section */}
        <View style={styles.quoteSection}>
         <Image source={images.panels.happyLife}  />
        </View>
      </ScrollView>

      {/* Bottom Tab Navigation */}
      <View style={styles.bottomTabContainer}>
        {tabs.map((tab: any, index: number) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => handleTabPress(index)}
            accessibilityLabel={`${tab.title} tab`}
            accessibilityState={{ selected: activeTab === index }}
            accessibilityHint={`Tap to navigate to ${tab.title}`}
          >
            <Image
              source={tab.image}
              style={[
                styles.tabIcon,
                { tintColor: activeTab === index ? '#ED67B8' : '#707070' },
              ]}
              resizeMode="contain"
            />
            <Text
              style={[
              styles.tabText,
                { color: activeTab === index ? '#FFFFFF' : '#707070' },
              ]}
            >
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>


      {/* Notification Modal - Slides from right to left */}
      <Modal
        visible={notificationVisible}
        animationType="none"
        transparent={true}
        onRequestClose={hideNotificationModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            onPress={hideNotificationModal}
          />
          <Animated.View 
            style={[
              styles.modalContent,
              {
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity 
                onPress={hideNotificationModal}
                style={styles.closeButton}
              >
                <Image 
                  source={images.icons.close} 
                  style={styles.closeIcon}
                />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={notifications}
              renderItem={renderNotification}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.notificationsList}
              accessibilityRole="list"
              accessibilityLabel="Notifications list"
            />
          </Animated.View>
        </View>
      </Modal>

      {/* FAQ Modal - Slides from bottom to top */}
      <Modal
        visible={faqVisible}
        animationType="none"
        transparent={true}
        onRequestClose={hideBottomModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            onPress={hideBottomModal}
          />
          <Animated.View 
            style={[
              styles.bottomModalContent,
              {
                transform: [{ translateY: bottomSlideAnim }],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Frequently Asked Questions</Text>
              <TouchableOpacity 
                onPress={hideBottomModal}
                style={styles.closeButton}
              >
                <Image 
                  source={images.icons.close} 
                  style={styles.closeIcon}
                />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={faqs}
              renderItem={renderFAQ}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.faqList}
              accessibilityRole="list"
              accessibilityLabel="Frequently asked questions"
            />
          </Animated.View>
        </View>
      </Modal>

      {/* Feedback Modal - Slides from bottom to top */}
      <Modal
        visible={feedbackVisible}
        animationType="none"
        transparent={true}
        onRequestClose={hideBottomModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            onPress={hideBottomModal}
          />
          <Animated.View 
            style={[
              styles.bottomModalContent,
              {
                transform: [{ translateY: bottomSlideAnim }],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Feedback</Text>
              <TouchableOpacity 
                onPress={hideBottomModal}
                style={styles.closeButton}
              >
                <Image 
                  source={images.icons.close} 
                  style={styles.closeIcon}
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.feedbackForm}>
              <TextInput
                style={styles.input}
                placeholder="Your Name"
                value={feedbackForm.name}
                onChangeText={(text) =>
                  setFeedbackForm({ ...feedbackForm, name: text })
                }
                accessibilityLabel="Name input"
                accessibilityHint="Enter your full name"
                autoComplete="name"
              />
              <TextInput
                style={styles.input}
                placeholder="Your Email"
                value={feedbackForm.email}
                onChangeText={(text) =>
                  setFeedbackForm({ ...feedbackForm, email: text })
                }
                keyboardType="email-address"
                accessibilityLabel="Email input"
                accessibilityHint="Enter your email address"
                autoComplete="email"
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Your Message"
                value={feedbackForm.message}
                onChangeText={(text) =>
                  setFeedbackForm({ ...feedbackForm, message: text })
                }
                multiline
                numberOfLines={4}
                accessibilityLabel="Message input"
                accessibilityHint="Enter your feedback message"
              />
              <Button 
                mode="contained" 
                style={styles.submitButton}
                onPress={handleFeedbackSubmit}
                accessibilityLabel="Send feedback"
                accessibilityHint="Submit your feedback"
              >
                Send Feedback
              </Button>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Profile Modal */}
      <ProfileModal 
        visible={profileVisible} 
        onClose={() => setProfileVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg_primary,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // paddingHorizontal: 10,
    paddingLeft: 16,
    paddingTop: 20,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  profileIcon: {
    width: 32,
    height: 32,
  },
  notificationIcon: {
    width: 28,
    height: 28,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileButton: {
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  locationSubtext: {
    fontSize: 12,
    color: 'white',
    marginTop: 2,
  },
  notificationButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingBottom: 80, // Space for bottom navigation
  },
  headingSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
    color: 'white',
  },
  mainHeading: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subHeading: {
    fontSize: 18,
    color: 'white',
    fontWeight: '500',
    textAlign: 'center',
  },
  yogaImageSection: {
    marginVertical: 20,
    alignItems: 'center',
  },
  yogaImage: {
    width: '80%',
    height: 200,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  servicesSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCardWrapper: {
    width: '48%',
    marginBottom: 16,
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    padding: 16,
    minHeight: 160,
    justifyContent: 'space-between',
  },
  serviceCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'left',
    flex: 1,
  },
  serviceCardBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  serviceImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  arrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rotatedArrow: {
    transform: [{ rotate: '325deg' }],
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  featureBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  featureContent: {
    flex: 1,
    zIndex: 1,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 14,
    color: '#ebd8d8',
    marginBottom: 16,
  },
  featureButton: {
    alignSelf: 'flex-start',
    borderRadius: 23,
    color: '#EFBC73'
  },
  featureImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginLeft: 16,
    zIndex: 1,
    alignSelf: 'flex-end',
  },
  ambulanceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  ambulanceBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  ambulanceImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  ambulanceContent: {
    flex: 1,
    zIndex: 1,
  },
  ambulanceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  ambulanceSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  ambulanceButton: {
    alignSelf: 'flex-start',
    borderRadius: 23,
  },
  divider: {
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  articlesContainer: {
    paddingHorizontal: 10,
  },
  articleCard: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  articleImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  articleContent: {
    padding: 16,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  articleExcerpt: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  articleReadTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  actionButtons: {
    // flexDirection: 'row',
    // justifyContent: 'space-around',
    gap: 10,
    
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  quoteSection: {
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 40,
    marginBottom: 20,
  },
  quoteTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  quoteText: {
    fontSize: 18,
    color: colors.secondary,
    fontWeight: '500',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomTabContainer: {
    flexDirection: 'row',
    backgroundColor: 'black',
    paddingBottom: 20,
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    width: 20,
    height: 20,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: screenWidth,
    height: '100%',
    backgroundColor: '#fff',
    // borderTopLeftRadius: 20,
    // borderBottomLeftRadius: 20,
  },
  bottomModalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingTop: 60,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    width: 24,
    height: 24,
    tintColor: colors.textSecondary,
  },
  notificationsList: {
    padding: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  notificationItemIcon: {
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  faqList: {
    padding: 20,
  },
  faqItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  feedbackForm: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 23,
  },
});
