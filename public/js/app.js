// Gatherly Main Application Orchestrator

const app = {
  currentView: 'dashboard',
  events: [],
  activeEvent: null,
  activeEventData: null,
  countdownInterval: null,

  formatCurrency(amount) {
    if (isNaN(amount) || amount === null || amount === undefined) amount = 0;
    return '₹' + Number(amount).toLocaleString('en-IN');
  },

  async init() {
    console.log('[Gatherly] Initializing application...');
    await auth.init();
    await this.loadEvents();
    this.setupEventListeners();
    this.startCountdownTimer();
  },

  async loadEvents() {
    try {
      const res = await api.getEvents();
      if (res.success && res.events) {
        this.events = res.events;
        this.renderEventSelectorDropdown();
        
        // Pick first event or last active
        const savedId = localStorage.getItem('gatherly_active_event_id');
        const match = this.events.find(e => e._id === savedId);
        if (match) {
          await this.setActiveEvent(match._id);
        } else if (this.events.length > 0) {
          await this.setActiveEvent(this.events[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  },

  async setActiveEvent(eventId) {
    const evt = this.events.find(e => e._id === eventId);
    if (!evt) return;

    this.activeEvent = evt;
    localStorage.setItem('gatherly_active_event_id', eventId);

    // Update active topbar selector UI
    const titleEl = document.getElementById('active-event-title');
    const badgeEl = document.getElementById('active-event-badge');
    if (titleEl) titleEl.textContent = evt.name;
    if (badgeEl) {
      badgeEl.textContent = evt.type;
      badgeEl.className = `event-type-badge badge-${evt.type}`;
    }

    // Fetch full active event details (budget, expenses, vendors, tasks, ai)
    try {
      const fullRes = await api.getEventById(eventId);
      if (fullRes.success) {
        this.activeEventData = fullRes;
      }
    } catch (e) {
      console.warn('Could not fetch full event data:', e);
    }

    // Refresh current view
    this.renderCurrentView();
  },

  async refreshActiveEvent() {
    if (this.activeEvent?._id) {
      await this.setActiveEvent(this.activeEvent._id);
    }
  },

  renderEventSelectorDropdown() {
    const dropdown = document.getElementById('event-switcher-menu');
    if (!dropdown) return;

    dropdown.innerHTML = this.events.map(evt => `
      <li>
        <a class="dropdown-item d-flex align-items-center justify-content-between py-2 ${evt._id === this.activeEvent?._id ? 'active' : ''}" 
           href="#" onclick="app.setActiveEvent('${evt._id}')">
          <div>
            <strong>${evt.name}</strong>
            <div class="small text-muted">${new Date(evt.date).toLocaleDateString()} • ${evt.guestCount} Guests</div>
          </div>
          <span class="event-type-badge badge-${evt.type} ms-2">${evt.type}</span>
        </a>
      </li>
    `).join('') + `
      <li><hr class="dropdown-divider"></li>
      <li>
        <a class="dropdown-item text-primary fw-bold" href="#" onclick="app.openCreateEventModal()">
          <i class="bi bi-plus-circle me-1"></i> + Create New Event
        </a>
      </li>
    `;
  },

  navigateTo(viewName) {
    this.currentView = viewName;

    // Toggle navigation button styles
    document.querySelectorAll('.nav-item-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // Toggle view visibility
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const activeSec = document.getElementById(`view-${viewName}`);
    if (activeSec) {
      activeSec.classList.add('active');
    }

    this.renderCurrentView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  renderCurrentView() {
    switch (this.currentView) {
      case 'dashboard':
        dashboard.render();
        break;
      case 'budget':
        budget.render();
        break;
      case 'timeline':
        timeline.render();
        break;
      case 'vendors':
        vendors.render();
        break;
      case 'ai':
        aiPlanner.render();
        break;
      case 'events':
        this.renderAllEventsView();
        break;
    }
  },

  renderAllEventsView() {
    const container = document.getElementById('all-events-grid');
    if (!container) return;

    if (this.events.length === 0) {
      container.innerHTML = `<div class="col-12 text-center p-5 text-muted">No events created yet.</div>`;
      return;
    }

    container.innerHTML = this.events.map(evt => {
      const isCurrent = this.activeEvent?._id === evt._id;
      const daysUntil = Math.ceil((new Date(evt.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

      return `
        <div class="col-md-6 col-lg-4 mb-4">
          <div class="gatherly-card h-100 d-flex flex-column justify-content-between p-4 ${isCurrent ? 'border-primary shadow-md' : ''}">
            <div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="event-type-badge badge-${evt.type}">${evt.type.toUpperCase()}</span>
                <span class="badge ${daysUntil <= 14 ? 'bg-danger' : 'bg-primary'}">${daysUntil > 0 ? `${daysUntil} days left` : 'Celebrated'}</span>
              </div>
              <h4 class="fw-bold mb-1" style="color:#1A0F33;">${evt.name}</h4>
              <p class="text-muted small mb-3"><i class="bi bi-geo-alt"></i> ${evt.location}</p>

              <div class="bg-light p-3 rounded-3 mb-3 small">
                <div class="d-flex justify-content-between mb-1">
                  <span class="text-muted">Target Date:</span>
                  <strong>${new Date(evt.date).toLocaleDateString()}</strong>
                </div>
                <div class="d-flex justify-content-between mb-1">
                  <span class="text-muted">Guest Count:</span>
                  <strong>${evt.guestCount} attendees</strong>
                </div>
                <div class="d-flex justify-content-between mb-1">
                  <span class="text-muted">Target Budget:</span>
                  <strong class="text-success">${app.formatCurrency(evt.estimatedBudget)}</strong>
                </div>
                <div class="d-flex justify-content-between">
                  <span class="text-muted">Theme:</span>
                  <strong>${evt.theme || 'Classic'}</strong>
                </div>
              </div>
            </div>

            <div class="d-flex gap-2 border-top pt-3">
              <button class="btn btn-sm ${isCurrent ? 'btn-secondary' : 'btn-primary-purple'} flex-grow-1" onclick="app.setActiveEvent('${evt._id}')">
                ${isCurrent ? '<i class="bi bi-check2-circle"></i> Active' : 'Switch To Event'}
              </button>
              <button class="btn btn-sm btn-outline-danger" onclick="app.deleteEvent('${evt._id}')" title="Delete Event">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  openCreateEventModal() {
    document.getElementById('create-event-form').reset();
    new bootstrap.Modal(document.getElementById('createEventModal')).show();
  },

  async handleCreateEventSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('event-create-name').value;
    const type = document.getElementById('event-create-type').value;
    const date = document.getElementById('event-create-date').value;
    const location = document.getElementById('event-create-location').value;
    const guestCount = parseInt(document.getElementById('event-create-guests').value) || 50;
    const estimatedBudget = parseFloat(document.getElementById('event-create-budget').value) || 5000;
    const theme = document.getElementById('event-create-theme').value;
    const notes = document.getElementById('event-create-notes').value;

    try {
      const res = await api.createEvent({
        name,
        type,
        date,
        location,
        guestCount,
        estimatedBudget,
        theme,
        preferences: { notes }
      });

      if (res.success && res.event) {
        this.showToast('Event created successfully with auto-generated budgets, milestones, and vendor checklists!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('createEventModal')).hide();
        await this.loadEvents();
        await this.setActiveEvent(res.event._id);
        this.navigateTo('dashboard');
      }
    } catch (err) {
      this.showToast(`Error creating event: ${err.message}`, 'danger');
    }
  },

  async deleteEvent(eventId) {
    if (!confirm('Are you sure you want to permanently delete this event and all associated records?')) return;
    try {
      await api.deleteEvent(eventId);
      this.showToast('Event deleted.', 'info');
      await this.loadEvents();
      if (this.events.length > 0) {
        await this.setActiveEvent(this.events[0]._id);
      }
    } catch (err) {
      this.showToast(`Failed to delete event: ${err.message}`, 'danger');
    }
  },

  startCountdownTimer() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.countdownInterval = setInterval(() => {
      dashboard.updateCountdown();
    }, 1000);
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'gatherly-toast';

    let icon = 'bi-info-circle-fill text-gold';
    if (type === 'success') icon = 'bi-check-circle-fill text-success';
    if (type === 'danger') icon = 'bi-exclamation-triangle-fill text-danger';

    toast.innerHTML = `<i class="bi ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  setupEventListeners() {
    // Nav buttons
    document.querySelectorAll('.nav-item-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const view = btn.dataset.view;
        if (view) this.navigateTo(view);
      });
    });

    // Form Submissions
    const createEventForm = document.getElementById('create-event-form');
    if (createEventForm) createEventForm.addEventListener('submit', (e) => this.handleCreateEventSubmit(e));

    const expenseForm = document.getElementById('expense-form');
    if (expenseForm) expenseForm.addEventListener('submit', (e) => budget.handleAddExpenseSubmit(e));

    const taskForm = document.getElementById('task-form');
    if (taskForm) taskForm.addEventListener('submit', (e) => timeline.handleAddTaskSubmit(e));

    const vendorForm = document.getElementById('vendor-form');
    if (vendorForm) vendorForm.addEventListener('submit', (e) => vendors.handleAddVendorSubmit(e));

    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', (e) => auth.handleLogin(e));

    const registerForm = document.getElementById('register-form');
    if (registerForm) registerForm.addEventListener('submit', (e) => auth.handleRegister(e));
  }
};

window.addEventListener('DOMContentLoaded', () => {
  app.init();
});

