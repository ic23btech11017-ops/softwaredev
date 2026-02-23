/** Time tracking: logs, approvals, summary. Role-based visibility. */
window.ERP_Time = (function () {
  var TIME_LOGS = [
    { id: 'tl1', user: 'd1', userName: 'Alex Chen', project: 'p1', projectId: 'p1', projectName: 'Portal v2', sprint: 'sp1', sprintName: 'Sprint 15', story: 's1', storyTitle: 'As a user I can log in with email', hours: 4, billable: true, description: 'Login API implementation', status: 'approved', date: '2025-02-16' },
    { id: 'tl2', user: 'd1', userName: 'Alex Chen', project: 'p1', projectId: 'p1', projectName: 'Portal v2', sprint: 'sp1', sprintName: 'Sprint 15', story: 's1', storyTitle: 'As a user I can log in with email', hours: 2.5, billable: false, description: 'Code review', status: 'approved', date: '2025-02-15' },
    { id: 'tl3', user: 'd2', userName: 'Sam Rivera', project: 'p1', projectId: 'p1', projectName: 'Portal v2', sprint: 'sp1', sprintName: 'Sprint 15', story: 's3', storyTitle: 'As a user I can log out', hours: 1, billable: true, description: 'Logout flow', status: 'pending', date: '2025-02-16' },
    { id: 'tl4', user: 'd1', userName: 'Alex Chen', project: 'p3', projectId: 'p3', projectName: 'CRM Revamp', sprint: 'sp3', sprintName: 'Sprint 8', story: 's9', storyTitle: 'Contact import from CSV', hours: 3, billable: true, description: 'CSV parser and field mapping', status: 'approved', date: '2025-02-14' },
    { id: 'tl5', user: 'd1', userName: 'Alex Chen', project: 'p4', projectId: 'p4', projectName: 'API Gateway', sprint: 'sp4', sprintName: 'Sprint 3', story: 's12', storyTitle: 'Rate limiting middleware', hours: 5, billable: true, description: 'Redis-backed rate limiter', status: 'approved', date: '2025-02-13' },
    { id: 'tl6', user: 'd3', userName: 'Jordan Lee', project: 'p4', projectId: 'p4', projectName: 'API Gateway', sprint: 'sp4', sprintName: 'Sprint 3', story: 's13', storyTitle: 'OAuth2 client credentials flow', hours: 4, billable: true, description: 'OAuth2 implementation', status: 'approved', date: '2025-02-15' },
    { id: 'tl7', user: 'd2', userName: 'Sam Rivera', project: 'p3', projectId: 'p3', projectName: 'CRM Revamp', sprint: 'sp3', sprintName: 'Sprint 8', story: 's11', storyTitle: 'Contact merge and dedupe', hours: 2, billable: true, description: 'Merge UI and conflict handling', status: 'pending', date: '2025-02-16' }
  ];
  var nextLogId = 11;

  function getRole() {
    return window.ERP_Role && window.ERP_Role.getRole ? window.ERP_Role.getRole() : 'developer';
  }

  function getCurrentUserId() {
    return window.ERP_DATA && window.ERP_DATA.currentUserId ? window.ERP_DATA.currentUserId : 'd1';
  }

  function getProjects() {
    return (window.ERP_DATA && window.ERP_DATA.projects) || [];
  }

  function getSprints() {
    return (window.ERP_DATA && window.ERP_DATA.sprints) || [];
  }

  function getStories() {
    return window.ERP_Backlog && window.ERP_Backlog.getStories ? window.ERP_Backlog.getStories() : [];
  }

  function getDevelopers() {
    return window.ERP_Backlog && window.ERP_Backlog.getDevelopers ? window.ERP_Backlog.getDevelopers() : [];
  }

  function getProjectName(id) {
    var p = getProjects().filter(function (x) { return x.id === id; })[0];
    return p ? p.name : id || '—';
  }

  function getSprintName(id) {
    var s = getSprints().filter(function (x) { return x.id === id; })[0];
    return s ? s.name : id || '—';
  }

  function getStoryTitle(id) {
    var s = getStories().filter(function (x) { return x.id === id; })[0];
    return s ? s.title : id || '—';
  }

  function getDeveloperName(id) {
    var d = getDevelopers().filter(function (x) { return x.id === id; })[0];
    return d ? d.name : id || '—';
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function getWeekStart(dateStr) {
    var d = new Date(dateStr);
    var day = d.getDay();
    var diff = d.getDate() - day + (day === 0 ? -6 : 1);
    var monday = new Date(d);
    monday.setDate(diff);
    return monday.toISOString().slice(0, 10);
  }

  function getCurrentMonth() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function getFilteredLogs() {
    var pid = window.currentProjectId;
    return pid ? TIME_LOGS.filter(function (l) { return l.projectId === pid; }) : TIME_LOGS;
  }

  function logsForRole() {
    var base = getFilteredLogs();
    var role = getRole();
    var uid = getCurrentUserId();
    if (role === 'developer') {
      return base.filter(function (l) { return l.user === uid; });
    }
    if (role === 'accounts') {
      return base.filter(function (l) { return l.status === 'approved' && l.billable; });
    }
    return base;
  }

  function statusClass(s) {
    if (s === 'approved') return 'badge-green';
    if (s === 'rejected') return 'badge-red';
    return 'badge-amber';
  }

  var currentTab = 'my-logs';

  function renderTabContent() {
    var contentEl = document.getElementById('timeTabContent');
    if (!contentEl) return;
    var role = getRole();

    if (currentTab === 'my-logs') {
      renderMyLogs(contentEl);
    } else if (currentTab === 'team-logs' && (role === 'pm' || role === 'admin')) {
      renderTeamLogs(contentEl);
    } else if (currentTab === 'approvals' && (role === 'pm' || role === 'admin')) {
      renderApprovals(contentEl);
    } else if (currentTab === 'summary') {
      renderSummary(contentEl);
    } else {
      contentEl.innerHTML = '<div class="time-empty">You do not have access to this tab.</div>';
    }
  }

  function renderMyLogs(container) {
    var uid = getCurrentUserId();
    var myLogs = getFilteredLogs().filter(function (l) { return l.user === uid; });

    var weekTotal = 0;
    var billableTotal = 0;
    var nonBillableTotal = 0;
    var now = new Date();
    var weekStart = getWeekStart(now.toISOString().slice(0, 10));
    myLogs.forEach(function (l) {
      if (getWeekStart(l.date) === weekStart) {
        weekTotal += l.hours;
        if (l.billable) billableTotal += l.hours;
        else nonBillableTotal += l.hours;
      }
    });

    var projects = getProjects();
    var sprints = getSprints();
    var stories = getStories();

    var projectOpts = projects.map(function (p) { return '<option value="' + p.id + '">' + escapeHtml(p.name) + '</option>'; }).join('');
    var sprintOpts = sprints.map(function (s) { return '<option value="' + s.id + '">' + escapeHtml(s.name) + '</option>'; }).join('');
    var storyOpts = stories.map(function (s) { return '<option value="' + s.id + '">' + escapeHtml(s.title) + '</option>'; }).join('');

    container.innerHTML =
      '<div class="time-stats">' +
      '<div class="card"><div class="card-title">Weekly Total</div><div class="card-value">' + weekTotal.toFixed(1) + 'h</div></div>' +
      '<div class="card"><div class="card-title">Billable</div><div class="card-value">' + billableTotal.toFixed(1) + 'h</div></div>' +
      '<div class="card"><div class="card-title">Non-billable</div><div class="card-value">' + nonBillableTotal.toFixed(1) + 'h</div></div>' +
      '</div>' +
      '<div class="card" style="margin-bottom:20px;">' +
      '<h3 style="margin:0 0 16px;font-size:14px;">Log Time</h3>' +
      '<div class="time-form-grid">' +
      '<div class="form-group"><label>Project</label><select id="timeProject">' + projectOpts + '</select></div>' +
      '<div class="form-group"><label>Sprint</label><select id="timeSprint">' + sprintOpts + '</select></div>' +
      '<div class="form-group"><label>Story</label><select id="timeStory">' + storyOpts + '</select></div>' +
      '<div class="form-group"><label>Hours</label><input type="number" id="timeHours" min="0" step="0.25" value="0" placeholder="0"></div>' +
      '<div class="form-group" style="display:flex;align-items:center;gap:8px;"><input type="checkbox" id="timeBillable" checked><label for="timeBillable" style="margin:0;">Billable</label></div>' +
      '</div>' +
      '<div class="time-form-full form-group"><label>Description</label><textarea id="timeDesc" rows="2" placeholder="What did you work on?"></textarea></div>' +
      '<button type="button" class="btn btn-primary" id="timeSubmitBtn">Submit</button>' +
      '</div>' +
      '<div class="card"><h3 style="margin:0 0 12px;font-size:14px;">My Logs</h3>' +
      (myLogs.length === 0
        ? '<div class="time-empty">No time logs yet.</div>'
        : '<table class="time-log-table"><thead><tr><th>Date</th><th>Project</th><th>Story</th><th>Hours</th><th>Billable</th><th>Status</th></tr></thead><tbody>' +
          myLogs.map(function (l) {
            return '<tr><td>' + escapeHtml(l.date) + '</td><td>' + escapeHtml(l.projectName) + '</td><td>' + escapeHtml(l.storyTitle) + '</td><td>' + l.hours + '</td><td>' + (l.billable ? 'Yes' : 'No') + '</td><td><span class="badge ' + statusClass(l.status) + '">' + l.status + '</span></td></tr>';
          }).join('') +
          '</tbody></table>') +
      '</div>';

    var submitBtn = document.getElementById('timeSubmitBtn');
    if (submitBtn) submitBtn.addEventListener('click', submitTimeLog);

    var projEl = document.getElementById('timeProject');
    var sprintEl = document.getElementById('timeSprint');
    if (projEl) projEl.addEventListener('change', updateStoryDropdown);
    if (sprintEl) sprintEl.addEventListener('change', updateStoryDropdown);
    updateStoryDropdown();
  }

  function updateStoryDropdown() {
    var storySel = document.getElementById('timeStory');
    if (!storySel) return;
    var sprintId = (document.getElementById('timeSprint') || {}).value;
    var stories = getStories();
    var filtered = sprintId ? stories.filter(function (s) { return s.sprintId === sprintId; }) : stories;
    storySel.innerHTML = filtered.map(function (s) { return '<option value="' + s.id + '">' + escapeHtml(s.title) + '</option>'; }).join('');
  }

  function submitTimeLog() {
    var projectSel = document.getElementById('timeProject');
    var sprintSel = document.getElementById('timeSprint');
    var storySel = document.getElementById('timeStory');
    var hoursEl = document.getElementById('timeHours');
    var billableEl = document.getElementById('timeBillable');
    var descEl = document.getElementById('timeDesc');

    var projectId = projectSel ? projectSel.value : '';
    var sprintId = sprintSel ? sprintSel.value : '';
    var storyId = storySel ? storySel.value : '';
    var hours = parseFloat(hoursEl ? hoursEl.value : 0);
    var billable = billableEl ? billableEl.checked : true;
    var description = descEl ? descEl.value.trim() : '';

    if (!projectId || !storyId || hours <= 0) return;

    var uid = getCurrentUserId();
    var userName = getDeveloperName(uid);
    var projectName = getProjectName(projectId);
    var sprintName = getSprintName(sprintId);
    var storyTitle = getStoryTitle(storyId);

    var today = new Date().toISOString().slice(0, 10);
    var id = 'tl' + (nextLogId++);
    TIME_LOGS.unshift({
      id: id,
      user: uid,
      userName: userName,
      project: projectId,
      projectId: projectId,
      projectName: projectName,
      sprint: sprintId,
      sprintName: sprintName,
      story: storyId,
      storyTitle: storyTitle,
      hours: hours,
      billable: billable,
      description: description,
      status: 'pending',
      date: today
    });

    if (hoursEl) hoursEl.value = '0';
    if (descEl) descEl.value = '';
    if (billableEl) billableEl.checked = true;
    renderTabContent();
  }

  function renderTeamLogs(container) {
    var logs = getFilteredLogs();
    var filterProj = container.getAttribute('data-filter-project') || '';
    var filterSprint = container.getAttribute('data-filter-sprint') || '';
    if (filterProj) logs = logs.filter(function (l) { return l.project === filterProj; });
    if (filterSprint) logs = logs.filter(function (l) { return l.sprint === filterSprint; });

    var projects = getProjects();
    var sprints = getSprints();
    var projOpts = '<option value="">All projects</option>' + projects.map(function (p) { return '<option value="' + p.id + '"' + (filterProj === p.id ? ' selected' : '') + '>' + escapeHtml(p.name) + '</option>'; }).join('');
    var sprintOpts = '<option value="">All sprints</option>' + sprints.map(function (s) { return '<option value="' + s.id + '"' + (filterSprint === s.id ? ' selected' : '') + '>' + escapeHtml(s.name) + '</option>'; }).join('');

    container.innerHTML =
      '<div class="time-filter-row">' +
      '<select id="teamFilterProject">' + projOpts + '</select>' +
      '<select id="teamFilterSprint">' + sprintOpts + '</select>' +
      '</div>' +
      (logs.length === 0
        ? '<div class="time-empty">No team logs match the filters.</div>'
        : '<table class="time-log-table"><thead><tr><th>Date</th><th>User</th><th>Project</th><th>Story</th><th>Hours</th><th>Billable</th><th>Status</th></tr></thead><tbody>' +
          logs.map(function (l) {
            return '<tr><td>' + escapeHtml(l.date) + '</td><td>' + escapeHtml(l.userName) + '</td><td>' + escapeHtml(l.projectName) + '</td><td>' + escapeHtml(l.storyTitle) + '</td><td>' + l.hours + '</td><td>' + (l.billable ? 'Yes' : 'No') + '</td><td><span class="badge ' + statusClass(l.status) + '">' + l.status + '</span></td></tr>';
          }).join('') +
          '</tbody></table>');

    var projSel = document.getElementById('teamFilterProject');
    var sprintSel = document.getElementById('teamFilterSprint');
    if (projSel) projSel.addEventListener('change', function () { container.setAttribute('data-filter-project', projSel.value); renderTabContent(); });
    if (sprintSel) sprintSel.addEventListener('change', function () { container.setAttribute('data-filter-sprint', sprintSel.value); renderTabContent(); });
  }

  function renderApprovals(container) {
    var base = getFilteredLogs();
    var pending = base.filter(function (l) { return l.status === 'pending'; });
    var approved = base.filter(function (l) { return l.status === 'approved'; });
    var rejected = base.filter(function (l) { return l.status === 'rejected'; });

    var html = '<div class="time-stats">' +
      '<div class="card"><div class="card-title">Pending</div><div class="card-value">' + pending.length + '</div></div>' +
      '<div class="card"><div class="card-title">Approved</div><div class="card-value">' + approved.length + '</div></div>' +
      '<div class="card"><div class="card-title">Rejected</div><div class="card-value">' + rejected.length + '</div></div>' +
      '</div>';

    var allLogs = pending.concat(approved).concat(rejected);
    if (allLogs.length === 0) {
      html += '<div class="time-empty">No time logs to approve.</div>';
    } else {
      html += '<table class="time-log-table"><thead><tr><th>Date</th><th>User</th><th>Project</th><th>Story</th><th>Hours</th><th>Billable</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
      allLogs.forEach(function (l) {
        var actions = '';
        if (l.status === 'pending') {
          actions = '<button type="button" class="btn btn-primary btn-sm" data-action="approve" data-id="' + l.id + '">Approve</button> ' +
            '<button type="button" class="btn btn-ghost btn-sm" data-action="reject" data-id="' + l.id + '">Reject</button>';
        }
        html += '<tr><td>' + escapeHtml(l.date) + '</td><td>' + escapeHtml(l.userName) + '</td><td>' + escapeHtml(l.projectName) + '</td><td>' + escapeHtml(l.storyTitle) + '</td><td>' + l.hours + '</td><td>' + (l.billable ? 'Yes' : 'No') + '</td><td><span class="badge ' + statusClass(l.status) + '">' + l.status + '</span></td><td>' + actions + '</td></tr>';
      });
      html += '</tbody></table>';
    }
    container.innerHTML = html;

    container.querySelectorAll('[data-action="approve"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var log = TIME_LOGS.filter(function (l) { return l.id === btn.getAttribute('data-id'); })[0];
        if (log) { log.status = 'approved'; renderTabContent(); }
      });
    });
    container.querySelectorAll('[data-action="reject"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var log = TIME_LOGS.filter(function (l) { return l.id === btn.getAttribute('data-id'); })[0];
        if (log) { log.status = 'rejected'; renderTabContent(); }
      });
    });
  }

  function renderSummary(container) {
    var role = getRole();
    var logs = logsForRole();
    var month = getCurrentMonth();
    var monthLogs = logs.filter(function (l) { return l.date && l.date.slice(0, 7) === month; });

    var billable = 0;
    var nonBillable = 0;
    monthLogs.forEach(function (l) {
      if (l.billable) billable += l.hours;
      else nonBillable += l.hours;
    });

    var total = billable + nonBillable;
    var utilization = total > 0 ? (billable / total * 100).toFixed(1) : 0;

    if (role === 'accounts') {
      logs = logs.filter(function (l) { return l.status === 'approved' && l.billable; });
      monthLogs = logs.filter(function (l) { return l.date && l.date.slice(0, 7) === month; });
      billable = monthLogs.reduce(function (s, l) { return s + l.hours; }, 0);
      nonBillable = 0;
      utilization = billable;
    }

    var displayUtil = role === 'accounts' ? billable + 'h approved billable' : utilization + '%';

    container.innerHTML =
      '<div class="time-stats">' +
      '<div class="card"><div class="card-title">Total Billable (this month)</div><div class="card-value">' + billable.toFixed(1) + 'h</div></div>' +
      '<div class="card"><div class="card-title">Total Non-billable</div><div class="card-value">' + nonBillable.toFixed(1) + 'h</div></div>' +
      '<div class="card"><div class="card-title">Utilization</div><div class="card-value">' + displayUtil + '</div></div>' +
      '</div>' +
      '<p class="card-meta">Current month: ' + month + '</p>';
  }

  function setupTabs() {
    var tabs = document.querySelectorAll('.time-tab');
    var contentEl = document.getElementById('timeTabContent');
    if (!contentEl) return;

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        currentTab = tab.getAttribute('data-tab');
        tabs.forEach(function (t) { t.classList.toggle('active', t === tab); });
        contentEl.removeAttribute('data-filter-project');
        contentEl.removeAttribute('data-filter-sprint');
        renderTabContent();
      });
    });
  }

  function hideTabsByRole() {
    var role = getRole();
    var tabs = document.querySelectorAll('.time-tab');
    tabs.forEach(function (tab) {
      var t = tab.getAttribute('data-tab');
      if (t === 'team-logs' || t === 'approvals') {
        tab.style.display = (role === 'pm' || role === 'admin') ? '' : 'none';
      } else {
        tab.style.display = '';
      }
    });
  }

  function init() {
    renderModuleScopeBanner('content');
    var contentEl = document.getElementById('content');
    if (!contentEl || !contentEl.querySelector('.time-tabs')) return;
    setupTabs();
    hideTabsByRole();
    renderTabContent();
  }

  function getApprovedBillableLogs() {
    return TIME_LOGS.filter(function (l) { return l.status === 'approved' && l.billable; });
  }
  function getTimeLogs() { return getFilteredLogs(); }
  return { init: init, getApprovedBillableLogs: getApprovedBillableLogs, getTimeLogs: getTimeLogs };
})();
