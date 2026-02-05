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