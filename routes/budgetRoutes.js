const express = require('./expressHelper');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const { optionalAuth } = require('../middleware/auth');

router.get('/:eventId', optionalAuth, budgetController.getBudgetByEventId);
router.put('/:eventId', optionalAuth, budgetController.updateBudgetSettings);
router.post('/:eventId/expenses', optionalAuth, budgetController.addExpense);
router.put('/expenses/:expenseId', optionalAuth, budgetController.updateExpense);
router.delete('/expenses/:expenseId', optionalAuth, budgetController.deleteExpense);

module.exports = router;
