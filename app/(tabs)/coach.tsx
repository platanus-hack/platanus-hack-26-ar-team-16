import { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { MessageList, MessageInput } from '@/components/chat';
import { useChatStore } from '@/store';
import { sendUserMessage, seedWelcomeMessage } from '@/modules/chat';
import { useSpeechRecognition } from '@/hooks';

export default function CoachScreen() {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.streaming.isStreaming);
  const activeTool = useChatStore((s) => s.activeTool);
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white"
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
  );
}
