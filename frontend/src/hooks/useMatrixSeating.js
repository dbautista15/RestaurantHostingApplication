import { useState, useEffect, useMemo, useCallback } from 'react';
import { MatrixSeatService } from '../services/matrixService';
import { WAITER_ASSIGNMENTS } from '../config/restaurantLayout';

export const useMatrixSeating = (waiters, tables, waitlist) => {
	// Initialize matrix service
	const matrixService = useMemo(() => new MatrixSeatService(waiters), [waiters]);

	// State for suggestions and assignments
	const [suggestions, setSuggestions] = useState([]);
	const [pendingAssignments, setPendingAssignments] = useState([]);
	const [matrixVersion, setMatrixVersion] = useState(0);

	// Get table waiter from assignments - MOVED UP to avoid dependency issues
	const getTableWaiter = useCallback((tableId) => {
		for (let waiterId = 1; waiterId <= 5; waiterId++) {
			if (WAITER_ASSIGNMENTS[waiterId]?.includes(tableId)) {
				return waiterId;
			}
		}
		return null;
	}, []);

	// Check if table or party has pending assignment - MOVED UP
	const isPendingAssignment = useCallback((tableId = null, partyId = null) => {
		return pendingAssignments.some(assignment =>
			(tableId && assignment.tableId === tableId) ||
			(partyId && assignment.partyId === partyId)
		);
	}, [pendingAssignments]);

	// Get waiters who have available tables for specific party size - FIXED DEPENDENCIES
	const getWaitersWithAvailableTables = useCallback((partySize, excludeWaiters = []) => {
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
	}, [waiters, tables, getTableWaiter, isPendingAssignment]);

	// Find best table for waiter and party - FIXED DEPENDENCIES
	const getBestTableForWaiterAndParty = useCallback((waiter, partySize) => {
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
	}, [tables, getTableWaiter, isPendingAssignment]);


	// Add this function after your existing getBestTableForWaiterAndParty function
	const findBestWaiterWithFIFO = useCallback((party, availableWaiters) => {
		const partySizeIndex = matrixService.getPartySizeIndex(party.partySize);
		const waitMinutes = Math.floor((Date.now() - new Date(party.createdAt)) / (1000 * 60));

		// If party has been waiting > 20 minutes, prioritize them (less strict fairness)
		const isUrgent = waitMinutes > 20;

		// Find waiters with lowest count for this party size
		const waiterCounts = availableWaiters.map(waiter => ({
			waiter,
			count: matrixService.matrix[waiter.index][partySizeIndex],
			totalTables: matrixService.getWaiterTotal(waiter.index)
		}));

		const minCount = Math.min(...waiterCounts.map(w => w.count));
		const fairestWaiters = waiterCounts.filter(w => w.count === minCount);

		if (fairestWaiters.length === 1) {
			return fairestWaiters[0].waiter;
		}

		// Tiebreaker: if urgent party, pick waiter with fewest total tables
		// Otherwise, use existing logic (total tables)
		if (isUrgent) {
			const minTotal = Math.min(...fairestWaiters.map(w => w.totalTables));
			const candidate = fairestWaiters.find(w => w.totalTables === minTotal);
			return candidate.waiter;
		}

		// Default to existing matrixService logic
		return matrixService.findBestWaiter(party.partySize, availableWaiters);
	}, [matrixService]);

	// Calculate confidence score for suggestion - FIXED DEPENDENCIES
	const calculateConfidence = useCallback((party, table, waiter) => {
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
	}, [matrixService, waiters.length]);

	// Generate reason for suggestion - FIXED DEPENDENCIES
	const generateReason = useCallback((party, table, waiter) => {
		const partySizeIndex = matrixService.getPartySizeIndex(party.partySize);
		const count = matrixService.matrix[waiter.index][partySizeIndex];

		if (count === 0) {
			return `W${waiter.id} hasn't had a ${party.partySize}-top yet today`;
		} else {
			return `W${waiter.id} has the fewest ${party.partySize}-tops (${count})`;
		}
	}, [matrixService]);

	// Generate smart suggestions - FIXED DEPENDENCIES
	const generateSuggestions = useCallback(() => {
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
			const bestWaiter = findBestWaiterWithFIFO(party, availableWaiters);

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
	}, [
		waitlist,
		isPendingAssignment,
		getWaitersWithAvailableTables,
		matrixService,
		getBestTableForWaiterAndParty,
		calculateConfidence,
		generateReason
	]);

	// Assign party to table - FIXED DEPENDENCIES
	const assignPartyToTable = useCallback((partyId, tableId) => {
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
	}, [waitlist, tables, waiters, getTableWaiter]);

	// Confirm party is seated (updates matrix) - FIXED DEPENDENCIES
	const confirmSeating = useCallback((assignmentId) => {
		const assignment = pendingAssignments.find(a => a.id === assignmentId);
		if (!assignment) return;

		const party = waitlist.find(p => p._id === assignment.partyId);
		const waiter = waiters.find(w => w.id === assignment.waiterId);

		if (party && waiter) {
			const waiterIndex = waiters.findIndex(w => w.id === waiter.id);
			matrixService.seatParty(waiterIndex, party.partySize);

			// Force re-render when matrix changes
			setMatrixVersion(prev => prev + 1);

			setPendingAssignments(prev => prev.filter(a => a.id !== assignmentId));
		}
	}, [pendingAssignments, waitlist, waiters, matrixService]);

	// Manual update function for external matrix updates - FIXED DEPENDENCIES
	const updateMatrix = useCallback((waiterIndex, partySize) => {
		matrixService.seatParty(waiterIndex, partySize);
		setMatrixVersion(prev => prev + 1);
	}, [matrixService]);

	// Cancel assignment - ALREADY CORRECT
	const cancelAssignment = useCallback((assignmentId) => {
		setPendingAssignments(prev => prev.filter(a => a.id !== assignmentId));
	}, []);

	// Auto-generate suggestions when data changes
	useEffect(() => {
		generateSuggestions();
	}, [generateSuggestions]);

	return {
		// Data
		matrix: matrixService.getMatrix(),
		suggestions,
		pendingAssignments,
		updateMatrix,
		// Actions
		assignPartyToTable,
		confirmSeating,
		cancelAssignment,

		// Utilities
		generateSuggestions,
		getFairnessScore: () => matrixService.getFairnessScore(),
		resetMatrix: () => matrixService.reset(),
		matrixService
	};
};