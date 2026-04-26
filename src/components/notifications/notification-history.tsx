import type { Notification } from "@/contracts";

const categoryLabel: Record<Notification["category"], string> = {
  message: "Message",
  "price-change": "Price change",
  "dealer-response": "Dealer",
  payment: "Payment",
  "deal-status": "Deal status",
  system: "System",
};

const categoryIcon: Record<Notification["category"], string> = {
  message: "💬",
  "price-change": "💰",
  "dealer-response": "🤝",
  payment: "💳",
  "deal-status": "📊",
  system: "⚙️",
};

export function NotificationHistoryDisplay({
  notifications,
}: {
  notifications: Notification[];
}) {
  if (notifications.length === 0) {
    return (
      <div
        style={{
          padding: '24px',
          backgroundColor: 'var(--muted)',
          borderRadius: '8px',
          textAlign: 'center',
          color: 'var(--muted-foreground)',
        }}
        data-testid="notifications-empty"
      >
        <p style={{ fontSize: '14px', margin: 0 }}>No notifications yet</p>
      </div>
    );
  }
  return (
    <div
      data-testid="notification-history"
      aria-label="Notification history"
      style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
    >
      {notifications.map((n) => {
        const payload = n.payload as { title?: string } | null;
        return (
          <div
            key={n.id}
            data-testid="notification-item"
            data-category={n.category}
            data-channel={n.channel}
            data-read={n.readAt ? "true" : "false"}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px',
              backgroundColor: n.readAt ? 'var(--background)' : 'var(--accent)',
              border: `1px solid var(--border)`,
              borderRadius: '8px',
              opacity: n.readAt ? 0.7 : 0.12,
              transition: 'all 200ms ease-out',
            }}
          >
            <div style={{ fontSize: '18px', marginTop: '2px' }}>
              {categoryIcon[n.category]}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {categoryLabel[n.category]} · {n.channel}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--foreground)', wordBreak: 'break-word' }}>
                {payload?.title ?? JSON.stringify(n.payload)}
              </div>
            </div>
            <time
              style={{
                fontSize: '11px',
                color: 'var(--muted-foreground)',
                whiteSpace: 'nowrap',
                marginTop: '2px',
              }}
              dateTime={n.createdAt}
            >
              {new Date(n.createdAt).toLocaleString()}
            </time>
          </div>
        );
      })}
    </div>
  );
}
