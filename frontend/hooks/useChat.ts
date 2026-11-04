/**
 * useChat — manages conversation state for the Q&A chat window.
 * Phase 4 will add streaming; for now it's a simple request/response.
 */
'use client';

import { useState, useCallback } from 'react';
import { chatApi } from '@/lib/api';
import type { ChatResponse, Citation, Conflict } from '@/lib/types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  status_flags?: string[];
  conflicts?: Conflict[];
  isLoading?: boolean;
  error?: string;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (question: string) => {
    // Optimistically add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
    };
    // Add a loading placeholder for the assistant
    const loadingId = `assistant-loading-${Date.now()}`;
    const loadingMsg: ChatMessage = {
      id: loadingId,
      role: 'assistant',
      content: '',
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setIsLoading(true);

    try {
      const res: ChatResponse = await chatApi.ask(question, conversationId);
      if (!conversationId) setConversationId(res.conversation_id);

      const assistantMsg: ChatMessage = {
        id: `assistant-${res.message_id}`,
        role: 'assistant',
        content: res.answer,
        citations: res.citations,
        status_flags: res.status_flags,
        conflicts: res.conflicts,
      };
      setMessages((prev) =>
        prev.map((m) => (m.id === loadingId ? assistantMsg : m))
      );
    } catch (err: unknown) {
      const errorMsg: ChatMessage = {
        id: loadingId,
        role: 'assistant',
        content: '',
        error: err instanceof Error ? err.message : 'Terjadi kesalahan. Silakan coba lagi.',
        isLoading: false,
      };
      setMessages((prev) =>
        prev.map((m) => (m.id === loadingId ? errorMsg : m))
      );
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setConversationId(undefined);
  }, []);

  return { messages, conversationId, isLoading, sendMessage, clearChat };
}

