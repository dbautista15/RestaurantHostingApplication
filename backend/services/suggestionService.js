const WaitlistEntry = require('../models/WaitlistEntry');
const assignmentEngine = require('./assignmentEngine');

class SuggestionService {
  /**
   * 🎯 PURE FORMATTING SERVICE
   * No business logic - just formats assignment results
   */
  async generateSuggestions(limit = 3) {
    // 1. Get prioritized waitlist from database
    const waitingParties = await WaitlistEntry.find({
      partyStatus: 'waiting'
    })
    .sort({ 
      priority: -1,  // coworker > large_party > normal
      createdAt: 1   // FIFO within priority
    })
    .limit(limit);

    // 2. Generate suggestions by calling assignment engine
    const suggestions = [];

    for (const party of waitingParties) {
      try {
        const assignment = await assignmentEngine.findBestAssignment(party.partySize);
        
        if (assignment) {
          suggestions.push(this.formatSuggestion(party, assignment));
        }
      } catch (error) {
        console.error(`Failed to generate suggestion for ${party.partyName}:`, error);
      }
    }

    return suggestions;
  }

  formatSuggestion(party, assignment) {
    return {
      id: `suggestion_${party._id}_${Date.now()}`,
      party: {
        _id: party._id,
        partyName: party.partyName,
        partySize: party.partySize,
        priority: party.priority,
        waitTime: Math.floor((Date.now() - party.createdAt) / (1000 * 60)),
        specialRequests: party.specialRequests
      },
      table: {
        id: assignment.table.tableNumber,
        number: assignment.table.tableNumber,
        capacity: assignment.table.capacity,
        section: assignment.table.section
      },
      waiter: {
        id: assignment.waiter._id,
        name: assignment.waiter.userName,
        section: assignment.waiter.section
      },
      confidence: assignment.confidence,
      reason: assignment.reason,
      generatedAt: new Date()
    };
  }
}

module.exports = new SuggestionService();