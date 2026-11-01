const { db } = require('../services/dbEngine');
const aiService = require('../services/aiService');

exports.generatePlan = async (req, res) => {
  try {
    const { eventId, name, type, guestCount, estimatedBudget, location, theme, preferences } = req.body;

    let eventData = { name, type, guestCount, estimatedBudget, location, theme, preferences };

    // If eventId provided, merge with stored event
    if (eventId) {
      const stored = await db.collection('events').findById(eventId);
      if (stored) {
        eventData = {
          name: name || stored.name,
          type: type || stored.type,
          guestCount: guestCount || stored.guestCount,
          estimatedBudget: estimatedBudget || stored.estimatedBudget,
          location: location || stored.location,
          theme: theme || stored.theme,
          preferences: preferences || stored.preferences
        };
      }
    }

    if (!eventData.type || !eventData.estimatedBudget) {
      return res.status(400).json({
        success: false,
        message: 'Event type and budget are required to generate an AI plan.'
      });
    }

    const plan = await aiService.generateComprehensivePlan(eventData);

    // Save as recommendation record if eventId is provided
    if (eventId) {
      await db.collection('ai_recommendations').create({
        eventId,
        category: 'overall_plan',
        title: `AI Master Plan: ${plan.recommendedThemes[0]?.name || eventData.theme}`,
        description: plan.executiveSummary,
        details: plan,
        isApplied: true
      });
    }

    res.status(200).json({
      success: true,
      message: 'Personalised event plan generated successfully.',
      plan
    });
  } catch (err) {
    console.error('Generate plan error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI plan.'
    });
  }
};

exports.generateIdeas = async (req, res) => {
  try {
    const { eventId, category, budget, guestCount, theme, location, preferences } = req.body;

    let params = {
      category: category || 'wedding',
      budget: Number(budget) || 10000,
      guestCount: Number(guestCount) || 100,
      theme: theme || '',
      location: location || '',
      preferences: preferences || ''
    };

    if (eventId) {
      const stored = await db.collection('events').findById(eventId);
      if (stored) {
        params = {
          category: stored.type,
          budget: stored.estimatedBudget,
          guestCount: stored.guestCount,
          theme: stored.theme,
          location: stored.location,
          preferences: stored.preferences?.notes || ''
        };
      }
    }

    const ideas = await aiService.generatePersonalizedIdeas(params);

    res.status(200).json({
      success: true,
      count: ideas.length,
      ideas
    });
  } catch (err) {
    console.error('Generate ideas error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to generate personalised ideas.'
    });
  }
};

exports.getCostSavingSuggestions = async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide eventId for cost-saving analysis.'
      });
    }

    const event = await db.collection('events').findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    const budget = await db.collection('budgets').findOne({ eventId }) || { totalBudget: event.estimatedBudget };
    const expenses = await db.collection('expenses').find({ eventId });

    const analysis = await aiService.generateCostSavingSuggestions(event, budget, expenses);

    res.status(200).json({
      success: true,
      analysis
    });
  } catch (err) {
    console.error('Cost saving error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to generate cost-saving analysis.'
    });
  }
};

exports.applyIdeaToPlan = async (req, res) => {
  try {
    const { eventId, idea } = req.body;

    if (!eventId || !idea) {
      return res.status(400).json({
        success: false,
        message: 'eventId and idea are required.'
      });
    }

    // Map idea category to expense/task
    let category = 'Decoration';
    if (idea.category === 'Food') category = 'Catering';
    else if (idea.category === 'Entertainment') category = 'Entertainment';
    else if (idea.category === 'Logistics') category = 'Logistics';

    // Create an expense item
    const expense = await db.collection('expenses').create({
      eventId,
      category,
      title: idea.title,
      estimatedAmount: Number(idea.estimatedCost) || 200,
      actualAmount: 0,
      paymentStatus: 'unpaid',
      notes: `AI Recommendation: ${idea.whyItWorks || idea.description}`
    });

    // Create a corresponding task
    const task = await db.collection('tasks').create({
      eventId,
      title: `Implement Idea: ${idea.title}`,
      description: idea.description,
      milestonePeriod: '1_month_before',
      priority: 'medium',
      category: category,
      assignedTo: 'Lead Organizer'
    });

    res.status(201).json({
      success: true,
      message: 'Idea successfully added to your budget and timeline checklist!',
      expense,
      task
    });
  } catch (err) {
    console.error('Apply idea error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to apply idea to plan.'
    });
  }
};

