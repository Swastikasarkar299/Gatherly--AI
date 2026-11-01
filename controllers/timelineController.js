const { db } = require('../services/dbEngine');

exports.getTimelineByEventId = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await db.collection('events').findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    const tasks = await db.collection('tasks').find({ eventId });
    const eventDate = new Date(event.date);
    const now = new Date();
    const diffTime = eventDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Milestone buckets
    const milestones = {
      '3_months_before': {
        label: '3 Months Before Event',
        tagline: 'Strategic bookings, major vendor locks & design vision',
        tasks: []
      },
      '1_month_before': {
        label: '1 Month Before Event',
        tagline: 'RSVP confirmations, fittings & logistical lock-in',
        tasks: []
      },
      '1_week_before': {
        label: '1 Week Before Event',
        tagline: 'Final headcounts, vendor runsheets & packing lists',
        tasks: []
      },
      '1_day_before': {
        label: '1 Day Before Event',
        tagline: 'Rehearsals, deliveries, sound check & restful preparation',
        tasks: []
      },
      'event_day': {
        label: 'Event Day (Minute-by-Minute Runsheet)',
        tagline: 'Live execution, cues, coordination & memorable celebration',
        tasks: []
      }
    };

    tasks.forEach(task => {
      const period = task.milestonePeriod || '1_month_before';
      if (milestones[period]) {
        milestones[period].tasks.push(task);
      } else {
        milestones['1_month_before'].tasks.push(task);
      }
    });

    // Sort event_day tasks chronologically by timeSlot
    milestones['event_day'].tasks.sort((a, b) => {
      return (a.timeSlot || '').localeCompare(b.timeSlot || '');
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.isCompleted).length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.status(200).json({
      success: true,
      eventDate: event.date,
      daysRemaining,
      stats: {
        totalTasks,
        completedTasks,
        completionPercentage
      },
      milestones,
      allTasks: tasks
    });
  } catch (err) {
    console.error('Get timeline error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving timeline.'
    });
  }
};

exports.addTask = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { title, description, milestonePeriod, dueDate, timeSlot, priority, category, assignedTo } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required.'
      });
    }

    const newTask = await db.collection('tasks').create({
      eventId,
      title: title.trim(),
      description: description || '',
      milestonePeriod: milestonePeriod || '1_month_before',
      dueDate: dueDate || null,
      timeSlot: timeSlot || '',
      isCompleted: false,
      priority: priority || 'medium',
      category: category || 'General',
      assignedTo: assignedTo || 'Organizer',
      order: 0
    });

    res.status(201).json({
      success: true,
      message: 'Task added successfully.',
      task: newTask
    });
  } catch (err) {
    console.error('Add task error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error while adding task.'
    });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const existing = await db.collection('tasks').findById(taskId);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.'
      });
    }

    const updated = await db.collection('tasks').findByIdAndUpdate(taskId, { $set: req.body });

    res.status(200).json({
      success: true,
      message: 'Task updated.',
      task: updated
    });
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating task.'
    });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const removed = await db.collection('tasks').findByIdAndDelete(taskId);

    if (!removed) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task removed.'
    });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting task.'
    });
  }
};

