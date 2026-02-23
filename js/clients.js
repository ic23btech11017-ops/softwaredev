/** Clients: list view, client detail with overview, projects, financial summary. */
window.ERP_Clients = (function () {
  var CONTACT_EMAIL = { c1: 'jane@acme.com', c2: 'bob@techstart.io', c3: 'alice@global.co' };

  function getProjects() {
    return (window.ERP_DATA && window.ERP_DATA.projects) || [];
  }

  function getInvoicesAll() {
    return (window.ERP_Invoice && window.ERP_Invoice.getInvoicesAll) ? window.ERP_Invoice.getInvoicesAll() : [];
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatCurrency(n) {
    return '$' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function getClientsFromProjects() {
    var projects = getProjects();
    var seen = {};
    var clients = [];
    projects.forEach(function (p) {
      if (p.clientId && !seen[p.clientId]) {
        seen[p.clientId] = true;
        clients.push({
          id: p.clientId,
          name: p.client || p.clientId,
          contact: CONTACT_EMAIL[p.clientId] || '—'
        });
      }
    });
    return clients;
  }

  function getProjectsForClient(clientId) {
    return getProjects().filter(function (p) { return p.clientId === clientId; });
  }

  function getClientStats(clientId) {
    var projects = getProjectsForClient(clientId);
    var projectIds = projects.map(function (p) { return p.id; });
    var invoices = getInvoicesAll().filter(function (i) { return projectIds.indexOf(i.projectId) >= 0; });

    var totalRevenue = invoices.filter(function (i) { return i.status === 'paid'; }).reduce(function (s, i) { return s + (i.amount || 0); }, 0);
    var pendingInvoices = invoices.filter(function (i) { return i.status === 'sent'; });
    var pendingAmount = pendingInvoices.reduce(function (s, i) { return s + (i.amount || 0); }, 0);
    var activeProjects = projects.filter(function (p) { return (p.status || '').toLowerCase().indexOf('progress') >= 0 || (p.status || '').toLowerCase().indexOf('active') >= 0; }).length;

    return {
      totalProjects: projects.length,
      activeProjects: activeProjects,
      totalRevenue: totalRevenue,
      pendingInvoices: pendingInvoices.length,
      pendingAmount: pendingAmount,
      paidInvoices: invoices.filter(function (i) { return i.status === 'paid'; }).length
    };
  }

  function renderList() {
    var listEl = document.getElementById('clientsList');
    var detailEl = document.getElementById('clientsDetail');
    if (!listEl || !detailEl) return;

    var clients = getClientsFromProjects();
    var html = clients.map(function (c) {
      var stats = getClientStats(c.id);
      var statusClass = stats.activeProjects > 0 ? 'badge-green' : 'badge-amber';
      var statusText = stats.activeProjects > 0 ? 'Active' : 'Pending';
      return '<tr class="client-row" data-client-id="' + escapeHtml(c.id) + '" style="cursor:pointer;">' +
        '<td>' + escapeHtml(c.name) + '</td>' +
        '<td>' + escapeHtml(c.contact) + '</td>' +
        '<td>' + stats.totalProjects + '</td>' +
        '<td><span class="badge ' + statusClass + '">' + statusText + '</span></td>' +
        '</tr>';
    }).join('') || '<tr><td colspan="4" class="card-meta">No clients.</td></tr>';

    listEl.innerHTML = html;
    detailEl.style.display = 'none';
    document.getElementById('clientsListView').style.display = '';

    listEl.querySelectorAll('.client-row').forEach(function (row) {
      row.addEventListener('click', function () {
        var clientId = row.getAttribute('data-client-id');
        if (clientId) openClientDetail(clientId);
      });
    });
  }

  function openClientDetail(clientId) {
    var listView = document.getElementById('clientsListView');
    var detailEl = document.getElementById('clientsDetail');
    if (!listView || !detailEl) return;

    var clients = getClientsFromProjects();
    var client = clients.filter(function (c) { return c.id === clientId; })[0];
    if (!client) return;

    var projects = getProjectsForClient(clientId);
    var stats = getClientStats(clientId);
    var loadSection = window.ERP && window.ERP.loadSection ? window.ERP.loadSection : function () {};
    var setCurrentProject = window.setCurrentProject;

    var overviewHtml =
      '<div class="clients-overview card">' +
      '<h3 style="margin:0 0 16px;font-size:14px;">Client Overview</h3>' +
      '<div class="clients-overview-grid">' +
      '<div><strong>Client Name</strong><div>' + escapeHtml(client.name) + '</div></div>' +
      '<div><strong>Contact</strong><div>' + escapeHtml(client.contact) + '</div></div>' +
      '<div><strong>Total Projects</strong><div>' + stats.totalProjects + '</div></div>' +
      '<div><strong>Active Projects</strong><div>' + stats.activeProjects + '</div></div>' +
      '<div><strong>Total Revenue</strong><div>' + formatCurrency(stats.totalRevenue) + '</div></div>' +
      '<div><strong>Pending Invoices</strong><div>' + stats.pendingInvoices + ' (' + formatCurrency(stats.pendingAmount) + ')</div></div>' +
      '</div></div>';

    var projectsHtml = '<div class="card"><h3 style="margin:0 0 12px;font-size:14px;">Projects Under Client</h3>';
    if (projects.length === 0) {
      projectsHtml += '<p class="card-meta">No projects for this client.</p>';
    } else {
      projectsHtml += '<div class="card-grid">' +
        projects.map(function (p) {
          var meta = (p.meta || '') ? p.meta : p.status || '';
          return '<div class="card project-card" data-project-id="' + escapeHtml(p.id) + '">' +
            '<div class="card-title">' + escapeHtml(p.name) + '</div>' +
            '<div class="card-meta">' + escapeHtml(meta) + '</div>' +
            '<div class="card-value project-status" style="font-size:0.9rem;">' + escapeHtml(p.status || '—') + '</div>' +
            '<div class="project-actions">' +
            '<button type="button" class="btn btn-primary btn-sm" data-action="backlog">Open Backlog</button> ' +
            '<button type="button" class="btn btn-ghost btn-sm" data-action="sprints">View Sprint</button> ' +
            '<button type="button" class="btn btn-ghost btn-sm" data-action="qa-defects">View QA</button> ' +
            '<button type="button" class="btn btn-ghost btn-sm" data-action="time-tracking">View Time</button> ' +
            '<button type="button" class="btn btn-ghost btn-sm" data-action="invoices">View Invoices</button>' +
            '</div></div>';
        }).join('') + '</div>';
    }
    projectsHtml += '</div>';

    var financialHtml =
      '<div class="card"><h3 style="margin:0 0 12px;font-size:14px;">Financial Summary</h3>' +
      '<div class="clients-overview-grid">' +
      '<div><strong>Total Revenue</strong><div>' + formatCurrency(stats.totalRevenue) + '</div></div>' +
      '<div><strong>Paid Invoices</strong><div>' + formatCurrency(stats.totalRevenue) + '</div></div>' +
      '<div><strong>Outstanding Amount</strong><div>' + formatCurrency(stats.pendingAmount) + '</div></div>' +
      '</div></div>';

    detailEl.innerHTML =
      '<button type="button" class="btn btn-ghost btn-sm" id="clientsBackBtn" style="margin-bottom:16px;">← Back to Clients</button>' +
      overviewHtml + projectsHtml + financialHtml;

    listView.style.display = 'none';
    detailEl.style.display = '';

    var backBtn = document.getElementById('clientsBackBtn');
    if (backBtn) backBtn.addEventListener('click', renderList);

    detailEl.querySelectorAll('.project-actions button').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var card = btn.closest('.project-card');
        var projectId = card ? card.getAttribute('data-project-id') : null;
        var section = btn.getAttribute('data-action');
        if (projectId && typeof setCurrentProject === 'function') setCurrentProject(projectId);
        if (section) loadSection(section);
      });
    });
  }

  function init() {
    renderList();
  }

  return { init: init };
})();
