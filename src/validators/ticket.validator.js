const { body } = require('express-validator');

exports.createTicketValidator = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('houseDetails').optional().isString(),
  body('latitude').optional().isNumeric(),
  body('longitude').optional().isNumeric(),
  body('attachments').optional().isArray(),
  body('attachments.*.name').optional().isString(),
  body('attachments.*.url').optional().isString(),
  body('attachments.*.type').optional().isString(),
  body('priority').isIn(['LOW', 'MEDIUM', 'HIGH']).withMessage('Invalid priority'),
  body('serviceType').notEmpty().withMessage('Service type is required'),
  body('urgency').isIn(['normal', 'urgent']).withMessage('Invalid urgency'),
  body('timeSlot').isIn(['morning', 'afternoon', 'evening']).withMessage('Invalid time slot'),
  body('serviceCategory').notEmpty().withMessage('Service category is required'),
  body('appliance').notEmpty().withMessage('Appliance is required'),
  body('issue').notEmpty().withMessage('Issue is required')
];