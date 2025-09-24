// backend/config/seedTablesAndConfiguration.js (SIMPLIFIED)
const { RESTAURANT_TABLES, SHIFT_CONFIGURATIONS } = require('./restaurantLayout');
const Table = require('../models/Table');
const SectionConfiguration = require('../models/SectionConfiguration');
const { connectDatabase } = require('./database');

const seedRestaurantLayout = async () => {
  try {
    await connectDatabase();
    
    console.log('🏢 Seeding restaurant layout (DRY/SSOT)...');
    
    // Clear existing data
    await Table.deleteMany({});
    await SectionConfiguration.deleteMany({});
    
    // Seed tables from SSOT layout
    const tablesToCreate = RESTAURANT_TABLES.map(table => ({
      tableNumber: table.number,
      section: table.section,
      capacity: table.capacity,
      state: 'available',
      // Store frontend coordinates for layout consistency
      position: { x: table.x, y: table.y }
    }));
    
    const createdTables = await Table.insertMany(tablesToCreate);
    console.log(`✅ Created ${createdTables.length} tables from SSOT layout`);
    
    // Seed shift configurations from SSOT
    const configsToCreate = SHIFT_CONFIGURATIONS.map(config => ({
      shiftName: config.name,
      serverCount: config.serverCount,
      activeSections: config.sections.map(section => ({
        sectionNumber: section.number,
        assignedTables: section.tables,
        serverCount: 1
      })),
      isActive: config.name === 'six-servers' // Default active config
    }));
    
    const createdConfigs = await SectionConfiguration.insertMany(configsToCreate);
    console.log(`✅ Created ${createdConfigs.length} shift configurations`);
    
    console.log('🎯 Restaurant layout seeded successfully (DRY/SSOT)');
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    process.exit(0);
  }
};

if (require.main === module) {
  seedRestaurantLayout();
}

module.exports = { seedRestaurantLayout };