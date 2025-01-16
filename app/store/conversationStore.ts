import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'


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
  summaryData: SummaryData | null
  conversationId: string | null
  setConversationSummaryData: (data: SummaryData) => void
  setConversationId: (id: string) => void
  clearConversation: () => void
}

export const useConversationStore = create<ConversationStore>()(
  persist(
    (set) => ({
      summaryData: null,
      conversationId: null,
      setConversationSummaryData: (data: SummaryData) => set({ summaryData: data }),
      setConversationId: (id: string) => set({ conversationId: id }),
      clearConversation: () => set({ summaryData: null, conversationId: null }),
    }),
    {
      name: 'conversation-storage',
    }
  )
)