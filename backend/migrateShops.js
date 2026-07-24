const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const Shop = require("./models/Shop");
const Merchant = require("./models/Merchant");
const { requireEnvironmentVariable } = require("./config");

dotenv.config({ path: path.join(__dirname, ".env") });

const mongoUri = requireEnvironmentVariable("MONGO_URI");

async function migrateShopsToMerchants() {
  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected for migration.");

    var shops = await Shop.find({});
    console.log("Found " + shops.length + " Shop records.");

    if (shops.length === 0) {
      console.log("No Shop records to migrate. Done.");
      await mongoose.disconnect();
      return;
    }

    var migrated = 0;
    var skipped = 0;

    for (var i = 0; i < shops.length; i++) {
      var shop = shops[i];

      var existingMerchant = await Merchant.findOne({ owner: shop.ownerId });
      if (existingMerchant) {
        console.log("Skipping Shop '" + shop.name + "' — Merchant already exists for this owner.");
        skipped++;
        continue;
      }

      await Merchant.create({
        name: shop.name,
        description: "",
        address: shop.location || "",
        phone: "",
        email: "",
        image: "",
        available: shop.days || "",
        owner: shop.ownerId,
        active: true
      });

      console.log("Migrated Shop '" + shop.name + "' → Merchant.");
      migrated++;
    }

    console.log("Migration complete. Migrated: " + migrated + ", Skipped: " + skipped);
    console.log("Shop records have NOT been deleted. Delete them manually after verifying:");
    console.log("  db.shops.drop()");

    await mongoose.disconnect();
  } catch (error) {
    console.error("Migration error:", error.message);
    process.exit(1);
  }
}

migrateShopsToMerchants();
