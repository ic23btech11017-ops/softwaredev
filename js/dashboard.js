/** Dashboard: role-based cards, insight banner, activity feed, deadlines. */
window.ERP_Dashboard = (function () {

    /* ── SVG line icons (24×24, stroke-based) ── */
    var ICONS = {
        folder: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>',
        clipboard: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>',
        bug: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2l1.88 1.88M14.12 3.88L16 2M9 7.13v-1a3 3 0 116 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 014-4h4a4 4 0 014 4v3c0 3.3-2.7 6-6 6z"/><path d="M12 20v-9M6.53 9C4.6 8.8 3 7.1 3 5M6 13H2M6 17l-4 1M17.47 9c1.93-.2 3.53-1.9 3.53-4M18 13h4M18 17l4 1"/></svg>',
        dollar: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
        chart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
        users: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>',
        check: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        calendar: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
        clock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        sprint: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>',
        ban: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>',
        alert: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        file: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
        hourglass: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 00-.586-1.414L12 12l-4.414 4.414A2 2 0 007 17.828V22M7 2v4.172a2 2 0 00.586 1.414L12 12l4.414-4.414A2 2 0 0017 6.172V2"/></svg>',
        circle: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>',
        flask: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6.5L3.3 19.4A1 1 0 004.1 21h15.8a1 1 0 00.8-1.6L14 9.5V3"/></svg>',
        shield: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
    };

    /* ── helpers ── */
    function getRole() {
        return (window.ERP_Role && window.ERP_Role.getRole) ? window.ERP_Role.getRole() : 'admin';
    }
    function loadSection(s) {
        if (window.ERP && window.ERP.loadSection) window.ERP.loadSection(s);
    }
    function projects() { return (window.ERP_DATA && window.ERP_DATA.projects) || []; }
    function stories() { return (window.ERP_Backlog && window.ERP_Backlog.getStories) ? window.ERP_Backlog.getStories() : []; }
    function defects() { return (window.ERP_QA && window.ERP_QA.defects) || []; }
    function testCases() { return (window.ERP_QA && window.ERP_QA.testCases) || []; }
    function timeLogs() { return (window.ERP_Time && window.ERP_Time.getTimeLogs) ? window.ERP_Time.getTimeLogs() : []; }
    function approvedLogs() { return (window.ERP_Time && window.ERP_Time.getApprovedBillableLogs) ? window.ERP_Time.getApprovedBillableLogs() : []; }
    function invoices() { return (window.ERP_Invoice && window.ERP_Invoice.getInvoicesAll) ? window.ERP_Invoice.getInvoicesAll() : []; }
    function currentUser() { return (window.ERP_DATA && window.ERP_DATA.currentUserId) || ''; }
    function projectId() { return window.currentProjectId || null; }
    function scopeLabel() {
        var pid = projectId();
        if (!pid) return 'All Projects';
        var p = projects().filter(function (x) { return x.id === pid; })[0];
        return p ? p.name : pid;
    }

    /* ── metric calculators ── */
    function activeProjects() { return projects().filter(function (p) { return p.status === 'In progress'; }).length; }
    function openTasks() { return stories().filter(function (s) { return s.status !== 'done' && s.status !== 'release_ready'; }).length; }
    function openDefects() { return defects().filter(function (d) { return d.status === 'Open'; }).length; }
    function criticalDefects() { return defects().filter(function (d) { return d.severity === 'Critical' && d.status === 'Open'; }).length; }

    function monthlyRevenue() {
        var now = new Date();
        var m = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
        var total = 0;
        invoices().forEach(function (inv) {
            if (inv.dateCreated && inv.dateCreated.substring(0, 7) === m) total += inv.amount || 0;
        });
        return total;
    }

    function pendingInvoices() { return invoices().filter(function (i) { return i.status === 'sent' || i.status === 'pending'; }).length; }
    function overdueInvoices() {
        var today = new Date().toISOString().substring(0, 10);
        return invoices().filter(function (i) { return i.status === 'sent' && i.dueDate && i.dueDate < today; }).length;
    }

    function hoursThisWeek() {
        var now = new Date();
        var day = now.getDay() || 7;
        var monday = new Date(now);
        monday.setDate(now.getDate() - day + 1);
        var start = monday.toISOString().substring(0, 10);
        var total = 0;
        timeLogs().forEach(function (l) { if (l.date >= start) total += l.hours || 0; });
        return total;
    }

    function approvedBillableHours() {
        var total = 0;
        approvedLogs().forEach(function (l) { total += l.hours || 0; });
        return total;
    }

    function utilizationPct() {
        var devs = (window.ERP_Backlog && window.ERP_Backlog.getDevelopers) ? window.ERP_Backlog.getDevelopers() : [];
        if (!devs.length) return 0;
        var capacity = devs.length * 40;
        var logged = hoursThisWeek();
        return capacity > 0 ? Math.round((logged / capacity) * 100) : 0;
    }

    function sprintCompletion() {
        if (!window.ERP_Sprint || !window.ERP_Sprint.getSprints) return 0;
        var sprints = window.ERP_Sprint.getSprints();
        if (!sprints.length) return 0;
        var s = sprints[0];
        var sprintStories = stories().filter(function (st) { return st.sprintId === s.id; });
        if (!sprintStories.length) return 0;
        var done = sprintStories.filter(function (st) { return st.status === 'done' || st.status === 'release_ready'; });
        return Math.round((done.length / sprintStories.length) * 100);
    }

    function myTasks() {
        var uid = currentUser();
        return stories().filter(function (s) { return s.assigneeId === uid && s.status !== 'done' && s.status !== 'release_ready'; }).length;
    }
    function myDefects() {
        var uid = currentUser();
        return defects().filter(function (d) { return d.assignedDeveloperId === uid && d.status === 'Open'; }).length;
    }
    function blockedTasks() { return stories().filter(function (s) { return s.status === 'blocked'; }).length; }
    function testPassRate() {
        var tcs = testCases();
        if (!tcs.length) return 100;
        var pass = 0; var total = 0;
        if (window.ERP_QA) {
            pass = tcs.length - defects().filter(function (d) { return d.status === 'Open'; }).length;
            total = tcs.length;
        }
        if (total <= 0) return 100;
        return Math.max(0, Math.round((pass / total) * 100));
    }
    function activeTestRuns() {
        if (!window.ERP_Sprint || !window.ERP_Sprint.getSprints) return 0;
        return window.ERP_Sprint.getSprints().filter(function (sp) { return sp.status !== 'completed'; }).length || 1;
    }

    /* ── card definitions per role ── */
    function cardsForRole(role) {
        switch (role) {
            case 'pm':
                return [
                    { label: 'Sprint Completion', value: sprintCompletion() + '%', icon: ICONS.chart, section: 'sprints', color: 'var(--primary)' },
                    { label: 'Open Stories', value: openTasks(), icon: ICONS.clipboard, section: 'backlog', color: 'var(--info)' },
                    { label: 'Blocked Tasks', value: blockedTasks(), icon: ICONS.ban, section: 'tasks', color: 'var(--danger)' },
                    { label: 'Team Utilization', value: utilizationPct() + '%', icon: ICONS.users, section: 'resources', color: 'var(--warning)' },
                    { label: 'Active Projects', value: activeProjects(), icon: ICONS.folder, section: 'projects', color: 'var(--success)' },
                    { label: 'Open Defects', value: openDefects(), icon: ICONS.bug, section: 'qa-defects', color: 'var(--danger)' }
                ];
            case 'developer':
                return [
                    { label: 'My Tasks', value: myTasks(), icon: ICONS.check, section: 'tasks', color: 'var(--primary)' },
                    { label: 'Tasks Due Today', value: 0, icon: ICONS.calendar, section: 'tasks', color: 'var(--warning)' },
                    { label: 'Hours This Week', value: hoursThisWeek() + 'h', icon: ICONS.clock, section: 'time-tracking', color: 'var(--info)' },
                    { label: 'My Open Defects', value: myDefects(), icon: ICONS.bug, section: 'qa-defects', color: 'var(--danger)' },
                    { label: 'Sprint Progress', value: sprintCompletion() + '%', icon: ICONS.sprint, section: 'sprints', color: 'var(--success)' }
                ];
            case 'qa':
                return [
                    { label: 'Open Defects', value: openDefects(), icon: ICONS.bug, section: 'qa-defects', color: 'var(--danger)' },
                    { label: 'Critical Defects', value: criticalDefects(), icon: ICONS.circle, section: 'qa-defects', color: '#DC2626' },
                    { label: 'Test Pass Rate', value: testPassRate() + '%', icon: ICONS.check, section: 'qa-defects', color: 'var(--success)' },
                    { label: 'Active Test Runs', value: activeTestRuns(), icon: ICONS.flask, section: 'qa-defects', color: 'var(--info)' }
                ];
            case 'accounts':
                return [
                    { label: 'Monthly Revenue', value: '$' + monthlyRevenue().toLocaleString(), icon: ICONS.dollar, section: 'invoices', color: 'var(--success)' },
                    { label: 'Pending Invoices', value: pendingInvoices(), icon: ICONS.file, section: 'invoices', color: 'var(--warning)' },
                    { label: 'Overdue Invoices', value: overdueInvoices(), icon: ICONS.alert, section: 'invoices', color: 'var(--danger)' },
                    { label: 'Approved Billable Hrs', value: approvedBillableHours() + 'h', icon: ICONS.hourglass, section: 'time-tracking', color: 'var(--info)' }
                ];
            default: // admin
                return [
                    { label: 'Active Projects', value: activeProjects(), icon: ICONS.folder, section: 'projects', color: 'var(--primary)' },
                    { label: 'Open Tasks', value: openTasks(), icon: ICONS.clipboard, section: 'tasks', color: 'var(--info)' },
                    { label: 'Open Defects', value: openDefects(), icon: ICONS.bug, section: 'qa-defects', color: 'var(--danger)' },
                    { label: 'Revenue This Month', value: '$' + monthlyRevenue().toLocaleString(), icon: ICONS.dollar, section: 'invoices', color: 'var(--success)' },
                    { label: 'Utilization', value: utilizationPct() + '%', icon: ICONS.chart, section: 'resources', color: 'var(--warning)' },
                    { label: 'Delivery Risk', value: sprintCompletion() < 70 ? 'At Risk' : 'On Track', icon: sprintCompletion() < 70 ? ICONS.alert : ICONS.shield, section: 'sprints', color: sprintCompletion() < 70 ? 'var(--danger)' : 'var(--success)' }
                ];
        }
    }

    /* ── insight banner ── */
    function buildBanner() {
        var warnings = [];
        if (criticalDefects() > 0) warnings.push({ text: criticalDefects() + ' critical defect' + (criticalDefects() > 1 ? 's' : '') + ' open', section: 'qa-defects' });
        if (utilizationPct() > 95) warnings.push({ text: 'Team utilization at ' + utilizationPct() + '%', section: 'resources' });
        if (pendingInvoices() > 5) warnings.push({ text: pendingInvoices() + ' invoices pending', section: 'invoices' });
        if (sprintCompletion() < 70 && sprintCompletion() > 0) warnings.push({ text: 'Sprint completion at ' + sprintCompletion() + '%', section: 'sprints' });

        if (warnings.length) {
            var items = warnings.map(function (w) {
                return '<span class="dashboard-banner-item" data-section="' + w.section + '">' + w.text + '</span>';
            }).join(' &middot; ');
            return '<div class="dashboard-banner dashboard-banner-warning">' +
                '<div class="dashboard-banner-content"><span class="dashboard-banner-icon">' + ICONS.alert + '</span>' +
                '<div><strong>Attention Required</strong><div class="dashboard-banner-details">' + items + '</div></div></div>' +
                '<button class="btn btn-sm btn-primary dashboard-banner-cta" data-section="' + warnings[0].section + '">View Details</button></div>';
        }
        return '<div class="dashboard-banner dashboard-banner-success">' +
            '<div class="dashboard-banner-content"><span class="dashboard-banner-icon">' + ICONS.check + '</span>' +
            '<div><strong>Operations Running Smoothly</strong><div class="dashboard-banner-details">All systems are within normal parameters.</div></div></div></div>';
    }

    /* ── recent activity ── */
    function buildActivity() {
        var items = [];
        stories().filter(function (s) { return s.status === 'done' || s.status === 'release_ready'; }).slice(0, 3).forEach(function (s) {
            items.push({ text: 'Task completed: ' + s.title, badge: 'Done', badgeClass: 'badge-green', section: 'tasks' });
        });
        defects().filter(function (d) { return d.status === 'Open'; }).slice(0, 2).forEach(function (d) {
            items.push({ text: 'Defect created: ' + d.title, badge: d.severity, badgeClass: d.severity === 'Critical' ? 'badge-red' : 'badge-amber', section: 'qa-defects' });
        });
        invoices().slice(0, 2).forEach(function (inv) {
            items.push({ text: 'Invoice ' + inv.id + ' (' + (inv.status || 'draft') + ')', badge: inv.status || 'draft', badgeClass: inv.status === 'sent' ? 'badge-blue' : 'badge-green', section: 'invoices' });
        });

        if (!items.length) return '<div class="card"><div class="card-title">Recent Activity</div><p class="text-muted" style="padding:16px 0;">No recent activity.</p></div>';
        var html = '<div class="card"><div class="card-title">Recent Activity</div><ul class="dashboard-activity-list">';
        items.forEach(function (item) {
            html += '<li class="dashboard-activity-item" data-section="' + item.section + '">' +
                '<span class="dashboard-activity-text">' + item.text + '</span>' +
                '<span class="badge ' + item.badgeClass + '">' + item.badge + '</span></li>';
        });
        html += '</ul></div>';
        return html;
    }

    /* ── upcoming deadlines ── */
    function buildDeadlines() {
        var items = [];
        if (window.ERP_Sprint && window.ERP_Sprint.getSprints) {
            window.ERP_Sprint.getSprints().forEach(function (sp) {
                if (sp.status !== 'completed') {
                    items.push({ text: sp.name + ' ends soon', urgent: true, section: 'sprints' });
                }
            });
        }
        var today = new Date().toISOString().substring(0, 10);
        invoices().forEach(function (inv) {
            if (inv.dueDate && inv.status === 'sent') {
                var isUrgent = inv.dueDate <= today;
                items.push({ text: inv.id + ' due ' + inv.dueDate, urgent: isUrgent, section: 'invoices' });
            }
        });
        stories().filter(function (s) { return s.status === 'in_progress'; }).slice(0, 2).forEach(function (s) {
            items.push({ text: s.title + ' (in progress)', urgent: false, section: 'tasks' });
        });

        if (!items.length) return '<div class="card"><div class="card-title">Upcoming Deadlines</div><p class="text-muted" style="padding:16px 0;">No upcoming deadlines.</p></div>';
        var html = '<div class="card"><div class="card-title">Upcoming Deadlines</div><ul class="dashboard-deadline-list">';
        items.slice(0, 6).forEach(function (item) {
            html += '<li class="dashboard-deadline-item" data-section="' + item.section + '">' +
                '<span class="dashboard-deadline-text">' + item.text + '</span>' +
                (item.urgent ? '<span class="badge badge-red">Urgent</span>' : '<span class="badge badge-gray">Upcoming</span>') + '</li>';
        });
        html += '</ul></div>';
        return html;
    }

    /* ── main render ── */
    function init() {
        var root = document.getElementById('dashboardRoot');
        if (!root) return;

        var role = getRole();
        var cards = cardsForRole(role);

        var scopeHtml = '<div class="dashboard-scope">Showing: <strong>' + scopeLabel() + '</strong></div>';
        var bannerHtml = buildBanner();

        var row1 = cards.slice(0, 4);
        var row2 = cards.slice(4);
        var cardsHtml = '<div class="dashboard-grid">';
        row1.forEach(function (c) {
            cardsHtml += '<div class="dashboard-metric-card" data-section="' + c.section + '">' +
                '<div class="dashboard-metric-icon" style="color:' + c.color + '">' + c.icon + '</div>' +
                '<div class="dashboard-metric-info">' +
                '<div class="dashboard-metric-value">' + c.value + '</div>' +
                '<div class="dashboard-metric-label">' + c.label + '</div></div></div>';
        });
        cardsHtml += '</div>';
        if (row2.length) {
            cardsHtml += '<div class="dashboard-grid">';
            row2.forEach(function (c) {
                cardsHtml += '<div class="dashboard-metric-card" data-section="' + c.section + '">' +
                    '<div class="dashboard-metric-icon" style="color:' + c.color + '">' + c.icon + '</div>' +
                    '<div class="dashboard-metric-info">' +
                    '<div class="dashboard-metric-value">' + c.value + '</div>' +
                    '<div class="dashboard-metric-label">' + c.label + '</div></div></div>';
            });
            cardsHtml += '</div>';
        }

        var bottomHtml = '<div class="dashboard-split">' +
            '<div class="dashboard-split-left">' + buildActivity() + '</div>' +
            '<div class="dashboard-split-right">' + buildDeadlines() + '</div></div>';

        root.innerHTML = scopeHtml + bannerHtml + cardsHtml + bottomHtml;

        root.querySelectorAll('[data-section]').forEach(function (el) {
            el.style.cursor = 'pointer';
            el.addEventListener('click', function (e) {
                var section = el.getAttribute('data-section');
                if (section) loadSection(section);
            });
        });
    }

    return { init: init };
})();
