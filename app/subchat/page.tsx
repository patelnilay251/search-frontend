'use client'

import { Suspense } from 'react'
import ContinueChat from '../components/ContinueChat'

export default function ContinueChatPage() {
  return (
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      <Suspense fallback={<div>Loading...</div>}>
        <ContinueChat/>
      </Suspense>
    </div>
  )
}
