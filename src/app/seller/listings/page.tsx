'use client';

import { useState } from 'react';

export default function MyListingsPage() {
  const [listings, setListings] = useState<Array<{
    id: number;
    make: string;
    model: string;
    year: string;
    price: string;
    description: string;
    status: string;
    views: number;
  }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    price: '',
    description: '',
  });

  const handleCreateListing = () => {
    setListings([...listings, { id: Date.now(), ...formData, status: 'active', views: 0 }]);
    setFormData({ make: '', model: '', year: '', price: '', description: '' });
    setShowForm(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--foreground)' }}>My Listings</h1>
        <p style={{ fontSize: '16px', color: 'var(--muted-foreground)', margin: 0 }}>Manage all your car listings</p>
      </div>

      {/* Create New Listing Button */}
      {!showForm && (
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
              style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontSize: '14px', fontFamily: 'inherit' }}
            />

            <input
              type="text"
              placeholder="Model (e.g., Camry)"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontSize: '14px', fontFamily: 'inherit' }}
            />

            <input
              type="text"
              placeholder="Year"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontSize: '14px', fontFamily: 'inherit' }}
            />

            <input
              type="text"
              placeholder="Price"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontSize: '14px', fontFamily: 'inherit' }}
            />

            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontSize: '14px', fontFamily: 'inherit', minHeight: '100px', resize: 'vertical' }}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleCreateListing}
                style={{ flex: 1, padding: '12px 24px', borderRadius: '8px', backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)', border: 'none', fontWeight: '600', cursor: 'pointer' }}
              >
                Create Listing
              </button>
              <button
                onClick={() => setShowForm(false)}
                style={{ flex: 1, padding: '12px 24px', borderRadius: '8px', backgroundColor: 'var(--muted)', color: 'var(--foreground)', border: '1px solid var(--border)', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Listings Table */}
      {listings.length === 0 ? (
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
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing.id} style={{ borderBottom: '1px solid var(--border)', color: 'var(--foreground)' }}>
                  <td style={{ padding: '12px' }}>{listing.make} {listing.model} {listing.year}</td>
                  <td style={{ padding: '12px' }}>${listing.price}</td>
                  <td style={{ padding: '12px' }}><span style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>{listing.status}</span></td>
                  <td style={{ padding: '12px' }}>{listing.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
