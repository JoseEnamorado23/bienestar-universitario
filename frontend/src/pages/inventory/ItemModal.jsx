import { useState, useRef, useEffect } from 'react';
import { HiOutlineUpload, HiX, HiOutlinePhotograph } from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function ItemModal({ isOpen, onClose, selectedItem, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    total_quantity: 0,
    image_url: ''
  });
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (selectedItem) {
        setFormData({
          name: selectedItem.name,
          description: selectedItem.description || '',
          total_quantity: selectedItem.total_quantity,
          image_url: selectedItem.image_url || ''
        });
        setPreviewUrl(selectedItem.image_url ? `http://${window.location.hostname}:8000${selectedItem.image_url}` : ''); // Fallback for local testing
      } else {
        setFormData({
          name: '',
          description: '',
          total_quantity: 1,
          image_url: ''
        });
        setPreviewUrl('');
      }
      setSelectedFile(null);
    }
  }, [isOpen, selectedItem]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Formato no válido. Usa JPG, PNG o WEBP.');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
       if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Formato no válido. Usa JPG, PNG o WEBP.');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalImageUrl = formData.image_url;

      // Upload image first if there's a new one
      if (selectedFile) {
        const uploadData = new FormData();
        uploadData.append('file', selectedFile);
        
        const uploadRes = await api.post('/upload/image', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalImageUrl = uploadRes.data.url;
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        total_quantity: Number(formData.total_quantity),
        image_url: finalImageUrl,
        status: 'ACTIVE'
      };

      if (selectedItem) {
        await api.put(`/inventory/${selectedItem.id}`, payload);
        toast.success('Implemento actualizado');
      } else {
        await api.post('/inventory/', payload);
        toast.success('Implemento creado');
      }
      
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al guardar implemento');
    } finally {
      setLoading(false);
    }
  };

  // Inline Modal Styles replicating the local light theme style
  const overlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)',
    zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center'
  };

  const contentStyle = {
    backgroundColor: '#ffffff', borderRadius: '12px', width: '90%',
    maxWidth: '500px', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(0, 0, 0, 0.1)'
  };

  // Drag and drop zone style
  const dropZoneStyle = {
    border: '2px dashed rgba(0, 172, 201, 0.4)',
    borderRadius: '8px',
    padding: '2rem',
    textAlign: 'center',
    background: 'rgba(0, 172, 201, 0.05)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'var(--text-secondary)'
  };

  return (
    <div style={overlayStyle}>
      <div style={contentStyle} className="animate-fade-in">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(0, 0, 0, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
            {selectedItem ? 'Editar Implemento' : 'Nuevo Implemento'}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
            <HiX size={24} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          <form id="item-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Fotografía (Opcional)</label>
              
              {!previewUrl ? (
                <div 
                  style={dropZoneStyle}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <HiOutlineUpload size={32} color="var(--accent-primary)" />
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Haz clic o arrastra una imagen aquí</div>
                  <div style={{ fontSize: '0.8rem' }}>Soporta JPG, PNG, WEBP</div>
                </div>
              ) : (
                <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)' }}>
                  <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                  <button 
                    type="button"
                    onClick={() => { setPreviewUrl(''); setSelectedFile(null); setFormData({...formData, image_url: ''}); }}
                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer' }}
                  >
                    <HiX size={16} />
                  </button>
                </div>
              )}
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/jpeg, image/png, image/webp" 
                style={{ display: 'none' }} 
              />
            </div>

            <div className="form-group">
              <label>Nombre del Implemento</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                required 
                placeholder="Ej. Balón de Fútbol #5"
              />
            </div>

            <div className="form-group">
              <label>Cantidad Total Inicial</label>
              <input 
                type="number" 
                className="form-input" 
                min="0"
                value={formData.total_quantity} 
                onChange={e => setFormData({ ...formData, total_quantity: e.target.value })} 
                required 
              />
            </div>

            <div className="form-group">
              <label>Descripción (Opcional)</label>
              <textarea 
                className="form-input" 
                rows="3" 
                value={formData.description} 
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalles sobre marca, estado, ubicación..."
              ></textarea>
            </div>
          </form>
        </div>

        <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(0, 0, 0, 0.1)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button type="submit" form="item-form" className="btn btn-primary" disabled={loading}>
            {loading ? <div className="spinner" style={{ width: '1rem', height: '1rem' }}></div> : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
