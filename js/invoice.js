/** Invoice & Billing: milestones, generate, list, revenue dashboard. */
window.ERP_Invoice = (function () {
  var MILESTONES = [
    { id: 'm1', name: 'Phase 1 - Login', projectId: 'p1', projectName: 'Portal v2', billingType: 'fixed', amount: 5000, hourlyRate: null },
    { id: 'm2', name: 'Phase 2 - Billing', projectId: 'p1', projectName: 'Portal v2', billingType: 't_m', amount: null, hourlyRate: 120 },
    { id: 'm3', name: 'MVP', projectId: 'p2', projectName: 'Mobile App', billingType: 'fixed', amount: 15000, hourlyRate: null },
    { id: 'm4', name: 'Phase 1 - Contact Mgmt', projectId: 'p3', projectName: 'CRM Revamp', billingType: 'fixed', amount: 12000, hourlyRate: null },
    { id: 'm5', name: 'API Gateway T&M', projectId: 'p4', projectName: 'API Gateway', billingType: 't_m', amount: null, hourlyRate: 140 },
    { id: 'm6', name: 'Analytics MVP', projectId: 'p5', projectName: 'Analytics Dashboard', billingType: 'fixed', amount: 20000, hourlyRate: null }
  ];
  var INVOICES = [
    { id: 'INV-001', projectId: 'p1', projectName: 'Portal v2', amount: 12400, status: 'sent', dateCreated: '2025-02-01', dateFrom: '2025-01-06', dateTo: '2025-01-19', hours: 103.33, rate: 120, dueDate: '2025-03-03', logIds: [] },
    { id: 'INV-002', projectId: 'p1', projectName: 'Portal v2', amount: 5200, status: 'paid', dateCreated: '2025-01-15', dateFrom: '2024-12-16', dateTo: '2025-01-05', hours: 43.33, rate: 120, dueDate: '2025-02-14', logIds: [] },
    { id: 'INV-003', projectId: 'p3', projectName: 'CRM Revamp', amount: 360, status: 'sent', dateCreated: '2025-02-15', dateFrom: '2025-02-01', dateTo: '2025-02-14', hours: 3, rate: 120, dueDate: '2025-03-17', logIds: [] },
    { id: 'INV-004', projectId: 'p4', projectName: 'API Gateway', amount: 1260, status: 'paid', dateCreated: '2025-02-10', dateFrom: '2025-02-01', dateTo: '2025-02-09', hours: 9, rate: 140, dueDate: '2025-03-12', logIds: [] }
  ];
  var nextMilestoneId = 10;
  var nextInvoiceNum = 5;

  function getRole() {
    return window.ERP_Role && window.ERP_Role.getRole ? window.ERP_Role.getRole() : 'developer';
  }

  function getProjects() {
    return (window.ERP_DATA && window.ERP_DATA.projects) || [];
  }

  function getProjectName(id) {
    var p = getProjects().filter(function (x) { return x.id === id; })[0];
    return p ? p.name : id || '—';
  }

  function getApprovedBillableLogs() {
    return window.ERP_Time && window.ERP_Time.getApprovedBillableLogs ? window.ERP_Time.getApprovedBillableLogs() : [];
  }

  function getRateForProject(projectId) {
    var m = MILESTONES.filter(function (x) { return x.projectId === projectId; });
    var tAndM = m.filter(function (x) { return x.billingType === 't_m'; })[0];
    if (tAndM && tAndM.hourlyRate) return tAndM.hourlyRate;
    return (window.ERP_DATA && window.ERP_DATA.defaultHourlyRate) || 120;
  }

  function getLogsInRange(projectId, dateFrom, dateTo) {
    var logs = getApprovedBillableLogs()
      .filter(function (l) { return l.project === projectId && l.invoiced !== true; });
    if (!dateFrom || !dateTo) return logs;
    return logs.filter(function (l) {
      var d = l.date || '';
      return d >= dateFrom && d <= dateTo;
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatCurrency(n) {
    return '$' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function getCurrentMonth() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function canEdit() {
    var r = getRole();
    return r === 'accounts' || r === 'admin';
  }

  function canView() {
    var r = getRole();
    return r === 'accounts' || r === 'admin' || r === 'pm';
  }

  var currentTab = 'milestones';

  function renderTabContent() {
    var contentEl = document.getElementById('invoiceTabContent');
    if (!contentEl) return;

    if (!canView()) {
      contentEl.innerHTML = '<div class="invoice-access-denied"><h3>Access Denied</h3><p>Only Accounts and Project Managers can access Invoice & Billing. Developers do not have access.</p></div>';
      return;
    }

    if (currentTab === 'milestones') renderMilestones(contentEl);
    else if (currentTab === 'generate') renderGenerate(contentEl);
    else if (currentTab === 'list') renderList(contentEl);
    else if (currentTab === 'dashboard') renderDashboard(contentEl);
  }

  function renderMilestones(container) {
    var projects = getProjects();
    var projOpts = projects.map(function (p) { return '<option value="' + p.id + '">' + escapeHtml(p.name) + '</option>'; }).join('');
    var readonly = !canEdit();

    var pid = window.currentProjectId;
    var milestones = pid ? MILESTONES.filter(function (m) { return m.projectId === pid; }) : MILESTONES;
    var listHtml = milestones.length === 0
      ? '<p class="card-meta">No milestones yet. Create one above.</p>'
      : milestones.map(function (m) {
          var typeLabel = m.billingType === 'fixed' ? 'Fixed: ' + formatCurrency(m.amount) : 'T&M: $' + (m.hourlyRate || 0) + '/hr';
          return '<div class="invoice-milestone-card"><div><strong>' + escapeHtml(m.name) + '</strong><br><span class="card-meta">' + escapeHtml(m.projectName) + ' · ' + typeLabel + '</span></div></div>';
        }).join('');

    container.innerHTML =
      (readonly ? '' : '<div class="card" style="margin-bottom:20px;"><h3 style="margin:0 0 16px;font-size:14px;">Create Milestone</h3>' +
      '<div class="invoice-form-grid">' +
      '<div class="form-group"><label>Milestone Name</label><input type="text" id="milestoneName" placeholder="e.g. Phase 1 - Login"></div>' +
      '<div class="form-group"><label>Project</label><select id="milestoneProject">' + projOpts + '</select></div>' +
      '<div class="form-group"><label>Billing Type</label><select id="milestoneBillingType"><option value="fixed">Fixed</option><option value="t_m">Time & Material</option></select></div>' +
      '<div class="form-group" id="milestoneAmountGroup"><label>Amount ($)</label><input type="number" id="milestoneAmount" min="0" step="0.01" placeholder="5000"></div>' +
      '<div class="form-group" id="milestoneRateGroup" style="display:none;"><label>Hourly Rate ($)</label><input type="number" id="milestoneRate" min="0" step="1" placeholder="120" value="120"></div>' +
      '</div><button type="button" class="btn btn-primary" id="milestoneCreateBtn">Create</button></div>') +
      '<div class="card"><h3 style="margin:0 0 12px;font-size:14px;">Milestones</h3>' + listHtml + '</div>';

    if (!readonly) {
      var billingSel = document.getElementById('milestoneBillingType');
      var amountGrp = document.getElementById('milestoneAmountGroup');
      var rateGrp = document.getElementById('milestoneRateGroup');
      function toggleBillingFields() {
        var isFixed = (billingSel && billingSel.value === 'fixed');
        if (amountGrp) amountGrp.style.display = isFixed ? 'block' : 'none';
        if (rateGrp) rateGrp.style.display = isFixed ? 'none' : 'block';
      }
      if (billingSel) {
        billingSel.addEventListener('change', toggleBillingFields);
        toggleBillingFields();
      }
      var createBtn = document.getElementById('milestoneCreateBtn');
      if (createBtn) createBtn.addEventListener('click', createMilestone);
    }
  }

  function createMilestone() {
    var nameEl = document.getElementById('milestoneName');
    var projEl = document.getElementById('milestoneProject');
    var billingEl = document.getElementById('milestoneBillingType');
    var amountEl = document.getElementById('milestoneAmount');
    var rateEl = document.getElementById('milestoneRate');

    var name = (nameEl && nameEl.value || '').trim();
    var projectId = projEl ? projEl.value : '';
    var billingType = billingEl ? billingEl.value : 'fixed';
    if (!name || !projectId) return;

    var projectName = getProjectName(projectId);
    var amount = null;
    var hourlyRate = null;
    if (billingType === 'fixed') {
      amount = parseFloat(amountEl ? amountEl.value : 0) || 0;
      if (amount <= 0) return;
    } else {
      hourlyRate = parseFloat(rateEl ? rateEl.value : 0) || 120;
    }

    var id = 'm' + (nextMilestoneId++);
    MILESTONES.push({ id: id, name: name, projectId: projectId, projectName: projectName, billingType: billingType, amount: amount, hourlyRate: hourlyRate });
    if (nameEl) nameEl.value = '';
    if (amountEl) amountEl.value = '';
    if (rateEl) rateEl.value = '120';
    renderTabContent();
  }

  function renderGenerate(container) {
    var readonly = !canEdit();
    var projects = getProjects();
    var projOpts = '<option value="">— Select Project —</option>' + projects.map(function (p) { return '<option value="' + p.id + '">' + escapeHtml(p.name) + '</option>'; }).join('');

    var today = new Date().toISOString().slice(0, 10);
    var firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    var dateFrom = firstOfMonth.toISOString().slice(0, 10);

    container.innerHTML =
      (readonly ? '<p class="card-meta">View only. Only Accounts and Admin can generate invoices.</p>' : '') +
      '<div class="card" style="margin-bottom:20px;"><h3 style="margin:0 0 16px;font-size:14px;">Generate Invoice</h3>' +
      '<div class="invoice-form-grid">' +
      '<div class="form-group"><label>Project</label><select id="invProject"' + (readonly ? ' disabled' : '') + '>' + projOpts + '</select></div>' +
      '<div class="form-group"><label>Milestone</label><select id="invMilestone"' + (readonly ? ' disabled' : '') + '><option value="">Time & Material</option></select></div>' +
      '<div class="form-group"><label>Date From</label><input type="date" id="invDateFrom" value="' + dateFrom + '"' + (readonly ? ' disabled' : '') + '></div>' +
      '<div class="form-group"><label>Date To</label><input type="date" id="invDateTo" value="' + today + '"' + (readonly ? ' disabled' : '') + '></div>' +
      '<div class="form-group"><label>&nbsp;</label><button type="button" class="btn btn-primary" id="invPreviewBtn"' + (readonly ? ' disabled' : '') + '>Preview</button></div>' +
      '</div>' +
      '<div id="invPreviewArea"></div>' +
      '</div>';

    if (!readonly) {
      var projSel = document.getElementById('invProject');
      var milSel = document.getElementById('invMilestone');
      if (projSel) projSel.addEventListener('change', function () {
        var pid = projSel.value;
        milSel.innerHTML = '<option value="">Time & Material</option>';
        if (pid) {
          MILESTONES.filter(function (m) { return m.projectId === pid && m.billingType === 'fixed' && m.invoiced !== true; }).forEach(function (m) {
            milSel.innerHTML += '<option value="' + m.id + '">' + escapeHtml(m.name) + ' - ' + formatCurrency(m.amount) + '</option>';
          });
        }
      });
      var previewBtn = document.getElementById('invPreviewBtn');
      if (previewBtn) previewBtn.addEventListener('click', previewInvoice);
    }
  }

  function previewInvoice() {
    var projEl = document.getElementById('invProject');
    var milEl = document.getElementById('invMilestone');
    var fromEl = document.getElementById('invDateFrom');
    var toEl = document.getElementById('invDateTo');
    var areaEl = document.getElementById('invPreviewArea');

    var projectId = projEl ? projEl.value : '';
    var milestoneId = milEl ? milEl.value : '';
    var dateFrom = fromEl ? fromEl.value : '';
    var dateTo = toEl ? toEl.value : '';
    if (!projectId) return;

    var milestone = milestoneId ? MILESTONES.filter(function (m) { return m.id === milestoneId; })[0] : null;
    var isFixed = milestone && milestone.billingType === 'fixed';

    if (isFixed) {
      if (milestone.invoiced === true) {
        if (areaEl) areaEl.innerHTML = '<div class="invoice-preview"><p style="color:#b91c1c;"><strong>Cannot generate:</strong> Milestone "' + escapeHtml(milestone.name) + '" has already been invoiced.</p></div>';
        return;
      }
      var amount = milestone.amount || 0;
      var html = '<div class="invoice-preview"><h4 style="margin:0 0 12px;">Preview (Fixed)</h4>' +
        '<p><strong>' + escapeHtml(milestone.name) + '</strong> · ' + formatCurrency(amount) + '</p>' +
        '<div style="margin-top:12px;"><button type="button" class="btn btn-primary" id="invGenerateBtn">Generate Invoice</button></div></div>';
      if (areaEl) areaEl.innerHTML = html;
      var genBtn = document.getElementById('invGenerateBtn');
      if (genBtn) genBtn.addEventListener('click', function () { generateInvoiceFixed(projectId, getProjectName(projectId), milestone); });
      return;
    }

    var logs = getLogsInRange(projectId, dateFrom, dateTo);
    var totalHours = logs.reduce(function (s, l) { return s + (l.hours || 0); }, 0);
    var rate = getRateForProject(projectId);
    var amount = totalHours * rate;
    var projectName = getProjectName(projectId);

    var rows = logs.map(function (l) {
      return '<tr><td>' + escapeHtml(l.date) + '</td><td>' + escapeHtml(l.userName || '') + '</td><td>' + escapeHtml(l.storyTitle || '') + '</td><td>' + (l.hours || 0) + '</td><td>' + formatCurrency((l.hours || 0) * rate) + '</td></tr>';
    }).join('');

    var html = '<div class="invoice-preview"><h4 style="margin:0 0 12px;">Preview</h4>' +
      '<table class="invoice-preview-table"><thead><tr><th>Date</th><th>User</th><th>Story</th><th>Hours</th><th>Amount</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="5" class="card-meta">No approved billable logs in this range.</td></tr>') +
      '</tbody></table>' +
      '<div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">' +
      '<div><strong>Total Hours:</strong> ' + totalHours.toFixed(2) + ' · <strong>Rate:</strong> $' + rate + '/hr · <strong>Amount:</strong> ' + formatCurrency(amount) + '</div>' +
      (logs.length > 0 ? '<button type="button" class="btn btn-primary" id="invGenerateBtn">Generate Invoice</button>' : '') +
      '</div></div>';

    if (areaEl) areaEl.innerHTML = html;

    var genBtn = document.getElementById('invGenerateBtn');
    if (genBtn) genBtn.addEventListener('click', function () { generateInvoice(projectId, projectName, dateFrom, dateTo, totalHours, rate, logs); });
  }

  function generateInvoice(projectId, projectName, dateFrom, dateTo, hours, rate, logs) {
    var id = 'INV-' + String(nextInvoiceNum++).padStart(3, '0');
    var today = new Date().toISOString().slice(0, 10);
    var due = new Date();
    due.setDate(due.getDate() + 30);
    var dueDate = due.toISOString().slice(0, 10);
    var amount = hours * rate;
    var logIds = logs.map(function (l) { return l.id; });

    INVOICES.unshift({
      id: id,
      projectId: projectId,
      projectName: projectName,
      amount: amount,
      status: 'sent',
      dateCreated: today,
      dateFrom: dateFrom,
      dateTo: dateTo,
      hours: hours,
      rate: rate,
      dueDate: dueDate,
      logIds: logIds
    });

    logs.forEach(function (log) {
      log.invoiced = true;
      log.invoiceId = id;
    });

    finishGenerate(id, amount);
  }

  function generateInvoiceFixed(projectId, projectName, milestone) {
    if (milestone.invoiced === true) return;
    var id = 'INV-' + String(nextInvoiceNum++).padStart(3, '0');
    var today = new Date().toISOString().slice(0, 10);
    var due = new Date();
    due.setDate(due.getDate() + 30);
    var dueDate = due.toISOString().slice(0, 10);
    var amount = milestone.amount || 0;

    INVOICES.unshift({
      id: id,
      projectId: projectId,
      projectName: projectName,
      amount: amount,
      status: 'sent',
      dateCreated: today,
      dateFrom: null,
      dateTo: null,
      hours: 0,
      rate: 0,
      dueDate: dueDate,
      logIds: []
    });

    milestone.invoiced = true;

    finishGenerate(id, amount);
  }

  function finishGenerate(id, amount) {
    var areaEl = document.getElementById('invPreviewArea');
    if (areaEl) areaEl.innerHTML = '<div class="invoice-preview"><p><strong>Invoice ' + id + ' generated successfully.</strong> Amount: ' + formatCurrency(amount) + '</p></div>';
    currentTab = 'list';
    document.querySelectorAll('.invoice-tab').forEach(function (t) { t.classList.toggle('active', t.getAttribute('data-tab') === 'list'); });
    renderTabContent();
  }

  function renderList(container) {
    var readonly = !canEdit();
    var today = new Date().toISOString().slice(0, 10);
    var pid = window.currentProjectId;
    var invoices = pid ? INVOICES.filter(function (i) { return i.projectId === pid; }) : INVOICES;

    function statusDisplay(inv) {
      if (inv.status === 'paid') return { label: 'Paid', cls: 'badge-green' };
      if (inv.dueDate && inv.dueDate < today) return { label: 'Overdue', cls: 'badge-red' };
      return { label: 'Sent', cls: 'badge-amber' };
    }

    var rows = invoices.map(function (inv) {
      var s = statusDisplay(inv);
      var markPaid = !readonly && inv.status !== 'paid' ? '<button type="button" class="btn btn-primary btn-sm" data-inv-id="' + inv.id + '">Mark as Paid</button>' : '';
      return '<tr><td>' + escapeHtml(inv.id) + '</td><td>' + escapeHtml(inv.projectName) + '</td><td>' + formatCurrency(inv.amount) + '</td><td><span class="badge ' + s.cls + '">' + s.label + '</span></td><td>' + markPaid + '</td></tr>';
    }).join('');

    container.innerHTML =
      '<table class="placeholder-table"><thead><tr><th>Invoice ID</th><th>Project</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="5" class="card-meta">No invoices yet.</td></tr>') +
      '</tbody></table>';

    container.querySelectorAll('[data-inv-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var inv = INVOICES.filter(function (i) { return i.id === btn.getAttribute('data-inv-id'); })[0];
        if (inv) { inv.status = 'paid'; renderTabContent(); }
      });
    });
  }

  function renderDashboard(container) {
    var pid = window.currentProjectId;
    var invoices = pid ? INVOICES.filter(function (i) { return i.projectId === pid; }) : INVOICES;
    var month = getCurrentMonth();
    var monthInvoices = invoices.filter(function (i) { return (i.dateCreated || '').slice(0, 7) === month; });
    var revenueThisMonth = monthInvoices.filter(function (i) { return i.status === 'paid'; }).reduce(function (s, i) { return s + i.amount; }, 0);
    var pending = invoices.filter(function (i) { return i.status === 'sent'; }).reduce(function (s, i) { return s + i.amount; }, 0);
    var paidTotal = invoices.filter(function (i) { return i.status === 'paid'; }).reduce(function (s, i) { return s + i.amount; }, 0);

    var byProject = {};
    invoices.filter(function (i) { return i.status === 'paid'; }).forEach(function (i) {
      byProject[i.projectName] = (byProject[i.projectName] || 0) + i.amount;
    });
    var projectRows = Object.keys(byProject).map(function (p) { return '<tr><td>' + escapeHtml(p) + '</td><td>' + formatCurrency(byProject[p]) + '</td></tr>'; }).join('') || '<tr><td colspan="2" class="card-meta">No paid invoices yet.</td></tr>';

    container.innerHTML =
      '<div class="invoice-stats">' +
      '<div class="card"><div class="card-title">Revenue This Month</div><div class="card-value">' + formatCurrency(revenueThisMonth) + '</div><div class="card-meta">' + month + '</div></div>' +
      '<div class="card"><div class="card-title">Pending Payments</div><div class="card-value">' + formatCurrency(pending) + '</div></div>' +
      '<div class="card"><div class="card-title">Paid Invoices</div><div class="card-value">' + formatCurrency(paidTotal) + '</div><div class="card-meta">Total</div></div>' +
      '</div>' +
      '<div class="card"><h3 style="margin:0 0 12px;font-size:14px;">Revenue per Project</h3>' +
      '<table class="placeholder-table"><thead><tr><th>Project</th><th>Revenue</th></tr></thead><tbody>' + projectRows + '</tbody></table></div>';
  }

  function setupTabs() {
    var tabs = document.querySelectorAll('.invoice-tab');
    var contentEl = document.getElementById('invoiceTabContent');
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
    if (!contentEl || !contentEl.querySelector('.invoice-tabs')) return;
    setupTabs();
    renderTabContent();
  }

  function getFilteredInvoices() {
    var pid = window.currentProjectId;
    return pid ? INVOICES.filter(function (i) { return i.projectId === pid; }) : INVOICES;
  }
  function getInvoices() { return getFilteredInvoices(); }
  function getInvoicesAll() { return INVOICES; }
  return { init: init, getInvoices: getInvoices, getInvoicesAll: getInvoicesAll };
})();
