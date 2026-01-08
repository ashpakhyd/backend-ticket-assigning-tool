// controllers/dashboard.controller.js
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const Rating = require("../models/Rating");

/**
 * ADMIN → Main dashboard stats
 */
exports.getDashboardStats = async (req, res) => {
  const [
    totalTickets,
    openTickets,
    completedTickets,
    technicians,
    customers
  ] = await Promise.all([
    Ticket.countDocuments(),
    Ticket.countDocuments({ status: { $ne: "CLOSED" } }),
    Ticket.countDocuments({ status: "COMPLETED" }),
    User.countDocuments({ role: "TECHNICIAN", isActive: true }),
    User.countDocuments({ role: "CUSTOMER" })
  ]);

  res.json({
    totalTickets,
    openTickets,
    completedTickets,
    technicians,
    customers
  });
};

/**
 * ADMIN → Ticket status breakdown (for charts)
 */
exports.ticketStatusChart = async (req, res) => {
  const data = await Ticket.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);

  res.json(data);
};

/**
 * ADMIN → Technician performance
 */
exports.technicianPerformance = async (req, res) => {
  const data = await Ticket.aggregate([
    {
      $match: { technician: { $ne: null } }
    },
    {
      $group: {
        _id: "$technician",
        totalJobs: { $sum: 1 },
        completedJobs: {
          $sum: {
            $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0]
          }
        }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "technician"
      }
    },
    { $unwind: "$technician" },
    {
      $project: {
        name: "$technician.name",
        phone: "$technician.phone",
        totalJobs: 1,
        completedJobs: 1
      }
    }
  ]);

  res.json(data);
};

/**
 * ADMIN → Average rating per technician
 */
exports.technicianRatings = async (req, res) => {
  const data = await Rating.aggregate([
    {
      $group: {
        _id: "$technician",
        avgRating: { $avg: "$rating" },
        totalRatings: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "technician"
      }
    },
    { $unwind: "$technician" },
    {
      $project: {
        name: "$technician.name",
        phone: "$technician.phone",
        avgRating: { $round: ["$avgRating", 1] },
        totalRatings: 1
      }
    }
  ]);

  res.json(data);
};
