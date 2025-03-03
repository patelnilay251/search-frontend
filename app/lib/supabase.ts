import { createClient } from '@supabase/supabase-js';

// Define types for conversations and messages
export interface Conversation {
    id: string;
    user_id: string;
    query: string;
    summary: string;
    created_at: string;
    updated_at: string;
}

export interface Message {
    id: string;
    conversation_id: string;
    content: string;
    type: 'user' | 'assistant';
    citations?: Citation[];
    visualization_data?: VisualizationData;
    visualization_context?: VisualizationContext;
    timestamp: string;
}

export interface Citation {
    number: number;
    source: string;
    url: string;
}

export interface VisualizationData {
    type: 'geographic' | 'financial' | 'weather';
    data: unknown;
    status: 'success' | 'error';
    error?: string;
}

export interface VisualizationContext {
    type: 'geographic' | 'financial' | 'weather';
    description: string;
}

export interface SearchResult {
    id: string;
    conversation_id: string;
    title: string;
    text: string;
    url: string;
    published_date: string;
    source: string;
    score: number;
}

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check for missing environment variables
if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set in environment variables. Please check your .env.local file.');
}

if (!supabaseKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in environment variables. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions for database operations
export async function getConversation(id: string) {
    const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as Conversation;
}

export async function createConversation(conversation: Omit<Conversation, 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
        .from('conversations')
        .insert(conversation)
        .select()
        .single();

    if (error) throw error;
    return data as Conversation;
}

export async function getMessages(conversationId: string) {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

    if (error) throw error;
    return data as Message[];
}

export async function addMessage(message: Omit<Message, 'timestamp'>) {
    const { data, error } = await supabase
        .from('messages')
        .insert({
            ...message,
            timestamp: new Date().toISOString()
        })
        .select()
        .single();

    if (error) throw error;
    return data as Message;
}

export async function saveSearchResults(results: Omit<SearchResult, 'id'>[]) {
    const { data, error } = await supabase
        .from('search_results')
        .insert(results)
        .select();

    if (error) throw error;
    return data as SearchResult[];
}

export async function getSearchResults(conversationId: string) {
    const { data, error } = await supabase
        .from('search_results')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('score', { ascending: false });

    if (error) throw error;
    return data as SearchResult[];
}

export async function getUserConversations(userId: string) {
    const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

    if (error) throw error;
    return data as Conversation[];
} 