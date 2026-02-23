/** Role-based sidebar visibility. */
window.ERP_Role = (function () {
  var roleSelect, sidebar, sidebarItems, loadSection;

  function getRole() {
    return roleSelect ? roleSelect.value : 'admin';
  }

  function updateSidebarVisibility() {
    if (!sidebar || !sidebarItems.length) return;
    var role = getRole();
    for (var i = 0; i < sidebarItems.length; i++) {
      var item = sidebarItems[i];
      var roles = (item.getAttribute('data-roles') || '').split(/\s+/).filter(Boolean);
      if (roles.indexOf(role) !== -1) {
        item.classList.remove('hidden-by-role');
      } else {
        item.classList.add('hidden-by-role');
      }
    }
    var activeItem = sidebar.querySelector('.sidebar-item.active');
    if (activeItem && activeItem.classList.contains('hidden-by-role') && typeof loadSection === 'function') {
      var firstVisible = sidebar.querySelector('.sidebar-item:not(.hidden-by-role)');
      if (firstVisible) {
        loadSection(firstVisible.getAttribute('data-section'));
      }
    }
  }

  function init(roleSelectEl, sidebarEl, loadSectionFn) {
    roleSelect = roleSelectEl;
    sidebar = sidebarEl;
    loadSection = loadSectionFn;
    if (sidebar) {
      sidebarItems = sidebar.querySelectorAll('.sidebar-item') || [];
    } else {
      sidebarItems = [];
    }
    if (roleSelect) {
      roleSelect.addEventListener('change', updateSidebarVisibility);
    }
    updateSidebarVisibility();
  }

  return {
    init: init,
    getRole: getRole,
    updateSidebarVisibility: updateSidebarVisibility
  };
})();
