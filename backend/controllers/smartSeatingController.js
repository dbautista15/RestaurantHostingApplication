// backend/controllers/smartSeatingController.js
const seatingCoordinator = require('../services/core/seatingCoordinator');
const suggestionService = require('../services/core/suggestionService');
const fairnessService = require('../services/core/fairnessService');

class SmartSeatingController {
  
  async getSuggestions(req, res) {
    try {
      const suggestions = await suggestionService.generateSuggestions();
      
      res.json({
        success: true,
        suggestions,
        count: suggestions.length,
        generatedAt: new Date()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async assignPartyFromWaitlist(req, res) {
    try {
      const { partyId, options = {} } = req.body;
      
      const result = await seatingCoordinator.seatPartyFromWaitlist(
        partyId,
        req.user,
        options
      );

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async seatManually(req, res) {
    try {
      const { tableNumber } = req.params;
      const { partySize } = req.body;

      const result = await seatingCoordinator.seatManuallyOnFloorPlan(
        tableNumber,
        partySize,
        req.user
      );

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getFairnessMatrix(req, res) {
    try {
      const matrix = await fairnessService.getCurrentMatrix();
      
      res.json({
        success: true,
        ...matrix
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new SmartSeatingController();
