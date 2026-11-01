// Gatherly Vendor Management Controller

let currentVendorFilter = 'ALL';

const vendors = {
  render() {
    const activeEvent = app.activeEvent;
    if (!activeEvent) return;

    this.renderVendorStats();
    this.renderCategoryFilterButtons();
    this.renderVendorList();
  },

  renderVendorStats() {
    const vendorsList = app.activeEventData?.vendors || [];

    const total = vendorsList.length;
    const booked = vendorsList.filter(v => v.status === 'booked' || v.status === 'completed').length;
    const pending = total - booked;
    const totalAgreed = vendorsList.reduce((s, v) => s + (v.agreedAmount || 0), 0);
    const depositsPaid = vendorsList.reduce((s, v) => s + (v.depositPaid || 0), 0);
    const remainingBalance = Math.max(0, totalAgreed - depositsPaid);

    document.getElementById('vendor-stat-total').textContent = total;
    document.getElementById('vendor-stat-booked').textContent = booked;
    document.getElementById('vendor-stat-pending').textContent = pending;
    document.getElementById('vendor-stat-agreed').textContent = app.formatCurrency(totalAgreed);
    document.getElementById('vendor-stat-deposits').textContent = app.formatCurrency(depositsPaid);
    document.getElementById('vendor-stat-balance').textContent = app.formatCurrency(remainingBalance);
  },

  renderCategoryFilterButtons() {
    const categories = [
      'ALL',
      'Venue',
      'Catering',
      'Photography',
      'Decoration',
      'Entertainment',
      'Transportation',
      'Invitations',
      'Lighting & Sound'
    ];

    const container = document.getElementById('vendor-filter-buttons');
    if (!container) return;

    container.innerHTML = categories.map(cat => `
      <button class="btn btn-sm ${currentVendorFilter === cat ? 'btn-primary-purple' : 'btn-outline-purple'}" onclick="vendors.setFilter('${cat}')">
        ${cat}
      </button>
    `).join('');
  },

  setFilter(category) {
    currentVendorFilter = category;
    this.renderCategoryFilterButtons();
    this.renderVendorList();
  },

  renderVendorList() {
    const container = document.getElementById('vendor-cards-grid');
    if (!container) return;

    let list = app.activeEventData?.vendors || [];
    if (currentVendorFilter !== 'ALL') {
      list = list.filter(v => v.category === currentVendorFilter);
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center p-5 bg-white rounded-4 border">
          <p class="text-muted mb-3">No vendors found under "${currentVendorFilter}".</p>
          <button class="btn btn-primary-purple" onclick="vendors.openAddVendorModal()">
            <i class="bi bi-person-plus-fill"></i> Add Vendor
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(v => {
      let statusClass = 'status-researching';
      if (v.status === 'booked') statusClass = 'status-booked';
      if (v.status === 'completed') statusClass = 'status-completed';
      if (v.status === 'quoted') statusClass = 'status-quoted';

      const remainingBal = Math.max(0, (v.agreedAmount || 0) - (v.depositPaid || 0));

      return `
        <div class="col-lg-6 col-xl-4 mb-4">
          <div class="gatherly-card h-100 d-flex flex-column justify-content-between p-4">
            <div>
              <div class="d-flex justify-content-between align-items-start mb-2">
                <span class="badge bg-light text-dark border px-2 py-1">${v.category}</span>
                <span class="status-pill ${statusClass}">${v.status.toUpperCase()}</span>
              </div>
              <h5 class="fw-bold mb-1" style="color:#1A0F33;">${v.name}</h5>
              ${v.contactPerson ? `<p class="small text-muted mb-2"><i class="bi bi-person"></i> ${v.contactPerson}</p>` : ''}

              <div class="small mb-3 text-secondary">
                ${v.phone ? `<div><i class="bi bi-telephone"></i> ${v.phone}</div>` : ''}
                ${v.email ? `<div><i class="bi bi-envelope"></i> ${v.email}</div>` : ''}
              </div>

              <!-- Payment Tracking Details in Rupees -->
              <div class="bg-light p-3 rounded-3 mb-3">
                <div class="d-flex justify-content-between small mb-1">
                  <span class="text-muted">Quoted Amount:</span>
                  <strong>${app.formatCurrency(v.quotedAmount || 0)}</strong>
                </div>
                <div class="d-flex justify-content-between small mb-1">
                  <span class="text-muted">Agreed Price:</span>
                  <strong>${app.formatCurrency(v.agreedAmount || 0)}</strong>
                </div>
                <div class="d-flex justify-content-between small mb-1">
                  <span class="text-muted">Deposit Paid:</span>
                  <strong class="text-success">${app.formatCurrency(v.depositPaid || 0)}</strong>
                </div>
                <div class="d-flex justify-content-between small pt-1 border-top">
                  <span class="fw-bold">Remaining Balance:</span>
                  <strong class="${remainingBal > 0 ? 'text-danger' : 'text-success'}">${app.formatCurrency(remainingBal)}</strong>
                </div>
              </div>

              <!-- Category Checklist Items -->
              ${v.checklistItems && v.checklistItems.length > 0 ? `
                <div class="mb-3">
                  <div class="small fw-bold text-muted mb-2 text-uppercase" style="font-size:0.7rem; letter-spacing:0.5px;">Vendor Checklist</div>
                  <div class="d-flex flex-column gap-1">
                    ${v.checklistItems.map((chk, idx) => `
                      <label class="small d-flex align-items-center gap-2 cursor-pointer mb-0">
                        <input type="checkbox" ${chk.isCompleted ? 'checked' : ''} onchange="vendors.toggleChecklistItem('${v._id}', ${idx}, this.checked)">
                        <span class="${chk.isCompleted ? 'text-decoration-line-through text-muted' : ''}">${chk.title}</span>
                      </label>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              ${v.contractNotes ? `<p class="small text-muted border-top pt-2 mb-0"><i class="bi bi-journal-text"></i> ${v.contractNotes}</p>` : ''}
            </div>

            <!-- Bottom Actions -->
            <div class="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
              <select class="form-select form-select-sm w-auto" onchange="vendors.changeStatus('${v._id}', this.value)">
                <option value="researching" ${v.status === 'researching' ? 'selected' : ''}>Researching</option>
                <option value="contacted" ${v.status === 'contacted' ? 'selected' : ''}>Contacted</option>
                <option value="quoted" ${v.status === 'quoted' ? 'selected' : ''}>Quoted</option>
                <option value="booked" ${v.status === 'booked' ? 'selected' : ''}>Booked</option>
                <option value="completed" ${v.status === 'completed' ? 'selected' : ''}>Completed</option>
              </select>
              <button class="btn btn-sm btn-outline-danger" onclick="vendors.deleteVendor('${v._id}')" title="Delete Vendor">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  async changeStatus(vendorId, newStatus) {
    try {
      await api.updateVendor(vendorId, { status: newStatus });
      app.showToast(`Vendor status updated to ${newStatus.toUpperCase()}`, 'success');
      await app.refreshActiveEvent();
    } catch (err) {
      app.showToast(`Error updating vendor status: ${err.message}`, 'danger');
    }
  },

  async toggleChecklistItem(vendorId, itemIndex, isCompleted) {
    const v = (app.activeEventData?.vendors || []).find(item => item._id === vendorId);
    if (!v || !v.checklistItems) return;

    v.checklistItems[itemIndex].isCompleted = isCompleted;

    try {
      await api.updateVendor(vendorId, { checklistItems: v.checklistItems });
      app.showToast('Checklist item updated.', 'info');
      await app.refreshActiveEvent();
    } catch (err) {
      app.showToast(`Error updating checklist: ${err.message}`, 'danger');
    }
  },

  openAddVendorModal() {
    document.getElementById('vendor-form').reset();
    const modalEl = document.getElementById('addVendorModal');
    if (modalEl) {
      new bootstrap.Modal(modalEl).show();
    }
  },

  async handleAddVendorSubmit(e) {
    e.preventDefault();
    const eventId = app.activeEvent?._id;
    if (!eventId) return;

    const name = document.getElementById('vendor-name').value;
    const category = document.getElementById('vendor-category').value;
    const contactPerson = document.getElementById('vendor-contact').value;
    const email = document.getElementById('vendor-email').value;
    const phone = document.getElementById('vendor-phone').value;
    const status = document.getElementById('vendor-status-select').value;
    const quotedAmount = parseFloat(document.getElementById('vendor-quoted').value) || 0;
    const agreedAmount = parseFloat(document.getElementById('vendor-agreed').value) || 0;
    const depositPaid = parseFloat(document.getElementById('vendor-deposit').value) || 0;
    const contractNotes = document.getElementById('vendor-notes').value;

    try {
      await api.createVendor({
        eventId,
        name,
        category,
        contactPerson,
        email,
        phone,
        status,
        quotedAmount,
        agreedAmount,
        depositPaid,
        contractNotes
      });

      app.showToast('Vendor added to checklist in Rupees (₹)!', 'success');
      bootstrap.Modal.getInstance(document.getElementById('addVendorModal')).hide();
      await app.refreshActiveEvent();
    } catch (err) {
      app.showToast(`Error adding vendor: ${err.message}`, 'danger');
    }
  },

  async deleteVendor(vendorId) {
    if (!confirm('Are you sure you want to remove this vendor?')) return;
    try {
      await api.deleteVendor(vendorId);
      app.showToast('Vendor removed.', 'info');
      await app.refreshActiveEvent();
    } catch (err) {
      app.showToast(`Error deleting vendor: ${err.message}`, 'danger');
    }
  }
};
