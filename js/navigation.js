/** Sidebar navigation – calls loadSection on item click. */
window.ERP_Navigation = (function () {
  function init(sidebarEl, loadSectionFn) {
    if (!sidebarEl || typeof loadSectionFn !== 'function') return;
    var items = sidebarEl.querySelectorAll('.sidebar-item');
    for (var i = 0; i < items.length; i++) {
      (function (item) {
        item.addEventListener('click', function () {
          if (item.classList.contains('hidden-by-role')) return;
          var sectionId = item.getAttribute('data-section');
          if (sectionId) loadSectionFn(sectionId);
        });
      })(items[i]);
    }
  }
  return { init: init };
})();
