/** Backlog management: epics, stories, modals, detail panel. */
window.ERP_Backlog = (function () {
  var DEVELOPERS = [
    { id: 'd1', name: 'Alex Chen' },
    { id: 'd2', name: 'Sam Rivera' },
    { id: 'd3', name: 'Jordan Lee' }
  ];

  var EPICS = [
    { id: 'e1', title: 'User authentication' },
    { id: 'e2', title: 'Billing & subscriptions' },
    { id: 'e3', title: 'Dashboard & reporting' },
    { id: 'e4', title: 'CRM Contacts & Leads' },
    { id: 'e5', title: 'API & Integrations' }
  ];

  var STORIES = [
    { id: 's1', epicId: 'e1', projectId: 'p1', title: 'As a user I can log in with email', description: 'User enters email and password. System validates and issues session. Session expires after 24h.', priority: 'high', storyPoints: 5, assigneeId: 'd1', status: 'in_progress', sprintId: 'sp1', loggedTime: 4 },
    { id: 's2', epicId: 'e1', projectId: 'p1', title: 'As a user I can reset my password', description: 'Forgot password flow: email link, token valid 1h, new password form.', priority: 'medium', storyPoints: 3, assigneeId: '', status: 'backlog', sprintId: null, loggedTime: 0 },
    { id: 's3', epicId: 'e1', projectId: 'p1', title: 'As a user I can log out', description: 'Clear session and redirect to login.', priority: 'low', storyPoints: 1, assigneeId: 'd2', status: 'done', sprintId: 'sp1', loggedTime: 1 },
    { id: 's4', epicId: 'e2', projectId: 'p1', title: 'Stripe integration for payments', description: 'Integrate Stripe SDK. Support card and SEPA. Webhook for successful payment.', priority: 'high', storyPoints: 8, assigneeId: 'd1', status: 'backlog', sprintId: null, loggedTime: 0 },
    { id: 's5', epicId: 'e2', projectId: 'p1', title: 'Subscription plans CRUD', description: 'Admin can create/edit plans. Display on pricing page.', priority: 'medium', storyPoints: 5, assigneeId: '', status: 'backlog', sprintId: null, loggedTime: 0 },
    { id: 's6', epicId: 'e3', projectId: 'p1', title: 'Main dashboard widgets', description: 'Cards for key metrics: revenue, users, active sessions. Configurable layout.', priority: 'high', storyPoints: 8, assigneeId: 'd2', status: 'to_do', sprintId: 'sp1', loggedTime: 0 },
    { id: 's7', epicId: 'e1', projectId: 'p2', title: 'Mobile app login flow', description: 'Native login screen with biometric option.', priority: 'high', storyPoints: 5, assigneeId: 'd3', status: 'backlog', sprintId: null, loggedTime: 0 },
    { id: 's8', epicId: 'e3', projectId: 'p2', title: 'Offline sync for dashboard', description: 'Cache data locally and sync when online.', priority: 'medium', storyPoints: 8, assigneeId: '', status: 'backlog', sprintId: null, loggedTime: 0 },
    { id: 's9', epicId: 'e4', projectId: 'p3', title: 'Contact import from CSV', description: 'Bulk import contacts with field mapping.', priority: 'high', storyPoints: 5, assigneeId: 'd1', status: 'in_progress', sprintId: 'sp3', loggedTime: 3 },
    { id: 's10', epicId: 'e4', projectId: 'p3', title: 'Lead scoring rules engine', description: 'Configure rules for automatic lead scoring.', priority: 'medium', storyPoints: 8, assigneeId: 'd2', status: 'backlog', sprintId: null, loggedTime: 0 },
    { id: 's11', epicId: 'e4', projectId: 'p3', title: 'Contact merge and dedupe', description: 'Merge duplicate contacts with conflict resolution.', priority: 'medium', storyPoints: 5, assigneeId: '', status: 'to_do', sprintId: 'sp3', loggedTime: 0 },
    { id: 's12', epicId: 'e5', projectId: 'p4', title: 'Rate limiting middleware', description: 'Throttle requests per API key and IP.', priority: 'high', storyPoints: 5, assigneeId: 'd1', status: 'done', sprintId: 'sp4', loggedTime: 5 },
    { id: 's13', epicId: 'e5', projectId: 'p4', title: 'OAuth2 client credentials flow', description: 'Support client_credentials grant for machine-to-machine.', priority: 'high', storyPoints: 8, assigneeId: 'd3', status: 'in_progress', sprintId: 'sp4', loggedTime: 4 },
    { id: 's14', epicId: 'e5', projectId: 'p4', title: 'API versioning (v1/v2)', description: 'Path-based versioning with deprecation headers.', priority: 'medium', storyPoints: 5, assigneeId: '', status: 'backlog', sprintId: null, loggedTime: 0 },
    { id: 's15', epicId: 'e3', projectId: 'p5', title: 'Custom chart builder', description: 'Drag-and-drop charts with filters.', priority: 'high', storyPoints: 13, assigneeId: 'd2', status: 'backlog', sprintId: null, loggedTime: 0 },
    { id: 's16', epicId: 'e3', projectId: 'p5', title: 'Export to PDF/Excel', description: 'Export dashboards and tables.', priority: 'medium', storyPoints: 5, assigneeId: '', status: 'backlog', sprintId: null, loggedTime: 0 }
  ];

  var STORY_HISTORY = [
    { date: '2025-02-14 10:30', text: 'Story created' },
    { date: '2025-02-14 11:00', text: 'Assigned to Alex Chen' },
    { date: '2025-02-15 09:15', text: 'Status changed to In Sprint' },
    { date: '2025-02-16 14:00', text: 'Description updated' }
  ];

  var nextEpicId = 10;
  var nextStoryId = 17;
  var selectedEpicId = null;
  var selectedStoryId = null;
  var editingStoryId = null;

  function getFilteredStories() {
    var pid = window.currentProjectId;
    return pid ? STORIES.filter(function (s) { return s.projectId === pid; }) : STORIES;
  }

  function pointsForEpic(epicId) {
    return getFilteredStories().filter(function (s) { return s.epicId === epicId; }).reduce(function (sum, s) { return sum + (s.storyPoints || 0); }, 0);
  }

  function totalBacklogPoints() {
    return getFilteredStories().reduce(function (sum, s) { return sum + (s.storyPoints || 0); }, 0);
  }

  function getDeveloperName(id) {
    if (!id) return 'Unassigned';
    var d = DEVELOPERS.filter(function (x) { return x.id === id; })[0];
    return d ? d.name : 'Unknown';
  }

  function priorityClass(p) {
    return p === 'high' ? 'badge-red' : p === 'medium' ? 'badge-amber' : 'badge-gray';
  }

  function statusLabel(s) {
    if (s === 'backlog') return 'Backlog';
    if (s === 'done' || s === 'release_ready') return 'Done';
    if (s === 'to_do' || s === 'in_progress' || s === 'review' || s === 'in_sprint') return 'In Sprint';
    return s || 'Backlog';
  }

  function statusClass(s) {
    if (s === 'done' || s === 'release_ready') return 'badge-green';
    if (s === 'in_progress' || s === 'review' || s === 'in_sprint') return 'badge-amber';
    if (s === 'to_do') return 'badge-blue';
    return 'badge-blue';
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderEpics() {
    var totalPointsEl = document.getElementById('backlogTotalPoints');
    var epicsListEl = document.getElementById('backlogEpicsList');
    if (!totalPointsEl || !epicsListEl) return;
    totalPointsEl.textContent = totalBacklogPoints();
    var filtered = getFilteredStories();
    var epicsWithStories = EPICS.filter(function (e) { return filtered.some(function (s) { return s.epicId === e.id; }); });
    var html = '';
    epicsWithStories.forEach(function (epic) {
      var pts = pointsForEpic(epic.id);
      var active = selectedEpicId === epic.id ? ' active' : '';
      html += '<div class="backlog-epic-item' + active + '" data-epic-id="' + epic.id + '"><div class="backlog-epic-name">' + escapeHtml(epic.title) + '</div><div class="backlog-epic-points">' + pts + ' pts</div></div>';
    });
    epicsListEl.innerHTML = html || '<div class="backlog-empty">No epics yet. Add one above.</div>';
    epicsListEl.querySelectorAll('.backlog-epic-item').forEach(function (el) {
      el.addEventListener('click', function () {
        selectedEpicId = el.getAttribute('data-epic-id');
        selectedStoryId = null;
        renderEpics();
        renderStories();
        closeDetail();
      });
    });
  }

  function renderStories() {
    var storiesListEl = document.getElementById('backlogStoriesList');
    var storiesTitleEl = document.getElementById('backlogStoriesTitle');
    var storiesEmptyEl = document.getElementById('backlogStoriesEmpty');
    var addStoryBtn = document.getElementById('backlogAddStoryBtn');
    if (!storiesListEl) return;
    if (!selectedEpicId) {
      storiesListEl.innerHTML = '';
      if (storiesEmptyEl) storiesEmptyEl.style.display = 'flex';
      if (addStoryBtn) addStoryBtn.style.display = 'none';
      if (storiesTitleEl) storiesTitleEl.textContent = 'Stories';
      return;
    }
    if (storiesEmptyEl) storiesEmptyEl.style.display = 'none';
    if (addStoryBtn) addStoryBtn.style.display = 'block';
    var epic = EPICS.filter(function (e) { return e.id === selectedEpicId; })[0];
    if (storiesTitleEl) storiesTitleEl.textContent = epic ? epic.title + ' — Stories' : 'Stories';
    var list = getFilteredStories().filter(function (s) { return s.epicId === selectedEpicId; });
    var html = '';
    list.forEach(function (story) {
      var sel = selectedStoryId === story.id ? ' selected' : '';
      html += '<div class="backlog-story-card' + sel + '" data-story-id="' + story.id + '">' +
        '<div class="story-title">' + escapeHtml(story.title) + '</div>' +
        '<div class="backlog-story-meta">' +
        '<span class="badge ' + priorityClass(story.priority) + '">' + story.priority + '</span>' +
        '<span class="badge badge-gray">' + (story.storyPoints || 0) + ' pts</span>' +
        '<span class="badge ' + statusClass(story.status) + '">' + statusLabel(story.status) + '</span>' +
        '</div></div>';
    });
    storiesListEl.innerHTML = html || '<div class="backlog-empty">No stories in this epic. Add one.</div>';
    storiesListEl.querySelectorAll('.backlog-story-card').forEach(function (el) {
      el.addEventListener('click', function () {
        selectedStoryId = el.getAttribute('data-story-id');
        renderStories();
        openDetail(selectedStoryId);
      });
    });
  }

  function openDetail(storyId) {
    var story = getFilteredStories().filter(function (s) { return s.id === storyId; })[0];
    if (!story) return;
    var layout = document.getElementById('backlogLayout');
    var detailPanel = document.getElementById('backlogDetailPanel');
    var detailTitle = document.getElementById('backlogDetailTitle');
    var detailBody = document.getElementById('backlogDetailBody');
    if (!detailPanel || !detailBody) return;
    detailPanel.classList.remove('closed');
    if (layout) {
      layout.classList.remove('detail-closed');
      layout.classList.add('detail-open');
    }
    if (detailTitle) detailTitle.textContent = story.title;
    detailBody.innerHTML =
      '<div class="backlog-detail-section"><h4>Description</h4><p>' + escapeHtml(story.description || '—') + '</p></div>' +
      '<div class="backlog-detail-section"><h4>Assigned</h4><p>' + escapeHtml(getDeveloperName(story.assigneeId)) + '</p></div>' +
      '<div class="backlog-detail-section"><h4>History</h4><ul class="backlog-detail-history">' +
      STORY_HISTORY.map(function (h) { return '<li><strong>' + escapeHtml(h.date) + '</strong> ' + escapeHtml(h.text) + '</li>'; }).join('') +
      '</ul></div>' +
      '<div class="backlog-detail-section"><button type="button" class="btn btn-primary" id="backlogDetailEditBtn">Edit</button></div>';
    var editBtn = document.getElementById('backlogDetailEditBtn');
    if (editBtn) editBtn.addEventListener('click', function () { openEditStoryModal(storyId); });
  }

  function closeDetail() {
    var layout = document.getElementById('backlogLayout');
    var detailPanel = document.getElementById('backlogDetailPanel');
    if (detailPanel) detailPanel.classList.add('closed');
    if (layout) {
      layout.classList.add('detail-closed');
      layout.classList.remove('detail-open');
    }
    selectedStoryId = null;
  }

  function openAddEpicModal() {
    var el = document.getElementById('epicTitle');
    var overlay = document.getElementById('modalAddEpic');
    if (el) el.value = '';
    if (overlay) overlay.classList.add('open');
  }

  function openAddStoryModal() {
    editingStoryId = null;
    document.getElementById('storyTitle').value = '';
    document.getElementById('storyDescription').value = '';
    document.getElementById('storyPriority').value = 'medium';
    document.getElementById('storyPoints').value = '5';
    document.getElementById('storyAssignee').value = '';
    var epicSelect = document.getElementById('storyEpic');
    if (epicSelect) epicSelect.innerHTML = EPICS.map(function (e) { return '<option value="' + e.id + '"' + (e.id === selectedEpicId ? ' selected' : '') + '>' + escapeHtml(e.title) + '</option>'; }).join('');
    var assignSelect = document.getElementById('storyAssignee');
    if (assignSelect) assignSelect.innerHTML = '<option value="">— Unassigned —</option>' + DEVELOPERS.map(function (d) { return '<option value="' + d.id + '">' + escapeHtml(d.name) + '</option>'; }).join('');
    document.getElementById('modalAddStory').classList.add('open');
  }

  function openEditStoryModal(storyId) {
    var story = getFilteredStories().filter(function (s) { return s.id === storyId; })[0];
    if (!story) return;
    editingStoryId = storyId;
    document.getElementById('storyTitle').value = story.title;
    document.getElementById('storyDescription').value = story.description || '';
    document.getElementById('storyPriority').value = story.priority || 'medium';
    document.getElementById('storyPoints').value = String(story.storyPoints || 5);
    var assignSelect = document.getElementById('storyAssignee');
    if (assignSelect) {
      assignSelect.innerHTML = '<option value="">— Unassigned —</option>' + DEVELOPERS.map(function (d) { return '<option value="' + d.id + '">' + escapeHtml(d.name) + '</option>'; }).join('');
      assignSelect.value = story.assigneeId || '';
    }
    var epicSelect = document.getElementById('storyEpic');
    if (epicSelect) epicSelect.innerHTML = EPICS.map(function (e) { return '<option value="' + e.id + '"' + (e.id === story.epicId ? ' selected' : '') + '>' + escapeHtml(e.title) + '</option>'; }).join('');
    var modal = document.getElementById('modalAddStory');
    if (modal) {
      var h2 = modal.querySelector('.modal-header h2');
      if (h2) h2.textContent = 'Edit Story';
      modal.classList.add('open');
    }
  }

  function closeAddEpicModal() {
    var overlay = document.getElementById('modalAddEpic');
    if (overlay) overlay.classList.remove('open');
  }

  function closeAddStoryModal() {
    var overlay = document.getElementById('modalAddStory');
    if (overlay) {
      overlay.classList.remove('open');
      var h2 = overlay.querySelector('.modal-header h2');
      if (h2) h2.textContent = 'Add Story';
    }
    editingStoryId = null;
  }

  function init() {
    renderModuleScopeBanner('content');
    var layout = document.getElementById('backlogLayout');
    var detailPanel = document.getElementById('backlogDetailPanel');
    var detailBody = document.getElementById('backlogDetailBody');
    var detailTitle = document.getElementById('backlogDetailTitle');
    var detailClose = document.getElementById('backlogDetailClose');
    var addEpicBtn = document.getElementById('backlogAddEpicBtn');
    var addStoryBtn = document.getElementById('backlogAddStoryBtn');

    if (!selectedEpicId && EPICS.length) selectedEpicId = EPICS[0].id;

    if (detailClose) {
      detailClose.addEventListener('click', function () {
        closeDetail();
        renderStories();
      });
    }
    if (addEpicBtn) addEpicBtn.addEventListener('click', openAddEpicModal);
    if (addStoryBtn) addStoryBtn.addEventListener('click', openAddStoryModal);

    var cancelEpic = document.getElementById('modalAddEpicCancel');
    var saveEpic = document.getElementById('modalAddEpicSave');
    if (cancelEpic) cancelEpic.addEventListener('click', closeAddEpicModal);
    if (saveEpic) saveEpic.addEventListener('click', function () {
      var titleEl = document.getElementById('epicTitle');
      var title = titleEl ? titleEl.value.trim() : '';
      if (!title) return;
      var id = 'e' + (nextEpicId++);
      EPICS.push({ id: id, title: title });
      closeAddEpicModal();
      selectedEpicId = id;
      selectedStoryId = null;
      renderEpics();
      renderStories();
    });

    var cancelStory = document.getElementById('modalAddStoryCancel');
    var saveStory = document.getElementById('modalAddStorySave');
    if (cancelStory) cancelStory.addEventListener('click', closeAddStoryModal);
    if (saveStory) saveStory.addEventListener('click', function () {
      var titleEl = document.getElementById('storyTitle');
      var title = titleEl ? titleEl.value.trim() : '';
      if (!title) return;
      var epicIdEl = document.getElementById('storyEpic');
      var epicId = epicIdEl ? epicIdEl.value : '';
      if (!epicId) return;
      if (editingStoryId) {
        var story = STORIES.filter(function (s) { return s.id === editingStoryId; })[0];
        if (story) {
          story.title = title;
          story.description = (document.getElementById('storyDescription') || {}).value.trim();
          story.priority = (document.getElementById('storyPriority') || {}).value;
          story.storyPoints = parseInt((document.getElementById('storyPoints') || {}).value, 10);
          story.assigneeId = (document.getElementById('storyAssignee') || {}).value || '';
          story.epicId = epicId;
        }
        closeAddStoryModal();
        renderEpics();
        renderStories();
        if (selectedStoryId === editingStoryId && detailBody) {
          if (detailTitle) detailTitle.textContent = title;
          var sections = detailBody.querySelectorAll('.backlog-detail-section');
          if (sections[0]) { var p = sections[0].querySelector('p'); if (p) p.textContent = story.description || '—'; }
          if (sections[1]) { var p2 = sections[1].querySelector('p'); if (p2) p2.textContent = getDeveloperName(story.assigneeId); }
        }
      } else {
        var id = 's' + (nextStoryId++);
        STORIES.push({
          id: id,
          epicId: epicId,
          projectId: window.currentProjectId || null,
          title: title,
          description: (document.getElementById('storyDescription') || {}).value.trim(),
          priority: (document.getElementById('storyPriority') || {}).value,
          storyPoints: parseInt((document.getElementById('storyPoints') || {}).value, 10),
          assigneeId: (document.getElementById('storyAssignee') || {}).value || '',
          status: 'backlog',
          sprintId: null,
          loggedTime: 0
        });
        closeAddStoryModal();
        selectedEpicId = epicId;
        renderEpics();
        renderStories();
      }
    });

    var overlayEpic = document.getElementById('modalAddEpic');
    var overlayStory = document.getElementById('modalAddStory');
    if (overlayEpic) overlayEpic.addEventListener('click', function (e) { if (e.target === this) closeAddEpicModal(); });
    if (overlayStory) overlayStory.addEventListener('click', function (e) { if (e.target === this) closeAddStoryModal(); });

    renderEpics();
    renderStories();
  }

  function getStories() { return getFilteredStories(); }
  function getDevelopers() { return DEVELOPERS; }
  function updateStory(id, updates) {
    var s = STORIES.filter(function (x) { return x.id === id; })[0];
    if (s) { for (var k in updates) if (updates.hasOwnProperty(k)) s[k] = updates[k]; }
  }

  return { init: init, getStories: getStories, getDevelopers: getDevelopers, updateStory: updateStory };
})();
