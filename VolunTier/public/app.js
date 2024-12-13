// Global variables
let token = localStorage.getItem('token');
let isAdmin = localStorage.getItem('isAdmin') === 'true';

// DOM Elements
const loginModal = document.getElementById('login-modal');
const registerModal = document.getElementById('register-modal');
const loginButton = document.getElementById('login-button');
const registerButton = document.getElementById('register-button');
const logoutButton = document.getElementById('logout-button');
const closeButtons = document.querySelectorAll('.close');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const adminLinks = document.getElementById('admin-links');
const loggedOutButtons = document.getElementById('logged-out-buttons');
const loggedInButtons = document.getElementById('logged-in-buttons');
const usernameDisplay = document.getElementById('username-display');

// Navigation Elements
const homeLink = document.getElementById('home-link');
const eventsLink = document.getElementById('events-link');
const applicationsLink = document.getElementById('applications-link');
const adminPanelLink = document.getElementById('admin-panel-link');
const exploreEventsButton = document.getElementById('explore-events');

// Section Elements
const homeSection = document.getElementById('home-section');
const eventsSection = document.getElementById('events-section');
const applicationsSection = document.getElementById('applications-section');
const adminSection = document.getElementById('admin-section');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    console.log('App initialized');
    
    // Navigation Event Listeners
    if (homeLink) {
        homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSection(homeSection);
            updateActiveLink(homeLink);
        });
    }

    if (eventsLink) {
        eventsLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSection(eventsSection);
            updateActiveLink(eventsLink);
            loadEvents();
        });
    }

    if (applicationsLink) {
        applicationsLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (!isLoggedIn()) {
                showModal(loginModal);
                return;
            }
            showSection(applicationsSection);
            updateActiveLink(applicationsLink);
            loadMyApplications();
        });
    }

    if (adminPanelLink) {
        adminPanelLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSection(adminSection);
            updateActiveLink(adminPanelLink);
            loadAdminData();
        });
    }

    if (exploreEventsButton) {
        exploreEventsButton.addEventListener('click', () => {
            showSection(eventsSection);
            updateActiveLink(eventsLink);
            loadEvents();
        });
    }

    // Modal Event Listeners
    if (loginButton) {
        loginButton.addEventListener('click', () => showModal(loginModal));
    }

    if (registerButton) {
        registerButton.addEventListener('click', () => showModal(registerModal));
    }

    if (closeButtons) {
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                hideModal(loginModal);
                hideModal(registerModal);
            });
        });
    }

    // Form Event Listeners
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Event Form Handler
    const eventForm = document.getElementById('event-form');
    if (eventForm) {
        eventForm.addEventListener('submit', handleEventCreation);
    }

    // Initialize UI
    updateAuthUI();
    showSection(homeSection);
    updateActiveLink(homeLink);
});

// Navigation Functions
function showSection(section) {
    const sections = [homeSection, eventsSection, applicationsSection, adminSection];
    sections.forEach(s => {
        if (s) {
            s.classList.remove('active');
        }
    });
    if (section) {
        section.classList.add('active');
    }
}

function updateActiveLink(activeLink) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

// Modal Functions
function showModal(modal) {
    if (modal) {
        modal.style.display = 'block';
    }
}

function hideModal(modal) {
    if (modal) {
        modal.style.display = 'none';
    }
}

// Click outside modal to close
window.addEventListener('click', (event) => {
    if (event.target === loginModal) {
        hideModal(loginModal);
    }
    if (event.target === registerModal) {
        hideModal(registerModal);
    }
});

// Authentication Functions
function isLoggedIn() {
    return token !== null;
}

function updateAuthUI() {
    if (isLoggedIn()) {
        if (loggedOutButtons) loggedOutButtons.style.display = 'none';
        if (loggedInButtons) loggedInButtons.style.display = 'flex';
        if (applicationsLink) applicationsLink.style.display = 'block';
        if (usernameDisplay) {
            const username = localStorage.getItem('username');
            usernameDisplay.textContent = username || '';
        }
        if (isAdmin && adminLinks) {
            adminLinks.style.display = 'block';
        }
    } else {
        if (loggedOutButtons) loggedOutButtons.style.display = 'flex';
        if (loggedInButtons) loggedInButtons.style.display = 'none';
        if (applicationsLink) applicationsLink.style.display = 'none';
        if (adminLinks) adminLinks.style.display = 'none';
    }
}

// Form Handlers
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            token = data.token;
            isAdmin = data.isAdmin;
            localStorage.setItem('token', token);
            localStorage.setItem('isAdmin', isAdmin);
            localStorage.setItem('username', username);
            hideModal(loginModal);
            updateAuthUI();
            showSection(eventsSection);
            updateActiveLink(eventsLink);
            loadEvents();
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Error during login');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            token = data.token;
            isAdmin = data.isAdmin;
            localStorage.setItem('token', token);
            localStorage.setItem('isAdmin', isAdmin);
            localStorage.setItem('username', username);
            hideModal(registerModal);
            updateAuthUI();
            showSection(eventsSection);
            updateActiveLink(eventsLink);
            loadEvents();
        } else {
            alert(data.error || 'Registration failed');
        }
    } catch (error) {
        console.error('Register error:', error);
        alert('Error during registration');
    }
}

// Event Creation Handler
async function handleEventCreation(e) {
    e.preventDefault();
    
    if (!isLoggedIn() || !isAdmin) {
        alert('You must be logged in as an admin to create events');
        return;
    }

    const eventData = {
        title: document.getElementById('event-title').value,
        description: document.getElementById('event-description').value,
        date: document.getElementById('event-date').value,
        location: document.getElementById('event-location').value,
        maxApplicants: parseInt(document.getElementById('event-max-applicants').value)
    };

    try {
        const response = await fetch('/api/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(eventData)
        });

        if (response.ok) {
            document.getElementById('event-form').reset();
            alert('Event created successfully!');
            loadAdminData();
            loadEvents();
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to create event');
        }
    } catch (error) {
        console.error('Error creating event:', error);
        alert('Error creating event. Please try again.');
    }
}

// Data Loading Functions
async function loadEvents() {
    const eventsList = document.getElementById('events-list');
    if (!eventsList) return;

    try {
        const response = await fetch('/api/events');
        const events = await response.json();
        
        eventsList.innerHTML = events.map(event => `
            <div class="event-card">
                <h3>${event.title}</h3>
                <p>${event.description}</p>
                <div class="event-details">
                    <span><i class="fas fa-calendar"></i> ${new Date(event.date).toLocaleDateString()}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${event.location}</span>
                    <span><i class="fas fa-users"></i> ${event.currentApplicants}/${event.maxApplicants}</span>
                </div>
                ${isLoggedIn() ? `<button onclick="applyForEvent(${event.id})" class="btn btn-primary">Apply</button>` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading events:', error);
        eventsList.innerHTML = '<p class="error-message">Error loading events. Please try again later.</p>';
    }
}

async function loadMyApplications() {
    if (!isLoggedIn()) return;

    const applicationsList = document.getElementById('applications-list');
    if (!applicationsList) return;

    try {
        const response = await fetch('/api/applications/my', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const applications = await response.json();
        
        applicationsList.innerHTML = applications.map(app => `
            <div class="application-card">
                <h3>${app.eventTitle}</h3>
                <div class="application-details">
                    <span><i class="fas fa-calendar"></i> ${new Date(app.date).toLocaleDateString()}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${app.location}</span>
                    <span class="status ${app.status.toLowerCase()}">${app.status}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading applications:', error);
        applicationsList.innerHTML = '<p class="error-message">Error loading your applications. Please try again later.</p>';
    }
}

async function loadAdminData() {
    if (!isAdmin) return;

    const adminEventsList = document.getElementById('admin-events-list');
    const adminApplicationsList = document.getElementById('admin-applications-list');
    
    if (!adminEventsList || !adminApplicationsList) return;

    try {
        // Load admin events
        const eventsResponse = await fetch('/api/events');
        const events = await eventsResponse.json();
        
        adminEventsList.innerHTML = events.map(event => `
            <div class="admin-event-card">
                <h4>${event.title}</h4>
                <div class="event-details">
                    <span>${new Date(event.date).toLocaleDateString()}</span>
                    <span>${event.currentApplicants}/${event.maxApplicants} applicants</span>
                </div>
                <button onclick="deleteEvent(${event.id})" class="btn btn-outline">Delete</button>
            </div>
        `).join('');

        // Load admin applications
        const applicationsResponse = await fetch('/api/applications', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const applications = await applicationsResponse.json();
        
        adminApplicationsList.innerHTML = applications.map(app => `
            <div class="admin-application-card">
                <div class="application-info">
                    <h4>${app.eventTitle}</h4>
                    <p>Applicant: ${app.applicantName}</p>
                    <span class="status ${app.status.toLowerCase()}">${app.status}</span>
                </div>
                <div class="application-actions">
                    ${app.status === 'pending' ? `
                        <button onclick="updateApplication(${app.id}, 'approved')" class="btn btn-primary">Approve</button>
                        <button onclick="updateApplication(${app.id}, 'rejected')" class="btn btn-outline">Reject</button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading admin data:', error);
        if (adminEventsList) {
            adminEventsList.innerHTML = '<p class="error-message">Error loading events</p>';
        }
        if (adminApplicationsList) {
            adminApplicationsList.innerHTML = '<p class="error-message">Error loading applications</p>';
        }
    }
}

// Event Application Functions
window.applyForEvent = async function(eventId) {
    if (!isLoggedIn()) {
        showModal(loginModal);
        return;
    }

    try {
        const response = await fetch('/api/applications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ eventId })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Application submitted successfully!');
            loadEvents();
        } else {
            alert(data.error || 'Failed to apply for event');
        }
    } catch (error) {
        console.error('Application error:', error);
        alert('Error submitting application');
    }
}

// Admin Functions
window.deleteEvent = async function(eventId) {
    if (!isAdmin) return;

    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
        const response = await fetch(`/api/events/${eventId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            loadAdminData();
            loadEvents();
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to delete event');
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('Error deleting event');
    }
}

window.updateApplication = async function(applicationId, status) {
    if (!isAdmin) return;

    try {
        const response = await fetch(`/api/applications/${applicationId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            loadAdminData();
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to update application');
        }
    } catch (error) {
        console.error('Update error:', error);
        alert('Error updating application');
    }
}

// Logout Handler
if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        token = null;
        isAdmin = false;
        localStorage.removeItem('token');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('username');
        updateAuthUI();
        showSection(homeSection);
        updateActiveLink(homeLink);
    });
}
