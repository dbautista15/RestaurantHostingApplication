// backend/utils/auditLogger.js
const AuditEvent = require('../models/AuditEvent');

/**
 * 🎯 AUDIT LOGGER (PROVIDED FOR YOU)
 * Utility functions for creating audit trail entries
 */

const createAuditEvent = async (eventType, tableId, userId, metadata = {}) => {
  try {
    const auditEvent = new AuditEvent({
      eventType,
      tableId,
      userId,
      fromState: metadata.fromState,
      toState: metadata.toState,
      metadata,
      ipAddress: metadata.ipAddress,
      deviceInfo: metadata.userAgent
    });
    
    await auditEvent.save();
    return auditEvent;
  } catch (error) {
    console.error('Failed to create audit event:', error);
    throw error;
  }
};

const logStateTransition = async (table, userId, fromState, toState, metadata = {}) => {
  return createAuditEvent('STATE_TRANSITION', table._id, userId, {
    fromState,
    toState,
    tableNumber: table.tableNumber,
    ...metadata
  });
};

const logWaiterAssignment = async (tableId, userId, waiterId, partySize, metadata = {}) => {
  return createAuditEvent('ASSIGNMENT', tableId, userId, {
    waiterId,
    partySize,
    ...metadata
  });
};

module.exports = {
  createAuditEvent,
  logStateTransition,
  logWaiterAssignment
};