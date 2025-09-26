// client/src/components/medical/EncryptedUpload.jsx
import React, { useRef, useState } from 'react';
import { presignDocument, attachDocument } from '../../services/medical/documentService';

async function sha256(buffer) {
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
}

async function encryptFile(file) {
  const key = await crypto.subtle.generateKey({ name:'AES-GCM', length:256 }, true, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const raw = await file.arrayBuffer();
  const ciphertext = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, raw);
  const jwk = await crypto.subtle.exportKey('jwk', key);
  return { ciphertext: new Uint8Array(ciphertext), iv, jwk };
}

export default function EncryptedUpload({ 
  playerId, 
  caseId, 
  documentType='MEDICAL_REPORT', 
  classification='SPECIAL_CATEGORY', 
  visibility='MEDICAL_ONLY', 
  retentionUntil, 
  title,
  onSuccess,
  onError 
}) {
  const inputRef = useRef(null);
  const [progress, setProgress] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const onFile = async (file) => {
    try {
      setError(null);
      setStatus('encrypting');
      setProgress(10);
      
      const { ciphertext, iv, jwk } = await encryptFile(file);
      setProgress(30);
      
      const checksum = await sha256(ciphertext);
      setProgress(50);

      setStatus('presigning');
      const meta = { 
        mimeType: file.type, 
        sizeBytes: ciphertext.byteLength, 
        checksumSHA256: checksum, 
        classification, 
        retentionUntil: retentionUntil || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year default
        visibility 
      };
      const { uploadUrl, encryptionKeyId } = await presignDocument(meta);
      setProgress(70);

      setStatus('uploading');
      await fetch(uploadUrl, { 
        method:'PUT', 
        body: ciphertext, 
        headers: { 
          'Content-Type': 'application/octet-stream', 
          'x-amz-meta-iv': Buffer.from(iv).toString('base64') 
        } 
      });
      setProgress(90);

      setStatus('attaching');
      await attachDocument({ 
        teamId: undefined, // Will be set by server from user context
        playerId, 
        caseId, 
        documentType, 
        title: title || file.name, 
        encryptionKeyId, 
        checksumSHA256: checksum, 
        jwk 
      });

      setStatus('done');
      setProgress(100);
      
      if (onSuccess) onSuccess({ file, checksum, encryptionKeyId });
      
      // Reset after 2 seconds
      setTimeout(() => {
        setStatus('idle');
        setProgress(null);
      }, 2000);
      
    } catch (e) {
      console.error('Upload error:', e);
      setError(e.message);
      setStatus('error');
      if (onError) onError(e);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onFile(file);
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'encrypting': return 'Crittografia in corso...';
      case 'presigning': return 'Preparazione upload...';
      case 'uploading': return 'Upload in corso...';
      case 'attaching': return 'Collegamento documento...';
      case 'done': return 'Upload completato!';
      case 'error': return 'Errore durante upload';
      default: return 'Seleziona un file';
    }
  };

  return (
    <div className="card">
      <h3>Upload Documento Cifrato</h3>
      <div className="row">
        <input 
          ref={inputRef} 
          type="file" 
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
        />
        <button 
          className="btn" 
          onClick={() => inputRef.current?.click()}
          disabled={status !== 'idle'}
        >
          {status === 'idle' ? 'Seleziona File' : getStatusText()}
        </button>
      </div>
      
      {progress !== null && (
        <div className="upload-progress">
          <div 
            className="upload-progress-bar" 
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      
      <div style={{ marginTop: 8, opacity: .8, fontSize: '14px' }}>
        {error ? (
          <span style={{ color: '#ef4444' }}>Errore: {error}</span>
        ) : (
          getStatusText()
        )}
      </div>
      
      <div style={{ marginTop: 8, fontSize: '12px', opacity: 0.6 }}>
        File supportati: PDF, DOC, DOCX, JPG, PNG, TXT
      </div>
    </div>
  );
}
