'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SellerListing } from '@/services/team-02-profiles';

export default function MyListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    price: '',
    description: '',
  });

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/seller/listings');
      if (!response.ok) throw new Error('Failed to load listings');
      const data = await response.json();
      setListings(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listings');
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateListing = async () => {
    if (!formData.make.trim() || !formData.model.trim() || !formData.year.trim() || !formData.price.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const response = await fetch('/api/seller/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to create listing');
      const newListing = await response.json();
      setListings([newListing, ...listings]);
      setFormData({ make: '', model: '', year: '', price: '', description: '' });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create listing');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/seller/listings/${listingId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete listing');
      setListings(listings.filter((l) => l.id !== listingId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete listing');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--foreground)' }}>My Listings</h1>
        <p style={{ fontSize: '16px', color: 'var(--muted-foreground)', margin: 0 }}>Manage all your car listings</p>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '6px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* Create New Listing Button */}
      {!showForm && !isLoading && (
        <button
          onClick={() => setShowForm(true)}
          style={{ alignSelf: 'flex-start', padding: '12px 24px', borderRadius: '8px', backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)', border: 'none', fontWeight: '600', cursor: 'pointer' }}
        >
          + Create New Listing
        </button>
      )}

      {/* Create Listing Form */}
      {showForm && (
        <div style={{ maxWidth: '600px', padding: '24px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: 'var(--foreground)' }}>Create New Listing</h2>

            <input
              type="text"
              placeholder="Make (e.g., Toyota)"
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              disabled={isSaving}
              style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontSize: '14px', fontFamily: 'inherit', opacity: isSaving ? 0.6 : 1 }}
            />

            <input
              type="text"
              placeholder="Model (e.g., Camry)"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              disabled={isSaving}
              style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontSize: '14px', fontFamily: 'inherit', opacity: isSaving ? 0.6 : 1 }}
            />

            <input
              type="text"
              placeholder="Year"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              disabled={isSaving}
              style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontSize: '14px', fontFamily: 'inherit', opacity: isSaving ? 0.6 : 1 }}
            />

            <input
              type="text"
              placeholder="Price"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              disabled={isSaving}
              style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontSize: '14px', fontFamily: 'inherit', opacity: isSaving ? 0.6 : 1 }}
            />

            <textarea
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isSaving}
              style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontSize: '14px', fontFamily: 'inherit', minHeight: '100px', resize: 'vertical', opacity: isSaving ? 0.6 : 1 }}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleCreateListing}
                disabled={isSaving}
                style={{ flex: 1, padding: '12px 24px', borderRadius: '8px', backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)', border: 'none', fontWeight: '600', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.6 : 1 }}
              >
                {isSaving ? 'Creating...' : 'Create Listing'}
              </button>
              <button
                onClick={() => { setShowForm(false); setError(null); }}
                disabled={isSaving}
                style={{ flex: 1, padding: '12px 24px', borderRadius: '8px', backgroundColor: 'var(--muted)', color: 'var(--foreground)', border: '1px solid var(--border)', fontWeight: '600', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.6 : 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Listings Table */}
      {isLoading ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', borderRadius: '8px', border: '2px dashed var(--border)', backgroundColor: 'var(--muted)' }}>
          <div style={{ fontSize: '16px', color: 'var(--muted-foreground)' }}>Loading listings...</div>
        </div>
      ) : listings.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', borderRadius: '8px', border: '2px dashed var(--border)', backgroundColor: 'var(--muted)' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--foreground)' }}>No listings yet</div>
          <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', margin: 0 }}>Create your first listing to start selling</p>
        </div>
      ) : (
        <div style={{ borderRadius: '8px', border: '1px solid var(--border)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: 'var(--foreground)' }}>Car</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: 'var(--foreground)' }}>Price</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: 'var(--foreground)' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: 'var(--foreground)' }}>Views</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px', color: 'var(--foreground)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing.id} style={{ borderBottom: '1px solid var(--border)', color: 'var(--foreground)' }}>
                  <td style={{ padding: '12px' }}>{listing.make} {listing.model} {listing.year}</td>
                  <td style={{ padding: '12px' }}>${listing.price}</td>
                  <td style={{ padding: '12px' }}><span style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>{listing.status}</span></td>
                  <td style={{ padding: '12px' }}>{listing.views}</td>
                  <td style={{ padding: '12px' }}>
                    <button
                      onClick={() => handleDeleteListing(listing.id)}
                      style={{ padding: '4px 12px', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
