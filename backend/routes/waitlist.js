// backend/routes/waitlist.js
const express = require('express');
const WaitlistEntry = require('../models/WaitlistEntry');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateWaitlistEntry } = require('../middleware/validation');

const router = express.Router();

/**
 * 🎯 YOUR ENGINEERING TASK: Waitlist Management API
 */

// TODO: GET /waitlist - Get current waitlist
router.get('/', authenticateToken, async (req, res) => {
  try {
    // TODO: Get active waitlist entries ordered by priority and time
    // YOUR CODE HERE:

    const waitlist = await WaitlistEntry.find({partyStatus:'waiting'});
    res.json({waitlist});

    if(!waitlist){
      return res.status(404).json({
        error:'Waitlist not found.'
      });
    }
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TODO: POST /waitlist - Add party to waitlist
router.post('/', authenticateToken, requireRole(['host']), async (req, res) => {
  try {
    // TODO: Create new waitlist entry
    // TODO: Calculate estimated wait time
    // TODO: Broadcast update to connected clients
    // YOUR CODE HERE:
    const {partyName,partySize,phoneNumber,estimatedWait,priority,partyStatus,specialRequests} = req.body;
    //validation
    if(!partyName || !partySize || !phoneNumber || !estimatedWait || !priority || !partyStatus){
      return res.status(400).json({
        error:'Missing required fields',
        required:['partyName','partySize','phoneNumber']
      });
    }
    // //check if the entry has already been added
    // const existingEntry = await WaitlistEntry.findOne({phoneNumber});
    // if(existingEntry){
    //   return res.status(409).json({
    //     error:'Waitlist entry has already been added, double check real quick'
    //   });
    // }
    //create a new entry
    const newWaitlistEntry = new WaitlistEntry({
      partyName,
      partySize,
      phoneNumber,
      estimatedWait,
      priority,
      partyStatus,
      specialRequests: specialRequests || '', // ✅ NEW: Include special requests
      addedBy: req.user._id // ✅ FIXED: Set addedBy from authenticated user
    });
    await newWaitlistEntry.save();
    res.status(201).json({
      success:true,
      message:'Waitlist entry was created successfully',
      waitlist:{
        _id: newWaitlistEntry._id, // ✅ NEW: Include _id for frontend
        partyName:newWaitlistEntry.partyName,
        partySize:newWaitlistEntry.partySize,
        phoneNumber:newWaitlistEntry.phoneNumber,
        estimatedWait:newWaitlistEntry.estimatedWait,
        priority:newWaitlistEntry.priority,
        partyStatus:newWaitlistEntry.partyStatus,
        specialRequests:newWaitlistEntry.specialRequests, // ✅ NEW
        createdAt: newWaitlistEntry.createdAt // ✅ NEW: Include timestamp
      }
    });
  } catch (error) {
    console.error('Waitlist creation error:', error)
    res.status(500).json({ error: error.message });
  }
});

// ✅ NEW: PATCH /waitlist/:id - Update waitlist entry
router.patch('/:id', authenticateToken, requireRole(['host']), async (req, res) => {
  try {
    const { id } = req.params;
    const { partyName, partySize, phoneNumber, specialRequests, priority } = req.body;
    
    // Find the waitlist entry
    const waitlistEntry = await WaitlistEntry.findById(id);
    if (!waitlistEntry) {
      return res.status(404).json({
        error: 'Waitlist entry not found'
      });
    }
    
    // Only allow updating if still waiting
    if (waitlistEntry.partyStatus !== 'waiting') {
      return res.status(400).json({
        error: 'Cannot update a party that is no longer waiting'
      });
    }
    
    // Update only provided fields
    const updateFields = {};
    if (partyName !== undefined) updateFields.partyName = partyName;
    if (partySize !== undefined) updateFields.partySize = partySize;
    if (phoneNumber !== undefined) updateFields.phoneNumber = phoneNumber;
    if (specialRequests !== undefined) updateFields.specialRequests = specialRequests;
    if (priority !== undefined) updateFields.priority = priority;
    
    // Update the entry
    const updatedEntry = await WaitlistEntry.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Waitlist entry updated successfully',
      waitlist: {
        _id: updatedEntry._id,
        partyName: updatedEntry.partyName,
        partySize: updatedEntry.partySize,
        phoneNumber: updatedEntry.phoneNumber,
        estimatedWait: updatedEntry.estimatedWait,
        priority: updatedEntry.priority,
        partyStatus: updatedEntry.partyStatus,
        specialRequests: updatedEntry.specialRequests,
        createdAt: updatedEntry.createdAt
      }
    });
    
  } catch (error) {
    console.error('Waitlist update error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    res.status(500).json({
      error: 'Failed to update waitlist entry'
    });
  }
});

// TODO: PUT /waitlist/:id/status - Update waitlist entry status
router.put('/:id/partyStatus', authenticateToken, requireRole(['host']), async (req, res) => {
  // TODO: Update waitlist entry status (seated, cancelled, etc.)
  // YOUR CODE HERE:
  try{
    const {partyStatus} = req.body;
    if(!partyStatus){
      return res.status(400).json({
        error:'Party status is required'
      });
    }
    const waitlist = await WaitlistEntry.findByIdAndUpdate(req.params.id);
    if(!waitlist){
      return res.status(404).json({
        error:'Waitlist entry was not found'
      });
    }
    waitlist.partyStatus = 'seated';
    waitlist.seatedAt = new Date();
  
    await waitlist.save();
  
    res.status(200).json({
      success:true,
      message:'waitlist entry was updated successfully'
    });
  } catch(error){
    console.error('waitlist entry update error:', error);
    res.status(500).json({
      error:'waitlist entry update error'
    });
  }
});

// TODO: DELETE /waitlist/:id - Remove from waitlist
router.delete('/:id', authenticateToken, requireRole(['host']), async (req, res) => {
  // TODO: Remove waitlist entry
  // YOUR CODE HERE:
  try{
    const {id} = req.params;
    const updatedWaitlistEntry = await WaitlistEntry.findByIdAndUpdate(
      id,{partyStatus:'cancelled'},{new:true} );
    
    //validation
      if(!updatedWaitlistEntry){
      return res.status(404).json({
        error:'waitlist entry was not found'
      });
    }
    res.status(200).json({
      success: true,
      message:'Waitlist entry was cancelled successfully',
      waitlist: updatedWaitlistEntry
    });


  }catch(error){
    res.status(500).json({
      error:'failed to cancel the party'
    })
  }
});

module.exports = router;