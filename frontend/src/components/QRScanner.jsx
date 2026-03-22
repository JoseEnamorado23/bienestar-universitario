import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { HiOutlineCamera, HiOutlineX } from 'react-icons/hi';

/**
 * QRScanner — abre la cámara para escanear un QR y registrar asistencia.
 * Props:
 *   onSuccess {function(attendance)} — callback cuando el escaneo es exitoso
 *   onClose   {function}            — cerrar el escáner
 */
export default function QRScanner({ onSuccess, onClose }) {
  const scannerRef = useRef(null);
  const hasScanned = useRef(false);
  const [scanning, setScanning] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      },
      /* verbose= */ false
    );

    scanner.render(
      async (decodedText) => {
        if (hasScanned.current || submitting) return;
        hasScanned.current = true;
        setScanning(false);
        setSubmitting(true);

        // El token es el contenido del QR
        const token = decodedText.trim();

        // Intentar obtener ubicación si el navegador lo soporta
        let latitude = null;
        let longitude = null;
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              maximumAge: 10000,
            });
          });
          latitude = pos.coords.latitude;
          longitude = pos.coords.longitude;
        } catch {
          // El usuario negó o no hay GPS — el backend decide si es requerido
        }

        try {
          const { data } = await api.post('/activities/attend', {
            token,
            latitude,
            longitude,
          });
          toast.success(`✅ Asistencia registrada! +${data.hours_earned}h sociales`);
          if (onSuccess) onSuccess(data);
          scanner.clear().catch(() => {});
          if (onClose) onClose();
        } catch (err) {
          const msg = err.response?.data?.detail || 'Error al registrar asistencia.';
          toast.error(msg);
          // Permitir reintentar
          hasScanned.current = false;
          setScanning(true);
        } finally {
          setSubmitting(false);
        }
      },
      (error) => {
        // Ignorar errores de frames sin QR
      }
    );

    scannerRef.current = scanner;

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      {/* Cabecera */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <HiOutlineCamera size={20} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontWeight: 600, fontSize: '1rem' }}>Escanear QR</span>
        </div>
        <button
          onClick={() => {
            scannerRef.current?.clear().catch(() => {});
            if (onClose) onClose();
          }}
          style={{
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <HiOutlineX size={16} />
        </button>
      </div>

      {/* Área del escáner */}
      <div id="qr-reader" style={{ width: '100%' }} />

      {submitting && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255,255,255,0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          gap: 12,
        }}>
          <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Registrando asistencia…</span>
        </div>
      )}

      <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 12 }}>
        Apunta la cámara al código QR de la actividad.
      </p>
    </div>
  );
}
