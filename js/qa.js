/** QA & Defect Management: test cases, test runs, defects, dashboard. */
window.ERP_QA = (function () {
  /* ── Data ── */
  var testCases = [
    { id: 'TC-001', title: 'User can log in with valid credentials', relatedStoryId: 's1', priority: 'High', status: 'Active', expectedResult: 'User is logged in and redirected to dashboard.' },
    { id: 'TC-002', title: 'Login fails with invalid password', relatedStoryId: 's1', priority: 'High', status: 'Active', expectedResult: 'Error message shown, user not logged in.' },
    { id: 'TC-003', title: 'User can log out', relatedStoryId: 's3', priority: 'Medium', status: 'Active', expectedResult: 'Session cleared, redirected to login.' },
    { id: 'TC-004', title: 'Password reset sends email', relatedStoryId: 's2', priority: 'Medium', status: 'Active', expectedResult: 'Confirmation message and email sent.' }
  ];

  var testRuns = [
    {
      id: 'TR-001', sprintId: 'sp1', createdAt: '2025-02-10', results: [
        { testCaseId: 'TC-001', status: 'pass' },
        { testCaseId: 'TC-002', status: 'pass' },
        { testCaseId: 'TC-003', status: 'fail' },
        { testCaseId: 'TC-004', status: 'pass' }
      ]
    }
  ];

  var defects = [
    { id: 'DEF-001', title: 'Login timeout on slow network', projectId: 'p1', relatedStoryId: 's1', severity: 'High', status: 'Open', assignedDeveloperId: '' },
    { id: 'DEF-002', title: 'Export CSV encoding issue', projectId: 'p1', relatedStoryId: null, severity: 'Medium', status: 'In Progress', assignedDeveloperId: 'd1' },
    { id: 'DEF-003', title: 'Tooltip overflow on mobile', projectId: 'p1', relatedStoryId: null, severity: 'Low', status: 'Open', assignedDeveloperId: '' },
    { id: 'DEF-004', title: 'Session not cleared on logout', projectId: 'p1', relatedStoryId: 's3', severity: 'Critical', status: 'Open', assignedDeveloperId: 'd2' },
    { id: 'DEF-005', title: 'Biometric prompt crashes on Android 11', projectId: 'p2', relatedStoryId: 's7', severity: 'High', status: 'Open', assignedDeveloperId: 'd3' },
    { id: 'DEF-006', title: 'Contact import truncates long emails', projectId: 'p3', relatedStoryId: 's9', severity: 'Medium', status: 'Open', assignedDeveloperId: '' },
    { id: 'DEF-007', title: 'Rate limiter allows burst at startup', projectId: 'p4', relatedStoryId: 's12', severity: 'High', status: 'In Progress', assignedDeveloperId: 'd1' },
    { id: 'DEF-008', title: 'OAuth token expiry not validated', projectId: 'p4', relatedStoryId: 's13', severity: 'Critical', status: 'Open', assignedDeveloperId: 'd3' }
  ];

  var nextTcIndex = 5;
  var nextTrIndex = 2;
  var nextDefIndex = 9;
  var currentTab = 'testcases';
  var defectFilterSeverity = '';
  var defectFilterStatus = '';

  /* ── Helpers ── */
  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function getStories() {
    return window.ERP_Backlog && window.ERP_Backlog.getStories ? window.ERP_Backlog.getStories() : [];
  }

  function getDevelopers() {
    return window.ERP_Backlog && window.ERP_Backlog.getDevelopers ? window.ERP_Backlog.getDevelopers() : [];
  }

  function getSprints() {
    if (window.ERP_Sprint && typeof window.ERP_Sprint.getSprints === 'function') {
      return window.ERP_Sprint.getSprints();
    }
    return [{ id: 'sp1', name: 'Sprint 15' }, { id: 'sp0', name: 'Sprint 14' }];
  }

  function storyTitle(id) {
    if (!id) return '—';
    var s = getStories().filter(function (x) { return x.id === id; })[0];
    return s ? s.title : id;
  }

  function devName(id) {
    if (!id) return 'Unassigned';
    var d = getDevelopers().filter(function (x) { return x.id === id; })[0];
    return d ? d.name : id;
  }

  function tcById(id) {
    return testCases.filter(function (x) { return x.id === id; })[0];
  }

  function filteredTestCases() {
    var pid = window.currentProjectId;
    // Test cases aren't project-scoped in this demo, return all
    return testCases;
  }

  function filteredDefects() {
    var pid = window.currentProjectId;
    var list = pid ? defects.filter(function (d) { return d.projectId === pid; }) : defects.slice();
    if (defectFilterSeverity) list = list.filter(function (d) { return d.severity === defectFilterSeverity; });
    if (defectFilterStatus) list = list.filter(function (d) { return d.status === defectFilterStatus; });
    return list;
  }

  function passFailCounts() {
    var pass = 0, fail = 0;
    testRuns.forEach(function (tr) {
      tr.results.forEach(function (r) {
        if (r.status === 'pass') pass++; else fail++;
      });
    });
    return { pass: pass, fail: fail };
  }

  /* ── Tab switching ── */
  function renderQATabs() {
    var tabsEl = document.getElementById('qaTabs');
    if (!tabsEl) return;
    tabsEl.querySelectorAll('.qa-tab').forEach(function (t) {
      t.addEventListener('click', function () {
        switchTab(t.getAttribute('data-tab'));
      });
    });
  }

  function switchTab(tab) {
    currentTab = tab;
    var tabsEl = document.getElementById('qaTabs');
    if (tabsEl) {
      tabsEl.querySelectorAll('.qa-tab').forEach(function (t) {
        t.classList.toggle('active', t.getAttribute('data-tab') === tab);
      });
    }
    if (tab === 'testcases') renderTestCases();
    else if (tab === 'testruns') renderTestRuns();
    else if (tab === 'defects') renderDefects();
    else if (tab === 'dashboard') renderQADashboard();
  }

  /* ── 1. Test Cases ── */
  function renderTestCases() {
    var el = document.getElementById('qaContent');
    if (!el) return;
    var cases = filteredTestCases();
    var html = '<div class="qa-toolbar">' +
      '<button type="button" class="btn btn-primary" id="qaAddTestCaseBtn">+ Add Test Case</button>' +
      '</div>' +
      '<table class="placeholder-table">' +
      '<thead><tr><th>ID</th><th>Title</th><th>Related Story</th><th>Priority</th><th>Status</th></tr></thead>' +
      '<tbody>' +
      cases.map(function (tc) {
        return '<tr>' +
          '<td>' + escapeHtml(tc.id) + '</td>' +
          '<td>' + escapeHtml(tc.title) + '</td>' +
          '<td>' + escapeHtml(storyTitle(tc.relatedStoryId)) + '</td>' +
          '<td>' + escapeHtml(tc.priority) + '</td>' +
          '<td>' + escapeHtml(tc.status) + '</td>' +
          '</tr>';
      }).join('') +
      '</tbody></table>';
    el.innerHTML = html;

    var btn = document.getElementById('qaAddTestCaseBtn');
    if (btn) btn.addEventListener('click', openTestCaseModal);
  }

  function openTestCaseModal() {
    document.getElementById('tcTitle').value = '';
    document.getElementById('tcStory').value = '';
    document.getElementById('tcPriority').value = 'Medium';
    document.getElementById('tcExpected').value = '';
    // Populate story dropdown
    var storySelect = document.getElementById('tcStory');
    var stories = getStories();
    storySelect.innerHTML = '<option value="">— None —</option>' + stories.map(function (s) {
      return '<option value="' + s.id + '">' + escapeHtml(s.id + ': ' + (s.title || '').slice(0, 40)) + '</option>';
    }).join('');
    document.getElementById('qaModalTestCase').classList.add('open');
  }

  function saveTestCase() {
    var title = (document.getElementById('tcTitle') || {}).value;
    if (!title || !title.trim()) return;
    var id = 'TC-' + String(nextTcIndex++).padStart(3, '0');
    testCases.push({
      id: id,
      title: title.trim(),
      relatedStoryId: (document.getElementById('tcStory') || {}).value || null,
      priority: (document.getElementById('tcPriority') || {}).value || 'Medium',
      status: 'Active',
      expectedResult: (document.getElementById('tcExpected') || {}).value.trim()
    });
    document.getElementById('qaModalTestCase').classList.remove('open');
    switchTab(currentTab);
  }

  /* ── 2. Test Runs ── */
  function renderTestRuns() {
    var el = document.getElementById('qaContent');
    if (!el) return;
    var sprints = getSprints();
    var html = '<div class="qa-toolbar">' +
      '<label>Select Sprint:</label>' +
      '<select id="qaRunSprintSelect">' +
      sprints.map(function (s) {
        return '<option value="' + s.id + '">' + escapeHtml(s.name) + '</option>';
      }).join('') +
      '</select>' +
      '<button type="button" class="btn btn-primary" id="qaRunTestsBtn">Run Tests</button>' +
      '</div>' +
      '<div id="qaRunResults"></div>';
    el.innerHTML = html;

    // Show existing run for selected sprint
    var sprintSelect = document.getElementById('qaRunSprintSelect');
    showRunResults(sprintSelect.value);

    sprintSelect.addEventListener('change', function () {
      showRunResults(sprintSelect.value);
    });

    var runBtn = document.getElementById('qaRunTestsBtn');
    if (runBtn) {
      runBtn.addEventListener('click', function () {
        var sid = sprintSelect.value;
        // Create a new run with all test cases defaulting to pass
        var runId = 'TR-' + String(nextTrIndex++).padStart(3, '0');
        testRuns.push({
          id: runId,
          sprintId: sid,
          createdAt: new Date().toISOString().slice(0, 10),
          results: testCases.map(function (tc) {
            return { testCaseId: tc.id, status: 'pass' };
          })
        });
        showRunResults(sid);
      });
    }
  }

  function showRunResults(sprintId) {
    var container = document.getElementById('qaRunResults');
    if (!container) return;
    var run = null;
    for (var i = testRuns.length - 1; i >= 0; i--) {
      if (testRuns[i].sprintId === sprintId) { run = testRuns[i]; break; }
    }
    if (!run) {
      container.innerHTML = '<p class="card-meta">No test run for this sprint yet. Click "Run Tests" to execute.</p>';
      return;
    }
    container.innerHTML = '<h3 style="font-size:14px;margin:0 0 12px;">Run ' + escapeHtml(run.id) + ' · ' + escapeHtml(run.createdAt) + '</h3>' +
      run.results.map(function (r, idx) {
        var tc = tcById(r.testCaseId);
        var tcTitle = tc ? tc.title : r.testCaseId;
        return '<div class="qa-testrun-row ' + r.status + '" data-run-id="' + run.id + '" data-idx="' + idx + '">' +
          '<div class="tr-info"><strong>' + escapeHtml(tcTitle) + '</strong> (' + escapeHtml(r.testCaseId) + ')</div>' +
          '<div class="tr-actions">' +
          '<button type="button" class="btn btn-ghost btn-sm qa-mark-pass">Pass</button>' +
          '<button type="button" class="btn btn-ghost btn-sm qa-mark-fail">Fail</button>' +
          '<span class="badge ' + (r.status === 'pass' ? 'badge-green' : 'badge-red') + '">' + r.status + '</span>' +
          (r.status === 'fail' ? '<button type="button" class="btn btn-ghost btn-sm qa-create-defect-run" data-tc="' + r.testCaseId + '" data-story="' + (tc ? tc.relatedStoryId || '' : '') + '">Create Defect</button>' : '') +
          '</div></div>';
      }).join('');

    // Mark pass buttons
    container.querySelectorAll('.qa-mark-pass').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var row = btn.closest('.qa-testrun-row');
        var runId = row.getAttribute('data-run-id');
        var idx = parseInt(row.getAttribute('data-idx'), 10);
        var r = testRuns.filter(function (tr) { return tr.id === runId; })[0];
        if (r && r.results[idx]) {
          r.results[idx].status = 'pass';
          showRunResults(document.getElementById('qaRunSprintSelect').value);
        }
      });
    });

    // Mark fail buttons
    container.querySelectorAll('.qa-mark-fail').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var row = btn.closest('.qa-testrun-row');
        var runId = row.getAttribute('data-run-id');
        var idx = parseInt(row.getAttribute('data-idx'), 10);
        var r = testRuns.filter(function (tr) { return tr.id === runId; })[0];
        if (r && r.results[idx]) {
          r.results[idx].status = 'fail';
          showRunResults(document.getElementById('qaRunSprintSelect').value);
        }
      });
    });

    // Create defect from failed run
    container.querySelectorAll('.qa-create-defect-run').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tcId = btn.getAttribute('data-tc');
        var tc = tcById(tcId);
        var prefTitle = tc ? 'Failed: ' + tc.title : '';
        openDefectModal(tcId, btn.getAttribute('data-story') || null, prefTitle);
      });
    });
  }

  /* ── 3. Defects ── */
  function renderDefects() {
    var el = document.getElementById('qaContent');
    if (!el) return;
    var list = filteredDefects();
    var statusOptions = ['Open', 'In Progress', 'Retest', 'Closed'];
    var html = '<div class="qa-toolbar">' +
      '<div class="qa-filters">' +
      '<label>Severity:</label>' +
      '<select id="qaFilterSeverity">' +
      '<option value="">All</option><option value="Critical">Critical</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>' +
      '</select>' +
      '<label>Status:</label>' +
      '<select id="qaFilterStatus">' +
      '<option value="">All</option>' + statusOptions.map(function (s) { return '<option value="' + s + '">' + s + '</option>'; }).join('') +
      '</select>' +
      '</div>' +
      '<button type="button" class="btn btn-primary" id="qaAddDefectBtn">+ Add Defect</button>' +
      '</div>' +
      '<table class="placeholder-table">' +
      '<thead><tr><th>ID</th><th>Title</th><th>Related Story</th><th>Severity</th><th>Status</th><th>Assigned Developer</th><th>Actions</th></tr></thead>' +
      '<tbody>' +
      list.map(function (d) {
        var sevClass = 'qa-severity-' + (d.severity || 'medium').toLowerCase();
        var actionBtns = statusOptions.map(function (s) {
          return '<button type="button" class="btn btn-ghost btn-sm qa-def-status' + (d.status === s ? ' active' : '') + '" data-def="' + d.id + '" data-status="' + s + '" style="padding:3px 6px;font-size:11px;">' + s + '</button>';
        }).join(' ');
        return '<tr>' +
          '<td>' + escapeHtml(d.id) + '</td>' +
          '<td>' + escapeHtml(d.title) + '</td>' +
          '<td>' + escapeHtml(storyTitle(d.relatedStoryId)) + '</td>' +
          '<td><span class="badge ' + sevClass + '">' + escapeHtml(d.severity) + '</span></td>' +
          '<td>' + escapeHtml(d.status) + '</td>' +
          '<td>' + escapeHtml(devName(d.assignedDeveloperId)) + '</td>' +
          '<td>' + actionBtns + '</td>' +
          '</tr>';
      }).join('') +
      '</tbody></table>';
    el.innerHTML = html;

    // Severity filter
    var sevFilter = document.getElementById('qaFilterSeverity');
    if (sevFilter) {
      sevFilter.value = defectFilterSeverity;
      sevFilter.addEventListener('change', function () {
        defectFilterSeverity = sevFilter.value;
        renderDefects();
      });
    }
    // Status filter
    var statusFilter = document.getElementById('qaFilterStatus');
    if (statusFilter) {
      statusFilter.value = defectFilterStatus;
      statusFilter.addEventListener('change', function () {
        defectFilterStatus = statusFilter.value;
        renderDefects();
      });
    }
    // Add defect button
    var addBtn = document.getElementById('qaAddDefectBtn');
    if (addBtn) addBtn.addEventListener('click', function () { openDefectModal(null, null, ''); });

    // Lifecycle buttons
    el.querySelectorAll('.qa-def-status').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var defId = btn.getAttribute('data-def');
        var newStatus = btn.getAttribute('data-status');
        var d = defects.filter(function (x) { return x.id === defId; })[0];
        if (d) d.status = newStatus;
        renderDefects();
      });
    });
  }

  function openDefectModal(relatedTcId, relatedStoryId, prefTitle) {
    document.getElementById('defTitle').value = prefTitle || '';
    // Populate story dropdown
    var storySelect = document.getElementById('defStory');
    var stories = getStories();
    storySelect.innerHTML = '<option value="">— None —</option>' + stories.map(function (s) {
      return '<option value="' + s.id + '"' + (s.id === relatedStoryId ? ' selected' : '') + '>' + escapeHtml(s.id + ': ' + (s.title || '').slice(0, 40)) + '</option>';
    }).join('');
    document.getElementById('defSeverity').value = 'Medium';
    // Populate developer dropdown
    var assignSelect = document.getElementById('defAssignee');
    var devs = getDevelopers();
    assignSelect.innerHTML = '<option value="">— Unassigned —</option>' + devs.map(function (d) {
      return '<option value="' + d.id + '">' + escapeHtml(d.name) + '</option>';
    }).join('');
    var modal = document.getElementById('qaModalDefect');
    modal.setAttribute('data-related-tc', relatedTcId || '');
    modal.setAttribute('data-related-story', relatedStoryId || '');
    modal.classList.add('open');
  }

  function saveDefect() {
    var title = (document.getElementById('defTitle') || {}).value;
    if (!title || !title.trim()) return;
    var modal = document.getElementById('qaModalDefect');
    var relatedTc = modal.getAttribute('data-related-tc') || null;
    var relatedStory = (document.getElementById('defStory') || {}).value || modal.getAttribute('data-related-story') || null;
    var id = 'DEF-' + String(nextDefIndex++).padStart(3, '0');
    defects.push({
      id: id,
      title: title.trim(),
      projectId: window.currentProjectId || null,
      relatedStoryId: relatedStory || null,
      severity: (document.getElementById('defSeverity') || {}).value || 'Medium',
      status: 'Open',
      assignedDeveloperId: (document.getElementById('defAssignee') || {}).value || ''
    });
    modal.classList.remove('open');
    switchTab(currentTab);
  }

  /* ── 4. QA Dashboard ── */
  function renderQADashboard() {
    var el = document.getElementById('qaContent');
    if (!el) return;
    var pid = window.currentProjectId;
    var allDefects = pid ? defects.filter(function (d) { return d.projectId === pid; }) : defects;
    var openDefects = allDefects.filter(function (d) { return d.status !== 'Closed'; }).length;
    var criticalDefects = allDefects.filter(function (d) { return d.severity === 'Critical' && d.status !== 'Closed'; }).length;
    var pf = passFailCounts();
    var totalRun = pf.pass + pf.fail;
    var passedPct = totalRun === 0 ? 0 : Math.round((pf.pass / totalRun) * 100);
    var failedPct = totalRun === 0 ? 0 : 100 - passedPct;

    el.innerHTML =
      '<div class="qa-stats">' +
      '<div class="card"><div class="card-title">Total Test Cases</div><div class="card-value">' + testCases.length + '</div></div>' +
      '<div class="card"><div class="card-title">Passed %</div><div class="card-value" style="color:#10B981">' + passedPct + '%</div></div>' +
      '<div class="card"><div class="card-title">Failed %</div><div class="card-value" style="color:#EF4444">' + failedPct + '%</div></div>' +
      '<div class="card"><div class="card-title">Open Defects</div><div class="card-value">' + openDefects + '</div></div>' +
      '<div class="card"><div class="card-title">Critical Defects</div><div class="card-value" style="color:#EF4444">' + criticalDefects + '</div></div>' +
      '</div>';
  }

  /* ── Init (single entry point) ── */
  function initQA() {
    renderModuleScopeBanner('content');

    // Tab switching
    renderQATabs();

    // Modal: Test Case
    var tcCancel = document.getElementById('qaModalTestCaseCancel');
    if (tcCancel) tcCancel.addEventListener('click', function () { document.getElementById('qaModalTestCase').classList.remove('open'); });
    var tcSave = document.getElementById('qaModalTestCaseSave');
    if (tcSave) tcSave.addEventListener('click', saveTestCase);
    var tcOverlay = document.getElementById('qaModalTestCase');
    if (tcOverlay) tcOverlay.addEventListener('click', function (e) { if (e.target === this) this.classList.remove('open'); });

    // Modal: Defect
    var defCancel = document.getElementById('qaModalDefectCancel');
    if (defCancel) defCancel.addEventListener('click', function () { document.getElementById('qaModalDefect').classList.remove('open'); });
    var defSave = document.getElementById('qaModalDefectSave');
    if (defSave) defSave.addEventListener('click', saveDefect);
    var defOverlay = document.getElementById('qaModalDefect');
    if (defOverlay) defOverlay.addEventListener('click', function (e) { if (e.target === this) this.classList.remove('open'); });

    // Default tab
    renderTestCases();
  }

  /* ── Public API ── */
  function getDefects() {
    var pid = window.currentProjectId;
    return pid ? defects.filter(function (d) { return d.projectId === pid; }) : defects;
  }

  return { init: initQA, initQA: initQA, getDefects: getDefects, testCases: testCases, defects: defects };
})();
