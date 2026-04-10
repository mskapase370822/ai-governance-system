// Run: node seed.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";
import Policy from "./models/Policy.js";

dotenv.config();

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  // Clear existing data
  await User.deleteMany({});
  await Policy.deleteMany({});

  // Create users
  const password = await bcrypt.hash("12345", 10);

  await User.create([
    { username: "admin", password, role: "Admin" },
    { username: "manager1", password, role: "Manager" },
    { username: "employee1", password, role: "Employee" },
    { username: "employee2", password, role: "Employee" },
  ]);

  // Create default policies
  await Policy.create([
    {
      name: "Block Dangerous SQL",
      type: "block_keywords",
      isActive: true,
      blockedKeywords: ["drop table", "drop database", "truncate table"],
      priority: 10,
    },
    {
      name: "Block System Commands",
      type: "block_keywords",
      isActive: true,
      blockedKeywords: ["rm -rf", "format c:", "shutdown"],
      priority: 9,
    },
    {
      name: "Working Hours Only",
      type: "time_restriction",
      isActive: false, // disabled by default
      timeRestriction: {
        enabled: true,
        allowedStartHour: 9,
        allowedEndHour: 18,
        allowedDays: [1, 2, 3, 4, 5],
      },
      priority: 5,
    },
    {
      name: "Employee Rate Limit",
      type: "rate_limit",
      isActive: true,
      rateLimit: {
        enabled: true,
        maxActions: 100,
        windowMinutes: 60,
      },
      priority: 3,
    },
  ]);

  console.log("\n✅ Seed complete! Users created:");
  console.log("   admin    / 12345  (Admin)");
  console.log("   manager1 / 12345  (Manager)");
  console.log("   employee1/ 12345  (Employee)");
  console.log("   employee2/ 12345  (Employee)");
  console.log("\n✅ Default policies created (4 policies)");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
