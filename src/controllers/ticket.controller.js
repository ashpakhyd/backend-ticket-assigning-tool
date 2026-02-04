const Ticket = require("../models/Ticket");
const User = require("../models/User");
const { notifyUser } = require("../services/notification.service");

// OTP generation utility
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * ADMIN / CUSTOMER → Create Ticket
 */
exports.createTicket = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      priority, 
      serviceType, 
      customerId, 
      appliance, 
      issue, 
      address, 
      timeSlot, 
      urgency,
      serviceCategory,
      houseDetails,
      latitude,
      longitude,
      attachments
    } = req.body;

    // Parse attachments properly
    let parsedAttachments = [];
    if (attachments) {
      if (typeof attachments === 'string') {
        try {
          parsedAttachments = JSON.parse(attachments);
        } catch (e) {
          console.error('JSON parse error:', e);
          parsedAttachments = [];
        }
      } else if (Array.isArray(attachments)) {
        parsedAttachments = attachments;
      }
    }

    if (!title || !appliance || !issue || !address || !timeSlot || !serviceCategory || !houseDetails) {
      return res.status(400).json({ 
        message: "Missing required fields: title, appliance, issue, address, timeSlot, serviceCategory, houseDetails" 
      });
    }

    const ticketData = {
      title,
      description,
      priority,
      serviceType,
      customer: customerId || req.user._id,
      createdBy: req.user._id,
      appliance,
      issue,
      address,
      timeSlot,
      urgency,
      serviceCategory,
      houseDetails,
      latitude,
      longitude,
      attachments: parsedAttachments,
      otp: generateOtp(),
      status: "NEW"
    };

    console.log('Creating ticket with data:', JSON.stringify(ticketData, null, 2));

    const ticket = await Ticket.create(ticketData);

    // 🔔 Notify customer
    await notifyUser({
      userId: ticket.customer,
      ticketId: ticket._id,
      title: "Ticket Created",
      message: `Your ticket "${ticket.title}" has been created`,
      type: "TICKET_CREATED"
    });

    res.json(ticket);
  } catch (error) {
    console.error("Create ticket error:", error);
    res.status(500).json({ message: "Failed to create ticket", error: error.message });
  }
};


exports.assignTechnician = async (req, res) => {
  try {
    const { technicianId } = req.body;

    // 1️⃣ Validate technician
    const technician = await User.findOne({
      _id: technicianId,
      role: "TECHNICIAN",
      isActive: true
    });

    if (!technician) {
      return res.status(400).json({ message: "Invalid technician" });
    }

    // 2️⃣ Fetch ticket
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // 3️⃣ Assign (OTP not required for assignment)
    const updateData = {
      technician: technicianId,
      status: "ASSIGNED"
    };
    
    // Use findByIdAndUpdate to bypass validation for OTP
    const updatedTicket = await Ticket.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: false }
    );

    // 4️⃣ 🔔 Notify technician
    await notifyUser({
      userId: technicianId,
      ticketId: updatedTicket._id,
      title: "New Job Assigned",
      message: `You have been assigned ticket "${updatedTicket.title}"`,
      type: "TICKET_ASSIGNED"
    });

    res.json(updatedTicket);
  } catch (error) {
    console.error("Assign technician error:", error);
    res.status(500).json({ message: "Failed to assign technician", error: error.message });
  }
};

/**
 * ADMIN → View All Tickets
 */
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate("customer technician", "name phone role")
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    console.error("Get all tickets error:", error);
    res.status(500).json({ message: "Failed to fetch tickets", error: error.message });
  }
};

/**
 * TECHNICIAN → Only assigned tickets
 */
exports.getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ technician: req.user._id })
      .populate("customer", "name phone")
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    console.error("Get my tickets error:", error);
    res.status(500).json({ message: "Failed to fetch tickets", error: error.message });
  }
};

/**
 * CUSTOMER → Own tickets only
 */
exports.getCustomerTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ customer: req.user._id })
      .sort({ createdAt: -1 });

    // Hide OTP from customer in list view
    const customerResponse = tickets.map(ticket => {
      const ticketObj = ticket.toObject();
      delete ticketObj.otp;
      return ticketObj;
    });

    res.json(customerResponse);
  } catch (error) {
    console.error("Get customer tickets error:", error);
    res.status(500).json({ message: "Failed to fetch tickets", error: error.message });
  }
};

/**
 * TECHNICIAN → Update Status
 */
exports.updateStatus = async (req, res) => {
  try {
    const { status, customerOtp, finalOTP } = req.body;

    // 1️⃣ Fetch ticket
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // 2️⃣ 🔐 OWNERSHIP CHECK
    if (req.user.role === "TECHNICIAN") {
      if (String(ticket.technician) !== String(req.user._id)) {
        return res.status(403).json({ message: "Not your ticket" });
      }
    }

    // 3️⃣ OTP VALIDATION for IN_PROGRESS status
    if (status === "IN_PROGRESS") {
      if (!customerOtp) {
        return res.status(400).json({ message: "OTP is required to start work" });
      }
      if (ticket.otp !== customerOtp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }
      // Generate finalOTP for completion
      ticket.finalOTP = generateOtp();
    }

    // 4️⃣ Final OTP VALIDATION for COMPLETED status
    if (status === "COMPLETED") {
      if (!finalOTP) {
        return res.status(400).json({ message: "Final OTP is required to complete work" });
      }
      if (ticket.finalOTP !== finalOTP) {
        return res.status(400).json({ message: "Invalid final OTP" });
      }
    }

    // 5️⃣ Update status
    ticket.status = status;
    await ticket.save();

    // 6️⃣ 🔔 Notify customer
    await notifyUser({
      userId: ticket.customer,
      ticketId: ticket._id,
      title: "Ticket Status Updated",
      message: `Status changed to ${status}`,
      type: "STATUS_UPDATED"
    });

    res.json(ticket);
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ message: "Failed to update status", error: error.message });
  }
};

/**
 * GET SINGLE TICKET
 */
exports.getSingleTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("customer technician", "name phone role");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Access control
    if (req.user.role === "CUSTOMER" && String(ticket.customer._id) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not your ticket" });
    }

    if (req.user.role === "TECHNICIAN" && String(ticket.technician?._id) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not your ticket" });
    }

    // Hide OTP from technician
    if (req.user.role === "TECHNICIAN") {
      const ticketObj = ticket.toObject();
      delete ticketObj.otp;
      delete ticketObj.finalOTP;
      return res.json(ticketObj);
    }

    // Customer OTP logic based on status
    if (req.user.role === "CUSTOMER") {
      const ticketObj = ticket.toObject();
      
      if (ticket.status === "ASSIGNED") {
        // Show OTP for technician
        delete ticketObj.finalOTP;
      } else if (ticket.status === "IN_PROGRESS" || ticket.status === "COMPLETED") {
        // Show finalOTP
        delete ticketObj.otp;
      } else {
        // NEW/CLOSED - Hide both OTPs
        delete ticketObj.otp;
        delete ticketObj.finalOTP;
      }
      
      return res.json(ticketObj);
    }

    // Admin gets everything
    res.json(ticket);
  } catch (error) {
    console.error("Get single ticket error:", error);
    res.status(500).json({ message: "Failed to fetch ticket", error: error.message });
  }
};
