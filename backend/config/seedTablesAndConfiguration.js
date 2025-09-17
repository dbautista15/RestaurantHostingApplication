// backend/scripts/seedTablesAndConfigurations.js
require('dotenv').config();
const mongoose = require('mongoose');
const Table = require('../models/Table');
const SectionConfiguration = require('../models/SectionConfiguration');

/**
 * 🎯 DYNAMIC TABLE SEEDING
 * Creates all your tables WITHOUT fixed section assignments
 * Sections are determined by shift configurations
 */

// Connect to database
const connectDatabase = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI);
		console.log('Connected to MongoDB');
	} catch (error) {
		console.error('Database connection failed:', error);
		process.exit(1);
	}
};

// Define ALL your restaurant tables (no fixed sections)
const ALL_RESTAURANT_TABLES = [
	// BOOTHS
	{ tableNumber: 'A2', capacity: 2, position: 'right-wall' },
	{ tableNumber: 'A3', capacity: 4, position: 'right-wall' },
	{ tableNumber: 'A4', capacity: 4, position: 'right-wall' },
	{ tableNumber: 'A5', capacity: 2, position: 'right-wall' },
	{ tableNumber: 'A6', capacity: 6, position: 'right-wall' },
	{ tableNumber: 'A7', capacity: 6, position: 'right-wall' },
	{ tableNumber: 'A8', capacity: 6, position: 'right-wall' },

	// Main dining area
	{ tableNumber: 'A16', capacity: 4, position: 'main-center' },
	{ tableNumber: 'A15', capacity: 4, position: 'main-center' },
	{ tableNumber: 'A14', capacity: 4, position: 'main-center' },
	{ tableNumber: 'A13', capacity: 4, position: 'main-center' },
	{ tableNumber: 'A12', capacity: 4, position: 'main-center' },
	{ tableNumber: 'A11', capacity: 2, position: 'main-center' },
	{ tableNumber: 'A10', capacity: 8, position: 'main-center' },
	{ tableNumber: 'A9', capacity: 4, position: 'main-center' },


	// Back dining area
	{ tableNumber: 'B1', capacity: 4, position: 'back-right' },
	{ tableNumber: 'B2', capacity: 4, position: 'back-center' },
	{ tableNumber: 'B6', capacity: 4, position: 'back-lower-right-corner' },

	// BIG TABLES
	{ tableNumber: 'B3', capacity: 15, position: 'back-left-corner' },
	{ tableNumber: 'B5', capacity: 15, position: 'back-right-corner' },

];

// Define shift configurations based on server count
const SECTION_CONFIGURATIONS = [
	// Moderate staffing - 3 servers
	{
		shiftName: 'four',
		serverCount: 4,
		activeSections: [
			{
				sectionNumber: 1,
				assignedTables: ['A16', 'A9', 'A7', 'A8','B6'], // Front
				serverCount: 1
			},
			{
				sectionNumber: 2,
				assignedTables: ['A15', 'A10', 'A5', 'A6','B1'], // Main with large table
				serverCount: 1
			},
			{
				sectionNumber: 3,
				assignedTables: ['A14', 'A11', 'A3', 'A4','B2'], // Back + Bar
				serverCount: 1
			},
			{
				sectionNumber: 4,
				assignedTables: ['A1', 'A2', 'A13', 'A12'], // Back + Bar
				serverCount: 1
			},
		],
		notes: 'when working with 4 servers tables b3 and b5 ( known as the party tables are now considered open'
	},

	// Full staffing - 4-5 servers
	{
		shiftName: 'five',
		serverCount: 5,
		activeSections: [
			{
				sectionNumber: 1,
				assignedTables: ['B1', 'B2', 'B6', 'A8'], // Front + booth
				serverCount: 1
			},
			{
				sectionNumber: 2,
				assignedTables: ['A16', 'A9', 'A7', 'A6'], // Main center
				serverCount: 1
			},
			{
				sectionNumber: 3,
				assignedTables: ['A15', 'A10', 'A4','A5'], // Large table section
				serverCount: 1
			},
			{
				sectionNumber: 4,
				assignedTables: ['A1', 'A2', 'A13', 'A12'], // Full back area
				serverCount: 1
			},
			{
				sectionNumber: 5,
				assignedTables: ['A14', 'A11', 'A3'], // Large table section
				serverCount: 1
			}
		],
		notes: 'Four servers, balanced sections'
	},

	// Weekend/busy - 5+ servers with patio
	{
		shiftName: 'six',
		serverCount: 6,
		activeSections: [
			{
				sectionNumber: 1,
				assignedTables: ['B1', 'B2', 'B6', 'A8'], // Front + booth
				serverCount: 1
			},
			{
				sectionNumber: 2,
				assignedTables: ['A16', 'A9', 'A7'], // Main center
				serverCount: 1
			},
			{
				sectionNumber: 3,
				assignedTables: ['A15', 'A10', 'A6'], // Large table section
				serverCount: 1
			},
			{
				sectionNumber: 4,
				assignedTables: ['A14', 'A11', 'A5'], // Full back area
				serverCount: 1
			},
			{
				sectionNumber: 5,
				assignedTables: ['A12', 'A3', 'A4'], // Large table section
				serverCount: 1
			},
			{
				sectionNumber: 6,
				assignedTables: ['A1', 'A2', 'A13'], // Full back area
				serverCount: 1
			}
		],
		notes: 'Four servers, balanced sections'
	},
	{
		shiftName: 'seven',
		serverCount: 7,
		activeSections: [
			{
				sectionNumber: 1,
				assignedTables: ['B3', 'B6'], // Front + booth
				serverCount: 1
			},
			{
				sectionNumber: 2,
				assignedTables: ['B1', 'B2', 'A8'], // Main center
				serverCount: 1
			},
			{
				sectionNumber: 3,
				assignedTables: ['A16', 'A9', 'A7'], // Large table section
				serverCount: 1
			},
			{
				sectionNumber: 4,
				assignedTables: ['A15', 'A10', 'A6'], // Full back area
				serverCount: 1
			},
			{
				sectionNumber: 5,
				assignedTables: ['A14', 'A11', 'A5'], // Large table section
				serverCount: 1
			},
			{
				sectionNumber: 6,
				assignedTables: ['A3', 'A4', 'A12'], // Full back area
				serverCount: 1
			},
			{
				sectionNumber: 7,
				assignedTables: ['A13', 'A1', 'A2'], // Full back area
				serverCount: 1
			}
		],
		notes: 'seven servers, open table here is the b5'
	},
];

const seedTablesAndConfigurations = async () => {
	try {
		console.log('Clearing existing data...');
		await Table.deleteMany({});
		await SectionConfiguration.deleteMany({});

		console.log('Creating tables...');

		// Create all tables with section: null initially
		const tablesToCreate = ALL_RESTAURANT_TABLES.map(table => ({
			tableNumber: table.tableNumber,
			section: null, // No fixed section - determined by shift config
			capacity: table.capacity,
			state: 'available',
			position: table.position // Store position for layout purposes
		}));

		const tables = await Table.insertMany(tablesToCreate);
		console.log(`Created ${tables.length} tables`);

		console.log(' Creating shift configurations...');

		// Create shift configurations
		const configs = await SectionConfiguration.insertMany(SECTION_CONFIGURATIONS);
		console.log(`Created ${configs.length} shift configurations`);

		// Activate the lunch configuration by default
		const sectionConfig = configs.find(c => c.shiftName === 'six');
		if (sectionConfig) {
			sectionConfig.isActive = true;
			await sectionConfig.save();
			console.log('Activated six server configuration as default');

			// Update table sections based on active configuration
			await applySectionConfiguration(sectionConfig);
		}

		console.log('\n Summary:');
		console.log(`Tables created: ${tables.length}`);
		console.log(`Configurations: ${configs.length}`);
		console.log(' Setup completed successfully!');

	} catch (error) {
		console.error(' Error seeding data:', error);
	} finally {
		mongoose.connection.close();
	}
};

// Helper function to apply a shift configuration
const applySectionConfiguration = async (config) => {
	try {
		// Reset all tables to no section
		await Table.updateMany({}, { section: null });

		// Apply the configuration
		for (const sectionConfig of config.activeSections) {
			await Table.updateMany(
				{ tableNumber: { $in: sectionConfig.assignedTables } },
				{ section: sectionConfig.sectionNumber }
			);
		}

		console.log(`Applied configuration: ${config.shiftName}`);
		return true;
	} catch (error) {
		console.error('Error applying configuration:', error);
		return false;
	}
};

// Run the seeding script
const runSeeder = async () => {
	await connectDatabase();
	await seedTablesAndConfigurations();
};

if (require.main === module) {
	runSeeder();
}

module.exports = {
	seedTablesAndConfigurations,
	applySectionConfiguration,
	ALL_RESTAURANT_TABLES,
	SECTION_CONFIGURATIONS
};

/**
 * 🚀 HOW THIS SOLVES YOUR PROBLEM:
 * 
 * 1. **All tables exist in database** - but sections are flexible
 * 2. **Shift configurations define sections** based on server count
 * 3. **Easy to switch between configurations** for different shifts
 * 4. **Tables can be reassigned** without recreating data
 * 
 * 🎯 USAGE:
 * 1. Run this script to create tables and configurations
 * 2. Use the shift management API to switch between configurations
 * 3. Your frontend automatically adapts to the active configuration
 * 
 * 💡 BENEFITS:
 * - 1 server? Only open easiest tables to manage
 * - 3 servers? Balanced sections across restaurant  
 * - 5 servers? Full service including patio
 * - Weather bad? Don't activate patio tables
 */