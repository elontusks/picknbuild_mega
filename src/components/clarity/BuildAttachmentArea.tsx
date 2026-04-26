'use client';

import { useState } from 'react';

export interface BuildAttachment {
  id: string;
  type: 'link' | 'image' | 'note';
  content: string;
  timestamp: number;
}

interface BuildAttachmentAreaProps {
  attachments: BuildAttachment[];
  onAdd: (attachment: BuildAttachment) => void;
  onRemove: (id: string) => void;
}

export default function BuildAttachmentArea({ attachments, onAdd, onRemove }: BuildAttachmentAreaProps) {
  const [pasteUrl, setPasteUrl] = useState('');
  const [uploadNote, setUploadNote] = useState('');
  const [activeTab, setActiveTab] = useState<'link' | 'note'>('link');

  const handleAddLink = () => {
    if (!pasteUrl.trim()) return;
    onAdd({
      id: Date.now().toString(),
      type: 'link',
      content: pasteUrl,
      timestamp: Date.now(),
    });
    setPasteUrl('');
  };

  const handleAddNote = () => {
    if (!uploadNote.trim()) return;
    onAdd({
      id: Date.now().toString(),
      type: 'note',
      content: uploadNote,
      timestamp: Date.now(),
    });
    setUploadNote('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onAdd({
          id: Date.now().toString(),
          type: 'image',
          content: event.target?.result as string,
          timestamp: Date.now(),
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      style={{
        padding: '12px',
        backgroundColor: 'rgba(34, 197, 94, 0.05)',
        border: '1px solid rgba(34, 197, 94, 0.2)',
        borderRadius: '8px',
        marginTop: '12px',
      }}
    >
      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', marginBottom: '10px', textTransform: 'uppercase' }}>
        Add to Your Build
      </div>

      {/* Tab Selection */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
        <button
          onClick={() => setActiveTab('link')}
          style={{
            padding: '6px 8px',
            fontSize: '11px',
            fontWeight: '600',
            borderRadius: '4px',
            border: activeTab === 'link' ? '2px solid var(--accent)' : '1px solid var(--border)',
            backgroundColor: activeTab === 'link' ? 'var(--accent)' : 'var(--background)',
            color: activeTab === 'link' ? 'var(--accent-foreground)' : 'var(--foreground)',
            cursor: 'pointer',
          }}
        >
          Links & Parts
        </button>
        <button
          onClick={() => setActiveTab('note')}
          style={{
            padding: '6px 8px',
            fontSize: '11px',
            fontWeight: '600',
            borderRadius: '4px',
            border: activeTab === 'note' ? '2px solid var(--accent)' : '1px solid var(--border)',
            backgroundColor: activeTab === 'note' ? 'var(--accent)' : 'var(--background)',
            color: activeTab === 'note' ? 'var(--accent-foreground)' : 'var(--foreground)',
            cursor: 'pointer',
          }}
        >
          Notes
        </button>
      </div>

      {/* Link Input Tab */}
      {activeTab === 'link' && (
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Paste link to parts, screens, accessories..."
            value={pasteUrl}
            onChange={(e) => setPasteUrl(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: '12px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)',
              marginBottom: '6px',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
          <button
            onClick={handleAddLink}
            style={{
              width: '100%',
              padding: '6px 8px',
              fontSize: '12px',
              fontWeight: '600',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-foreground)',
              cursor: 'pointer',
            }}
          >
            Add Link
          </button>
          <label
            style={{
              display: 'block',
              marginTop: '8px',
              padding: '8px 10px',
              fontSize: '12px',
              textAlign: 'center',
              borderRadius: '4px',
              border: '1px dashed var(--border)',
              backgroundColor: 'var(--background)',
              cursor: 'pointer',
              color: 'var(--muted-foreground)',
            }}
          >
            📸 Upload Image
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      )}

      {/* Note Input Tab */}
      {activeTab === 'note' && (
        <div style={{ marginBottom: '10px' }}>
          <textarea
            placeholder="What do you want added to the car? (e.g., 'I want this wrap', 'Use racing seats', 'Install LED underglow')"
            value={uploadNote}
            onChange={(e) => setUploadNote(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: '12px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)',
              marginBottom: '6px',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              minHeight: '60px',
              resize: 'none',
            }}
          />
          <button
            onClick={handleAddNote}
            style={{
              width: '100%',
              padding: '6px 8px',
              fontSize: '12px',
              fontWeight: '600',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-foreground)',
              cursor: 'pointer',
            }}
          >
            Add Note
          </button>
        </div>
      )}

      {/* Display Attachments */}
      {attachments.length > 0 && (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(34, 197, 94, 0.2)' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', marginBottom: '8px' }}>
            Requests ({attachments.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                style={{
                  padding: '8px 10px',
                  backgroundColor: 'var(--background)',
                  borderRadius: '4px',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '2px' }}>
                    {attachment.type === 'link' && '🔗 Link'}
                    {attachment.type === 'image' && '📸 Image'}
                    {attachment.type === 'note' && '📝 Note'}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--muted-foreground)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {attachment.type === 'link' && attachment.content}
                    {attachment.type === 'note' && attachment.content.substring(0, 50) + (attachment.content.length > 50 ? '...' : '')}
                    {attachment.type === 'image' && 'Image uploaded'}
                  </div>
                </div>
                <button
                  onClick={() => onRemove(attachment.id)}
                  style={{
                    marginLeft: '8px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    borderRadius: '3px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'transparent',
                    color: 'var(--muted-foreground)',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
