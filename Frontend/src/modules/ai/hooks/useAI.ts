import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { AI } from '@/lib/api/endpoints';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/stores/useAppStore';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  isError?: boolean;
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
  const companyId = useAppStore((state) => state.companyId);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return null;
    if (!companyId) {
      toast.error('Selecciona una empresa antes de usar la IA');
      return null;
    }
    if (status !== 'online') {
      toast.error('La IA no está disponible. Verifica la conexión con Ollama.');
      return null;
    }

    try {
      setIsTyping(true);
      const userMessage: ChatMessage = { role: 'user', content, timestamp: new Date() };
      setMessages(prev => [...prev, userMessage]);

      const historyPayload = messages.map(({ role, content }) => ({ role, content }));

      const response = await apiClient.post(AI.chat, {
        message: content,
        history: historyPayload,
        companyId,
      });

      const toolCalls = response?.toolCalls;
      let aiResponse = response?.response || '';

      if (!aiResponse && toolCalls?.length) {
        aiResponse = `El asistente solicitó ejecutar la función ${toolCalls[0].function.name}. Espera mientras se procesan los datos.`;
      }

      if (!aiResponse && response.data?.message) {
        aiResponse = typeof response.data.message === 'string'
          ? response.data.message
          : JSON.stringify(response.data.message, null, 2);
      }

      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: aiResponse || 'El asistente no obtuvo una respuesta válida.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      
      return aiMessage;
    } catch (error) {
      console.error('Error sending message to AI:', error instanceof Error ? error : JSON.stringify(error, null, 2));
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
  }, [messages, companyId, status]);

  const fetchModels = useCallback(async () => {
    try {
      const response = await apiClient.get<AIModel[]>(AI.models);
      setModels(response || []);
    } catch (error) {
      console.error('Error fetching AI models:', error);
    }
  }, []);

  const fetchTools = useCallback(async () => {
    try {
      const response = await apiClient.get<AITools>(AI.tools);
      setTools(response);
    } catch (error) {
      console.error('Error fetching AI tools:', error);
    }
  }, []);

  const checkStatus = useCallback(async () => {
    try {
      const response = await apiClient.get<any>(AI.status);
      const statusValue = response?.status || (response?.ollamaAvailable ? 'online' : 'offline');
      setStatus(statusValue);
      return response;
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
