/** Dashboard: role-based cards, insight banner, activity feed, deadlines. */
window.ERP_Dashboard = (function () {

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
        // look at all test runs for pass/fail
        var runs = (window.ERP_QA && window.ERP_QA.testCases) || [];
        // Simple: count pass/fail from latest test run results if available
        var pass = 0; var total = 0;
        if (window.ERP_QA) {
            // use defect vs testCase ratio as proxy
            pass = tcs.length - defects().filter(function (d) { return d.status === 'Open'; }).length;
            total = tcs.length;
        }
        if (total <= 0) return 100;
        return Math.max(0, Math.round((pass / total) * 100));
    }
    function activeTestRuns() {
        // count sprints that have test runs
        if (!window.ERP_Sprint || !window.ERP_Sprint.getSprints) return 0;
        return window.ERP_Sprint.getSprints().filter(function (sp) { return sp.status !== 'completed'; }).length || 1;
    }

    /* ── card definitions per role ── */
    function cardsForRole(role) {
        switch (role) {
            case 'pm':
                return [
                    { label: 'Sprint Completion', value: sprintCompletion() + '%', icon: '📊', section: 'sprints', color: 'var(--primary)' },
                    { label: 'Open Stories', value: openTasks(), icon: '📋', section: 'backlog', color: 'var(--info)' },
                    { label: 'Blocked Tasks', value: blockedTasks(), icon: '🚫', section: 'tasks', color: 'var(--danger)' },
                    { label: 'Team Utilization', value: utilizationPct() + '%', icon: '👥', section: 'resources', color: 'var(--warning)' },
                    { label: 'Active Projects', value: activeProjects(), icon: '📁', section: 'projects', color: 'var(--success)' },
                    { label: 'Open Defects', value: openDefects(), icon: '🐛', section: 'qa-defects', color: 'var(--danger)' }
                ];
            case 'developer':
                return [
                    { label: 'My Tasks', value: myTasks(), icon: '✅', section: 'tasks', color: 'var(--primary)' },
                    { label: 'Tasks Due Today', value: 0, icon: '📅', section: 'tasks', color: 'var(--warning)' },
                    { label: 'Hours This Week', value: hoursThisWeek() + 'h', icon: '⏱️', section: 'time-tracking', color: 'var(--info)' },
                    { label: 'My Open Defects', value: myDefects(), icon: '🐛', section: 'qa-defects', color: 'var(--danger)' },
                    { label: 'Sprint Progress', value: sprintCompletion() + '%', icon: '🏃', section: 'sprints', color: 'var(--success)' }
                ];
            case 'qa':
                return [
                    { label: 'Open Defects', value: openDefects(), icon: '🐛', section: 'qa-defects', color: 'var(--danger)' },
                    { label: 'Critical Defects', value: criticalDefects(), icon: '🔴', section: 'qa-defects', color: '#DC2626' },
                    { label: 'Test Pass Rate', value: testPassRate() + '%', icon: '✅', section: 'qa-defects', color: 'var(--success)' },
                    { label: 'Active Test Runs', value: activeTestRuns(), icon: '🧪', section: 'qa-defects', color: 'var(--info)' }
                ];
            case 'accounts':
                return [
                    { label: 'Monthly Revenue', value: '$' + monthlyRevenue().toLocaleString(), icon: '💰', section: 'invoices', color: 'var(--success)' },
                    { label: 'Pending Invoices', value: pendingInvoices(), icon: '📄', section: 'invoices', color: 'var(--warning)' },
                    { label: 'Overdue Invoices', value: overdueInvoices(), icon: '⚠️', section: 'invoices', color: 'var(--danger)' },
                    { label: 'Approved Billable Hrs', value: approvedBillableHours() + 'h', icon: '⏳', section: 'time-tracking', color: 'var(--info)' }
                ];
            default: // admin
                return [
                    { label: 'Active Projects', value: activeProjects(), icon: '📁', section: 'projects', color: 'var(--primary)' },
                    { label: 'Open Tasks', value: openTasks(), icon: '📋', section: 'tasks', color: 'var(--info)' },
                    { label: 'Open Defects', value: openDefects(), icon: '🐛', section: 'qa-defects', color: 'var(--danger)' },
                    { label: 'Revenue This Month', value: '$' + monthlyRevenue().toLocaleString(), icon: '💰', section: 'invoices', color: 'var(--success)' },
                    { label: 'Utilization', value: utilizationPct() + '%', icon: '📊', section: 'resources', color: 'var(--warning)' },
                    { label: 'Delivery Risk', value: sprintCompletion() < 70 ? 'At Risk' : 'On Track', icon: sprintCompletion() < 70 ? '⚠️' : '✅', section: 'sprints', color: sprintCompletion() < 70 ? 'var(--danger)' : 'var(--success)' }
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
            }).join(' · ');
            return '<div class="dashboard-banner dashboard-banner-warning">' +
                '<div class="dashboard-banner-content"><span class="dashboard-banner-icon">⚠️</span>' +
                '<div><strong>Attention Required</strong><div class="dashboard-banner-details">' + items + '</div></div></div>' +
                '<button class="btn btn-sm btn-primary dashboard-banner-cta" data-section="' + warnings[0].section + '">View Details</button></div>';
        }
        return '<div class="dashboard-banner dashboard-banner-success">' +
            '<div class="dashboard-banner-content"><span class="dashboard-banner-icon">✅</span>' +
            '<div><strong>Operations Running Smoothly</strong><div class="dashboard-banner-details">All systems are within normal parameters.</div></div></div></div>';
    }

    /* ── recent activity ── */
    function buildActivity() {
        var items = [];
        // completed stories
        stories().filter(function (s) { return s.status === 'done' || s.status === 'release_ready'; }).slice(0, 3).forEach(function (s) {
            items.push({ text: 'Task completed: ' + s.title, badge: 'Done', badgeClass: 'badge-green', section: 'tasks' });
        });
        // recent defects
        defects().filter(function (d) { return d.status === 'Open'; }).slice(0, 2).forEach(function (d) {
            items.push({ text: 'Defect created: ' + d.title, badge: d.severity, badgeClass: d.severity === 'Critical' ? 'badge-red' : 'badge-amber', section: 'qa-defects' });
        });
        // recent invoices
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
        // sprint end dates (simulated as 2 weeks from now for demo)
        if (window.ERP_Sprint && window.ERP_Sprint.getSprints) {
            window.ERP_Sprint.getSprints().forEach(function (sp) {
                if (sp.status !== 'completed') {
                    items.push({ text: sp.name + ' ends soon', urgent: true, section: 'sprints' });
                }
            });
        }
        // invoice due dates
        var today = new Date().toISOString().substring(0, 10);
        invoices().forEach(function (inv) {
            if (inv.dueDate && inv.status === 'sent') {
                var isUrgent = inv.dueDate <= today;
                items.push({ text: inv.id + ' due ' + inv.dueDate, urgent: isUrgent, section: 'invoices' });
            }
        });
        // tasks in progress
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

        // scope banner
        var scopeHtml = '<div class="dashboard-scope">Showing: <strong>' + scopeLabel() + '</strong></div>';

        // insight banner
        var bannerHtml = buildBanner();

        // metric cards
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

        // bottom split: activity + deadlines
        var bottomHtml = '<div class="dashboard-split">' +
            '<div class="dashboard-split-left">' + buildActivity() + '</div>' +
            '<div class="dashboard-split-right">' + buildDeadlines() + '</div></div>';

        root.innerHTML = scopeHtml + bannerHtml + cardsHtml + bottomHtml;

        // wire up clicks
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
