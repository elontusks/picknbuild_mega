'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralStats?: {
    invitesSent: number;
    completedReferrals: number;
    earnedCredits: number;
  };
}

export default function ReferralModal({ isOpen, onClose, referralStats }: ReferralModalProps) {
  const [copied, setCopied] = useState(false);
  
  // Generate a simple referral link (in a real app, this would be unique per user)
  const referralLink = `https://picknbuild.app/?ref=${Math.random().toString(36).substr(2, 9)}`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 40,
        }}
      />
      
      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'var(--card)',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        zIndex: 50,
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '32px',
          paddingRight: '32px',
          paddingTop: '32px',
          paddingBottom: '24px',
          borderBottom: '1px solid var(--border)'
        }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--foreground)', margin: 0, marginBottom: '4px' }}>
              Invite a Friend
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', margin: 0 }}>
              Earn $500 toward your PicknBuild vehicle when your friend completes a PicknBuild deal.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              color: 'var(--muted-foreground)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ paddingLeft: '32px', paddingRight: '32px', paddingTop: '24px', paddingBottom: '32px' }}>
          {/* Referral Link Section */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
              Your Referral Link
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                readOnly
                value={referralLink}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  fontSize: '13px',
                  fontFamily: 'monospace'
                }}
              />
              <button
                onClick={handleCopyLink}
                style={{
                  paddingLeft: '16px',
                  paddingRight: '16px',
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  borderRadius: '6px',
                  backgroundColor: copied ? 'var(--accent)' : 'var(--muted)',
                  color: copied ? 'var(--accent-foreground)' : 'var(--foreground)',
                  border: 'none',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 200ms',
                  whiteSpace: 'nowrap'
                }}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* How It Works */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--foreground)', margin: '0 0 16px 0' }}>
              How it works
            </h3>
            <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--muted-foreground)', lineHeight: '1.8' }}>
              <li style={{ marginBottom: '12px' }}>
                <strong style={{ color: 'var(--foreground)' }}>Invite a friend</strong> - Share your unique link
              </li>
              <li style={{ marginBottom: '12px' }}>
                <strong style={{ color: 'var(--foreground)' }}>They sign up</strong> - Your friend creates an account through your link
              </li>
              <li style={{ marginBottom: '12px' }}>
                <strong style={{ color: 'var(--foreground)' }}>They complete a PicknBuild deal</strong> - Your friend purchases a vehicle through PicknBuild
              </li>
              <li>
                <strong style={{ color: 'var(--foreground)' }}>You earn $500</strong> - Credited toward your PicknBuild vehicle
              </li>
            </ol>
          </div>

          {/* Important Note */}
          <div style={{
            padding: '12px 16px',
            borderRadius: '6px',
            backgroundColor: 'var(--muted)',
            borderLeft: '4px solid var(--accent)',
            marginBottom: '28px'
          }}>
            <p style={{ fontSize: '12px', color: 'var(--foreground)', margin: 0, fontWeight: '500' }}>
              <strong>Important:</strong> You only earn the $500 credit after your friend successfully completes a PicknBuild vehicle deal. The credit is applied to your PicknBuild balance.
            </p>
          </div>

          {/* Referral Stats */}
          {referralStats && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              paddingTop: '24px',
              borderTop: '1px solid var(--border)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent)', marginBottom: '4px' }}>
                  {referralStats.invitesSent}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontWeight: '500' }}>
                  Invites Sent
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent)', marginBottom: '4px' }}>
                  {referralStats.completedReferrals}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontWeight: '500' }}>
                  Completed Referrals
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent)', marginBottom: '4px' }}>
                  ${referralStats.earnedCredits}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontWeight: '500' }}>
                  Earned Credits
                </div>
              </div>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '6px',
              backgroundColor: 'var(--muted)',
              color: 'var(--foreground)',
              border: 'none',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              marginTop: '24px',
              transition: 'all 200ms'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
