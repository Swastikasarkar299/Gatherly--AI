const { db, generateObjectId } = require('../services/dbEngine');
const aiService = require('../services/aiService');

// Helper to generate default timeline tasks for an event
function generateDefaultTasks(eventId, eventDate) {
  const targetDate = new Date(eventDate);
  const now = new Date();
  
  // Calculate milestone dates relative to event date
  const threeMonthsBefore = new Date(targetDate.getTime() - 90 * 24 * 3600 * 1000).toISOString().split('T')[0];
  const oneMonthBefore = new Date(targetDate.getTime() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0];
  const oneWeekBefore = new Date(targetDate.getTime() - 7 * 24 * 3600 * 1000).toISOString().split('T')[0];
  const oneDayBefore = new Date(targetDate.getTime() - 1 * 24 * 3600 * 1000).toISOString().split('T')[0];
  const eventDay = targetDate.toISOString().split('T')[0];

  return [
    // 3 Months Before
    {
      eventId,
      title: 'Lock In Primary Venue Contract & Deposit',
      description: 'Review venue terms, insurance requirements, and payment schedule.',
      milestonePeriod: '3_months_before',
      dueDate: threeMonthsBefore,
      isCompleted: false,
      priority: 'high',
      category: 'Venue',
      assignedTo: 'Lead Organizer'
    },
    {
      eventId,
      title: 'Book Catering & Confirm Menu Tasting',
      description: 'Lock in guest meal selections and dietary alternatives.',
      milestonePeriod: '3_months_before',
      dueDate: threeMonthsBefore,
      isCompleted: false,
      priority: 'high',
      category: 'Catering',
      assignedTo: 'Lead Organizer'
    },
    {
      eventId,
      title: 'Design and Distribute Invitations & RSVP Link',
      description: 'Mail or digitally send invitation suites with RSVP deadline.',
      milestonePeriod: '3_months_before',
      dueDate: threeMonthsBefore,
      isCompleted: false,
      priority: 'medium',
      category: 'Invitations',
      assignedTo: 'Host / Team'
    },

    // 1 Month Before
    {
      eventId,
      title: 'Tally RSVPs & Finalize Floor Layout',
      description: 'Determine table count and seating arrangement.',
      milestonePeriod: '1_month_before',
      dueDate: oneMonthBefore,
      isCompleted: false,
      priority: 'high',
      category: 'Logistics',
      assignedTo: 'Organizer'
    },
    {
      eventId,
      title: 'Confirm Photography Shot List & AV Tech Setup',
      description: 'Review key visual moments with photographer and DJ/sound engineer.',
      milestonePeriod: '1_month_before',
      dueDate: oneMonthBefore,
      isCompleted: false,
      priority: 'medium',
      category: 'Media & AV',
      assignedTo: 'AV Coordinator'
    },

    // 1 Week Before
    {
      eventId,
      title: 'Deliver Final Guaranteed Headcount to Caterer',
      description: 'Lock in exact attendee numbers and allergy lists.',
      milestonePeriod: '1_week_before',
      dueDate: oneWeekBefore,
      isCompleted: false,
      priority: 'high',
      category: 'Catering',
      assignedTo: 'Organizer'
    },
    {
      eventId,
      title: 'Finalize Vendor Arrival Windows & Contact Sheet',
      description: 'Distribute run-of-show and emergency phone numbers to all vendors.',
      milestonePeriod: '1_week_before',
      dueDate: oneWeekBefore,
      isCompleted: false,
      priority: 'high',
      category: 'Logistics',
      assignedTo: 'Lead Coordinator'
    },

    // 1 Day Before
    {
      eventId,
      title: 'Onsite Rehearsal / Venue Walkthrough',
      description: 'Conduct rehearsal, sound test, and verify stage & table placements.',
      milestonePeriod: '1_day_before',
      dueDate: oneDayBefore,
      timeSlot: '04:00 PM',
      isCompleted: false,
      priority: 'high',
      category: 'Rehearsal',
      assignedTo: 'Event Core Team'
    },
    {
      eventId,
      title: 'Deliver Signage, Place Cards & Favor Boxes',
      description: 'Safely store decor items in locked venue storage room.',
      milestonePeriod: '1_day_before',
      dueDate: oneDayBefore,
      timeSlot: '02:00 PM',
      isCompleted: false,
      priority: 'medium',
      category: 'Decoration',
      assignedTo: 'Decor Lead'
    },

    // Event Day
    {
      eventId,
      title: 'Vendor Load-In, Power & Lighting Verification',
      description: 'Oversee setup for florist, sound, and staging.',
      milestonePeriod: 'event_day',
      dueDate: eventDay,
      timeSlot: '08:00 AM',
      isCompleted: false,
      priority: 'high',
      category: 'Runsheet',
      assignedTo: 'Production Manager'
    },
    {
      eventId,
      title: 'Welcome Desk Opens & Guest Registration',
      description: 'Greet attendees, distribute program schedules and badges.',
      milestonePeriod: 'event_day',
      dueDate: eventDay,
      timeSlot: '03:30 PM',
      isCompleted: false,
      priority: 'high',
      category: 'Runsheet',
      assignedTo: 'Welcome Squad'
    },
    {
      eventId,
      title: 'Main Program / Ceremony Starts',
      description: 'Execute stage cue, opening remarks, and featured proceedings.',
      milestonePeriod: 'event_day',
      dueDate: eventDay,
      timeSlot: '04:30 PM',
      isCompleted: false,
      priority: 'high',
      category: 'Runsheet',
      assignedTo: 'MC & Leads'
    },
    {
      eventId,
      title: 'Dinner / Food Service & Refreshments',
      description: 'Caterer begins service, background music plays.',
      milestonePeriod: 'event_day',
      dueDate: eventDay,
      timeSlot: '06:00 PM',
      isCompleted: false,
      priority: 'high',
      category: 'Runsheet',
      assignedTo: 'Catering Lead'
    },
    {
      eventId,
      title: 'Celebration, Dancing & Grand Finale',
      description: 'High-energy entertainment, open dance floor, closing toasts.',
      milestonePeriod: 'event_day',
      dueDate: eventDay,
      timeSlot: '08:00 PM',
      isCompleted: false,
      priority: 'medium',
      category: 'Runsheet',
      assignedTo: 'DJ / Band'
    }
  ];
}

// Helper to generate default vendor checklist
function generateDefaultVendors(eventId, eventType, budget) {
  const categories = [
    { name: 'Venue', pct: 0.35, defaultNotes: 'Capacity, curfew, and security deposit terms' },
    { name: 'Catering', pct: 0.28, defaultNotes: 'Staffing, tastings, and bar service inclusions' },
    { name: 'Photography', pct: 0.10, defaultNotes: 'Hours of coverage and digital gallery rights' },
    { name: 'Decoration', pct: 0.08, defaultNotes: 'Backdrop, floral centerpieces, and table runners' },
    { name: 'Entertainment', pct: 0.07, defaultNotes: 'Sound system, microphones, and curated playlist' },
    { name: 'Transportation', pct: 0.04, defaultNotes: 'Shuttle buses or VIP parking permits' },
    { name: 'Invitations', pct: 0.03, defaultNotes: 'Digital RSVP portal and luxury printed suites' },
    { name: 'Lighting & Sound', pct: 0.05, defaultNotes: 'Perimeter uplighting, stage pin spots, and PA' }
  ];

  return categories.map(cat => ({
    eventId,
    name: `Preferred ${cat.name} Partner`,
    category: cat.name,
    status: 'researching',
    quotedAmount: Math.round(budget * cat.pct),
    agreedAmount: 0,
    depositPaid: 0,
    paymentStatus: 'pending',
    contractNotes: cat.defaultNotes,
    checklistItems: [
      { title: 'Check portfolio and verify reviews', isCompleted: false },
      { title: 'Request detailed written quote', isCompleted: false },
      { title: 'Verify cancellation and refund policy', isCompleted: false }
    ]
  }));
}

// Helper to generate budget categories
function generateBudgetCategories(totalBudget, eventType) {
  const basePercentages = {
    wedding: [
      { name: 'Venue', pct: 35 },
      { name: 'Catering', pct: 28 },
      { name: 'Photography', pct: 10 },
      { name: 'Decoration', pct: 9 },
      { name: 'Entertainment', pct: 7 },
      { name: 'Transportation', pct: 3 },
      { name: 'Invitations', pct: 2 },
      { name: 'Lighting & Sound', pct: 3 },
      { name: 'Contingency', pct: 3 }
    ],
    birthday: [
      { name: 'Venue', pct: 30 },
      { name: 'Catering', pct: 30 },
      { name: 'Decoration', pct: 15 },
      { name: 'Entertainment', pct: 12 },
      { name: 'Photography', pct: 5 },
      { name: 'Invitations', pct: 3 },
      { name: 'Contingency', pct: 5 }
    ],
    community: [
      { name: 'Venue', pct: 20 },
      { name: 'Lighting & Sound', pct: 22 },
      { name: 'Entertainment', pct: 18 },
      { name: 'Decoration', pct: 12 },
      { name: 'Catering', pct: 12 },
      { name: 'Transportation', pct: 6 },
      { name: 'Invitations', pct: 4 },
      { name: 'Contingency', pct: 6 }
    ]
  };

  const scheme = basePercentages[eventType] || basePercentages.wedding;

  return scheme.map(item => ({
    name: item.name,
    allocatedAmount: Math.round(totalBudget * (item.pct / 100)),
    percentage: item.pct
  }));
}

exports.createEvent = async (req, res) => {
  try {
    const { name, type, date, location, guestCount, estimatedBudget, theme, preferences } = req.body;

    if (!name || !date || !location || !guestCount || estimatedBudget === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, date, location, guestCount, and estimatedBudget.'
      });
    }

    const userId = req.user ? req.user.id : (await db.collection('users').find())[0]?._id;

    const newEvent = await db.collection('events').create({
      userId,
      name: name.trim(),
      type: type || 'wedding',
      date: new Date(date).toISOString(),
      location: location.trim(),
      guestCount: Number(guestCount),
      estimatedBudget: Number(estimatedBudget),
      theme: theme ? theme.trim() : 'Classic Elegance',
      preferences: preferences || {
        colorPalette: ['#6C5CE7', '#FDCB6E', '#FFFFFF'],
        dietaryOptions: ['Vegetarian', 'Gluten-Free'],
        entertainmentStyle: 'Live Music & DJ',
        atmosphere: 'Festive & Elegant',
        notes: ''
      },
      status: 'planning'
    });

    const eventId = newEvent._id;

    // Auto-create initial budget
    const categories = generateBudgetCategories(Number(estimatedBudget), newEvent.type);
    await db.collection('budgets').create({
      eventId,
      totalBudget: Number(estimatedBudget),
      categories,
      contingencyRate: 10,
      currency: 'INR'
    });

    // Auto-create initial timeline tasks
    const tasks = generateDefaultTasks(eventId, newEvent.date);
    for (const t of tasks) {
      await db.collection('tasks').create(t);
    }

    // Auto-create initial vendor checklist
    const vendors = generateDefaultVendors(eventId, newEvent.type, Number(estimatedBudget));
    for (const v of vendors) {
      await db.collection('vendors').create(v);
    }

    res.status(201).json({
      success: true,
      message: 'Event created with automatic budget, timeline, and vendor checklists initialized.',
      event: newEvent
    });
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating event.'
    });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    let events = [];

    if (userId) {
      events = await db.collection('events').find({ userId });
    } else {
      events = await db.collection('events').find();
    }

    // Sort by event date ascending
    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json({
      success: true,
      count: events.length,
      events
    });
  } catch (err) {
    console.error('Get events error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving events.'
    });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await db.collection('events').findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    const budget = await db.collection('budgets').findOne({ eventId: id });
    const expenses = await db.collection('expenses').find({ eventId: id });
    const vendors = await db.collection('vendors').find({ eventId: id });
    const tasks = await db.collection('tasks').find({ eventId: id });
    const recommendations = await db.collection('ai_recommendations').find({ eventId: id });

    // Calculate metrics
    const totalSpent = expenses.reduce((sum, e) => sum + (e.actualAmount || e.estimatedAmount || 0), 0);
    const bookedVendors = vendors.filter(v => v.status === 'booked' || v.status === 'completed').length;
    const completedTasks = tasks.filter(t => t.isCompleted).length;

    res.status(200).json({
      success: true,
      event,
      budget,
      metrics: {
        totalBudget: budget ? budget.totalBudget : event.estimatedBudget,
        totalSpent,
        remainingBalance: (budget ? budget.totalBudget : event.estimatedBudget) - totalSpent,
        isOverbudget: totalSpent > (budget ? budget.totalBudget : event.estimatedBudget),
        totalVendors: vendors.length,
        bookedVendors,
        totalTasks: tasks.length,
        completedTasks,
        taskCompletionRate: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0
      },
      expenses,
      vendors,
      tasks,
      recommendations
    });
  } catch (err) {
    console.error('Get event by id error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching event details.'
    });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.collection('events').findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    const updated = await db.collection('events').findByIdAndUpdate(id, { $set: req.body });

    // If estimatedBudget was updated, update budget record too
    if (req.body.estimatedBudget !== undefined) {
      const budget = await db.collection('budgets').findOne({ eventId: id });
      if (budget) {
        await db.collection('budgets').findByIdAndUpdate(budget._id, {
          $set: { totalBudget: Number(req.body.estimatedBudget) }
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Event updated successfully.',
      event: updated
    });
  } catch (err) {
    console.error('Update event error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating event.'
    });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const removed = await db.collection('events').findByIdAndDelete(id);

    if (!removed) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    // Cascade delete related records
    await db.collection('budgets').deleteMany({ eventId: id });
    await db.collection('expenses').deleteMany({ eventId: id });
    await db.collection('vendors').deleteMany({ eventId: id });
    await db.collection('tasks').deleteMany({ eventId: id });
    await db.collection('ai_recommendations').deleteMany({ eventId: id });

    res.status(200).json({
      success: true,
      message: 'Event and all associated records deleted successfully.'
    });
  } catch (err) {
    console.error('Delete event error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting event.'
    });
  }
};

