'use client';

import { useState } from 'react';

export default function MessagesPage() {
  const [messages] = useState<any[]>([]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--foreground)' }}>Messages</h1>
        <p style={{ fontSize: '16px', color: 'var(--muted-foreground)', margin: 0 }}>See your messages from interested buyers</p>
      </div>

      {/* Messages List */}
      {messages.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', borderRadius: '8px', border: '2px dashed var(--border)', backgroundColor: 'var(--muted)' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--foreground)' }}>No messages yet</div>
          <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', margin: 0 }}>When buyers are interested, they'll message you here</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Messages will render here */}
        </div>
      )}
    </div>
  );
}
