import React from 'react';
import { Image as ImageIcon, Upload } from 'lucide-react';

interface ImagePickerButtonProps {
  value: string;
  onUpdate: (url: string) => void;
  label?: string;
  buttonLabel?: string;
  accentColor?: string;
  previewHeight?: number;
  placement?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showPreviewInline?: boolean;
  compact?: boolean;
  icon?: React.ReactNode;
}

export const ImagePickerButton: React.FC<ImagePickerButtonProps> = ({
  value, onUpdate, label, buttonLabel, accentColor, previewHeight = 60,
  placement = 'bottom-right', showPreviewInline = false, compact = false, icon,
}) => {
  const [open, setOpen] = React.useState(false);
  const [urlInput, setUrlInput] = React.useState('');
  const fileRef = React.useRef<HTMLInputElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const accent = accentColor || 'rgba(212,168,83,1)';
  const accentDim = accentColor ? `${accentColor}55` : 'rgba(212,168,83,0.25)';
  const accentFaint = accentColor ? `${accentColor}22` : 'rgba(212,168,83,0.12)';

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const placementStyle: React.CSSProperties = (() => {
    switch (placement) {
      case 'bottom-left': return { position: 'absolute', top: 34, left: 0 };
      case 'top-right':   return { position: 'absolute', bottom: 34, right: 0 };
      case 'top-left':    return { position: 'absolute', bottom: 34, left: 0 };
      default:            return { position: 'absolute', top: 34, right: 0 };
    }
  })();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('⚠️ Arquivo muito grande!\nUse imagens menores que 5MB.'); return; }
    const reader = new FileReader();
    reader.onloadend = () => { onUpdate(reader.result as string); setOpen(false); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', gap: 6 }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        title={label || 'Imagem'}
        style={{
          background: open ? `${accentFaint}` : 'rgba(22,27,38,0.9)',
          border: `1px solid ${value ? accentDim : 'rgba(212,168,83,0.2)'}`,
          borderRadius: 8, padding: compact ? '5px 7px' : '5px 10px',
          color: value ? accent : '#a07828', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: compact ? 8 : 9, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.1em',
          transition: 'all 0.2s',
        }}
        className="hover:!bg-amber-900/40 hover:!text-amber-400"
      >
        {icon || <ImageIcon style={{ width: 10, height: 10 }} />}
        {!compact && (buttonLabel || label || 'Imagem')} {value && !compact ? '●' : ''}
      </button>

      {showPreviewInline && value && (
        <div style={{ position: 'relative', width: '100%' }}>
          <img src={value} alt="preview" style={{ width: '100%', height: previewHeight, objectFit: 'cover', borderRadius: 8, border: `1px solid ${accentDim}` }} />
          <button onClick={() => onUpdate('')} style={{ position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%', background: '#dc2626', border: '2px solid #0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', fontSize: 9, fontWeight: 900 }}>×</button>
        </div>
      )}

      {open && (
        <div ref={panelRef} style={{ ...placementStyle, zIndex: 9999, background: 'rgba(16,20,30,0.97)', border: `1px solid ${accentDim}`, borderRadius: 12, padding: '12px', width: 252, boxShadow: '0 12px 48px rgba(0,0,0,0.95)', backdropFilter: 'blur(12px)' }}>
          <p style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.22em', color: '#7a5c14', marginBottom: 8 }}>{label || 'Imagem'}</p>
          {value && (
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <img src={value} alt="preview" style={{ width: '100%', height: previewHeight, objectFit: 'cover', borderRadius: 7, border: `1px solid ${accentDim}` }} />
              <button onClick={() => { onUpdate(''); }} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#dc2626', border: '2px solid #0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', fontSize: 10, fontWeight: 700 }}>×</button>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
              type="text" placeholder="URL da imagem..." value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && urlInput.trim()) { onUpdate(urlInput.trim()); setOpen(false); setUrlInput(''); } }}
              style={{ border: `1px solid ${accentDim}`, borderRadius: 7, padding: '6px 10px', fontSize: 10, outline: 'none', width: '100%' }}
            />
            {urlInput && (
              <button onClick={() => { onUpdate(urlInput.trim()); setOpen(false); setUrlInput(''); }}
                style={{ padding: '5px', borderRadius: 7, background: accentFaint, border: `1px solid ${accentDim}`, color: accent, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}>
                ✓ Aplicar URL
              </button>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', background: accentFaint, border: `1px solid ${accentDim}`, borderRadius: 7, color: accent, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}
              className="hover:!bg-amber-900/40 hover:!text-amber-300"
            >
              <Upload style={{ width: 10, height: 10 }} /> Upload de Arquivo
            </button>
            <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleFile} />
          </div>
        </div>
      )}
    </div>
  );
};
