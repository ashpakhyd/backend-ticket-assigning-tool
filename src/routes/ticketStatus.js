// routes/ticketStatus.js
const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const { handleTicketCompletion } = require('../utils/ticketOTP');

// Update ticket status
router.patch('/tickets/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Update ticket status
    await Ticket.findByIdAndUpdate(id, { status });
    
    let finalOTP = null;
    
    // If status is COMPLETED, handle OTP logic
    if (status === 'COMPLETED') {
      finalOTP = await handleTicketCompletion(id);
    }
    
    const updatedTicket = await Ticket.findById(id);
    
    res.json({
      success: true,
      ticket: updatedTicket,
      finalOTP: finalOTP
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;