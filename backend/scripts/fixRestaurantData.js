// backend/scripts/fixRestaurantData.js
const mongoose = require("mongoose");
const Table = require("../models/Table");
const User = require("../models/User");
const SectionConfiguration = require("../models/SectionConfiguration");
require("dotenv").config();

async function fixRestaurantData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // 1. Check current state
    console.log("\n=== CURRENT STATE ===");

    const tables = await Table.find({});
    console.log(`\nTables: ${tables.length} total`);
    console.log(
      "- Available:",
      tables.filter((t) => t.state === "available").length
    );
    console.log(
      "- With sections:",
      tables.filter((t) => t.section !== null).length
    );
    console.log(
      "- Without sections:",
      tables.filter((t) => t.section === null).length
    );

    const waiters = await User.find({ role: "waiter" });
    console.log(`\nWaiters: ${waiters.length} total`);
    console.log("- Active:", waiters.filter((w) => w.isActive).length);
    console.log(
      "- On shift:",
      waiters.filter((w) => w.shiftStart !== null).length
    );
    console.log(
      "- With sections:",
      waiters.filter((w) => w.section !== null).length
    );

    // 2. Fix tables - make them available and assign to sections
    console.log("\n=== FIXING TABLES ===");

    // Reset all tables to available state
    await Table.updateMany(
      { state: { $ne: "available" } },
      {
        state: "available",
        assignedWaiter: null,
        partySize: null,
        assignedAt: null,
      }
    );
    console.log("✅ Reset all tables to available");

    // Activate 6-server configuration
    const sixServerConfig = await SectionConfiguration.findOne({
      shiftName: "six-servers",
    });
    if (sixServerConfig) {
      await SectionConfiguration.updateMany({}, { isActive: false });
      sixServerConfig.isActive = true;
      await sixServerConfig.save();
      console.log("✅ Activated six-server configuration");

      // Apply configuration to tables
      for (const section of sixServerConfig.activeSections) {
        const result = await Table.updateMany(
          { tableNumber: { $in: section.assignedTables } },
          { section: section.sectionNumber }
        );
        console.log(
          `✅ Section ${section.sectionNumber}: Updated ${result.modifiedCount} tables`
        );
      }
    }

    // 3. Fix waiters - make sure they're active and on shift
    console.log("\n=== FIXING WAITERS ===");

    // Get first 6 waiters and assign them to sections
    const activeWaiters = await User.find({
      role: "waiter",
      isActive: true,
    }).limit(6);

    for (let i = 0; i < activeWaiters.length; i++) {
      const waiter = activeWaiters[i];
      waiter.section = i + 1; // Assign sections 1-6
      waiter.shiftStart = waiter.shiftStart || new Date(); // Start shift if not started
      await waiter.save();
      console.log(
        `✅ ${waiter.userName}: Section ${waiter.section}, shift started`
      );
    }

    // 4. Final check
    console.log("\n=== FINAL STATE ===");

    const availableTables = await Table.find({
      state: "available",
      section: { $ne: null },
    });
    console.log(
      `\n✅ Available tables with sections: ${availableTables.length}`
    );

    const activeWaitersOnShift = await User.find({
      role: "waiter",
      isActive: true,
      section: { $ne: null },
      shiftStart: { $ne: null },
    });
    console.log(`✅ Active waiters on shift: ${activeWaitersOnShift.length}`);

    // Show table distribution by section
    console.log("\nTables per section:");
    for (let section = 1; section <= 6; section++) {
      const sectionTables = await Table.find({ section, state: "available" });
      const sectionWaiter = activeWaitersOnShift.find(
        (w) => w.section === section
      );
      console.log(
        `  Section ${section}: ${sectionTables.length} tables, Waiter: ${
          sectionWaiter?.userName || "NONE"
        }`
      );
    }

    console.log("\n✅ Data fix complete! Your restaurant should be ready now.");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the fix
fixRestaurantData();
