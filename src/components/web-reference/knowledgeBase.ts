import { ReferenceDoc } from './types';

export const PNP_KNOWLEDGE_BASE: ReferenceDoc[] = [
  {
    id: 'k1',
    category: 'Intelligence',
    title: 'PNP Intelligence Operations Manual',
    content: 'Standard operating procedures for intelligence collection, analysis, and dissemination within the PNP.',
    tags: ['intelligence', 'sop', 'ops']
  },
  {
    id: 'k2',
    category: 'Training',
    title: 'Tactical Combat Casualty Care (TCCC)',
    content: 'Guidelines for providing medical care under fire and in tactical situations.',
    tags: ['medical', 'tactical', 'training']
  },
  {
    id: 'k3',
    category: 'General',
    title: 'PNP Ethical Standards and Code of Conduct',
    content: 'Code of professional conduct and ethical standards for all PNP personnel.',
    tags: ['conduct', 'ethics']
  }
];

export const INTEL_REPORT_TEMPLATES = {
  SPOT: 'SPOT REPORT TEMPLATE:\n- Type of Incident:\n- Date/Time:\n- Location:\n- Persons Involved:\n- Brief Narrative:\n- Action Taken:\n',
  INTEL: 'INTEL REPORT TEMPLATE:\n- Subject:\n- Source Reliability:\n- Information Authenticity:\n- Text/Details:\n- Assessment:\n',
  PROGRESS: 'PROGRESS REPORT TEMPLATE:\n- Reference:\n- Development:\n- Current Status:\n- Future Action:\n'
};

export const getFormattedReportTemplate = (reportType: string): string => {
  return INTEL_REPORT_TEMPLATES[reportType as keyof typeof INTEL_REPORT_TEMPLATES] || 'REPORT TEMPLATE:\n- Details:\n';
};
