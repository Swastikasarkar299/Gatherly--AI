// Gatherly Dashboard View Controller

const dashboard = {
  render() {
    const activeEvent = app.activeEvent;
    if (!activeEvent) return;

    this.updateMetrics();
    this.updateCountdown();
    this.renderUpcomingEventsList();
    this.renderAIRecommendations();
    this.renderQuickBudgetSummary();
  },

  updateMetrics() {
    const activeEvent = app.activeEvent;
    const allEvents = app.events;
    const expenses = app.activeEventData?.expenses || [];
    const vendors = app.activeEventData?.vendors || [];
    const budget = app.activeEventData?.budget;

    // 1. Total number of events
    document.getElementById('metric-total-events').textContent = allEvents.length;

    // 2. Total planned budget in Rupees
    const totalBudget = budget ? budget.totalBudget : (activeEvent.estimatedBudget || 0);
    document.getElementById('metric-total-budget').textContent = app.formatCurrency(totalBudget);

    // 3. Total expenses in Rupees
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.actualAmount || exp.estimatedAmount || 0), 0);
    document.getElementById('metric-total-expenses').textContent = app.formatCurrency(totalExpenses);

    // 4. Pending vendor bookings
    const pendingVendors = vendors.filter(v => v.status !== 'booked' && v.status !== 'completed').length;
    document.getElementById('metric-pending-vendors').textContent = pendingVendors;

    // Overbudget indicator
    const overbudgetBadge = document.getElementById('dashboard-overbudget-alert');
    if (overbudgetBadge) {
      if (totalExpenses > totalBudget) {
        overbudgetBadge.classList.remove('d-none');
        document.getElementById('overbudget-amount-text').textContent = app.formatCurrency(totalExpenses - totalBudget);
      } else {
        overbudgetBadge.classList.add('d-none');
      }
    }
  },

  updateCountdown() {
    const activeEvent = app.activeEvent;
    if (!activeEvent) return;

    const eventDate = new Date(activeEvent.date);
    const now = new Date();
    const diffMs = eventDate.getTime() - now.getTime();

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    // Update Topbar Ticker
    const ticker = document.getElementById('topbar-countdown-text');
    if (ticker) {
      if (diffMs > 0) {
        ticker.textContent = `${days}d ${hours}h ${minutes}m until ${activeEvent.name}`;
      } else {
        ticker.textContent = `Event in progress / Celebrated!`;
      }
    }

    // Update Dashboard Hero Countdown
    const daysEl = document.getElementById('hero-countdown-days');
    const hoursEl = document.getElementById('hero-countdown-hours');
    const minsEl = document.getElementById('hero-countdown-mins');

    if (daysEl && hoursEl && minsEl) {
      daysEl.textContent = Math.max(0, days);
      hoursEl.textContent = Math.max(0, hours);
      minsEl.textContent = Math.max(0, minutes);
    }
  },

  renderUpcomingEventsList() {
    const container = document.getElementById('dashboard-upcoming-events-container');
    if (!container) return;

    const events = [...app.events].sort((a, b) => new Date(a.date) - new Date(b.date));

    if (events.length === 0) {
      container.innerHTML = `<div class="p-4 text-center text-muted">No upcoming events planned yet.</div>`;
      return;
    }

    container.innerHTML = events.map(evt => {
      const isCurrent = app.activeEvent?._id === evt._id;
      const eventDate = new Date(evt.date);
      const daysUntil = Math.ceil((eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      let badgeClass = 'badge-wedding';
      if (evt.type === 'birthday') badgeClass = 'badge-birthday';
      if (evt.type === 'community') badgeClass = 'badge-community';

      return `
        <div class="d-flex align-items-center justify-content-between p-3 border-bottom ${isCurrent ? 'bg-light' : ''}" style="transition: all 0.2s ease;">
          <div class="d-flex align-items-center gap-3">
            <span class="event-type-badge ${badgeClass}">${evt.type}</span>
            <div>
              <h6 class="mb-0 fw-bold" style="color: #1A0F33;">${evt.name}</h6>
              <small class="text-muted"><i class="bi bi-geo-alt"></i> ${evt.location} • ${evt.guestCount} Guests • ${app.formatCurrency(evt.estimatedBudget)}</small>
            </div>
          </div>
          <div class="text-end d-flex align-items-center gap-2">
            <span class="badge ${daysUntil <= 14 ? 'bg-danger' : 'bg-primary'}" style="font-size: 0.8rem;">
              ${daysUntil > 0 ? `${daysUntil} days left` : 'Today!'}
            </span>
            <button class="btn btn-sm ${isCurrent ? 'btn-secondary' : 'btn-outline-purple'}" onclick="app.setActiveEvent('${evt._id}')">
              ${isCurrent ? 'Active' : 'Switch'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  renderAIRecommendations() {
    const container = document.getElementById('dashboard-ai-recommendations-container');
    if (!container) return;

    const recs = app.activeEventData?.recommendations || [];

    if (recs.length === 0) {
      container.innerHTML = `
        <div class="text-center p-4">
          <p class="text-muted mb-3">No AI recommendations generated for this event yet.</p>
          <button class="btn btn-accent-gold btn-sm" onclick="app.navigateTo('ai')">
            <i class="bi bi-magic"></i> Generate Recommendations in AI Studio
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = recs.slice(0, 3).map(rec => {
      const isPositiveSavings = rec.suggestedBudgetImpact > 0;
      return `
        <div class="ai-recommendation-card">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="ai-badge"><i class="bi bi-stars"></i> ${rec.category.replace('_', ' ').toUpperCase()}</span>
            ${rec.suggestedBudgetImpact ? `
              <span class="badge ${isPositiveSavings ? 'bg-success' : 'bg-info'}">
                ${isPositiveSavings ? `Save ~${app.formatCurrency(rec.suggestedBudgetImpact)}` : `Est. ${app.formatCurrency(Math.abs(rec.suggestedBudgetImpact))}`}
              </span>
            ` : ''}
          </div>
          <h6 class="fw-bold text-dark mb-1">${rec.title}</h6>
          <p class="text-muted small mb-2">${rec.description}</p>
          <div class="d-flex align-items-center justify-content-between">
            <div class="d-flex gap-1">
              ${(rec.tags || []).map(t => `<span class="badge bg-light text-secondary border" style="font-size:0.7rem;">#${t}</span>`).join('')}
            </div>
            <button class="btn btn-sm btn-outline-purple py-0 px-2" onclick="app.navigateTo('ai')">Explore & Apply</button>
          </div>
        </div>
      `;
    }).join('');
  },

  renderQuickBudgetSummary() {
    const container = document.getElementById('dashboard-quick-budget-bars');
    if (!container) return;

    const categories = app.activeEventData?.budget?.categories || [];
    const expenses = app.activeEventData?.expenses || [];

    if (categories.length === 0) {
      container.innerHTML = `<p class="text-muted small">No categories set.</p>`;
      return;
    }

    const html = categories.slice(0, 4).map(cat => {
      const spent = expenses
        .filter(e => e.category === cat.name)
        .reduce((sum, e) => sum + (e.actualAmount || e.estimatedAmount || 0), 0);
      const allocated = cat.allocatedAmount || 1;
      const pct = Math.min(100, Math.round((spent / allocated) * 100));
      const isExceeded = spent > allocated;

      return `
        <div class="category-progress-item">
          <div class="category-progress-label">
            <span>${cat.name}</span>
            <span>${app.formatCurrency(spent)} / ${app.formatCurrency(allocated)} (${pct}%)</span>
          </div>
          <div class="progress-track">
            <div class="progress-bar-fill" style="width: ${pct}%; background-color: ${isExceeded ? '#E74C3C' : '#6C5CE7'};"></div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  }
};
