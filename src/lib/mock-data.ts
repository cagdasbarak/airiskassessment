export const MOCK_LOGS = [
  { id: '1', timestamp: '2024-05-20 14:30:05', action: 'Report Generated', user: 'admin@company.com', status: 'Success' },
  { id: '2', timestamp: '2024-05-20 14:28:12', action: 'API Credentials Updated', user: 'admin@company.com', status: 'Success' },
  { id: '3', timestamp: '2024-05-19 09:15:44', action: 'License Check', user: 'admin@company.com', status: 'Success' },
  { id: '4', timestamp: '2024-05-18 16:20:00', action: 'Report Deleted', user: 'admin@company.com', status: 'Success' },
];
export const MOCK_REPORTS = [
  { id: 'rep_001', date: '2024-05-20', status: 'Completed', score: 84, riskLevel: 'Medium' },
  { id: 'rep_002', date: '2024-05-15', status: 'Completed', score: 92, riskLevel: 'Low' },
  { id: 'rep_003', date: '2024-05-10', status: 'Completed', score: 65, riskLevel: 'High' },
];
export const MOCK_REPORT_DETAILS = {
  id: 'rep_001',
  summary: {
    totalApps: 142,
    aiApps: 24,
    shadowAiApps: 8,
    dataExfiltrationRisk: 'High',
    complianceScore: 78
  },
  appLibrary: [
    { name: 'ChatGPT', category: 'AI Assistant', status: 'Approved', users: 45, risk: 'Low' },
    { name: 'Claude', category: 'AI Assistant', status: 'Pending', users: 12, risk: 'Medium' },
    { name: 'Midjourney', category: 'Image Gen', status: 'Unapproved', users: 5, risk: 'High' },
    { name: 'GitHub Copilot', category: 'Development', status: 'Approved', users: 88, risk: 'Low' },
  ],
  securityCharts: {
    usageOverTime: [
      { name: 'Mon', usage: 400 },
      { name: 'Tue', usage: 300 },
      { name: 'Wed', usage: 500 },
      { name: 'Thu', usage: 280 },
      { name: 'Fri', usage: 590 },
    ],
    riskDistribution: [
      { name: 'Low', value: 60 },
      { name: 'Medium', value: 25 },
      { name: 'High', value: 15 },
    ]
  }
};