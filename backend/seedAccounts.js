const bcrypt = require("bcrypt");
const User = require("./models/User");
const Shop = require("./models/Shop");

const shops = [
  "Glow Beauty Salon",
  "Women-Free",
  "Luxury Spa",
  "Wellness Center",
  "Make Up Studio",
  "Elite Barber",
  "Manly Mane Salon",
  "Blink Glam",
  "Cosmos Tattoo Art",
  "The Nail Hub"
];

async function upsertAccount(data, password) {
  var hash = await bcrypt.hash(password, 10);
  return User.findOneAndUpdate(
    { username: data.username },
    { $set: { ...data, password: hash } },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );
}

async function seedSystemAccounts() {
  try {
    await upsertAccount({
      fullName: "Vaniday Admin",
      username: "vaniday admin",
      email: "admin@vaniday.local",
      role: "Merchant Admin",
      loyaltyPoints: 0
    }, "Admin");

    for (var i = 0; i < shops.length; i++) {
      var shopName = shops[i];
      var slug = shopName.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");

      var user = await upsertAccount({
        fullName: shopName,
        username: shopName.toLowerCase(),
        email: slug + "@shops.vaniday.local",
        role: "Shop Owner",
        loyaltyPoints: 0
      }, "1234567");

      await Shop.findOneAndUpdate(
        { ownerId: user._id },
        { ownerId: user._id, name: shopName, assignedShop: shopName },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    console.log("Vaniday admin and shop-owner accounts are ready.");
  } catch (error) {
    console.error("Seed error:", error.message);
  }
}

module.exports = { seedSystemAccounts: seedSystemAccounts, shops: shops };
