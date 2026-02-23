/** Projects: clickable cards with quick actions. */
window.ERP_Projects = (function () {
  function getProjects() {
    return (window.ERP_DATA && window.ERP_DATA.projects) || [];
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function init() {
    var grid = document.getElementById('projectsGrid');
    if (!grid) return;

    var projects = getProjects();
    var loadSection = window.ERP && window.ERP.loadSection ? window.ERP.loadSection : function () {};

    var html = projects.map(function (p) {
      var meta = (p.client || '') + (p.meta ? ' · ' + p.meta : '');
      return '<div class="card project-card" data-project-id="' + escapeHtml(p.id) + '">' +
        '<div class="card-title">' + escapeHtml(p.name) + '</div>' +
        '<div class="card-meta">' + escapeHtml(meta) + '</div>' +
        '<div class="card-value project-status" style="font-size:1rem;color:var(--text);">' + escapeHtml(p.status || '—') + '</div>' +
        '<div class="project-actions">' +
        '<button type="button" class="btn btn-primary btn-sm" data-action="backlog">Open Backlog</button> ' +
        '<button type="button" class="btn btn-ghost btn-sm" data-action="sprints">View Sprint</button> ' +
        '<button type="button" class="btn btn-ghost btn-sm" data-action="qa-defects">View QA</button> ' +
        '<button type="button" class="btn btn-ghost btn-sm" data-action="time-tracking">View Time</button> ' +
        '<button type="button" class="btn btn-ghost btn-sm" data-action="invoices">View Invoices</button>' +
        '</div></div>';
    }).join('');

    grid.innerHTML = html || '<p class="card-meta">No projects.</p>';

    grid.querySelectorAll('.project-card').forEach(function (card) {
      var projectId = card.getAttribute('data-project-id');
      card.style.cursor = 'pointer';
      card.addEventListener('click', function (e) {
        if (e.target.closest('button')) return;
        if (typeof setCurrentProject === 'function') setCurrentProject(projectId);
        loadSection('backlog');
      });
    });

    grid.querySelectorAll('.project-actions button').forEach(function (btn) {
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

  return { init: init };
})();
