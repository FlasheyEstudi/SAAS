import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { AI } from '@/lib/api/endpoints';
import { toast } from 'sonner';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  status: 'available' | 'busy' | 'offline';
}

export interface AITools {
  canGenerateReports: boolean;
  canCreateJournalEntries: boolean;
  canAnalyzeData: boolean;
  canExportData: boolean;
}

export function useAI() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);
  const [tools, setTools] = useState<AITools | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [status, setStatus] = useState<'online' | 'offline' | 'busy'>('offline');

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return null;
    
    try {
      setIsTyping(true);
      const userMessage: ChatMessage = { role: 'user', content, timestamp: new Date() };
      setMessages(prev => [...prev, userMessage]);

      const response = await apiClient.post(AI.chat, { 
        message: content,
        conversationHistory: messages 
      });

      const aiMessage: ChatMessage = { 
        role: 'assistant', 
        content: response.data.response || response.data.message,
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, aiMessage]);
      
      return aiMessage;
    } catch (error) {
      console.error('Error sending message to AI:', error);
      toast.error('No se pudo obtener respuesta de la IA');
      const errorMessage: ChatMessage = { 
        role: 'assistant', 
        content: 'Lo siento, ocurrió un error al procesar tu solicitud. Por favor intenta nuevamente.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
      return null;
    } finally {
      setIsTyping(false);
    }
  }, [messages]);

  const fetchModels = useCallback(async () => {
    try {
      const response = await apiClient.get(AI.models);
      setModels(response.data || []);
    } catch (error) {
      console.error('Error fetching AI models:', error);
    }
  }, []);

  const fetchTools = useCallback(async () => {
    try {
      const response = await apiClient.get(AI.tools);
      setTools(response.data);
    } catch (error) {
      console.error('Error fetching AI tools:', error);
    }
  }, []);

  const checkStatus = useCallback(async () => {
    try {
      const response = await apiClient.get(AI.status);
      setStatus(response.data.status || 'offline');
      return response.data;
    } catch (error) {
      setStatus('offline');
      return null;
    }
  }, []);

  const clearConversation = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    models,
    tools,
    isTyping,
    status,
    sendMessage,
    fetchModels,
    fetchTools,
    checkStatus,
    clearConversation,
  };
}
