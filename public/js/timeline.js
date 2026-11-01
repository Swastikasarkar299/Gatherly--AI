// Gatherly Event Timeline Controller

const timeline = {
  render() {
    const activeEvent = app.activeEvent;
    if (!activeEvent) return;

    this.renderTimelineHeader();
    this.renderMilestoneSections();
  },

  renderTimelineHeader() {
    const tasks = app.activeEventData?.tasks || [];
    const completed = tasks.filter(t => t.isCompleted).length;
    const total = tasks.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    const eventDate = new Date(app.activeEvent.date);
    const daysLeft = Math.ceil((eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    document.getElementById('timeline-completed-ratio').textContent = `${completed} / ${total} Tasks Done`;
    document.getElementById('timeline-progress-pct').textContent = `${pct}%`;
    document.getElementById('timeline-progress-fill').style.width = `${pct}%`;

    const daysLeftEl = document.getElementById('timeline-days-remaining-badge');
    if (daysLeftEl) {
      daysLeftEl.textContent = daysLeft > 0 ? `${daysLeft} Days to Event` : 'Event Day!';
    }
  },

  renderMilestoneSections() {
    const container = document.getElementById('timeline-milestones-container');
    if (!container) return;

    const tasks = app.activeEventData?.tasks || [];

    const periodConfigs = [
      { key: '3_months_before', title: '3 Months Before Event', desc: 'Strategy, venue deposit, initial vendor contracts', badge: '3M' },
      { key: '1_month_before', title: '1 Month Before Event', desc: 'Final fittings, RSVP consolidation, decor layouts', badge: '1M' },
      { key: '1_week_before', title: '1 Week Before Event', desc: 'Final headcounts, vendor contact lists, packing checks', badge: '1W' },
      { key: '1_day_before', title: '1 Day Before Event', desc: 'Rehearsal, deliveries, final walk-through', badge: '1D' },
      { key: 'event_day', title: 'Event Day (Minute-by-Minute Runsheet)', desc: 'Live operations, cues, speeches, and coordination', badge: '★' }
    ];

    container.innerHTML = periodConfigs.map(period => {
      const periodTasks = tasks.filter(t => t.milestonePeriod === period.key);
      const isRunsheet = period.key === 'event_day';

      // Sort runsheet by timeSlot
      if (isRunsheet) {
        periodTasks.sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));
      }

      return `
        <div class="milestone-section mb-4">
          <div class="milestone-header">
            <div class="milestone-title-flex">
              <div class="milestone-badge-icon">${period.badge}</div>
              <div>
                <h4>${period.title}</h4>
                <p>${period.desc}</p>
              </div>
            </div>
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-light text-dark border">
                ${periodTasks.filter(t => t.isCompleted).length} / ${periodTasks.length} Done
              </span>
              <button class="btn btn-sm btn-outline-purple" onclick="timeline.openAddTaskModal('${period.key}')">
                <i class="bi bi-plus-lg"></i> Add
              </button>
            </div>
          </div>

          <div class="task-list-group">
            ${periodTasks.length === 0 ? `
              <div class="p-3 text-muted small text-center">No tasks listed for this milestone yet.</div>
            ` : periodTasks.map(t => {
              const priorityClass = t.priority === 'high' ? 'bg-danger' : (t.priority === 'medium' ? 'bg-warning text-dark' : 'bg-secondary');
              return `
                <div class="task-row-item">
                  <div class="task-row-left">
                    <input type="checkbox" class="task-checkbox" ${t.isCompleted ? 'checked' : ''} onchange="timeline.toggleTask('${t._id}', this.checked)">
                    <div>
                      <span class="task-label-text ${t.isCompleted ? 'completed' : 'fw-bold'}">${t.title}</span>
                      ${t.description ? `<div class="small text-muted">${t.description}</div>` : ''}
                      <div class="d-flex align-items-center gap-2 mt-1">
                        ${t.timeSlot ? `<span class="task-time-pill"><i class="bi bi-clock"></i> ${t.timeSlot}</span>` : ''}
                        ${t.dueDate ? `<small class="text-muted"><i class="bi bi-calendar3"></i> ${new Date(t.dueDate).toLocaleDateString()}</small>` : ''}
                        <span class="badge ${priorityClass}" style="font-size:0.68rem;">${t.priority}</span>
                        ${t.assignedTo ? `<small class="text-muted"><i class="bi bi-person"></i> ${t.assignedTo}</small>` : ''}
                      </div>
                    </div>
                  </div>
                  <div>
                    <button class="btn btn-sm btn-link text-danger p-0" onclick="timeline.deleteTask('${t._id}')" title="Delete Task">
                      <i class="bi bi-x-circle"></i>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');
  },

  async toggleTask(taskId, isCompleted) {
    try {
      await api.updateTask(taskId, { isCompleted });
      app.showToast(isCompleted ? 'Task marked complete!' : 'Task uncompleted', 'success');
      await app.refreshActiveEvent();
    } catch (err) {
      app.showToast(`Error updating task: ${err.message}`, 'danger');
    }
  },

  openAddTaskModal(defaultPeriod = '1_month_before') {
    document.getElementById('task-form').reset();
    document.getElementById('task-milestone-period').value = defaultPeriod;
    const modalEl = document.getElementById('addTaskModal');
    if (modalEl) {
      new bootstrap.Modal(modalEl).show();
    }
  },

  async handleAddTaskSubmit(e) {
    e.preventDefault();
    const eventId = app.activeEvent?._id;
    if (!eventId) return;

    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;
    const milestonePeriod = document.getElementById('task-milestone-period').value;
    const timeSlot = document.getElementById('task-time-slot').value;
    const dueDate = document.getElementById('task-due-date').value;
    const priority = document.getElementById('task-priority').value;
    const assignedTo = document.getElementById('task-assignee').value;

    try {
      await api.addTask(eventId, {
        title,
        description,
        milestonePeriod,
        timeSlot,
        dueDate,
        priority,
        assignedTo
      });

      app.showToast('Task added to timeline!', 'success');
      bootstrap.Modal.getInstance(document.getElementById('addTaskModal')).hide();
      await app.refreshActiveEvent();
    } catch (err) {
      app.showToast(`Error adding task: ${err.message}`, 'danger');
    }
  },

  async deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.deleteTask(taskId);
      app.showToast('Task removed from timeline', 'info');
      await app.refreshActiveEvent();
    } catch (err) {
      app.showToast(`Error deleting task: ${err.message}`, 'danger');
    }
  },

  downloadCalendarICS() {
    const activeEvent = app.activeEvent;
    const tasks = app.activeEventData?.tasks || [];
    if (!activeEvent) return;

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Gatherly//Event Planning Assistant//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    // Main Event
    const eventDate = new Date(activeEvent.date);
    const dateStr = eventDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    icsContent.push('BEGIN:VEVENT');
    icsContent.push(`UID:gatherly-main-${activeEvent._id}@gatherly.ai`);
    icsContent.push(`DTSTAMP:${dateStr}`);
    icsContent.push(`DTSTART:${dateStr}`);
    icsContent.push(`SUMMARY:${activeEvent.name}`);
    icsContent.push(`DESCRIPTION:Gatherly Celebration for ${activeEvent.guestCount} guests at ${activeEvent.location}. Theme: ${activeEvent.theme}`);
    icsContent.push(`LOCATION:${activeEvent.location}`);
    icsContent.push('END:VEVENT');

    // Milestones
    tasks.forEach(t => {
      if (t.dueDate) {
        const d = new Date(t.dueDate);
        const dStr = d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        icsContent.push('BEGIN:VEVENT');
        icsContent.push(`UID:gatherly-task-${t._id}@gatherly.ai`);
        icsContent.push(`DTSTAMP:${dStr}`);
        icsContent.push(`DTSTART:${dStr}`);
        icsContent.push(`SUMMARY:[Gatherly] ${t.title}`);
        icsContent.push(`DESCRIPTION:${t.description || ''} (Assigned to: ${t.assignedTo || 'Organizer'})`);
        icsContent.push('END:VEVENT');
      }
    });

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeEvent.name.replace(/[^a-zA-Z0-9]/g, '_')}_Timeline.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    app.showToast('Downloaded .ics calendar file!', 'success');
  }
};

