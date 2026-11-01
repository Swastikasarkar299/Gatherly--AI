const { db } = require('../services/dbEngine');

exports.getBudgetByEventId = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await db.collection('events').findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    let budget = await db.collection('budgets').findOne({ eventId });
    if (!budget) {
      // Auto-create default budget if missing
      budget = await db.collection('budgets').create({
        eventId,
        totalBudget: event.estimatedBudget || 10000,
        categories: [
          { name: 'Venue', allocatedAmount: Math.round((event.estimatedBudget || 10000) * 0.35), percentage: 35 },
          { name: 'Catering', allocatedAmount: Math.round((event.estimatedBudget || 10000) * 0.28), percentage: 28 },
          { name: 'Photography', allocatedAmount: Math.round((event.estimatedBudget || 10000) * 0.10), percentage: 10 },
          { name: 'Decoration', allocatedAmount: Math.round((event.estimatedBudget || 10000) * 0.10), percentage: 10 },
          { name: 'Entertainment', allocatedAmount: Math.round((event.estimatedBudget || 10000) * 0.08), percentage: 8 },
          { name: 'Contingency', allocatedAmount: Math.round((event.estimatedBudget || 10000) * 0.09), percentage: 9 }
        ],
        contingencyRate: 10,
        currency: 'INR'
      });
    }

    const expenses = await db.collection('expenses').find({ eventId });

    // Aggregate calculations
    let totalEstimated = 0;
    let totalActual = 0;
    let totalPaid = 0;
    const categoryTotals = {};

    // Initialize category totals
    (budget.categories || []).forEach(cat => {
      categoryTotals[cat.name] = {
        allocated: cat.allocatedAmount || 0,
        estimated: 0,
        actual: 0,
        paid: 0,
        itemsCount: 0
      };
    });

    expenses.forEach(exp => {
      const est = exp.estimatedAmount || 0;
      const act = exp.actualAmount || 0;
      totalEstimated += est;
      totalActual += act;

      if (exp.paymentStatus === 'paid') {
        totalPaid += act > 0 ? act : est;
      } else if (exp.paymentStatus === 'partial') {
        totalPaid += (act > 0 ? act : est) * 0.5;
      }

      if (!categoryTotals[exp.category]) {
        categoryTotals[exp.category] = {
          allocated: 0,
          estimated: 0,
          actual: 0,
          paid: 0,
          itemsCount: 0
        };
      }

      categoryTotals[exp.category].estimated += est;
      categoryTotals[exp.category].actual += act;
      categoryTotals[exp.category].itemsCount += 1;
    });

    const totalBudget = budget.totalBudget || event.estimatedBudget;
    const currentEffectiveSpent = totalActual > 0 ? totalActual : totalEstimated;
    const remainingBalance = totalBudget - currentEffectiveSpent;
    const isOverbudget = currentEffectiveSpent > totalBudget;
    const overageAmount = isOverbudget ? (currentEffectiveSpent - totalBudget) : 0;
    const percentSpent = totalBudget > 0 ? Math.round((currentEffectiveSpent / totalBudget) * 100) : 0;

    res.status(200).json({
      success: true,
      budget,
      expenses,
      summary: {
        totalBudget,
        totalEstimated,
        totalActual,
        totalPaid,
        remainingBalance,
        isOverbudget,
        overageAmount,
        percentSpent,
        currency: budget.currency || 'USD'
      },
      categoryBreakdown: categoryTotals
    });
  } catch (err) {
    console.error('Get budget error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching budget data.'
    });
  }
};

exports.updateBudgetSettings = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { totalBudget, categories, contingencyRate, currency } = req.body;

    let budget = await db.collection('budgets').findOne({ eventId });
    if (!budget) {
      budget = await db.collection('budgets').create({
        eventId,
        totalBudget: Number(totalBudget),
        categories: categories || [],
        contingencyRate: contingencyRate || 10,
        currency: currency || 'USD'
      });
    } else {
      const updateData = {};
      if (totalBudget !== undefined) updateData.totalBudget = Number(totalBudget);
      if (categories !== undefined) updateData.categories = categories;
      if (contingencyRate !== undefined) updateData.contingencyRate = Number(contingencyRate);
      if (currency !== undefined) updateData.currency = currency;

      budget = await db.collection('budgets').findByIdAndUpdate(budget._id, { $set: updateData });
    }

    // Also update parent event's estimatedBudget
    if (totalBudget !== undefined) {
      await db.collection('events').findByIdAndUpdate(eventId, {
        $set: { estimatedBudget: Number(totalBudget) }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Budget settings updated successfully.',
      budget
    });
  } catch (err) {
    console.error('Update budget error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating budget.'
    });
  }
};

exports.addExpense = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { category, title, estimatedAmount, actualAmount, paymentStatus, dueDate, vendorId, notes } = req.body;

    if (!category || !title) {
      return res.status(400).json({
        success: false,
        message: 'Category and title are required for an expense item.'
      });
    }

    const newExpense = await db.collection('expenses').create({
      eventId,
      category,
      title: title.trim(),
      estimatedAmount: Number(estimatedAmount) || 0,
      actualAmount: Number(actualAmount) || 0,
      paymentStatus: paymentStatus || 'unpaid',
      dueDate: dueDate || null,
      vendorId: vendorId || null,
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      message: 'Expense item added.',
      expense: newExpense
    });
  } catch (err) {
    console.error('Add expense error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error while adding expense.'
    });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const existing = await db.collection('expenses').findById(expenseId);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Expense record not found.'
      });
    }

    const updated = await db.collection('expenses').findByIdAndUpdate(expenseId, { $set: req.body });

    res.status(200).json({
      success: true,
      message: 'Expense updated.',
      expense: updated
    });
  } catch (err) {
    console.error('Update expense error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating expense.'
    });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const removed = await db.collection('expenses').findByIdAndDelete(expenseId);

    if (!removed) {
      return res.status(404).json({
        success: false,
        message: 'Expense record not found.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Expense removed.'
    });
  } catch (err) {
    console.error('Delete expense error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting expense.'
    });
  }
};

