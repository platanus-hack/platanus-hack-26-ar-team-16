import { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MessageList, MessageInput, CoachStylePicker } from '@/components/chat';
import { useChatStore } from '@/store';
import { sendUserMessage, seedWelcomeMessage } from '@/modules/chat';
import { useSpeechRecognition } from '@/hooks';
import { useTheme } from '@/theme';

export default function CoachScreen() {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.streaming.isStreaming);
  const activeTool = useChatStore((s) => s.activeTool);
  const theme = useTheme();
  const { isListening, transcript, startListening, stopListening } = useSpeechRecognition();

  useEffect(() => {
    seedWelcomeMessage();
  }, []);

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
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100">
        <View className="flex-row items-center gap-2">
          <View
            className="w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: theme.primary }}
          >
            <Ionicons name="fitness" size={16} color="#FFFFFF" />
          </View>
          <Text className="text-lg font-bold text-slate-900">Gohan</Text>
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
