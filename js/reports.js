/** Reports: Executive Overview, Sprint Performance, Resource Utilization, Financial Health. */
window.ERP_Reports = (function () {
  function getProjects() {
    return (window.ERP_DATA && window.ERP_DATA.projects) || [];
  }

  function getSprints() {
    return (window.ERP_Sprint && typeof window.ERP_Sprint.getSprints === 'function') ? window.ERP_Sprint.getSprints() : (window.ERP_DATA && window.ERP_DATA.sprints) || [];
  }

  function getStories() {
    return (window.ERP_Backlog && window.ERP_Backlog.getStories) ? window.ERP_Backlog.getStories() : [];
  }

  function getDevelopers() {
    return (window.ERP_Backlog && window.ERP_Backlog.getDevelopers) ? window.ERP_Backlog.getDevelopers() : [];
  }

  function getDefects() {
    return (window.ERP_QA && typeof window.ERP_QA.getDefects === 'function') ? window.ERP_QA.getDefects() : [];
  }

  function getInvoices() {
    return (window.ERP_Invoice && typeof window.ERP_Invoice.getInvoices === 'function') ? window.ERP_Invoice.getInvoices() : [];
  }

  function getTimeLogs() {
    return (window.ERP_Time && typeof window.ERP_Time.getTimeLogs === 'function') ? window.ERP_Time.getTimeLogs() : [];
  }

  function getApprovedBillableLogs() {
    return (window.ERP_Time && window.ERP_Time.getApprovedBillableLogs) ? window.ERP_Time.getApprovedBillableLogs() : [];
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

  function getCurrentMonth() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function getSprintStories(sprintId) {
    return getStories().filter(function (s) { return s.sprintId === sprintId; });
  }

  function plannedPoints(sprintId) {
    return getSprintStories(sprintId).reduce(function (sum, s) { return sum + (s.storyPoints || 0); }, 0);
  }

  function completedPoints(sprintId) {
    return getSprintStories(sprintId).filter(function (s) { return s.status === 'done' || s.status === 'release_ready'; }).reduce(function (sum, s) { return sum + (s.storyPoints || 0); }, 0);
  }

  function completionPercent(sprintId) {
    var p = plannedPoints(sprintId);
    return p === 0 ? 0 : Math.round((completedPoints(sprintId) / p) * 100);
  }

  function getActiveSprintId() {
    var sprints = getSprints();
    var active = sprints.filter(function (s) { return s.status === 'active'; })[0];
    return active ? active.id : (sprints[0] ? sprints[0].id : null);
  }

  var HOURS_PER_MONTH = 160;

  var currentTab = 'executive';

  function renderTabContent() {
    var contentEl = document.getElementById('reportsTabContent');
    if (!contentEl) return;

    if (currentTab === 'executive') renderExecutive(contentEl);
    else if (currentTab === 'sprint') renderSprint(contentEl);
    else if (currentTab === 'resource') renderResource(contentEl);
    else if (currentTab === 'financial') renderFinancial(contentEl);
  }

  function renderExecutive(container) {
    var projects = getProjects();
    var defects = getDefects();
    var openDefects = defects.filter(function (d) { return d.status !== 'Closed'; }).length;
    var criticalDefects = defects.filter(function (d) { return d.severity === 'Critical' && d.status !== 'Closed'; }).length;

    var activeSprintId = getActiveSprintId();
    var sprintCompletion = activeSprintId ? completionPercent(activeSprintId) : 0;

    var month = getCurrentMonth();
    var invoices = getInvoices();
    var monthRevenue = invoices.filter(function (i) { return (i.dateCreated || '').slice(0, 7) === month && i.status === 'paid'; }).reduce(function (s, i) { return s + (i.amount || 0); }, 0);

    var logs = getTimeLogs();
    var pid = window.currentProjectId;
    var billableLogs = getApprovedBillableLogs();
    if (pid) billableLogs = billableLogs.filter(function (l) { return l.projectId === pid; });
    var totalHours = logs.reduce(function (s, l) { return s + (l.hours || 0); }, 0);
    var billableHours = billableLogs.reduce(function (s, l) { return s + (l.hours || 0); }, 0);
    var utilization = totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0;

    var activeProjects = projects.length;

    var deliveryRisk = sprintCompletion < 70 || criticalDefects > 5 || utilization > 95;
    var statusHtml = deliveryRisk
      ? '<div class="reports-status risk">⚠ Delivery Risk Detected</div>'
      : '<div class="reports-status on-track">✔ Delivery On Track</div>';

    container.innerHTML =
      statusHtml +
      '<div class="reports-stats">' +
      '<div class="card"><div class="card-title">Active Projects</div><div class="card-value">' + activeProjects + '</div></div>' +
      '<div class="card"><div class="card-title">Open Defects</div><div class="card-value">' + openDefects + '</div></div>' +
      '<div class="card"><div class="card-title">Sprint Completion</div><div class="card-value">' + sprintCompletion + '%</div><div class="card-meta">current sprint</div></div>' +
      '<div class="card"><div class="card-title">Monthly Revenue</div><div class="card-value">' + formatCurrency(monthRevenue) + '</div><div class="card-meta">' + month + '</div></div>' +
      '<div class="card"><div class="card-title">Utilization</div><div class="card-value">' + utilization + '%</div></div>' +
      '</div>';
  }

  function renderSprint(container) {
    var sprints = getSprints();
    var last3 = sprints.slice(0, 3);
    var velocities = last3.map(function (sp) {
      var completed = completedPoints(sp.id);
      var planned = plannedPoints(sp.id);
      var pct = planned > 0 ? Math.round((completed / planned) * 100) : 0;
      return { name: sp.name || sp.id, velocity: completed, planned: planned, completed: completed, pct: pct };
    });

    var avgPct = velocities.length > 0
      ? Math.round(velocities.reduce(function (s, v) { return s + v.pct; }, 0) / velocities.length)
      : 0;

    var rows = velocities.map(function (v) {
      return '<tr><td>' + escapeHtml(v.name) + '</td><td>' + v.planned + '</td><td>' + v.completed + '</td><td>' + v.pct + '%</td></tr>';
    }).join('') || '<tr><td colspan="4" class="card-meta">No sprint data.</td></tr>';

    container.innerHTML =
      '<div class="reports-stats">' +
      '<div class="card"><div class="card-title">Avg Completion</div><div class="card-value">' + avgPct + '%</div></div>' +
      '</div>' +
      '<div class="card"><h3 style="margin:0 0 12px;font-size:14px;">Last 3 Sprints: Velocity & Completion</h3>' +
      '<table class="reports-table"><thead><tr><th>Sprint</th><th>Planned Pts</th><th>Completed Pts</th><th>Completion %</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  function renderResource(container) {
    var devs = getDevelopers();
    var logs = getTimeLogs();

    var byDev = {};
    devs.forEach(function (d) { byDev[d.id] = { name: d.name, total: 0, billable: 0 }; });
    logs.forEach(function (l) {
      var uid = l.user;
      if (byDev[uid]) {
        byDev[uid].total += l.hours || 0;
        if (l.billable && l.status === 'approved') byDev[uid].billable += l.hours || 0;
      }
    });

    var rows = devs.map(function (d) {
      var stats = byDev[d.id] || { total: 0, billable: 0 };
      var util = stats.total > 0 ? Math.round((stats.billable / stats.total) * 100) : 0;
      var badge = util > 90 ? '<span class="reports-badge-overload">Overloaded</span>' : (util < 50 ? '<span class="reports-badge-under">Underutilized</span>' : '');
      return '<tr><td>' + escapeHtml(d.name) + '</td><td>' + stats.total.toFixed(1) + 'h</td><td>' + stats.billable.toFixed(1) + 'h</td><td>' + util + '%</td><td>' + badge + '</td></tr>';
    }).join('') || '<tr><td colspan="5" class="card-meta">No resource data.</td></tr>';

    container.innerHTML =
      '<div class="card"><h3 style="margin:0 0 12px;font-size:14px;">Resource Utilization</h3>' +
      '<table class="reports-table"><thead><tr><th>Developer</th><th>Total Hours</th><th>Billable Hours</th><th>Utilization %</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  function renderFinancial(container) {
    var invoices = getInvoices();
    var totalRevenue = invoices.filter(function (i) { return i.status === 'paid'; }).reduce(function (s, i) { return s + (i.amount || 0); }, 0);
    var pending = invoices.filter(function (i) { return i.status === 'sent'; }).reduce(function (s, i) { return s + (i.amount || 0); }, 0);
    var paidTotal = invoices.filter(function (i) { return i.status === 'paid'; }).reduce(function (s, i) { return s + (i.amount || 0); }, 0);

    var byProject = {};
    invoices.filter(function (i) { return i.status === 'paid'; }).forEach(function (i) {
      var p = i.projectName || i.projectId || 'Unknown';
      byProject[p] = (byProject[p] || 0) + (i.amount || 0);
    });
    var projectRows = Object.keys(byProject).map(function (p) {
      return '<tr><td>' + escapeHtml(p) + '</td><td>' + formatCurrency(byProject[p]) + '</td></tr>';
    }).join('') || '<tr><td colspan="2" class="card-meta">No paid invoices.</td></tr>';

    var pid = window.currentProjectId;
    var billableLogs = getApprovedBillableLogs();
    if (pid) billableLogs = billableLogs.filter(function (l) { return l.projectId === pid; });
    var recentMonths = {};
    billableLogs.forEach(function (l) {
      var m = (l.date || '').slice(0, 7);
      if (m) recentMonths[m] = (recentMonths[m] || 0) + (l.hours || 0);
    });
    var monthHours = Object.values(recentMonths);
    var avgHours = monthHours.length > 0 ? monthHours.reduce(function (a, b) { return a + b; }, 0) / monthHours.length : 0;
    var rate = (window.ERP_DATA && window.ERP_DATA.defaultHourlyRate) || 120;
    var estNextMonth = Math.round(avgHours * rate);

    container.innerHTML =
      '<div class="reports-stats">' +
      '<div class="card"><div class="card-title">Total Revenue</div><div class="card-value">' + formatCurrency(totalRevenue) + '</div></div>' +
      '<div class="card"><div class="card-title">Pending Invoices</div><div class="card-value">' + formatCurrency(pending) + '</div></div>' +
      '<div class="card"><div class="card-title">Paid Invoices</div><div class="card-value">' + formatCurrency(paidTotal) + '</div></div>' +
      '<div class="card"><div class="card-title">Est. Next Month</div><div class="card-value">' + formatCurrency(estNextMonth) + '</div><div class="card-meta">avg billable trend</div></div>' +
      '</div>' +
      '<div class="card"><h3 style="margin:0 0 12px;font-size:14px;">Revenue per Project</h3>' +
      '<table class="reports-table"><thead><tr><th>Project</th><th>Revenue</th></tr></thead><tbody>' + projectRows + '</tbody></table></div>';
  }

  function setupTabs() {
    var tabs = document.querySelectorAll('.reports-tab');
    var contentEl = document.getElementById('reportsTabContent');
    if (!contentEl) return;

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        currentTab = tab.getAttribute('data-tab');
        tabs.forEach(function (t) { t.classList.toggle('active', t === tab); });
        renderTabContent();
      });
    });
  }

  function init() {
    renderModuleScopeBanner('content');
    var contentEl = document.getElementById('content');
    if (!contentEl || !contentEl.querySelector('.reports-tabs')) return;
    setupTabs();
    renderTabContent();
  }

  return { init: init };
})();
