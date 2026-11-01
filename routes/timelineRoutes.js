const express = require('./expressHelper');
const router = express.Router();
const timelineController = require('../controllers/timelineController');
const { optionalAuth } = require('../middleware/auth');

router.get('/:eventId', optionalAuth, timelineController.getTimelineByEventId);
router.post('/:eventId/tasks', optionalAuth, timelineController.addTask);
router.put('/tasks/:taskId', optionalAuth, timelineController.updateTask);
router.delete('/tasks/:taskId', optionalAuth, timelineController.deleteTask);

module.exports = router;
