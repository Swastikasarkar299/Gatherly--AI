const express = require('./expressHelper');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { optionalAuth } = require('../middleware/auth');

router.post('/', optionalAuth, eventController.createEvent);
router.get('/', optionalAuth, eventController.getEvents);
router.get('/:id', optionalAuth, eventController.getEventById);
router.put('/:id', optionalAuth, eventController.updateEvent);
router.delete('/:id', optionalAuth, eventController.deleteEvent);

module.exports = router;
