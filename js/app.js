/** Main app: loadSection and bootstrap. */
(function () {
  var SECTION_TO_FILE = {
    'dashboard': 'dashboard',
    'clients': 'clients',
    'projects': 'projects',
    'backlog': 'backlog',
    'sprints': 'sprints',
    'tasks': 'tasks',
    'qa-defects': 'qa',
    'resources': 'resources',
    'time-tracking': 'time',
    'invoices': 'invoices',
    'reports': 'reports',
    'integrations': 'integrations',
    'settings': 'settings'
  };

  function loadSection(sectionName) {
    var contentEl = document.getElementById('content');
    var headerTitle = document.getElementById('headerTitle');
    var sidebar = document.getElementById('sidebar');
    if (!contentEl) return;

    var file = SECTION_TO_FILE[sectionName] || sectionName;
    var url = 'sections/' + file + '.html';

    headerTitle.textContent = (window.ERP_DATA && window.ERP_DATA.sectionTitles && window.ERP_DATA.sectionTitles[sectionName]) ? window.ERP_DATA.sectionTitles[sectionName] : sectionName;

    if (sidebar) {
      var items = sidebar.querySelectorAll('.sidebar-item');
      for (var i = 0; i < items.length; i++) {
        items[i].classList.toggle('active', items[i].getAttribute('data-section') === sectionName);
      }
    }

    fetch(url)
      .then(function (res) { return res.ok ? res.text() : Promise.reject(new Error('Failed to load')); })
      .then(function (html) {
        contentEl.innerHTML = html;
        if (sectionName === 'clients' && window.ERP_Clients && typeof window.ERP_Clients.init === 'function') {
          window.ERP_Clients.init();
        }
        if (sectionName === 'projects' && window.ERP_Projects && typeof window.ERP_Projects.init === 'function') {
          window.ERP_Projects.init();
        }
        if (sectionName === 'backlog' && window.ERP_Backlog && typeof window.ERP_Backlog.init === 'function') {
          window.ERP_Backlog.init();
        }
        if (sectionName === 'sprints' && window.ERP_Sprint && typeof window.ERP_Sprint.init === 'function') {
          window.ERP_Sprint.init();
        }
        if (sectionName === 'qa-defects' && window.ERP_QA && typeof window.ERP_QA.init === 'function') {
          window.ERP_QA.init();
        }
        if (sectionName === 'time-tracking' && window.ERP_Time && typeof window.ERP_Time.init === 'function') {
          window.ERP_Time.init();
        }
        if (sectionName === 'invoices' && window.ERP_Invoice && typeof window.ERP_Invoice.init === 'function') {
          window.ERP_Invoice.init();
        }
        if (sectionName === 'reports' && window.ERP_Reports && typeof window.ERP_Reports.init === 'function') {
          window.ERP_Reports.init();
        }
      })
      .catch(function () {
        contentEl.innerHTML = '<p class="page-title">Could not load section. Serve the app from a local server (e.g. Live Server) so fetch() can load sections.</p>';
      });
  }

  window.ERP = { loadSection: loadSection };

  function boot() {
    if (typeof updateProjectLabel === 'function') updateProjectLabel();
    var sidebar = document.getElementById('sidebar');
    var roleSelect = document.getElementById('roleSelect');
    if (window.ERP_Role && window.ERP_Role.init) {
      window.ERP_Role.init(roleSelect, sidebar, loadSection);
    }
    if (window.ERP_Navigation && window.ERP_Navigation.init) {
      window.ERP_Navigation.init(sidebar, loadSection);
    }
    if (window.ERP_Role && window.ERP_Role.updateSidebarVisibility) {
      window.ERP_Role.updateSidebarVisibility();
    }
    loadSection('dashboard');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
