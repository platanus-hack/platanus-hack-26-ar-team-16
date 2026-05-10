import { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MessageList, MessageInput, CoachStylePicker } from '@/components/chat';
import { useChatStore, useAuthStore } from '@/store';
import { sendUserMessage, seedWelcomeMessage } from '@/modules/chat';
import { useSpeechRecognition } from '@/hooks';
import { useTheme } from '@/theme';

export default function CoachScreen() {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.streaming.isStreaming);
  const activeTool = useChatStore((s) => s.activeTool);
  const isAuthLoading = useAuthStore((s) => s.isLoading);
  const theme = useTheme();
  const { isListening, transcript, startListening, stopListening } = useSpeechRecognition();

  useEffect(() => {
    if (!isAuthLoading) {
      seedWelcomeMessage();
    }
  }, [isAuthLoading]);

  const handleSend = (text: string) => {
    void sendUserMessage(text);
  };

  const handleStopRecording = async () => {
    const text = await stopListening();
    if (text.trim()) {
      void sendUserMessage(text.trim());
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }} edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.primary }}>
            <Ionicons name="fitness" size={16} color="#FFFFFF" />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>Gohan</Text>
        </View>
        <CoachStylePicker />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View className="flex-1">
          <MessageList
            messages={messages}
            isStreaming={isStreaming}
            activeTool={activeTool}
          />
        </View>
        <MessageInput
          onSend={handleSend}
          onStartRecording={startListening}
          onStopRecording={handleStopRecording}
          isRecording={isListening}
          liveTranscript={transcript}
          disabled={isStreaming}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
