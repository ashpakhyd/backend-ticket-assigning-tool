// utils/ticketOTP.js
const Ticket = require('../models/Ticket');

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Handle ticket status update to COMPLETED
const handleTicketCompletion = async (ticketId) => {
  try {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) throw new Error('Ticket not found');
    
    if (ticket.status === 'COMPLETED') {
      // Remove old OTP and generate finalOTP
      const finalOTP = generateOTP();
      
      await Ticket.findByIdAndUpdate(ticketId, {
        $unset: { otp: 1 },
        $set: { finalOTP: finalOTP }
      });
      
      return finalOTP;
    }
    
    return null;
  } catch (error) {
    throw error;
  }
};

module.exports = { generateOTP, handleTicketCompletion };