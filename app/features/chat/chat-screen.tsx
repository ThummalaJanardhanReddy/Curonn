import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import BackButton from '../../shared/components/BackButton';
import { colors } from '../../shared/styles/commonStyles';
import {
    getResponsiveFontSize,
    getResponsiveSpacing,
    wp
} from '../../shared/utils/responsive';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatScreen() {
  const { doctorName, selectedSymptoms } = useLocalSearchParams<{
    doctorName: string;
    selectedSymptoms: string;
  }>();
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: `Hello! I'm ${doctorName || 'Dr. Sarah Johnson'}. I see you've selected the following symptoms: ${JSON.parse(selectedSymptoms || '[]').map((s: any) => s.name).join(', ')}. How can I help you today?`,
      isUser: false,
      timestamp: new Date(),
    },
  ]);

  const handleBack = () => {
    router.back();
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        text: message.trim(),
        isUser: true,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, newMessage]);
      setMessage('');
      
      // Simulate doctor response
      setTimeout(() => {
        const doctorResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: "Thank you for sharing that information. Can you tell me more about when these symptoms started?",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, doctorResponse]);
      }, 1000);
    }
  };

  const renderMessage = (message: ChatMessage) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessage : styles.doctorMessage,
      ]}
    >
      <Text
        style={[
          styles.messageText,
          message.isUser ? styles.userMessageText : styles.doctorMessageText,
        ]}
      >
        {message.text}
      </Text>
      <Text style={styles.timestamp}>
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton
          title={doctorName || 'Dr. Sarah Johnson'}
          onPress={handleBack}
          style={styles.backButton}
          textStyle={styles.headerTitle}
        />
      </View>

      {/* Chat Consultation Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>Chat consultation</Text>
      </View>

      {/* Messages */}
      <ScrollView 
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(renderMessage)}
      </ScrollView>

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
           <TextInput
             style={styles.textInput}
             placeholder="Type your message..."
             placeholderTextColor="#999"
             value={message}
             onChangeText={setMessage}
             onSubmitEditing={handleSendMessage}
             multiline
             maxLength={500}
           />
          <TouchableOpacity
            style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!message.trim()}
          >
             <Text style={[styles.sendIcon, !message.trim() && styles.sendIconDisabled]}>
               ➤
             </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg_primary,
  },
  header: {
    paddingHorizontal: getResponsiveSpacing(20),
    paddingTop: getResponsiveSpacing(50),
    paddingBottom: getResponsiveSpacing(10),
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: getResponsiveSpacing(20),
    top: getResponsiveSpacing(50),
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: colors.black,
    textAlign: 'center',
  },
  titleContainer: {
    paddingHorizontal: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(15),
    backgroundColor: '#fff',
  },
  titleText: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: getResponsiveSpacing(20),
  },
  messagesContent: {
    paddingVertical: getResponsiveSpacing(20),
  },
  messageContainer: {
    marginBottom: getResponsiveSpacing(12),
    maxWidth: wp(80),
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderRadius: getResponsiveSpacing(18),
    borderBottomRightRadius: getResponsiveSpacing(4),
    paddingHorizontal: getResponsiveSpacing(16),
    paddingVertical: getResponsiveSpacing(10),
  },
  doctorMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: getResponsiveSpacing(18),
    borderBottomLeftRadius: getResponsiveSpacing(4),
    paddingHorizontal: getResponsiveSpacing(16),
    paddingVertical: getResponsiveSpacing(10),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: getResponsiveFontSize(14),
    lineHeight: getResponsiveFontSize(20),
  },
  userMessageText: {
    color: '#fff',
  },
  doctorMessageText: {
    color: colors.text,
  },
  timestamp: {
    fontSize: getResponsiveFontSize(10),
    color: colors.textSecondary,
    marginTop: getResponsiveSpacing(4),
    textAlign: 'right',
  },
  inputContainer: {
    paddingHorizontal: getResponsiveSpacing(20),
    paddingVertical: getResponsiveSpacing(15),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f5f5f5',
    borderRadius: getResponsiveSpacing(20),
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(8),
    minHeight: getResponsiveSpacing(40),
  },
  textInput: {
    flex: 1,
    fontSize: getResponsiveFontSize(14),
    color: colors.text,
    maxHeight: getResponsiveSpacing(100),
    paddingVertical: getResponsiveSpacing(4),
  },
  sendButton: {
    width: getResponsiveSpacing(32),
    height: getResponsiveSpacing(32),
    borderRadius: getResponsiveSpacing(16),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: getResponsiveSpacing(8),
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendIcon: {
    fontSize: getResponsiveFontSize(16),
    color: '#fff',
    fontWeight: 'bold',
  },
  sendIconDisabled: {
    color: '#999',
  },
});
