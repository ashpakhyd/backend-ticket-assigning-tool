// controllers/admin.controller.js
const User = require("../models/User");

/**
 * ADMIN → Manually verify technician
 */
exports.verifyTechnician = async (req, res) => {
  try {
    const { technicianId } = req.params;

    const technician = await User.findOneAndUpdate(
      { _id: technicianId, role: "TECHNICIAN" },
      { isVerified: true },
      { new: true }
    );

    if (!technician) {
      return res.status(404).json({ message: "Technician not found" });
    }

    res.json({ 
      message: "Technician verified successfully",
      technician: {
        _id: technician._id,
        name: technician.name,
        phone: technician.phone,
        isVerified: technician.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to verify technician", error: error.message });
  }
};

/**
 * ADMIN → Deactivate technician
 */
exports.deactivateTechnician = async (req, res) => {
  try {
    const { technicianId } = req.params;

    const technician = await User.findOneAndUpdate(
      { _id: technicianId, role: "TECHNICIAN" },
      { isActive: false },
      { new: true }
    );

    if (!technician) {
      return res.status(404).json({ message: "Technician not found" });
    }

    res.json({ 
      message: "Technician deactivated successfully",
      technician: {
        _id: technician._id,
        name: technician.name,
        phone: technician.phone,
        isActive: technician.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to deactivate technician", error: error.message });
  }
};

/**
 * ADMIN → Activate technician
 */
exports.activateTechnician = async (req, res) => {
  try {
    const { technicianId } = req.params;

    const technician = await User.findOneAndUpdate(
      { _id: technicianId, role: "TECHNICIAN" },
      { isActive: true },
      { new: true }
    );

    if (!technician) {
      return res.status(404).json({ message: "Technician not found" });
    }

    res.json({ 
      message: "Technician activated successfully",
      technician: {
        _id: technician._id,
        name: technician.name,
        phone: technician.phone,
        isActive: technician.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to activate technician", error: error.message });
  }
};

/**
 * ADMIN → Get all customers list with search and pagination
 */
exports.getAllCustomers = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = { role: "CUSTOMER" };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { _id: search }
      ];
    }

    const customers = await User.find(query, { password: 0 })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const Ticket = require('../models/Ticket');
    const Otp = require('../models/Otp');
    
    const result = [];
    
    for (const customer of customers) {
      const tickets = await Ticket.find({ customer: customer._id.toString() });
      const phoneOTPs = await Otp.find({ phone: customer.phone });
      
      // Process tickets to show OTPs like customer sees them
      const ticketOTPs = tickets.map(ticket => {
        const ticketData = {
          _id: ticket._id,
          title: ticket.title,
          status: ticket.status,
          createdAt: ticket.createdAt,
          otp: null,
          finalOTP: null
        };
        
        // Same logic as getSingleTicket for customer
        if (ticket.status === "ASSIGNED") {
          ticketData.otp = ticket.otp; // Show OTP for technician
        } else if (ticket.status === "IN_PROGRESS" || ticket.status === "COMPLETED") {
          ticketData.finalOTP = ticket.finalOTP; // Show finalOTP
        } else if (ticket.status === "NEW") {
          // For admin, show the OTP even if customer can't see it
          ticketData.otp = ticket.otp;
          ticketData.note = "Customer can't see this OTP until status is ASSIGNED";
        }
        
        return ticketData;
      });
      
      const customerData = {
        ...customer.toObject(),
        ticketOTPs,
        phoneOTPs
      };
      
      result.push(customerData);
    }

    const total = await User.countDocuments(query);

    res.json({
      message: "Customers retrieved successfully",
      customers: result,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: result.length,
        totalRecords: total
      }
    });
  } catch (error) {
    console.error('Admin getAllCustomers error:', error);
    res.status(500).json({ message: "Failed to retrieve customers", error: error.message });
  }
};

/**
 * ADMIN → Manually verify customer
 */
exports.verifyCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await User.findOneAndUpdate(
      { _id: customerId, role: "CUSTOMER" },
      { isVerified: true },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ 
      message: "Customer verified successfully",
      customer: {
        _id: customer._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        isVerified: customer.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to verify customer", error: error.message });
  }
};

/**
 * ADMIN → Deactivate customer
 */
exports.deactivateCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await User.findOneAndUpdate(
      { _id: customerId, role: "CUSTOMER" },
      { isActive: false },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ 
      message: "Customer deactivated successfully",
      customer: {
        _id: customer._id,
        name: customer.name,
        phone: customer.phone,
        isActive: customer.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to deactivate customer", error: error.message });
  }
};

/**
 * ADMIN → Activate customer
 */
exports.activateCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await User.findOneAndUpdate(
      { _id: customerId, role: "CUSTOMER" },
      { isActive: true },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ 
      message: "Customer activated successfully",
      customer: {
        _id: customer._id,
        name: customer.name,
        phone: customer.phone,
        isActive: customer.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to activate customer", error: error.message });
  }
};