import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { AI } from '@/lib/api/endpoints';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/stores/useAppStore';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  isError?: boolean;
  metadata?: {
    downloadConfig?: {
      url: string;
      type: string;
      format: string;
    };
    isDataOnly?: boolean;
  };
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
  const companyId = useAppStore((state) => state.companyId);
  const storageKey = companyId ? `ganesha_chat_${companyId}` : null;

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined' && storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  useEffect(() => {
    if (!storageKey) {
      setMessages([]);
      return;
    }
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [storageKey]);

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, storageKey]);

  const [models, setModels] = useState<AIModel[]>([]);
  const [tools, setTools] = useState<AITools | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [status, setStatus] = useState<'online' | 'offline' | 'busy'>('offline');

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

      // Creamos un mensaje vacío para el asistente que iremos llenando
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);

      const reader = await apiClient.postStream(AI.chat, {
        message: content,
        history: historyPayload,
        companyId,
      });

      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = ''; // Acumulador para fragmentos incompletos

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        // El último elemento podría estar incompleto, lo dejamos en el buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            if (json.message?.content) {
              fullContent += json.message.content;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.role === 'assistant') {
                  lastMessage.content = fullContent;
                }
                return newMessages;
              });
            }
          } catch (e) {
            // Si falla, lo re-agregamos al inicio del buffer para el siguiente intento
            buffer = line + buffer;
          }
        }
      }
      
      return aiMessage;
    } catch (error) {
      console.error('Error sending message to AI:', error);
      toast.error('No se pudo obtener respuesta en tiempo real');
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
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

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
