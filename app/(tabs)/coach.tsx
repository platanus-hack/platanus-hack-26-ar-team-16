import { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { MessageList, MessageInput } from '@/components/chat';
import { useChatStore } from '@/store';
import { sendUserMessage, seedWelcomeMessage, pushAudioBubble } from '@/modules/chat';
import { useAudioRecorder } from '@/hooks';

export default function CoachScreen() {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.streaming.isStreaming);
  const activeTool = useChatStore((s) => s.activeTool);
  const { isRecording, startRecording, stopRecording } = useAudioRecorder();

  useEffect(() => {
    seedWelcomeMessage();
  }, []);

  const handleSend = (text: string) => {
    void sendUserMessage(text);
  };

  const handleStopRecording = async () => {
    const uri = await stopRecording();
    if (uri) pushAudioBubble(uri);
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
        onStartRecording={startRecording}
        onStopRecording={handleStopRecording}
        isRecording={isRecording}
        disabled={isStreaming}
      />
    </KeyboardAvoidingView>
  );
}
