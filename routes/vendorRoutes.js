const express = require('./expressHelper');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, vendorController.getVendors);
router.get('/:eventId', optionalAuth, vendorController.getVendors);
router.post('/', optionalAuth, vendorController.createVendor);
router.put('/:id', optionalAuth, vendorController.updateVendor);
router.delete('/:id', optionalAuth, vendorController.deleteVendor);

module.exports = router;
