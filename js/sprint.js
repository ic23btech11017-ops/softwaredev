/** Sprint management: list, planning, Kanban, analytics, completion. */
window.ERP_Sprint = (function () {
  var PREVIOUS_SPRINT_VELOCITY = 21;
  var SPRINTS = [
    { id: 'sp1', name: 'Sprint 15', projectId: 'p1', startDate: '2025-01-20', endDate: '2025-02-02', duration: 14, status: 'active', velocity: PREVIOUS_SPRINT_VELOCITY },
    { id: 'sp0', name: 'Sprint 14', projectId: 'p1', startDate: '2025-01-06', endDate: '2025-01-19', duration: 14, status: 'completed', velocity: PREVIOUS_SPRINT_VELOCITY },
    { id: 'sp2', name: 'Sprint 1', projectId: 'p2', startDate: '2025-02-10', endDate: '2025-02-23', duration: 14, status: 'planned', velocity: PREVIOUS_SPRINT_VELOCITY },
    { id: 'sp3', name: 'Sprint 8', projectId: 'p3', startDate: '2025-02-03', endDate: '2025-02-16', duration: 14, status: 'active', velocity: PREVIOUS_SPRINT_VELOCITY },
    { id: 'sp4', name: 'Sprint 3', projectId: 'p4', startDate: '2025-02-01', endDate: '2025-02-14', duration: 14, status: 'active', velocity: PREVIOUS_SPRINT_VELOCITY }
  ];
  var nextSprintId = 16;
  var selectedSprintId = null;
  var currentTab = 'planning';

  var KANBAN_COLUMNS = [
    { id: 'to_do', label: 'To Do' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'review', label: 'Review' },
    { id: 'done', label: 'Done' }
  ];

  function getStories() {
    return window.ERP_Backlog && window.ERP_Backlog.getStories ? window.ERP_Backlog.getStories() : [];
  }

  function getDevelopers() {
    return window.ERP_Backlog && window.ERP_Backlog.getDevelopers ? window.ERP_Backlog.getDevelopers() : [];
  }

  function updateStory(id, updates) {
    if (window.ERP_Backlog && window.ERP_Backlog.updateStory) {
      window.ERP_Backlog.updateStory(id, updates);
    }
  }

  function getDeveloperName(id) {
    var devs = getDevelopers();
    if (!id) return 'Unassigned';
    var d = devs.filter(function (x) { return x.id === id; })[0];
    return d ? d.name : 'Unknown';
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function statusLabel(status) {
    return status === 'planned' ? 'Planned' : status === 'active' ? 'Active' : 'Completed';
  }

  function statusClass(status) {
    return status === 'planned' ? 'planned' : status === 'active' ? 'active' : 'completed';
  }

  function getFilteredSprints() {
    var pid = window.currentProjectId;
    return pid ? SPRINTS.filter(function (s) { return s.projectId === pid; }) : SPRINTS;
  }

  function renderSprintList() {
    var listEl = document.getElementById('sprintList');
    var detailEl = document.getElementById('sprintDetail');
    if (!listEl) return;
    var list = getFilteredSprints();
    var html = '';
    list.forEach(function (sp) {
      var active = selectedSprintId === sp.id ? ' active' : '';
      html += '<div class="sprint-list-item' + active + '" data-sprint-id="' + sp.id + '">' +
        '<div class="sprint-name">' + escapeHtml(sp.name) + '</div>' +
        '<div class="sprint-meta">' + (sp.startDate || '') + ' – ' + (sp.endDate || '') + ' · ' + (sp.duration || 14) + ' days</div>' +
        '<span class="sprint-status ' + statusClass(sp.status) + '">' + statusLabel(sp.status) + '</span>' +
        '</div>';
    });
    listEl.innerHTML = html || '<p class="card-meta">No sprints. Create one above.</p>';
    listEl.querySelectorAll('.sprint-list-item').forEach(function (el) {
      el.addEventListener('click', function () {
        selectedSprintId = el.getAttribute('data-sprint-id');
        renderSprintList();
        renderSprintDetail();
      });
    });
    if (detailEl) detailEl.style.display = selectedSprintId ? 'block' : 'none';
  }

  function getSprintStories(sprintId) {
    return getStories().filter(function (s) { return s.sprintId === sprintId; });
  }

  function getBacklogStories() {
    return getStories().filter(function (s) { return s.status === 'backlog'; });
  }

  function plannedPoints(sprintId) {
    return getSprintStories(sprintId).reduce(function (sum, s) { return sum + (s.storyPoints || 0); }, 0);
  }

  function completedPoints(sprintId) {
    return getSprintStories(sprintId).filter(function (s) { return s.status === 'done' || s.status === 'release_ready'; }).reduce(function (sum, s) { return sum + (s.storyPoints || 0); }, 0);
  }

  function completionPercent(sprintId) {
    var planned = plannedPoints(sprintId);
    return planned === 0 ? 0 : Math.round((completedPoints(sprintId) / planned) * 100);
  }

  function renderSprintDetail() {
    var tabsEl = document.getElementById('sprintDetailTabs');
    var contentEl = document.getElementById('sprintDetailContent');
    if (!tabsEl || !contentEl || !selectedSprintId) return;
    var sprint = SPRINTS.filter(function (s) { return s.id === selectedSprintId; })[0];
    if (!sprint) return;

    if (sprint.status === 'completed') {
      currentTab = 'summary';
      tabsEl.innerHTML = '<button type="button" class="sprint-tab active" data-tab="summary">Summary</button>';
    } else if (sprint.status === 'active') {
      tabsEl.innerHTML =
        '<button type="button" class="sprint-tab' + (currentTab === 'board' ? ' active' : '') + '" data-tab="board">Board</button>' +
        '<button type="button" class="sprint-tab' + (currentTab === 'analytics' ? ' active' : '') + '" data-tab="analytics">Analytics</button>' +
        '<button type="button" class="btn btn-primary btn-sm" id="sprintCompleteBtn" style="margin-left:auto;">Complete Sprint</button>';
    } else {
      currentTab = 'planning';
      tabsEl.innerHTML =
        '<button type="button" class="sprint-tab active" data-tab="planning">Planning</button>' +
        '<button type="button" class="sprint-tab" data-tab="analytics">Analytics</button>' +
        (sprint.status === 'planned' ? '<button type="button" class="btn btn-primary btn-sm" id="sprintStartBtn" style="margin-left:auto;">Start Sprint</button>' : '');
    }

    tabsEl.querySelectorAll('.sprint-tab').forEach(function (el) {
      el.addEventListener('click', function () {
        currentTab = el.getAttribute('data-tab');
        renderSprintDetail();
      });
    });
    var completeBtn = document.getElementById('sprintCompleteBtn');
    if (completeBtn) completeBtn.addEventListener('click', completeSprint);
    var startBtn = document.getElementById('sprintStartBtn');
    if (startBtn) startBtn.addEventListener('click', function () {
      SPRINTS.forEach(function (s) { if (s.status === 'active') s.status = 'planned'; });
      sprint.status = 'active';
      renderSprintList();
      renderSprintDetail();
    });

    if (currentTab === 'planning') renderPlanningView(contentEl, sprint);
    else if (currentTab === 'board') renderKanbanView(contentEl, sprint);
    else if (currentTab === 'analytics') renderAnalyticsView(contentEl, sprint);
    else if (currentTab === 'summary') renderSummaryView(contentEl, sprint);
  }

  function renderPlanningView(contentEl, sprint) {
    var backlog = getBacklogStories();
    var inSprint = getSprintStories(sprint.id);
    contentEl.innerHTML =
      '<div class="sprint-planning">' +
      '<div class="sprint-planning-panel">' +
      '<h3>Backlog (status = Backlog)</h3>' +
      '<div id="sprintPlanningBacklog">' +
      backlog.map(function (s) {
        return '<div class="sprint-planning-story" data-story-id="' + s.id + '">' +
          '<div class="story-info"><div class="title">' + escapeHtml(s.title) + '</div><div class="meta">' + (s.storyPoints || 0) + ' pts · ' + escapeHtml(getDeveloperName(s.assigneeId)) + '</div></div>' +
          '<button type="button" class="btn btn-primary btn-sm add-to-sprint-btn">Add to sprint</button>' +
          '</div>';
      }).join('') +
      (backlog.length === 0 ? '<p class="card-meta">No backlog stories.</p>' : '') +
      '</div></div>' +
      '<div class="sprint-planning-panel">' +
      '<h3>Sprint stories</h3>' +
      '<div id="sprintPlanningSprint">' +
      inSprint.map(function (s) {
        return '<div class="sprint-planning-story" data-story-id="' + s.id + '">' +
          '<div class="story-info"><div class="title">' + escapeHtml(s.title) + '</div><div class="meta">' + (s.storyPoints || 0) + ' pts · ' + escapeHtml(getDeveloperName(s.assigneeId)) + '</div></div>' +
          '<button type="button" class="btn btn-ghost btn-sm remove-from-sprint-btn">Remove</button>' +
          '</div>';
      }).join('') +
      (inSprint.length === 0 ? '<p class="card-meta">No stories in this sprint.</p>' : '') +
      '</div></div></div></div>';
    contentEl.querySelectorAll('.add-to-sprint-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var storyId = btn.closest('.sprint-planning-story').getAttribute('data-story-id');
        updateStory(storyId, { sprintId: sprint.id, status: 'to_do' });
        renderSprintDetail();
      });
    });
    contentEl.querySelectorAll('.remove-from-sprint-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var storyId = btn.closest('.sprint-planning-story').getAttribute('data-story-id');
        updateStory(storyId, { sprintId: null, status: 'backlog' });
        renderSprintDetail();
      });
    });
  }

  function renderKanbanView(contentEl, sprint) {
    var stories = getSprintStories(sprint.id);
    var planned = plannedPoints(sprint.id);
    var completed = completedPoints(sprint.id);
    var pct = completionPercent(sprint.id);
    var colsHtml = KANBAN_COLUMNS.map(function (col) {
      var colStories = stories.filter(function (s) { return (s.status || 'to_do') === col.id; });
      var cardsHtml = colStories.map(function (s) {
        var idx = KANBAN_COLUMNS.findIndex(function (c) { return c.id === (s.status || 'to_do'); });
        var canPrev = idx > 0;
        var canNext = idx < KANBAN_COLUMNS.length - 1;
        var prevCol = canPrev ? KANBAN_COLUMNS[idx - 1].id : '';
        var nextCol = canNext ? KANBAN_COLUMNS[idx + 1].id : '';
        return '<div class="sprint-kanban-card" data-story-id="' + s.id + '">' +
          '<div class="card-title">' + escapeHtml(s.title) + '</div>' +
          '<div class="card-meta">' + (s.storyPoints || 0) + ' pts · ' + escapeHtml(getDeveloperName(s.assigneeId)) + ' · ' + (s.loggedTime || 0) + 'h logged</div>' +
          '<div class="card-actions">' +
          (canPrev ? '<button type="button" class="btn btn-ghost btn-sm" data-move="' + prevCol + '">← Back</button>' : '') +
          (canNext ? '<button type="button" class="btn btn-primary btn-sm" data-move="' + nextCol + '">Forward →</button>' : '') +
          '</div></div>';
      }).join('');
      return '<div class="sprint-kanban-col" data-col="' + col.id + '"><h4>' + col.label + '</h4>' + cardsHtml + '</div>';
    }).join('');
    contentEl.innerHTML =
      '<div class="sprint-analytics" style="margin-bottom:16px;">' +
      '<div class="card"><div class="card-title">Planned</div><div class="card-value">' + planned + '</div><div class="card-meta">story points</div></div>' +
      '<div class="card"><div class="card-title">Completed</div><div class="card-value">' + completed + '</div><div class="card-meta">story points</div></div>' +
      '<div class="card"><div class="card-title">Completion</div><div class="card-value">' + pct + '%</div></div>' +
      '<div class="card"><div class="card-title">Velocity</div><div class="card-value">' + (sprint.velocity || PREVIOUS_SPRINT_VELOCITY) + '</div><div class="card-meta">prev. sprint</div></div>' +
      '</div>' +
      '<div class="sprint-kanban">' + colsHtml + '</div>';
    contentEl.querySelectorAll('.sprint-kanban-card [data-move]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var storyId = btn.closest('.sprint-kanban-card').getAttribute('data-story-id');
        var newStatus = btn.getAttribute('data-move');
        updateStory(storyId, { status: newStatus });
        renderSprintDetail();
      });
    });
  }

  function renderAnalyticsView(contentEl, sprint) {
    var planned = plannedPoints(sprint.id);
    var completed = completedPoints(sprint.id);
    var pct = planned === 0 ? 0 : Math.round((completed / planned) * 100);
    var velocity = sprint.velocity || PREVIOUS_SPRINT_VELOCITY;
    contentEl.innerHTML =
      '<div class="sprint-analytics">' +
      '<div class="card"><div class="card-title">Planned Story Points</div><div class="card-value">' + planned + '</div></div>' +
      '<div class="card"><div class="card-title">Completed Story Points</div><div class="card-value">' + completed + '</div></div>' +
      '<div class="card"><div class="card-title">Sprint Completion</div><div class="card-value">' + pct + '%</div></div>' +
      '<div class="card"><div class="card-title">Velocity</div><div class="card-value">' + velocity + '</div><div class="card-meta">previous sprint</div></div>' +
      '</div>';
  }

  function renderSummaryView(contentEl, sprint) {
    var releaseReady = getStories().filter(function (s) { return s.status === 'release_ready' && s.sprintId === sprint.id; });
    contentEl.innerHTML =
      '<div class="sprint-analytics" style="margin-bottom:20px;">' +
      '<div class="card"><div class="card-title">Planned</div><div class="card-value">' + plannedPoints(sprint.id) + '</div><div class="card-meta">pts</div></div>' +
      '<div class="card"><div class="card-title">Completed</div><div class="card-value">' + completedPoints(sprint.id) + '</div><div class="card-meta">pts</div></div>' +
      '<div class="card"><div class="card-title">Completion</div><div class="card-value">' + completionPercent(sprint.id) + '%</div></div>' +
      '</div>' +
      '<div class="sprint-release-ready">' +
      '<h3>Release Ready</h3>' +
      '<ul class="sprint-summary-list">' +
      (releaseReady.length === 0 ? '<li class="card-meta">No stories in release ready.</li>' : releaseReady.map(function (s) {
        return '<li>' + escapeHtml(s.title) + ' · ' + (s.storyPoints || 0) + ' pts</li>';
      }).join('')) +
      '</ul></div>';
  }

  function completeSprint() {
    if (!selectedSprintId) return;
    var sprint = SPRINTS.filter(function (s) { return s.id === selectedSprintId; })[0];
    if (!sprint || sprint.status !== 'active') return;
    var stories = getSprintStories(sprint.id);
    stories.forEach(function (s) {
      if (s.status === 'done') {
        updateStory(s.id, { status: 'release_ready' });
      }
    });
    sprint.status = 'completed';
    renderSprintList();
    renderSprintDetail();
    showSprintSummaryModal(sprint);
  }

  function showSprintSummaryModal(sprint) {
    var planned = plannedPoints(sprint.id);
    var completed = completedPoints(sprint.id);
    var pct = completionPercent(sprint.id);
    var releaseReady = getStories().filter(function (s) { return s.status === 'release_ready' && s.sprintId === sprint.id; });
    document.getElementById('sprintSummaryTitle').textContent = 'Sprint Summary: ' + sprint.name;
    document.getElementById('sprintSummaryBody').innerHTML =
      '<div class="sprint-analytics" style="margin-bottom:16px;">' +
      '<div class="card"><div class="card-title">Planned</div><div class="card-value">' + planned + '</div><div class="card-meta">pts</div></div>' +
      '<div class="card"><div class="card-title">Completed</div><div class="card-value">' + completed + '</div><div class="card-meta">pts</div></div>' +
      '<div class="card"><div class="card-title">Completion</div><div class="card-value">' + pct + '%</div></div>' +
      '</div>' +
      '<h4 style="margin:0 0 8px;font-size:13px;">Stories moved to Release Ready</h4>' +
      '<ul class="sprint-summary-list">' +
      (releaseReady.length === 0 ? '<li class="card-meta">None</li>' : releaseReady.map(function (s) {
        return '<li>' + escapeHtml(s.title) + ' · ' + (s.storyPoints || 0) + ' pts</li>';
      }).join('')) +
      '</ul>';
    document.getElementById('sprintSummaryModal').classList.add('open');
  }

  function init() {
    renderModuleScopeBanner('content');
    var createBtn = document.getElementById('sprintCreateBtn');
    var modal = document.getElementById('sprintModal');
    var cancelBtn = document.getElementById('sprintModalCancel');
    var saveBtn = document.getElementById('sprintModalSave');
    var summaryClose = document.getElementById('sprintSummaryClose');

    if (createBtn) createBtn.addEventListener('click', function () {
      document.getElementById('sprintName').value = 'Sprint ' + nextSprintId;
      document.getElementById('sprintDuration').value = 14;
      var start = new Date();
      document.getElementById('sprintStartDate').value = start.toISOString().slice(0, 10);
      modal.classList.add('open');
    });
    if (cancelBtn) cancelBtn.addEventListener('click', function () { modal.classList.remove('open'); });
    if (saveBtn) saveBtn.addEventListener('click', function () {
      var name = (document.getElementById('sprintName') || {}).value.trim();
      var duration = parseInt((document.getElementById('sprintDuration') || {}).value, 10) || 14;
      var startDate = (document.getElementById('sprintStartDate') || {}).value;
      if (!name) return;
      var start = startDate ? new Date(startDate) : new Date();
      var end = new Date(start);
      end.setDate(end.getDate() + duration);
      var id = 'sp' + (nextSprintId++);
      SPRINTS.unshift({
        id: id,
        name: name,
        projectId: window.currentProjectId || null,
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
        duration: duration,
        status: 'planned',
        velocity: PREVIOUS_SPRINT_VELOCITY
      });
      modal.classList.remove('open');
      selectedSprintId = id;
      renderSprintList();
      renderSprintDetail();
    });
    if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) modal.classList.remove('open'); });

    if (summaryClose) summaryClose.addEventListener('click', function () {
      document.getElementById('sprintSummaryModal').classList.remove('open');
    });
    var summaryModal = document.getElementById('sprintSummaryModal');
    if (summaryModal) summaryModal.addEventListener('click', function (e) { if (e.target === summaryModal) summaryModal.classList.remove('open'); });

    var filtered = getFilteredSprints();
    var valid = filtered.some(function (s) { return s.id === selectedSprintId; });
    if (!valid) selectedSprintId = filtered.length ? filtered[0].id : null;
    renderSprintList();
    renderSprintDetail();
  }

  function getSprints() { return getFilteredSprints(); }
  return { init: init, getSprints: getSprints };
})();
