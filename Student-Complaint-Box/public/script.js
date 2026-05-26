// API URL
const API = 'http://localhost:5000/api';

// Helper function to show alerts
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.style.minWidth = '300px';
    alertDiv.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
}

// Format date
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Priority badge
function getPriorityBadge(priority) {
    const badges = {
        3: '<span class="badge bg-danger">Urgent</span>',
        2: '<span class="badge bg-warning">High</span>',
        1: '<span class="badge bg-info">Medium</span>',
        0: '<span class="badge bg-secondary">Normal</span>'
    };
    return badges[priority] || badges[0];
}

// Status badge
function getStatusBadge(status) {
    const badges = {
        'Pending': '<span class="badge bg-warning">Pending</span>',
        'In Progress': '<span class="badge bg-info">In Progress</span>',
        'Resolved': '<span class="badge bg-success">Resolved</span>',
        'Escalated': '<span class="badge bg-danger">Escalated</span>'
    };
    return badges[status] || badges['Pending'];
}

// ==================== REGISTRATION ====================
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            course: document.getElementById('course').value,
            year: document.getElementById('year').value
        };
        
        const res = await fetch(`${API}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await res.json();
        if (res.ok) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.student));
            showAlert('Registration successful!', 'success');
            setTimeout(() => window.location.href = '/dashboard.html', 1500);
        } else {
            showAlert(result.message, 'danger');
        }
    });
}

// ==================== STUDENT LOGIN ====================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };
        
        const res = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await res.json();
        if (res.ok) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.student));
            showAlert('Login successful!', 'success');
            setTimeout(() => window.location.href = '/dashboard.html', 1500);
        } else {
            showAlert(result.message, 'danger');
        }
    });
}

// ==================== ADMIN LOGIN (Teacher/Staff) ====================
const adminLoginForm = document.getElementById('adminLoginForm');
if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            role: 'teacher'
        };
        
        const res = await fetch(`${API}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await res.json();
        if (res.ok) {
            localStorage.setItem('adminToken', result.token);
            localStorage.setItem('admin', JSON.stringify(result.admin));
            showAlert('Staff login successful!', 'success');
            setTimeout(() => window.location.href = '/admin-dashboard.html', 1500);
        } else {
            showAlert(result.message, 'danger');
        }
    });
}

// ==================== PRINCIPAL LOGIN ====================
const principalLoginForm = document.getElementById('principalLoginForm');
if (principalLoginForm) {
    principalLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            role: 'principal'
        };
        
        const res = await fetch(`${API}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await res.json();
        if (res.ok) {
            localStorage.setItem('adminToken', result.token);
            localStorage.setItem('admin', JSON.stringify(result.admin));
            showAlert('Principal login successful!', 'success');
            setTimeout(() => window.location.href = '/principal-dashboard.html', 1500);
        } else {
            showAlert(result.message, 'danger');
        }
    });
}

// ==================== PUBLIC COMPLAINT FEED (Homepage) ====================
let currentPage = 1;
let currentStatus = 'all';
let currentPriority = '';

if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    loadComplaints('all');
    
    window.loadComplaints = (status, priority) => {
        currentStatus = status;
        currentPriority = priority || '';
        currentPage = 1;
        fetchComplaints();
    };
    
    window.loadMore = () => {
        currentPage++;
        fetchComplaints(true);
    };
    
    async function fetchComplaints(append = false) {
        try {
            let url = `${API}/complaints/all?page=${currentPage}&limit=6`;
            if (currentStatus !== 'all') url += `&status=${currentStatus}`;
            if (currentPriority) url += `&priority=${currentPriority}`;
            
            const res = await fetch(url);
            const data = await res.json();
            
            const container = document.getElementById('complaintsFeed');
            const loadMoreBtn = document.getElementById('loadMoreBtn');
            
            if (!append) {
                container.innerHTML = '';
            }
            
            if (data.complaints.length === 0 && !append) {
                container.innerHTML = '<div class="text-center py-5"><i class="bi bi-inbox fs-1"></i><p class="mt-3">No complaints found</p></div>';
                loadMoreBtn.style.display = 'none';
                return;
            }
            
            data.complaints.forEach(complaint => {
                const card = `
                    <div class="card complaint-card ${complaint.status.toLowerCase().replace(' ', '-')} mb-3">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    ${getStatusBadge(complaint.status)}
                                    ${getPriorityBadge(complaint.priority)}
                                </div>
                                <small class="text-muted">${formatDate(complaint.date)}</small>
                            </div>
                            <h6 class="mt-2">${complaint.category}</h6>
                            <p class="card-text mt-2">${complaint.description}</p>
                            <div class="d-flex justify-content-between align-items-center mt-3">
                                <div class="view-counter">
                                    <i class="bi bi-eye"></i> ${complaint.views || 0} views
                                    <span class="ms-2"><i class="bi bi-shield-check"></i> ${complaint.adminViews || 0} staff views</span>
                                </div>
                                ${complaint.file ? `<a href="${complaint.file}" target="_blank" class="btn btn-sm btn-link">View Evidence</a>` : ''}
                            </div>
                        </div>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', card);
            });
            
            loadMoreBtn.style.display = data.currentPage >= data.totalPages ? 'none' : 'block';
        } catch (error) {
            console.error('Error loading complaints:', error);
        }
    }
}

// ==================== STUDENT DASHBOARD ====================
if (window.location.pathname === '/dashboard.html') {
    const token = localStorage.getItem('token');
    if (!token) window.location.href = '/login.html';
    
    loadMyComplaints();
    
    async function loadMyComplaints() {
        const res = await fetch(`${API}/complaints/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const complaints = await res.json();
        
        const container = document.getElementById('complaintsList');
        if (complaints.length === 0) {
            container.innerHTML = '<div class="alert alert-info">No complaints yet. <a href="/complaint.html">Submit one</a></div>';
            return;
        }
        
        container.innerHTML = complaints.map(c => `
            <div class="col-md-6 mb-3">
                <div class="card complaint-card ${c.status.toLowerCase().replace(' ', '-')}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <h5>${c.category}</h5>
                            ${getStatusBadge(c.status)}
                        </div>
                        <p class="mt-2">${c.description}</p>
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <div>
                                <small class="text-muted">${formatDate(c.date)}</small>
                                <div class="view-counter mt-1">
                                    <i class="bi bi-eye"></i> ${c.views || 0} views
                                    <span class="ms-2"><i class="bi bi-shield-check"></i> ${c.adminViews || 0} staff views</span>
                                </div>
                            </div>
                            <div>
                                ${c.file ? `<a href="${c.file}" target="_blank" class="btn btn-sm btn-link">Evidence</a>` : ''}
                                <button onclick="deleteComplaint('${c._id}')" class="btn btn-sm btn-danger">Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    window.deleteComplaint = async (id) => {
        if (!confirm('Delete this complaint?')) return;
        const res = await fetch(`${API}/complaints/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            showAlert('Deleted!', 'success');
            loadMyComplaints();
        }
    };
}

// ==================== SUBMIT COMPLAINT ====================
const complaintForm = document.getElementById('complaintForm');
if (complaintForm) {
    const token = localStorage.getItem('token');
    if (!token) window.location.href = '/login.html';
    
    complaintForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('category', document.getElementById('category').value);
        formData.append('description', document.getElementById('description').value);
        const file = document.getElementById('file').files[0];
        if (file) formData.append('file', file);
        
        const submitBtn = complaintForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Submitting...';
        
        const res = await fetch(`${API}/complaints/create`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        const result = await res.json();
        if (res.ok) {
            showAlert('Complaint submitted!', 'success');
            setTimeout(() => window.location.href = '/dashboard.html', 1500);
        } else {
            showAlert(result.message || 'Failed to submit', 'danger');
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Submit Complaint';
        }
    });
}

// ==================== TEACHER/STAFF DASHBOARD ====================
if (window.location.pathname === '/admin-dashboard.html') {
    const token = localStorage.getItem('adminToken');
    if (!token) window.location.href = '/admin-login.html';
    
    loadStats();
    loadComplaints();
    checkOldComplaints();
    
    async function loadStats() {
        const res = await fetch(`${API}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const stats = await res.json();
        document.getElementById('total').textContent = stats.total;
        document.getElementById('pending').textContent = stats.pending;
        document.getElementById('inProgress').textContent = stats.inProgress;
        document.getElementById('resolved').textContent = stats.resolved;
    }
    
    async function checkOldComplaints() {
        const res = await fetch(`${API}/admin/teacher/unresolved-old`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const oldComplaints = await res.json();
        if (oldComplaints.length > 0) {
            document.getElementById('oldComplaintsAlert').style.display = 'block';
            document.getElementById('oldComplaintsCount').textContent = oldComplaints.length;
        }
    }
    
    async function loadComplaints() {
        const status = document.getElementById('statusFilter')?.value || '';
        const priority = document.getElementById('priorityFilter')?.value || '';
        let url = `${API}/admin/teacher/complaints`;
        const params = [];
        if (status) params.push(`status=${status}`);
        if (priority) params.push(`priority=${priority}`);
        if (params.length) url += '?' + params.join('&');
        
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const complaints = await res.json();
        
        const tbody = document.getElementById('complaintsList');
        tbody.innerHTML = complaints.map(c => `
            <tr>
                <td>${formatDate(c.date)}</td>
                <td>${c.category}</td>
                <td>${c.description.substring(0, 50)}...</td>
                <td>${getPriorityBadge(c.priority)}</td>
                <td>${getStatusBadge(c.status)}</td>
                <td>${c.views || 0} / ${c.adminViews || 0}</td>
                <td>
                    <button onclick="openStatusModal('${c._id}', '${c.status}')" class="btn btn-sm btn-primary">Update</button>
                    <button onclick="openBlacklistModal('${c.studentId?._id}')" class="btn btn-sm btn-danger">Blacklist</button>
                </td>
            </tr>
        `).join('');
    }
    
    window.openStatusModal = (id, status) => {
        document.getElementById('complaintId').value = id;
        document.getElementById('newStatus').value = status;
        new bootstrap.Modal(document.getElementById('statusModal')).show();
    };
    
    window.openBlacklistModal = (studentId) => {
        if (!studentId) {
            showAlert('Student ID not available', 'warning');
            return;
        }
        document.getElementById('blacklistStudentId').value = studentId;
        new bootstrap.Modal(document.getElementById('blacklistModal')).show();
    };
    
    document.getElementById('updateStatusBtn')?.addEventListener('click', async () => {
        const id = document.getElementById('complaintId').value;
        const status = document.getElementById('newStatus').value;
        const notes = document.getElementById('resolutionNotes').value;
        
        await fetch(`${API}/admin/teacher/complaint/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status, resolutionNotes: notes })
        });
        
        loadComplaints();
        loadStats();
        bootstrap.Modal.getInstance(document.getElementById('statusModal')).hide();
        showAlert('Status updated!', 'success');
    });
    
    document.getElementById('confirmBlacklistBtn')?.addEventListener('click', async () => {
        const studentId = document.getElementById('blacklistStudentId').value;
        const reason = document.getElementById('blacklistReason').value;
        
        if (!reason) {
            showAlert('Please provide a reason', 'warning');
            return;
        }
        
        const res = await fetch(`${API}/admin/blacklist/${studentId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ reason })
        });
        
        if (res.ok) {
            showAlert('Student blacklisted successfully', 'success');
            bootstrap.Modal.getInstance(document.getElementById('blacklistModal')).hide();
        } else {
            showAlert('Failed to blacklist student', 'danger');
        }
    });
    
    document.getElementById('applyFilters')?.addEventListener('click', loadComplaints);
}

// ==================== PRINCIPAL DASHBOARD ====================
if (window.location.pathname === '/principal-dashboard.html') {
    const token = localStorage.getItem('adminToken');
    if (!token) window.location.href = '/principal-login.html';
    
    loadPrincipalStats();
    loadAllComplaints();
    loadStaffPerformance();
    
    async function loadPrincipalStats() {
        const res = await fetch(`${API}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const stats = await res.json();
        document.getElementById('total').textContent = stats.total;
        document.getElementById('pending').textContent = stats.pending;
        document.getElementById('escalated').textContent = stats.escalated || 0;
        document.getElementById('resolved').textContent = stats.resolved;
    }
    
    async function loadAllComplaints() {
        const res = await fetch(`${API}/admin/principal/complaints`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const complaints = await res.json();
        
        const tbody = document.getElementById('allComplaints');
        tbody.innerHTML = complaints.map(c => `
            <tr>
                <td>${formatDate(c.date)}</td>
                <td>Anonymous Student #${c.studentId?._id?.slice(-4) || 'N/A'}</td>
                <td>${c.category}</td>
                <td>${c.description.substring(0, 50)}...</td>
                <td>${getPriorityBadge(c.priority)}</td>
                <td>${getStatusBadge(c.status)}</td>
                <td>${c.assignedTo?.name || 'Unassigned'}</td>
                <td>${c.views || 0} / ${c.adminViews || 0}</td>
            </tr>
        `).join('');
    }
    
    async function loadStaffPerformance() {
        const res = await fetch(`${API}/admin/principal/staff-performance`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const teachers = await res.json();
        
        const tbody = document.getElementById('staffPerformance');
        if (teachers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No teachers found</td></tr>';
            return;
        }
        
        tbody.innerHTML = teachers.map(t => `
            <tr>
                <td>${t.teacher.name}</td>
                <td>${t.totalAssigned}</td>
                <td class="text-success">${t.resolved}</td>
                <td class="text-warning">${t.pending}</td>
                <td class="text-info">${t.inProgress}</td>
                <td>${t.averageResolutionHours}</td>
                <td class="${t.overdueComplaints > 0 ? 'text-danger fw-bold' : ''}">${t.overdueComplaints}</td>
                <td>
                    <button onclick="viewTeacherDetails('${t.teacher.id}')" class="btn btn-sm btn-primary">View</button>
                </td>
            </tr>
        `).join('');
    }
    
    window.viewTeacherDetails = (teacherId) => {
        window.location.href = `/staff-monitor.html?teacher=${teacherId}`;
    };
}

// ==================== STAFF MONITOR (Principal) ====================
if (window.location.pathname === '/staff-monitor.html') {
    const token = localStorage.getItem('adminToken');
    if (!token) window.location.href = '/principal-login.html';
    
    loadOldComplaints();
    
    async function loadOldComplaints() {
        const res = await fetch(`${API}/admin/teacher/unresolved-old`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const complaints = await res.json();
        
        const tbody = document.getElementById('oldComplaints');
        if (complaints.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No old complaints found</td></tr>';
            return;
        }
        
        // Group by teacher
        const teachers = {};
        complaints.forEach(c => {
            const teacherId = c.assignedTo?._id || 'unassigned';
            if (!teachers[teacherId]) {
                teachers[teacherId] = {
                    name: c.assignedTo?.name || 'Unassigned',
                    complaints: []
                };
            }
            teachers[teacherId].complaints.push(c);
        });
        
        let html = '';
        for (const [teacherId, data] of Object.entries(teachers)) {
            html += `
                <tr class="table-warning">
                    <td colspan="6"><strong>Teacher: ${data.name}</strong> (${data.complaints.length} complaints)</td>
                    <td>
                        <button onclick="openPunishModal('${teacherId}', '${data.name}', ${data.complaints.length})" class="btn btn-danger btn-sm">
                            <i class="bi bi-flag"></i> Issue Action
                        </button>
                    </td>
                </tr>
            `;
            data.complaints.forEach(c => {
                const days = Math.floor((Date.now() - new Date(c.date)) / (1000 * 60 * 60 * 24));
                html += `
                    <tr>
                        <td>${formatDate(c.date)}</td>
                        <td>Anonymous</td>
                        <td>${c.category}</td>
                        <td>${c.description.substring(0, 50)}...</td>
                        <td>${c.assignedTo?.name || 'Unassigned'}</td>
                        <td class="text-danger">${days} days</td>
                        <td>
                            <button onclick="openStatusModal('${c._id}', '${c.status}')" class="btn btn-sm btn-primary">Update</button>
                        </td>
                    </tr>
                `;
            });
        }
        tbody.innerHTML = html;
    }
    
    window.openPunishModal = (teacherId, teacherName, complaintCount) => {
        document.getElementById('teacherId').value = teacherId;
        document.getElementById('teacherName').value = teacherName;
        document.getElementById('teacherNameDisplay').textContent = teacherName;
        document.getElementById('complaintCount').textContent = complaintCount;
        new bootstrap.Modal(document.getElementById('punishModal')).show();
    };
    
    document.getElementById('confirmPunishBtn')?.addEventListener('click', async () => {
        const teacherId = document.getElementById('teacherId').value;
        const action = document.getElementById('actionType').value;
        const reason = document.getElementById('punishReason').value;
        
        if (!reason) {
            showAlert('Please provide a reason', 'warning');
            return;
        }
        
        const res = await fetch(`${API}/admin/principal/punish-teacher/${teacherId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ action, reason })
        });
        
        const result = await res.json();
        if (res.ok) {
            showAlert(result.message, 'success');
            bootstrap.Modal.getInstance(document.getElementById('punishModal')).hide();
            loadOldComplaints();
        } else {
            showAlert(result.message || 'Failed', 'danger');
        }
    });
    
    window.openStatusModal = (id, status) => {
        document.getElementById('complaintId').value = id;
        document.getElementById('newStatus').value = status;
        new bootstrap.Modal(document.getElementById('statusModal')).show();
    };
    
    document.getElementById('updateStatusBtn')?.addEventListener('click', async () => {
        const id = document.getElementById('complaintId').value;
        const status = document.getElementById('newStatus').value;
        const notes = document.getElementById('resolutionNotes').value;
        
        await fetch(`${API}/admin/teacher/complaint/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
                
            },
            body: JSON.stringify({ status, resolutionNotes: notes })
        });
        
        loadOldComplaints();
        bootstrap.Modal.getInstance(document.getElementById('statusModal')).hide();
        showAlert('Status updated!', 'success');
    });
}

// ==================== LOGOUT ====================
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('user');
    localStorage.removeItem('admin');
    window.location.href = '/';
});

// Setup default admins on load
async function setupAdmins() {
    try {
        const res = await fetch(`${API}/admin/setup`, { method: 'POST' });
        const data = await res.json();
        console.log('Admins ready:', data);
    } catch(e) {}
}
setupAdmins();