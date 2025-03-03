import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { Message, createConversation, addMessage, getMessages } from '../lib/supabase'

interface SummaryData {
  overview: string;
  keyFindings: {
    title: string;
    description: string;
  }[];
  conclusion: string;
  metadata: {
    sourcesUsed: number;
    timeframe: string;
    queryContext: string;
  };
}

interface ConversationStore {
  // Local state
  summaryData: SummaryData | null
  conversationId: string | null
  messages: Message[]
  isLoading: boolean
  error: string | null

  // Actions
  setConversationSummaryData: (data: SummaryData) => void
  setConversationId: (id: string) => void
  clearConversation: () => void
  createNewConversation: (query: string, summary: string, userId?: string) => Promise<string>
  fetchMessages: (conversationId: string) => Promise<void>
  addMessageToConversation: (
    content: string,
    type: 'user' | 'assistant',
    conversationId: string,
    citations?: Citation[],
    visualizationData?: VisualizationData,
    visualizationContext?: VisualizationContext
  ) => Promise<void>
}

interface Citation {
  number: number;
  source: string;
  url: string;
}

interface VisualizationData {
  type: 'geographic' | 'financial' | 'weather';
  data: unknown;
  status: 'success' | 'error';
  error?: string;
}

interface VisualizationContext {
  type: 'geographic' | 'financial' | 'weather';
  description: string;
}

export const useConversationStore = create<ConversationStore>()(
  persist(
    (set) => ({
      summaryData: null,
      conversationId: null,
      messages: [],
      isLoading: false,
      error: null,

      setConversationSummaryData: (data: SummaryData) => set({ summaryData: data }),
      setConversationId: (id: string) => set({ conversationId: id }),
      clearConversation: () => set({ summaryData: null, conversationId: null, messages: [] }),

      createNewConversation: async (query: string, summary: string, userId = 'anonymous') => {
        set({ isLoading: true, error: null });

        try {
          const id = uuidv4();

          // Create in database
          await createConversation({
            id,
            user_id: userId,
            query,
            summary
          });

          set({ conversationId: id });
          return id;
        } catch (error) {
          console.error('Error creating conversation:', error);
          set({ error: 'Failed to create conversation' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      fetchMessages: async (conversationId: string) => {
        set({ isLoading: true, error: null });

        try {
          const messages = await getMessages(conversationId);
          set({ messages, conversationId });
        } catch (error) {
          console.error('Error fetching messages:', error);
          set({ error: 'Failed to fetch messages' });
        } finally {
          set({ isLoading: false });
        }
      },

      addMessageToConversation: async (
        content: string,
        type: 'user' | 'assistant',
        conversationId: string,
        citations = [],
        visualizationData?: VisualizationData,
        visualizationContext?: VisualizationContext
      ) => {
        if (!conversationId) {
          set({ error: 'No active conversation' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const newMessage = {
            id: uuidv4(),
            conversation_id: conversationId,
            content,
            type,
            citations,
            visualization_data: visualizationData,
            visualization_context: visualizationContext
          };

          // Add to database
          await addMessage(newMessage);

          // Update local state
          set(state => ({
            messages: [...state.messages, {
              ...newMessage,
              timestamp: new Date().toISOString()
            }]
          }));
        } catch (error) {
          console.error('Error adding message:', error);
          set({ error: 'Failed to save message' });
        } finally {
          set({ isLoading: false });
        }
      }
    }),
    {
      name: 'conversation-storage',
    }
  )
)