// Gatherly AI-Powered Planning Assistant Studio

const aiPlanner = {
  currentGeneratedPlan: null,

  render() {
    const activeEvent = app.activeEvent;
    if (!activeEvent) return;

    this.populateEventInputs();
    this.renderSavedRecommendations();
  },

  populateEventInputs() {
    const evt = app.activeEvent;
    if (!evt) return;

    const catSelect = document.getElementById('ai-input-category');
    const budgetInput = document.getElementById('ai-input-budget');
    const guestsInput = document.getElementById('ai-input-guests');
    const themeInput = document.getElementById('ai-input-theme');
    const locationInput = document.getElementById('ai-input-location');
    const prefInput = document.getElementById('ai-input-prefs');

    if (catSelect) catSelect.value = evt.type || 'wedding';
    if (budgetInput) budgetInput.value = evt.estimatedBudget || 10000;
    if (guestsInput) guestsInput.value = evt.guestCount || 100;
    if (themeInput) themeInput.value = evt.theme || '';
    if (locationInput) locationInput.value = evt.location || '';
    if (prefInput) prefInput.value = evt.preferences?.notes || '';
  },

  async generateMasterPlan() {
    const evt = app.activeEvent;
    if (!evt) return;

    const btn = document.getElementById('btn-generate-master-plan');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Synthesizing with GenAI...`;
    }

    app.showToast('Gatherly AI is synthesizing your event master plan...', 'info');

    try {
      const res = await api.generatePlan({
        eventId: evt._id,
        name: evt.name,
        type: evt.type,
        guestCount: evt.guestCount,
        estimatedBudget: evt.estimatedBudget,
        location: evt.location,
        theme: evt.theme,
        preferences: evt.preferences
      });

      if (res.success && res.plan) {
        this.currentGeneratedPlan = res.plan;
        this.renderMasterPlanDisplay(res.plan);
        app.showToast('AI Master Plan generated!', 'success');
        await app.refreshActiveEvent();
      }
    } catch (err) {
      app.showToast(`AI generation failed: ${err.message}`, 'danger');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i class="bi bi-stars"></i> Generate Full Master Plan`;
      }
    }
  },

  renderMasterPlanDisplay(plan) {
    const container = document.getElementById('ai-master-plan-result');
    if (!container) return;

    container.classList.remove('d-none');

    // Executive Summary
    document.getElementById('ai-plan-summary').textContent = plan.executiveSummary;

    // Themes
    const themesContainer = document.getElementById('ai-plan-themes');
    if (themesContainer && plan.recommendedThemes) {
      themesContainer.innerHTML = plan.recommendedThemes.map(th => `
        <div class="col-md-4 mb-3">
          <div class="p-3 bg-light rounded-3 h-100 border">
            <h6 class="fw-bold text-dark mb-1">${th.name}</h6>
            <p class="small text-muted mb-2">${th.mood}</p>
            <div class="d-flex gap-2">
              ${(th.colorPalette || []).map(hex => `
                <div style="width:24px; height:24px; border-radius:50%; background-color:${hex}; border:1px solid #ddd;" title="${hex}"></div>
              `).join('')}
            </div>
          </div>
        </div>
      `).join('');
    }

    // Decor
    const decorContainer = document.getElementById('ai-plan-decor');
    if (decorContainer && plan.decorConcepts) {
      decorContainer.innerHTML = plan.decorConcepts.map(d => `
        <li class="mb-2"><i class="bi bi-gem text-gold me-2"></i> ${d}</li>
      `).join('');
    }

    // Food & Drinks Menu
    const foodContainer = document.getElementById('ai-plan-food');
    if (foodContainer && plan.foodMenu) {
      const { appetizers, mains, desserts, signatureDrinks } = plan.foodMenu;
      foodContainer.innerHTML = `
        <div class="row g-3">
          <div class="col-md-6">
            <div class="p-3 bg-white rounded-3 border">
              <strong class="text-purple small text-uppercase">Appetizers & Canapés</strong>
              <ul class="small text-muted mt-2 ps-3 mb-0">
                ${(appetizers || []).map(a => `<li>${a}</li>`).join('')}
              </ul>
            </div>
          </div>
          <div class="col-md-6">
            <div class="p-3 bg-white rounded-3 border">
              <strong class="text-purple small text-uppercase">Entrées & Mains</strong>
              <ul class="small text-muted mt-2 ps-3 mb-0">
                ${(mains || []).map(m => `<li>${m}</li>`).join('')}
              </ul>
            </div>
          </div>
          <div class="col-md-6">
            <div class="p-3 bg-white rounded-3 border">
              <strong class="text-purple small text-uppercase">Desserts & Sweets</strong>
              <ul class="small text-muted mt-2 ps-3 mb-0">
                ${(desserts || []).map(d => `<li>${d}</li>`).join('')}
              </ul>
            </div>
          </div>
          <div class="col-md-6">
            <div class="p-3 bg-white rounded-3 border">
              <strong class="text-purple small text-uppercase">Signature Drinks</strong>
              <ul class="small text-muted mt-2 ps-3 mb-0">
                ${(signatureDrinks || []).map(s => `<li>${s}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>
      `;
    }

    // Entertainment
    const entContainer = document.getElementById('ai-plan-entertainment');
    if (entContainer && plan.entertainment) {
      entContainer.innerHTML = plan.entertainment.map(e => `
        <li class="mb-2"><i class="bi bi-music-note-beamed text-purple me-2"></i> ${e}</li>
      `).join('');
    }

    // Schedule Highlights
    const schedContainer = document.getElementById('ai-plan-schedule');
    if (schedContainer && plan.timelineHighlights) {
      schedContainer.innerHTML = plan.timelineHighlights.map(s => `
        <div class="badge bg-light text-dark border p-2 text-start font-monospace">${s}</div>
      `).join('');
    }

    // Cost-Saving Tips
    const savingContainer = document.getElementById('ai-plan-savings');
    if (savingContainer && plan.costSavingTips) {
      savingContainer.innerHTML = plan.costSavingTips.map(s => `
        <div class="col-md-4 mb-2">
          <div class="p-3 bg-success-subtle text-success-emphasis rounded-3 border border-success">
            <div class="fw-bold small mb-1">${s.tip}</div>
            <div class="text-success fw-bold">Est. Save ${app.formatCurrency(s.estimatedSavings)}</div>
            <div class="small text-muted mt-1">${s.description}</div>
          </div>
        </div>
      `).join('');
    }

    // Smooth scroll down to result
    container.scrollIntoView({ behavior: 'smooth' });
  },

  async generatePersonalizedIdeas() {
    const category = document.getElementById('ai-input-category').value;
    const budget = parseFloat(document.getElementById('ai-input-budget').value) || 10000;
    const guestCount = parseInt(document.getElementById('ai-input-guests').value) || 100;
    const theme = document.getElementById('ai-input-theme').value;
    const location = document.getElementById('ai-input-location').value;
    const preferences = document.getElementById('ai-input-prefs').value;

    const btn = document.getElementById('btn-generate-ideas');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Brainstorming...`;
    }

    app.showToast('Gatherly AI is tailoring creative suggestions...', 'info');

    try {
      const res = await api.generateIdeas({
        eventId: app.activeEvent?._id,
        category,
        budget,
        guestCount,
        theme,
        location,
        preferences
      });

      if (res.success && res.ideas) {
        this.renderIdeasGrid(res.ideas);
        app.showToast(`Generated ${res.ideas.length} tailored ideas!`, 'success');
      }
    } catch (err) {
      app.showToast(`Error generating ideas: ${err.message}`, 'danger');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i class="bi bi-lightbulb-fill"></i> Generate Ideas`;
      }
    }
  },

  renderIdeasGrid(ideas) {
    const container = document.getElementById('ai-personalized-ideas-grid');
    if (!container) return;

    container.innerHTML = ideas.map((idea, idx) => `
      <div class="col-lg-6 mb-3">
        <div class="gatherly-card h-100 p-4 border-warning">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <span class="badge bg-light text-dark border px-2 py-1">${idea.category}</span>
            <span class="badge bg-success">Est. ${app.formatCurrency(idea.estimatedCost)}</span>
          </div>
          <h5 class="fw-bold mb-2" style="color: #1A0F33;">${idea.title}</h5>
          <p class="text-muted small mb-3">${idea.description}</p>
          <div class="p-2 bg-light rounded-3 small text-secondary mb-3">
            <strong>Why it works:</strong> ${idea.whyItWorks}
          </div>
          <div class="text-end">
            <button class="btn btn-sm btn-accent-gold" onclick="aiPlanner.applyIdeaToPlan(${idx})">
              <i class="bi bi-plus-circle-fill"></i> Add to My Plan & Budget
            </button>
          </div>
        </div>
      </div>
    `).join('');

    this.lastGeneratedIdeas = ideas;
  },

  async applyIdeaToPlan(index) {
    if (!this.lastGeneratedIdeas || !this.lastGeneratedIdeas[index]) return;
    const idea = this.lastGeneratedIdeas[index];
    const eventId = app.activeEvent?._id;
    if (!eventId) return;

    try {
      const res = await api.applyIdea(eventId, idea);
      if (res.success) {
        app.showToast('Idea added to your Budget and Timeline checklist!', 'success');
        await app.refreshActiveEvent();
      }
    } catch (err) {
      app.showToast(`Failed to apply idea: ${err.message}`, 'danger');
    }
  },

  renderSavedRecommendations() {
    const container = document.getElementById('ai-saved-recommendations-list');
    if (!container) return;

    const recs = app.activeEventData?.recommendations || [];
    if (recs.length === 0) {
      container.innerHTML = `<p class="text-muted small">No saved AI recommendations yet.</p>`;
      return;
    }

    container.innerHTML = recs.map(rec => `
      <div class="ai-recommendation-card mb-3">
        <div class="d-flex justify-content-between mb-1">
          <span class="ai-badge">${rec.category}</span>
          ${rec.suggestedBudgetImpact ? `<span class="badge bg-success">Impact: ${app.formatCurrency(rec.suggestedBudgetImpact)}</span>` : ''}
        </div>
        <h6 class="fw-bold text-dark mt-1 mb-1">${rec.title}</h6>
        <p class="small text-muted mb-0">${rec.description}</p>
      </div>
    `).join('');
  }
};

