import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Icons } from '../../common/Icons';

interface Document {
  id: number;
  name: string;
  size: string;
  uploaded: string;
  status: 'analyzed' | 'analyzing';
}

export function DocumentsSection() {
  const [dragOver, setDragOver] = useState(false);

  const documents: Document[] = [
    { id: 1, name: 'Q4 Financial Report.pdf', size: '2.4 MB', uploaded: 'Jan 22, 2026', status: 'analyzed' },
    { id: 2, name: 'Employee Handbook v3.docx', size: '1.1 MB', uploaded: 'Jan 20, 2026', status: 'analyzed' },
    { id: 3, name: 'Marketing Strategy 2026.pptx', size: '5.8 MB', uploaded: 'Jan 18, 2026', status: 'analyzing' },
    { id: 4, name: 'Customer Data Export.csv', size: '12.3 MB', uploaded: 'Jan 15, 2026', status: 'analyzed' },
    { id: 5, name: 'IT Infrastructure Audit.pdf', size: '3.2 MB', uploaded: 'Jan 12, 2026', status: 'analyzed' },
  ];

  return (
    <div style={styles.sectionContainer}>
      <div style={styles.sectionHeader}>
        <div>
          <h1 style={styles.sectionTitle}>Documents</h1>
          <p style={styles.sectionSubtitle}>Upload and manage documents for AI analysis</p>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        style={{
          ...styles.uploadZone,
          borderColor: dragOver ? '#18181B' : '#E4E4E7',
          backgroundColor: dragOver ? '#F4F4F5' : '#FAFAFA'
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
      >
        <div style={styles.uploadIcon}>
          <Icons.Upload />
        </div>
        <p style={styles.uploadText}>
          <strong>Click to upload</strong> or drag and drop
        </p>
        <p style={styles.uploadHint}>PDF, DOCX, XLSX, CSV, PPTX up to 50MB</p>
        <button style={styles.uploadButton}>
          <Icons.Plus />
          Select Files
        </button>
      </div>

      {/* Documents List */}
      <div style={styles.documentsListSection}>
        <h2 style={styles.subsectionTitle}>Uploaded documents</h2>
        <div style={styles.documentsList}>
          {documents.map(doc => (
            <div key={doc.id} style={styles.documentItem}>
              <div style={styles.documentIcon}>
                <Icons.File />
              </div>
              <div style={styles.documentInfo}>
                <span style={styles.documentName}>{doc.name}</span>
                <span style={styles.documentMeta}>{doc.size} · Uploaded {doc.uploaded}</span>
              </div>
              <span style={{
                ...styles.documentStatus,
                color: doc.status === 'analyzed' ? '#059669' : '#D97706'
              }}>
                {doc.status === 'analyzed' ? 'Analyzed' : 'Analyzing...'}
              </span>
              <button style={styles.documentAction}>
                <Icons.Trash />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  sectionContainer: {
    maxWidth: '1000px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '28px',
    fontWeight: '600',
    letterSpacing: '-0.02em',
    marginBottom: '8px',
  },
  sectionSubtitle: {
    fontSize: '15px',
    color: '#71717A',
  },
  subsectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '16px',
  },
  uploadZone: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
    backgroundColor: '#FAFAFA',
    border: '2px dashed #E4E4E7',
    borderRadius: '12px',
    marginBottom: '40px',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  },
  uploadIcon: {
    width: '56px',
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    marginBottom: '16px',
    color: '#71717A',
  },
  uploadText: {
    fontSize: '15px',
    marginBottom: '8px',
  },
  uploadHint: {
    fontSize: '13px',
    color: '#A1A1AA',
    marginBottom: '20px',
  },
  uploadButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#FFFFFF',
    backgroundColor: '#18181B',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  documentsListSection: {},
  documentsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E4E4E7',
    overflow: 'hidden',
  },
  documentItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 20px',
    borderBottom: '1px solid #F4F4F5',
  },
  documentIcon: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F5',
    borderRadius: '8px',
    color: '#71717A',
  },
  documentInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  documentName: {
    fontSize: '14px',
    fontWeight: '500',
  },
  documentMeta: {
    fontSize: '12px',
    color: '#A1A1AA',
  },
  documentStatus: {
    fontSize: '12px',
    fontWeight: '500',
  },
  documentAction: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#A1A1AA',
    cursor: 'pointer',
    borderRadius: '6px',
  },
};

export default DocumentsSection;
