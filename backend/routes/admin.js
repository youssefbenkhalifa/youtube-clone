const express = require('express');
const Report = require('../models/Report');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all reports (admin only - simplified for testing)
router.get('/reports', auth, async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('reportedBy', 'username email')
      .populate('video', 'title')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports'
    });
  }
});

// Update report status (admin only - simplified for testing)
router.put('/reports/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const reportId = req.params.id;

    const report = await Report.findByIdAndUpdate(
      reportId,
      { 
        status,
        reviewedBy: req.user.id,
        reviewedAt: new Date()
      },
      { new: true }
    ).populate('reportedBy', 'username')
     .populate('video', 'title');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update report status'
    });
  }
});

module.exports = router;
