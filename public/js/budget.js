// Gatherly Smart Budget Controller

let budgetChartInstance = null;
let comparisonChartInstance = null;

const budget = {
  render() {
    const activeEvent = app.activeEvent;
    if (!activeEvent) return;

    this.renderHeaderSummary();
    this.renderExpensesTable();
    this.renderCategoryBreakdown();
    this.renderCharts();
  },

  renderHeaderSummary() {
    const budgetData = app.activeEventData?.budget;
    const expenses = app.activeEventData?.expenses || [];
    const totalBudget = budgetData ? budgetData.totalBudget : (app.activeEvent.estimatedBudget || 0);

    const totalEstimated = expenses.reduce((s, e) => s + (e.estimatedAmount || 0), 0);
    const totalActual = expenses.reduce((s, e) => s + (e.actualAmount || 0), 0);
    const currentEffective = totalActual > 0 ? totalActual : totalEstimated;
    const remaining = totalBudget - currentEffective;
    const isOver = currentEffective > totalBudget;

    document.getElementById('budget-total-target').textContent = app.formatCurrency(totalBudget);
    document.getElementById('budget-total-spent').textContent = app.formatCurrency(currentEffective);
    document.getElementById('budget-total-remaining').textContent = app.formatCurrency(remaining);
    
    // Style remaining balance
    const remEl = document.getElementById('budget-total-remaining');
    if (isOver) {
      remEl.classList.add('text-danger');
      remEl.classList.remove('text-success');
    } else {
      remEl.classList.remove('text-danger');
      remEl.classList.add('text-success');
    }

    // Overbudget Alert Banner
    const alertBanner = document.getElementById('budget-view-alert');
    if (alertBanner) {
      if (isOver) {
        alertBanner.classList.remove('d-none');
        document.getElementById('budget-overage-text').textContent = app.formatCurrency(currentEffective - totalBudget);
      } else {
        alertBanner.classList.add('d-none');
      }
    }
  },

  renderCategoryBreakdown() {
    const container = document.getElementById('budget-category-list-container');
    if (!container) return;

    const categories = app.activeEventData?.budget?.categories || [];
    const expenses = app.activeEventData?.expenses || [];

    if (categories.length === 0) {
      container.innerHTML = `<div class="text-muted p-3">No budget categories defined yet.</div>`;
      return;
    }

    container.innerHTML = categories.map(cat => {
      const catExpenses = expenses.filter(e => e.category === cat.name);
      const spent = catExpenses.reduce((s, e) => s + (e.actualAmount || e.estimatedAmount || 0), 0);
      const allocated = cat.allocatedAmount || 1;
      const pct = Math.round((spent / allocated) * 100);
      const isExceeded = spent > allocated;

      return `
        <div class="category-progress-item mb-3">
          <div class="category-progress-label">
            <span class="fw-bold">${cat.name}</span>
            <span>${app.formatCurrency(spent)} / ${app.formatCurrency(allocated)} <strong class="${isExceeded ? 'text-danger' : 'text-primary'}">(${pct}%)</strong></span>
          </div>
          <div class="progress-track" style="height: 10px;">
            <div class="progress-bar-fill" style="width: ${Math.min(100, pct)}%; background: ${isExceeded ? '#E74C3C' : 'linear-gradient(90deg, #6C5CE7, #FDCB6E)'};"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderExpensesTable() {
    const tbody = document.getElementById('expenses-table-body');
    if (!tbody) return;

    const expenses = app.activeEventData?.expenses || [];

    if (expenses.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-muted">No expenses recorded yet. Click "+ Add Expense" to begin tracking.</td></tr>`;
      return;
    }

    tbody.innerHTML = expenses.map(exp => {
      let statusBadge = '<span class="status-pill status-unpaid">Unpaid</span>';
      if (exp.paymentStatus === 'paid') statusBadge = '<span class="status-pill status-paid">Paid</span>';
      if (exp.paymentStatus === 'partial') statusBadge = '<span class="status-pill status-partial">Partial</span>';

      return `
        <tr>
          <td>
            <span class="badge bg-light text-dark border">${exp.category}</span>
          </td>
          <td>
            <strong>${exp.title}</strong>
            ${exp.notes ? `<br><small class="text-muted">${exp.notes}</small>` : ''}
          </td>
          <td>${app.formatCurrency(exp.estimatedAmount || 0)}</td>
          <td><strong>${app.formatCurrency(exp.actualAmount || 0)}</strong></td>
          <td>${statusBadge}</td>
          <td>${exp.dueDate ? new Date(exp.dueDate).toLocaleDateString() : '—'}</td>
          <td>
            <button class="btn btn-sm btn-outline-danger py-1 px-2" onclick="budget.deleteExpense('${exp._id}')" title="Delete Expense">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  renderCharts() {
    const categories = app.activeEventData?.budget?.categories || [];
    const expenses = app.activeEventData?.expenses || [];

    const labels = categories.map(c => c.name);
    const allocatedData = categories.map(c => c.allocatedAmount || 0);
    const actualData = categories.map(c => {
      return expenses
        .filter(e => e.category === c.name)
        .reduce((sum, e) => sum + (e.actualAmount || e.estimatedAmount || 0), 0);
    });

    const palette = [
      '#6C5CE7', '#FDCB6E', '#00CEC9', '#E84393', '#00B894',
      '#A29BFE', '#FAB1A0', '#FFEAA7', '#74B9FF', '#FF7675'
    ];

    // Donut Chart: Actual Spend Breakdown
    const donutCtx = document.getElementById('budgetDonutChart');
    if (donutCtx && typeof Chart !== 'undefined') {
      if (budgetChartInstance) {
        budgetChartInstance.destroy();
      }
      budgetChartInstance = new Chart(donutCtx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: actualData.some(v => v > 0) ? actualData : allocatedData,
            backgroundColor: palette,
            borderWidth: 2,
            borderColor: '#FFFFFF'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 12, font: { size: 11 } }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const val = context.raw || 0;
                  return ` ${context.label}: ${app.formatCurrency(val)}`;
                }
              }
            }
          },
          cutout: '65%'
        }
      });
    }

    // Bar Chart: Allocated vs Actual Spending
    const barCtx = document.getElementById('budgetComparisonChart');
    if (barCtx && typeof Chart !== 'undefined') {
      if (comparisonChartInstance) {
        comparisonChartInstance.destroy();
      }
      comparisonChartInstance = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Allocated Budget (₹)',
              data: allocatedData,
              backgroundColor: 'rgba(108, 92, 231, 0.7)',
              borderRadius: 6
            },
            {
              label: 'Actual / Est. Spent (₹)',
              data: actualData,
              backgroundColor: 'rgba(253, 203, 110, 0.9)',
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top' },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return ` ${context.dataset.label}: ${app.formatCurrency(context.raw || 0)}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { callback: v => app.formatCurrency(v) }
            }
          }
        }
      });
    }
  },

  openAddExpenseModal() {
    document.getElementById('expense-form').reset();
    const modalEl = document.getElementById('addExpenseModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  },

  async handleAddExpenseSubmit(e) {
    e.preventDefault();
    const eventId = app.activeEvent?._id;
    if (!eventId) return;

    const category = document.getElementById('expense-category').value;
    const title = document.getElementById('expense-title').value;
    const estimatedAmount = parseFloat(document.getElementById('expense-est-amount').value) || 0;
    const actualAmount = parseFloat(document.getElementById('expense-act-amount').value) || 0;
    const paymentStatus = document.getElementById('expense-status').value;
    const dueDate = document.getElementById('expense-due-date').value;
    const notes = document.getElementById('expense-notes').value;

    try {
      await api.addExpense(eventId, {
        category,
        title,
        estimatedAmount,
        actualAmount,
        paymentStatus,
        dueDate,
        notes
      });

      app.showToast('Expense item recorded in Rupees (₹)!', 'success');
      bootstrap.Modal.getInstance(document.getElementById('addExpenseModal')).hide();
      await app.refreshActiveEvent();
    } catch (err) {
      app.showToast(`Failed to add expense: ${err.message}`, 'danger');
    }
  },

  async deleteExpense(expenseId) {
    if (!confirm('Are you sure you want to delete this expense line item?')) return;
    try {
      await api.deleteExpense(expenseId);
      app.showToast('Expense deleted.', 'info');
      await app.refreshActiveEvent();
    } catch (err) {
      app.showToast(`Error deleting expense: ${err.message}`, 'danger');
    }
  },

  async analyzeCostSavings() {
    const eventId = app.activeEvent?._id;
    if (!eventId) return;

    app.showToast('Analyzing Indian budget with GenAI Engine in ₹...', 'info');
    try {
      const res = await api.getCostSaving(eventId);
      if (res.success && res.analysis) {
        this.displayCostSavingModal(res.analysis);
      }
    } catch (err) {
      app.showToast(`Cost saving analysis error: ${err.message}`, 'danger');
    }
  },

  displayCostSavingModal(analysis) {
    const modalBody = document.getElementById('costSavingModalBody');
    if (!modalBody) return;

    const html = `
      <div class="mb-3 p-3 bg-light rounded">
        <div class="d-flex justify-content-between align-items-center">
          <span>Target Budget: <strong>${app.formatCurrency(analysis.totalBudget)}</strong></span>
          <span>Current Spent: <strong class="${analysis.isOverbudget ? 'text-danger' : 'text-success'}">${app.formatCurrency(analysis.totalSpent)}</strong></span>
        </div>
        ${analysis.isOverbudget ? `<div class="text-danger small mt-2 fw-bold"><i class="bi bi-exclamation-triangle-fill"></i> Currently over budget by ${app.formatCurrency(analysis.overage)}</div>` : ''}
      </div>
      <h6 class="fw-bold mb-3 text-purple"><i class="bi bi-lightbulb-fill text-gold"></i> AI Recommended Cost-Cutting Compromises:</h6>
      <div class="d-flex flex-column gap-3">
        ${analysis.suggestions.map(s => `
          <div class="p-3 border rounded border-warning bg-white">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="fw-bold text-dark">${s.area}: ${s.action}</span>
              <span class="badge bg-success">Save ~${app.formatCurrency(s.estimatedSavings)}</span>
            </div>
            <p class="small text-muted mb-1">${s.details}</p>
            <span class="badge bg-light text-secondary border">${s.impact}</span>
          </div>
        `).join('')}
      </div>
    `;

    modalBody.innerHTML = html;
    new bootstrap.Modal(document.getElementById('costSavingModal')).show();
  }
};
