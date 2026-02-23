/** Static demo data and config. */
window.ERP_DATA = {
  /** Used when role is Developer: only defects assigned to this user are shown. */
  currentUserId: 'd1',
  /** Projects for time tracking. */
  projects: [
    { id: 'p1', name: 'Portal v2', client: 'Acme Corp', clientId: 'c1', status: 'In progress', meta: '3 sprints left' },
    { id: 'p2', name: 'Mobile App', client: 'TechStart Inc', clientId: 'c2', status: 'Backlog', meta: 'Planning' },
    { id: 'p3', name: 'CRM Revamp', client: 'Global Solutions', clientId: 'c3', status: 'In progress', meta: '2 sprints left' },
    { id: 'p4', name: 'API Gateway', client: 'Acme Corp', clientId: 'c1', status: 'In progress', meta: '1 sprint left' },
    { id: 'p5', name: 'Analytics Dashboard', client: 'Global Solutions', clientId: 'c3', status: 'Backlog', meta: 'Discovery' }
  ],
  /** Sprints for time tracking (mirrors sprint module data). */
  sprints: [
    { id: 'sp1', name: 'Sprint 15', projectId: 'p1' },
    { id: 'sp0', name: 'Sprint 14', projectId: 'p1' },
    { id: 'sp2', name: 'Sprint 1', projectId: 'p2' },
    { id: 'sp3', name: 'Sprint 8', projectId: 'p3' },
    { id: 'sp4', name: 'Sprint 3', projectId: 'p4' }
  ],
  /** Default hourly rate for projects without a milestone. */
  defaultHourlyRate: 120,
  sectionTitles: {
    dashboard: 'Dashboard',
    clients: 'Clients',
    projects: 'Projects',
    backlog: 'Backlog',
    sprints: 'Sprints',
    tasks: 'Tasks',
    'qa-defects': 'QA & Defects',
    resources: 'Resources',
    'time-tracking': 'Time Tracking',
    invoices: 'Invoices',
    reports: 'Reports',
    integrations: 'Integrations',
    settings: 'Settings'
  }
};

/** Global project context. */
window.currentProjectId = null;

function setCurrentProject(projectId) {
  window.currentProjectId = projectId;
  updateProjectLabel();
}

function updateProjectLabel() {
  var el = document.getElementById('headerProject');
  if (!el) return;
  var id = window.currentProjectId;
  var name = 'All Projects';
  if (id) {
    name = 'None';
    if (window.ERP_DATA && window.ERP_DATA.projects) {
      var p = window.ERP_DATA.projects.filter(function (x) { return x.id === id; })[0];
      if (p) name = p.name;
    }
  }
  el.textContent = 'Current Project: ' + name;
}

function requireProjectSelection() {
  return !!(window.currentProjectId);
}

function getProjectScopeLabel() {
  var id = window.currentProjectId;
  if (!id) return 'Showing data for: All Projects';
  var projects = (window.ERP_DATA && window.ERP_DATA.projects) || [];
  var p = projects.filter(function (x) { return x.id === id; })[0];
  return 'Showing data for: ' + (p ? p.name : id);
}

function renderModuleScopeBanner(containerId) {
  var el = document.getElementById(containerId || 'content');
  if (!el) return;
  var existing = el.querySelector('.module-scope-banner');
  if (existing) existing.remove();
  var banner = document.createElement('div');
  banner.className = 'module-scope-banner';
  banner.textContent = getProjectScopeLabel();
  var first = el.firstChild;
  el.insertBefore(banner, first);
}
