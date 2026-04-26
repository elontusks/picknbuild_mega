'use client';

export default function DealerFlow() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Dealer Listing</h3>
        <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: 0 }}>
          Professional dealer account with lead management
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px', backgroundColor: 'var(--muted)', borderRadius: '8px' }}>
        <div>
          <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted-foreground)', margin: '0 0 4px 0' }}>Plan</p>
          <p style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>10 Free Listings</p>
          <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '4px 0 0 0' }}>$100/month after</p>
        </div>
        <div>
          <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted-foreground)', margin: '0 0 4px 0' }}>Features</p>
          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px' }}>
            <li>Lead management</li>
            <li>Unlock leads ($15)</li>
          </ul>
        </div>
      </div>

      <div>
        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
          Dealership Name
        </label>
        <input
          type="text"
          placeholder="Your dealership name"
          style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px' }}
        />
      </div>

      <button
        style={{
          padding: '12px 16px',
          borderRadius: '6px',
          backgroundColor: 'var(--accent)',
          color: 'var(--accent-foreground)',
          border: 'none',
          fontWeight: '600',
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'opacity 200ms',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        Claim Your Dealership
      </button>
    </div>
  );
}
