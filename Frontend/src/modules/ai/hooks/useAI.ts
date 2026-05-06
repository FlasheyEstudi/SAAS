import { useState, useCallback, useEffect, useRef } from 'react';
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

  // Ref para tener acceso al historial más reciente sin recrear sendMessage
  const historyRef = useRef<ChatMessage[]>(messages);

  useEffect(() => {
    historyRef.current = messages;
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, storageKey]);

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

  const [models, setModels] = useState<AIModel[]>([]);
  const [tools, setTools] = useState<AITools | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [status, setStatus] = useState<'online' | 'offline' | 'busy'>('offline');

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !companyId || status !== 'online') {
      if (!companyId) toast.error('Selecciona una empresa');
      if (status !== 'online') toast.error('IA Offline');
      return null;
    }

    setIsTyping(true);
    const userMsg: ChatMessage = { role: 'user', content, timestamp: new Date() };
    const assistantMsg: ChatMessage = { role: 'assistant', content: '', timestamp: new Date() };
    
    // Capturar historial para la API (Filtrando solo mensajes con contenido y excluyendo el actual)
    const historyPayload = historyRef.current
      .filter(m => m.content.trim() !== '')
      .map(m => ({ role: m.role, content: m.content }))
      .slice(-6); // Mantener solo las últimas 3 interacciones para máxima velocidad
    
    // Actualizar UI inmediatamente con los nuevos mensajes
    setMessages(prev => [...prev, userMsg, assistantMsg]);

    let streamContent = '';
    try {
      const reader = await apiClient.postStream(AI.chat, {
        message: content,
        history: historyPayload,
        companyId,
      });

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            const delta = json.message?.content || '';
            if (delta) {
              streamContent += delta;
              setMessages(prev => {
                const updated = [...prev];
                for (let i = updated.length - 1; i >= 0; i--) {
                  if (updated[i].role === 'assistant') {
                    updated[i].content = streamContent;
                    break;
                  }
                }
                return updated;
              });
            }
          } catch (e) { }
        }
      }
      
      return { role: 'assistant', content: streamContent };
    } catch (error) {
      // Solo mostrar error si no tenemos nada de contenido (fallo real de inicio)
      if (!streamContent) {
        console.error('[useAI] Stream Error:', error);
        toast.error('Error al iniciar comunicación con la IA');
      }
      return null;
    } finally {
      setIsTyping(false);
    }
  }, [companyId, status]);

  const fetchModels = useCallback(async () => {
    try {
      const response = await apiClient.get<AIModel[]>(AI.models);
      setModels(response || []);
    } catch (error) {

    }
  }, []);

  const fetchTools = useCallback(async () => {
    try {
      const response = await apiClient.get<AITools>(AI.tools);
      setTools(response);
    } catch (error) {

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
