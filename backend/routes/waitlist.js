// backend/routes/waitlist.js
const express = require('express');
const WaitlistEntry = require('../models/WaitlistEntry');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateLogin, validateTableStateUpdate } = require('../middleware/validation');

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
    const {partyName,partySize,phoneNumber,estimatedWait,priority,partyStatus} = req.body;
    //validation
    if(!partyName || !partySize || !phoneNumber || !estimatedWait || !priority || !partyStatus){
      return res.status(400).json({
        error:'Missing required fields',
        required:['partyName','partySize','phoneNumber']
      });
    }
    //check if the entry has already been added
    const existingEntry = await WaitlistEntry.findOne({phoneNumber});
    if(existingEntry){
      return res.status(409).json({
        error:'Waitlist entry has already been added, double check real quick'
      });
    }
    //create a new entry
    const newWaitlistEntry = new WaitlistEntry({
      partyName,
      partySize,
      phoneNumber,
      estimatedWait,
      priority,
      partyStatus
    });
    await newWaitlistEntry.save();
    res.status(201).json({
      success:true,
      message:'Waitlist entry was created successfully',
      waitlist:{
        partyName:newWaitlistEntry.partyName,
        partySize:newWaitlistEntry.partySize,
        phoneNumber:newWaitlistEntry.phoneNumber,
        estimatedWait:newWaitlistEntry.estimatedWait,
        priority:newWaitlistEntry.priority,
        partyStatus:newWaitlistEntry.partyStatus
      }
    });
  } catch (error) {
    console.error('Waitlist creation error:', error)
    res.status(500).json({ error: error.message });
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