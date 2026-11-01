const express = require('./expressHelper');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { optionalAuth } = require('../middleware/auth');

router.post('/generate-plan', optionalAuth, aiController.generatePlan);
router.post('/ideas', optionalAuth, aiController.generateIdeas);
router.post('/cost-saving', optionalAuth, aiController.getCostSavingSuggestions);
router.post('/apply-idea', optionalAuth, aiController.applyIdeaToPlan);

module.exports = router;
