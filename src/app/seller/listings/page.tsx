'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SellerListing } from '@/services/team-02-profiles';

type FormErrors = {
  year?: string;
  price?: string;
  description?: string;
};

const validateForm = (data: {
  make: string;
  model: string;
  year: string;
  price: string;
  description: string;
}): FormErrors => {
  const errors: FormErrors = {};

  if (data.year.trim() && !/^\d{4}$/.test(data.year.trim())) {
    errors.year = 'Year must be a 4-digit number';
  }

  if (data.price.trim() && !/^\d+(\.\d{1,2})?$/.test(data.price.trim())) {
    errors.price = 'Price must be a valid number';
  }

  if (data.description.length > 500) {
    errors.description = 'Description must be 500 characters or less';
  }

  return errors;
};

export default function MyListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
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

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'year' || field === 'price' || field === 'description') {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field as keyof FormErrors];
        return next;
      });
    }
  };

  const handleCreateListing = async () => {
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
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
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create listing');
      }
      const newListing = await response.json();
      setListings([newListing, ...listings]);
      setFormData({ make: '', model: '', year: '', price: '', description: '' });
      setFormErrors({});
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

            {/* Make Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <input
                type="text"
                placeholder="Make (e.g., Toyota)"
                value={formData.make}
                onChange={(e) => handleFieldChange('make', e.target.value)}
                disabled={isSaving}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  opacity: isSaving ? 0.6 : 1,
                }}
              />
            </div>

            {/* Model Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <input
                type="text"
                placeholder="Model (e.g., Camry)"
                value={formData.model}
                onChange={(e) => handleFieldChange('model', e.target.value)}
                disabled={isSaving}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  opacity: isSaving ? 0.6 : 1,
                }}
              />
            </div>

            {/* Year Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <input
                type="text"
                placeholder="Year (e.g., 2024)"
                value={formData.year}
                onChange={(e) => handleFieldChange('year', e.target.value)}
                disabled={isSaving}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: formErrors.year ? '1px solid #dc2626' : '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  opacity: isSaving ? 0.6 : 1,
                }}
              />
              {formErrors.year && (
                <span style={{ fontSize: '12px', color: '#dc2626' }}>{formErrors.year}</span>
              )}
            </div>

            {/* Price Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <input
                type="text"
                placeholder="Price (e.g., 25000)"
                value={formData.price}
                onChange={(e) => handleFieldChange('price', e.target.value)}
                disabled={isSaving}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: formErrors.price ? '1px solid #dc2626' : '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  opacity: isSaving ? 0.6 : 1,
                }}
              />
              {formErrors.price && (
                <span style={{ fontSize: '12px', color: '#dc2626' }}>{formErrors.price}</span>
              )}
            </div>

            {/* Description Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <textarea
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                disabled={isSaving}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  minHeight: '100px',
                  resize: 'vertical',
                  opacity: isSaving ? 0.6 : 1,
                }}
              />
              <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                {formData.description.length}/500 characters
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleCreateListing}
                  disabled={isSaving || Object.keys(formErrors).length > 0}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    borderRadius: '8px',
                    backgroundColor: Object.keys(formErrors).length > 0 ? 'var(--muted)' : 'var(--accent)',
                    color: Object.keys(formErrors).length > 0 ? 'var(--muted-foreground)' : 'var(--accent-foreground)',
                    border: 'none',
                    fontWeight: '600',
                    cursor: isSaving || Object.keys(formErrors).length > 0 ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.6 : 1,
                  }}
                >
                  {isSaving ? 'Creating...' : 'Create Listing'}
                </button>
                <button
                  onClick={() => { setShowForm(false); setError(null); setFormErrors({}); }}
                  disabled={isSaving}
                  style={{ flex: 1, padding: '12px 24px', borderRadius: '8px', backgroundColor: 'var(--muted)', color: 'var(--foreground)', border: '1px solid var(--border)', fontWeight: '600', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.6 : 1 }}
                >
                  Cancel
                </button>
              </div>

              {Object.keys(formErrors).length > 0 && (
                <div style={{ padding: '12px', backgroundColor: '#fef2f2', borderRadius: '6px', fontSize: '13px', color: '#dc2626', border: '1px solid #fecaca' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {formErrors.year && <div>• {formErrors.year}</div>}
                    {formErrors.price && <div>• {formErrors.price}</div>}
                    {formErrors.description && <div>• {formErrors.description}</div>}
                  </div>
                </div>
              )}
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
