'use client'

import { useSearchParams } from 'next/navigation'
import ConversationContinuation from '../components/ConversationContinuation'

export default function ConversationPage() {
  const searchParams = useSearchParams()
  const summary = searchParams.get('summary') || 'No summary provided'

  return <ConversationContinuation summary={summary}/>
}

