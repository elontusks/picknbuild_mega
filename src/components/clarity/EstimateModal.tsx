'use client';

import { useState } from 'react';
import { X, Upload } from 'lucide-react';

interface EstimateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: () => void; // Callback to show sign-in modal
}

type EstimateStep = 'vehicle-input' | 'customization' | 'attachments' | 'estimate';

export default function EstimateModal({ isOpen, onClose, onSubmit }: EstimateModalProps) {
  const [step, setStep] = useState<EstimateStep>('vehicle-input');
  const [vinInput, setVinInput] = useState('');
  const [useVin, setUseVin] = useState(true);
  const [vehicleData, setVehicleData] = useState({
    year: '',
    make: '',
    model: '',
    mileage: '',
    trim: '',
  });
  
  const [selectedCustomizations, setSelectedCustomizations] = useState<{ [key: string]: boolean }>({
    seats: false,
    wrap: false,
    paint: false,
    starlights: false,
    repairs: false,
  });
  
  const [attachments, setAttachments] = useState<{ type: string; value: string }[]>([]);
  const [attachmentInput, setAttachmentInput] = useState('');
  const [attachmentType, setAttachmentType] = useState<'link' | 'note' | 'file'>('link');

  const customizationOptions = [
    { key: 'seats', label: 'Seats', description: 'Upgrade or customize seating', price: 800 },
    { key: 'wrap', label: 'Wrap', description: 'Custom vinyl wrap', price: 1200 },
    { key: 'paint', label: 'Paint', description: 'Custom paint job', price: 1500 },
    { key: 'starlights', label: 'Starlights', description: 'Interior ambient lighting', price: 400 },
    { key: 'repairs', label: 'Repairs', description: 'Mechanical or body repairs', price: 500 },
  ];

  const handleVinSubmit = () => {
    if (useVin && vinInput.trim()) {
      // In a real app, would decode VIN here
      setStep('customization');
    } else if (!useVin && vehicleData.year && vehicleData.make && vehicleData.model) {
      setStep('customization');
    }
  };

  const handleAddAttachment = () => {
    if (attachmentInput.trim()) {
      setAttachments([...attachments, { type: attachmentType, value: attachmentInput }]);
      setAttachmentInput('');
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const calculateEstimate = () => {
    const selected = Object.entries(selectedCustomizations)
      .filter(([_, selected]) => selected)
      .map(([key]) => customizationOptions.find(o => o.key === key))
      .filter(Boolean);
    
    const totalCustomization = selected.reduce((sum, item) => sum + (item?.price || 0), 0);
    setStep('estimate');
  };

  if (!isOpen) return null;

  const selected = Object.entries(selectedCustomizations)
    .filter(([_, s]) => s)
    .map(([key]) => customizationOptions.find(o => o.key === key))
    .filter(Boolean);
  
  const estimatedCost = selected.reduce((sum, item) => sum + (item?.price || 0), 0);

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ backgroundColor: 'var(--card)', borderRadius: '12px', maxWidth: '700px', width: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', border: '1px solid var(--border)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, backgroundColor: 'var(--card)' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Get an Estimate</h2>
            <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '4px 0 0 0' }}>
              {step === 'vehicle-input' && 'Enter your vehicle details'}
              {step === 'customization' && 'Select upgrades or repairs'}
              {step === 'attachments' && 'Add references and notes'}
              {step === 'estimate' && 'Your estimate summary'}
            </p>
          </div>
          <button onClick={onClose} style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--foreground)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Step 1: Vehicle Input */}
          {step === 'vehicle-input' && (
            <div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                  <input
                    type="radio"
                    checked={useVin}
                    onChange={() => setUseVin(true)}
                    style={{ cursor: 'pointer' }}
                  />
                  VIN
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                  <input
                    type="radio"
                    checked={!useVin}
                    onChange={() => setUseVin(false)}
                    style={{ cursor: 'pointer' }}
                  />
                  Year/Make/Model
                </label>
              </div>

              {useVin ? (
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>VIN</label>
                  <input
                    type="text"
                    placeholder="17-digit VIN"
                    value={vinInput}
                    onChange={(e) => setVinInput(e.target.value.toUpperCase())}
                    maxLength={17}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', fontFamily: 'monospace' }}
                  />
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Year</label>
                    <input
                      type="number"
                      placeholder="2024"
                      value={vehicleData.year}
                      onChange={(e) => setVehicleData({ ...vehicleData, year: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Make</label>
                    <input
                      type="text"
                      placeholder="Toyota"
                      value={vehicleData.make}
                      onChange={(e) => setVehicleData({ ...vehicleData, make: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Model</label>
                    <input
                      type="text"
                      placeholder="Camry"
                      value={vehicleData.model}
                      onChange={(e) => setVehicleData({ ...vehicleData, model: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Mileage</label>
                    <input
                      type="number"
                      placeholder="50000"
                      value={vehicleData.mileage}
                      onChange={(e) => setVehicleData({ ...vehicleData, mileage: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Customization */}
          {step === 'customization' && (
            <div>
              <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', marginBottom: '16px' }}>What do you want to change?</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {customizationOptions.map(option => (
                  <div
                    key={option.key}
                    onClick={() => setSelectedCustomizations({ ...selectedCustomizations, [option.key]: !selectedCustomizations[option.key] })}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: selectedCustomizations[option.key] ? '2px solid var(--accent)' : '1px solid var(--border)',
                      backgroundColor: selectedCustomizations[option.key] ? 'rgba(0, 204, 153, 0.1)' : 'var(--background)',
                      cursor: 'pointer',
                      transition: 'all 200ms',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCustomizations[option.key]}
                      onChange={() => {}}
                      style={{ marginRight: '8px', cursor: 'pointer' }}
                    />
                    <label style={{ fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginRight: '8px' }}>{option.label}</label>
                    <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '4px' }}>{option.description}</div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', marginTop: '4px' }}>~${option.price}</div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => setStep('attachments')}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--muted)',
                  border: '1px solid var(--border)',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginTop: '16px',
                }}
              >
                Add to Your Build →
              </button>
            </div>
          )}

          {/* Step 3: Attachments */}
          {step === 'attachments' && (
            <div>
              <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', marginBottom: '16px' }}>Add references, images, or notes</p>
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <select
                  value={attachmentType}
                  onChange={(e) => setAttachmentType(e.target.value as 'link' | 'note' | 'file')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    fontSize: '13px',
                  }}
                >
                  <option value="link">Paste Link</option>
                  <option value="note">Add Note</option>
                  <option value="file">Upload File</option>
                </select>
                <input
                  type="text"
                  placeholder={attachmentType === 'link' ? 'https://...' : 'Your note...'}
                  value={attachmentInput}
                  onChange={(e) => setAttachmentInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    fontSize: '13px',
                  }}
                />
                <button
                  onClick={handleAddAttachment}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-foreground)',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Add
                </button>
              </div>

              {attachments.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  {attachments.map((att, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--muted)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                        fontSize: '12px',
                      }}
                    >
                      <span>{att.value.substring(0, 50)}...</span>
                      <button
                        onClick={() => handleRemoveAttachment(idx)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: 'var(--destructive)',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={calculateEstimate}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-foreground)',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Get Estimate
              </button>
            </div>
          )}

          {/* Step 4: Estimate */}
          {step === 'estimate' && (
            <div>
              <div style={{ backgroundColor: 'var(--muted)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '0 0 8px 0' }}>Vehicle</p>
                <p style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>
                  {useVin ? `VIN: ${vinInput}` : `${vehicleData.year} ${vehicleData.make} ${vehicleData.model}`}
                </p>
                {vehicleData.mileage && <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '4px 0 0 0' }}>Mileage: {vehicleData.mileage} miles</p>}
              </div>

              {selected.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted-foreground)', margin: '0 0 8px 0', textTransform: 'uppercase' }}>Selected Upgrades/Repairs</p>
                  {selected.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        fontSize: '13px',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      <span>{item?.label}</span>
                      <span style={{ fontWeight: '600' }}>~${item?.price}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ backgroundColor: 'rgba(0, 204, 153, 0.1)', borderRadius: '8px', padding: '16px', marginBottom: '16px', border: '1px solid rgba(0, 204, 153, 0.2)' }}>
                <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '0 0 4px 0' }}>Estimated Total</p>
                <p style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent)', margin: 0 }}>
                  ${estimatedCost.toLocaleString()}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', margin: '8px 0 0 0' }}>Approximate cost based on selected items</p>
              </div>

              {attachments.length > 0 && (
                <div style={{ backgroundColor: 'var(--muted)', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '600', margin: '0 0 8px 0' }}>Attachments</p>
                  <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: 0 }}>{attachments.length} item(s) added</p>
                </div>
              )}

              <button
                onClick={() => {
                  if (onSubmit) {
                    onSubmit(); // Trigger sign-in modal
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-foreground)',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginBottom: '8px',
                }}
              >
                Submit Estimate & Continue
              </button>

              <button
                onClick={onClose}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--muted)',
                  border: '1px solid var(--border)',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        {(step === 'vehicle-input' || step === 'customization') && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                backgroundColor: 'var(--muted)',
                border: '1px solid var(--border)',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleVinSubmit}
              disabled={step === 'vehicle-input' && !((useVin && vinInput.trim()) || (!useVin && vehicleData.year && vehicleData.make && vehicleData.model))}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                backgroundColor: ((step === 'vehicle-input' && !((useVin && vinInput.trim()) || (!useVin && vehicleData.year && vehicleData.make && vehicleData.model)))) ? 'var(--muted)' : 'var(--accent)',
                color: ((step === 'vehicle-input' && !((useVin && vinInput.trim()) || (!useVin && vehicleData.year && vehicleData.make && vehicleData.model)))) ? 'var(--muted-foreground)' : 'var(--accent-foreground)',
                border: 'none',
                fontSize: '13px',
                fontWeight: '600',
                cursor: ((step === 'vehicle-input' && !((useVin && vinInput.trim()) || (!useVin && vehicleData.year && vehicleData.make && vehicleData.model)))) ? 'not-allowed' : 'pointer',
                opacity: ((step === 'vehicle-input' && !((useVin && vinInput.trim()) || (!useVin && vehicleData.year && vehicleData.make && vehicleData.model)))) ? '0.5' : '1',
              }}
            >
              {step === 'vehicle-input' ? 'Next' : 'Continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
