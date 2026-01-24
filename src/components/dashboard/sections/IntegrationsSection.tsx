import type { CSSProperties } from 'react';
import { Icons } from '../../common/Icons';

interface Integration {
  id: string;
  name: string;
  connected: boolean;
  icon: string;
}

interface IntegrationCategory {
  name: string;
  integrations: Integration[];
}

export function IntegrationsSection() {
  const integrationCategories: IntegrationCategory[] = [
    {
      name: 'CRM & Sales',
      integrations: [
        { id: 'salesforce', name: 'Salesforce', connected: true, icon: '☁️' },
        { id: 'hubspot', name: 'HubSpot', connected: false, icon: '🟠' },
        { id: 'pipedrive', name: 'Pipedrive', connected: false, icon: '🟢' },
      ]
    },
    {
      name: 'Social & Marketing',
      integrations: [
        { id: 'linkedin', name: 'LinkedIn', connected: true, icon: '💼' },
        { id: 'twitter', name: 'X (Twitter)', connected: false, icon: '✖️' },
        { id: 'analytics', name: 'Google Analytics', connected: true, icon: '📊' },
        { id: 'facebook', name: 'Facebook', connected: false, icon: '📘' },
      ]
    },
    {
      name: 'Databases',
      integrations: [
        { id: 'postgres', name: 'PostgreSQL', connected: true, icon: '🐘' },
        { id: 'mongodb', name: 'MongoDB', connected: false, icon: '🍃' },
        { id: 'mysql', name: 'MySQL', connected: false, icon: '🐬' },
        { id: 'snowflake', name: 'Snowflake', connected: false, icon: '❄️' },
      ]
    },
    {
      name: 'File Storage',
      integrations: [
        { id: 'gdrive', name: 'Google Drive', connected: false, icon: '📁' },
        { id: 'dropbox', name: 'Dropbox', connected: false, icon: '📦' },
        { id: 'onedrive', name: 'OneDrive', connected: false, icon: '☁️' },
        { id: 'box', name: 'Box', connected: false, icon: '📋' },
      ]
    },
  ];

  return (
    <div style={styles.sectionContainer}>
      <div style={styles.sectionHeader}>
        <div>
          <h1 style={styles.sectionTitle}>Integrations</h1>
          <p style={styles.sectionSubtitle}>Connect your tools and data sources for comprehensive analysis</p>
        </div>
      </div>

      <div style={styles.integrationsGrid}>
        {integrationCategories.map((category, i) => (
          <div key={i} style={styles.integrationCategory}>
            <h2 style={styles.integrationCategoryTitle}>{category.name}</h2>
            <div style={styles.integrationsList}>
              {category.integrations.map(integration => (
                <div key={integration.id} style={styles.integrationItem}>
                  <span style={styles.integrationIcon}>{integration.icon}</span>
                  <span style={styles.integrationName}>{integration.name}</span>
                  {integration.connected ? (
                    <span style={styles.connectedBadge}>
                      <Icons.Check />
                      Connected
                    </span>
                  ) : (
                    <button style={styles.connectButton}>Connect</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
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
  integrationsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '24px',
  },
  integrationCategory: {
    padding: '24px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E4E4E7',
  },
  integrationCategoryTitle: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#71717A',
  },
  integrationsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  integrationItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#FAFAFA',
    borderRadius: '8px',
  },
  integrationIcon: {
    fontSize: '20px',
  },
  integrationName: {
    flex: 1,
    fontSize: '14px',
    fontWeight: '500',
  },
  connectedBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#059669',
  },
  connectButton: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#18181B',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E4E7',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};

export default IntegrationsSection;
