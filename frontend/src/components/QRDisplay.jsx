import { QRCodeCanvas } from 'qrcode.react';
import { HiOutlineDownload } from 'react-icons/hi';

export default function QRDisplay({ token, size = 200, title = 'codigo-qr', showDownload = true }) {
  if (!token) return null;

  const downloadQR = () => {
    const canvas = document.getElementById('qr-canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
    }}>
      <div style={{
        background: '#ffffff',
        padding: 20,
        borderRadius: 16,
        boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
        display: 'inline-block',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <QRCodeCanvas
          id="qr-canvas"
          value={token}
          size={size}
          level="H"
          includeMargin={false}
          imageSettings={{
            src: "/logo_u.png", // Asumiendo que existe un logo pequeño
            x: undefined, y: undefined, height: 40, width: 40, excavate: true,
          }}
        />
      </div>
      
      {showDownload && (
        <button 
          onClick={downloadQR}
          className="btn btn-ghost"
          style={{ width: 'auto', padding: '8px 16px', fontSize: '0.85rem', gap: 8 }}
        >
          <HiOutlineDownload size={18} /> Descargar Imagen
        </button>
      )}
    </div>
  );
}
