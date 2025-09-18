
import { useState, useEffect, useMemo,useCallback } from 'react';
import { MatrixSeatService } from '../services/matrixService';
import { WAITER_ASSIGNMENTS } from '../config/restaurantLayout';
export const useMatrixSeating = (waiters, tables, waitlist) => {
  // Initialize matrix service
  const matrixService = useMemo(() => new MatrixSeatService(waiters), [waiters]);
  
  // State for suggestions and assignments
  const [suggestions, setSuggestions] = useState([]);
  const [pendingAssignments, setPendingAssignments] = useState([]);

  // Get waiters who have available tables for specific party size
  const getWaitersWithAvailableTables = (partySize, excludeWaiters = []) => {
	return waiters
	  .filter(waiter => !excludeWaiters.includes(waiter.id))
	  .filter(waiter => {
		const waiterTables = tables.filter(table => 
		  getTableWaiter(table.id) === waiter.id
		);
		
		return waiterTables.some(table => 
		  table.state === 'available' && 
		  table.capacity >= partySize && 
		  table.capacity <= (partySize + 2) &&
		  !isPendingAssignment(table.id)
		);
	  })
	  .map(waiter => ({
		...waiter,
		index: waiters.findIndex(w => w.id === waiter.id)
	  }));
  };

  // Get table waiter from assignments
  const getTableWaiter = (tableId) => {
	for (let waiterId = 1; waiterId <= 5; waiterId++) {
	  if (WAITER_ASSIGNMENTS[waiterId]?.includes(tableId)) {
		return waiterId;
	  }
	}
	return null;
  };

  // Check if table or party has pending assignment
  const isPendingAssignment = (tableId = null, partyId = null) => {
	return pendingAssignments.some(assignment => 
	  (tableId && assignment.tableId === tableId) ||
	  (partyId && assignment.partyId === partyId)
	);
  };

  // Find best table for waiter and party
  const getBestTableForWaiterAndParty = (waiter, partySize) => {
	const waiterTables = tables
	  .filter(table => getTableWaiter(table.id) === waiter.id)
	  .filter(table => 
		table.state === 'available' && 
		table.capacity >= partySize &&
		table.capacity <= (partySize + 2) &&
		!isPendingAssignment(table.id)
	  );

	if (waiterTables.length === 0) return null;

	// Prefer table that best matches party size
	return waiterTables.reduce((best, current) => {
	  const bestDiff = Math.abs(best.capacity - partySize);
	  const currentDiff = Math.abs(current.capacity - partySize);
	  return currentDiff < bestDiff ? current : best;
	});
  };

  // Generate smart suggestions
  const generateSuggestions = () => {
	const newSuggestions = [];
	
	// Sort waitlist by priority and wait time
	const sortedWaitlist = [...waitlist].sort((a, b) => {
	  const priorityOrder = { coworker: 3, large_party: 2, normal: 1 };
	  const aPriority = priorityOrder[a.priority] || 1;
	  const bPriority = priorityOrder[b.priority] || 1;
	  
	  if (aPriority !== bPriority) {
		return bPriority - aPriority;
	  }
	  
	  return new Date(a.createdAt) - new Date(b.createdAt);
	});

	// Generate suggestions for each party
	for (let party of sortedWaitlist.slice(0, 5)) { // Limit to top 5
	  if (isPendingAssignment(null, party._id)) continue;
	  
	  const availableWaiters = getWaitersWithAvailableTables(party.partySize);
	  const bestWaiter = matrixService.findBestWaiter(party.partySize, availableWaiters);
	  
	  if (bestWaiter) {
		const bestTable = getBestTableForWaiterAndParty(bestWaiter, party.partySize);
		
		if (bestTable) {
		  newSuggestions.push({
			id: `suggestion-${party._id}-${bestTable.id}`,
			party,
			table: bestTable,
			waiter: bestWaiter,
			confidence: calculateConfidence(party, bestTable, bestWaiter),
			reason: generateReason(party, bestTable, bestWaiter)
		  });
		}
	  }
	}

	setSuggestions(newSuggestions);
  };

  // Calculate confidence score for suggestion
  const calculateConfidence = (party, table, waiter) => {
	let confidence = 100;
	
	// Deduct for table size mismatch
	const sizeDiff = Math.abs(table.capacity - party.partySize);
	confidence -= sizeDiff * 10;
	
	// Deduct if waiter is overloaded
	const waiterTotal = matrixService.getWaiterTotal(waiter.index);
	const avgTotal = matrixService.matrix
	  .reduce((sum, row) => sum + row.reduce((a, b) => a + b), 0) / waiters.length;
	
	if (waiterTotal > avgTotal + 2) {
	  confidence -= 20;
	}
	
	return Math.max(50, confidence);
  };

  // Generate reason for suggestion
  const generateReason = (party, table, waiter) => {
	const partySizeIndex = matrixService.getPartySizeIndex(party.partySize);
	const count = matrixService.matrix[waiter.index][partySizeIndex];
	
	if (count === 0) {
	  return `W${waiter.id} hasn't had a ${party.partySize}-top yet today`;
	} else {
	  return `W${waiter.id} has the fewest ${party.partySize}-tops (${count})`;
	}
  };

  // Assign party to table
  const assignPartyToTable = (partyId, tableId) => {
	const party = waitlist.find(p => p._id === partyId);
	const table = tables.find(t => t.id === tableId);
	const waiter = waiters.find(w => w.id === getTableWaiter(tableId));
	
	if (!party || !table || !waiter) {
	  console.error('Invalid assignment:', { partyId, tableId });
	  return false;
	}

	const newAssignment = {
	  id: `assignment-${Date.now()}`,
	  partyId,
	  tableId,
	  waiterId: waiter.id,
	  assignedAt: new Date(),
	  status: 'assigned'
	};

	setPendingAssignments(prev => [...prev, newAssignment]);
	return true;
  };

  // Confirm party is seated (updates matrix)
  const confirmSeating = (assignmentId) => {
	const assignment = pendingAssignments.find(a => a.id === assignmentId);
	if (!assignment) return;

	const party = waitlist.find(p => p._id === assignment.partyId);
	const waiter = waiters.find(w => w.id === assignment.waiterId);
	
	if (party && waiter) {
	  const waiterIndex = waiters.findIndex(w => w.id === waiter.id);
	  matrixService.seatParty(waiterIndex, party.partySize);
	  
	  setPendingAssignments(prev => prev.filter(a => a.id !== assignmentId));
	}
  };

  // Cancel assignment
  const cancelAssignment = (assignmentId) => {
	setPendingAssignments(prev => prev.filter(a => a.id !== assignmentId));
  };

  // Auto-generate suggestions when data changes
  useEffect(() => {
	generateSuggestions();
  }, [waitlist, tables, pendingAssignments,generateSuggestions]);

  return {
	// Data
	matrix: matrixService.getMatrix(),
	suggestions,
	pendingAssignments,
	
	// Actions
	assignPartyToTable,
	confirmSeating,
	cancelAssignment,
	
	// Utilities
	generateSuggestions,
	getFairnessScore: () => matrixService.getFairnessScore(),
	resetMatrix: () => matrixService.reset()
  };
};
