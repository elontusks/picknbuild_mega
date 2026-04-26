'use client';

import { useState } from 'react';

export default function LeadsPage() {
  const [leads] = useState<any[]>([]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--foreground)' }}>Leads</h1>
        <p style={{ fontSize: '16px', color: 'var(--muted-foreground)', margin: 0 }}>Manage buyer leads for your dealership listings ($15 to unlock)</p>
      </div>

      {/* Leads List */}
      {leads.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', borderRadius: '8px', border: '2px dashed var(--border)', backgroundColor: 'var(--muted)' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--foreground)' }}>No leads yet</div>
          <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', margin: 0 }}>Buyers interested in your cars will appear here</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Leads will render here */}
        </div>
      )}

      {/* Lead Pricing Info */}
      <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--foreground)' }}>Unlock Leads</div>
        <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: 0 }}>Pay $15 to see buyer contact information and send messages</p>
      </div>
    </div>
  );
}
