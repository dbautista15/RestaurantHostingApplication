// backend/routes/demo.js (NEW FILE)
const express = require('express');
const WaitlistEntry = require('../models/WaitlistEntry');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/populate-waitlist', authenticateToken, async (req, res) => {
  try {
    const demoParties = [
      { 
        partyName: 'Rodriguez Anniversary',
        partySize: 2,
        priority: 'normal',
        phoneNumber: '704-939-4520',
        specialRequests: 'Booth preferred - celebrating anniversary',
        estimatedWait: 25
      },
      { 
        partyName: 'Chen (Staff)',
        partySize: 4,
        priority: 'coworker',
        phoneNumber: '704-555-0102',
        specialRequests: '',
        estimatedWait: 8
      },
      { 
        partyName: 'Birthday - Thompson',
        partySize: 10,
        priority: 'large_party',
        phoneNumber: '704-555-0103',
        specialRequests: 'Birthday celebration - need space for gifts',
        estimatedWait: 35
      },
      { 
        partyName: 'Wilson Date Night',
        partySize: 2,
        priority: 'normal',
        phoneNumber: '704-555-0104',
        specialRequests: 'Quiet table please',
        estimatedWait: 12
      },
      { 
        partyName: 'Business Lunch - Park',
        partySize: 6,
        priority: 'normal',
        phoneNumber: '704-555-0105',
        specialRequests: 'Need table near outlets for laptops',
        estimatedWait: 18
      }
    ];

    // Clear existing waitlist
    await WaitlistEntry.deleteMany({ partyStatus: 'waiting' });

    // Add demo parties
    const parties = await WaitlistEntry.insertMany(
      demoParties.map(party => ({
        ...party,
        partyStatus: 'waiting',
        addedBy: req.user._id
      }))
    );

    res.json({
      success: true,
      message: `Added ${parties.length} demo parties`,
      parties
    });

  } catch (error) {
    console.error('Demo data error:', error);
    res.status(500).json({ error: 'Failed to populate demo data' });
  }
});

module.exports = router;