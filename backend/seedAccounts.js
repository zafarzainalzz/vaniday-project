const bcrypt = require("bcrypt");
const User = require("./models/User");
const Merchant = require("./models/Merchant");
const Service = require("./models/Service");

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

const merchantDetails = {
  "Glow Beauty Salon": {
    description: "Premium hair and beauty treatments for a radiant glow.",
    address: "123 Orchard Road, Singapore",
    phone: "+65 6234 5678",
    available: "Mon - Sat"
  },
  "Women-Free": {
    description: "A dedicated men's grooming space with no compromise.",
    address: "456 Bukit Timah Road, Singapore",
    phone: "+65 6234 5679",
    available: "Mon - Sun"
  },
  "Luxury Spa": {
    description: "Indulge in luxurious spa experiences for total relaxation.",
    address: "789 Sentosa Gateway, Singapore",
    phone: "+65 6234 5680",
    available: "Mon - Sun"
  },
  "Wellness Center": {
    description: "Holistic wellness programs for mind and body balance.",
    address: "321 Clementi Avenue 3, Singapore",
    phone: "+65 6234 5681",
    available: "Mon - Sat"
  },
  "Make Up Studio": {
    description: "Professional makeup artistry for every occasion.",
    address: "654 Bugis Street, Singapore",
    phone: "+65 6234 5682",
    available: "Mon - Sat"
  },
  "Elite Barber": {
    description: "Classic and modern barbering for the distinguished gentleman.",
    address: "987 Tanjong Pagar Road, Singapore",
    phone: "+65 6234 5683",
    available: "Mon - Sat"
  },
  "Manly Mane Salon": {
    description: "Bold styles and expert grooming for the modern man.",
    address: "147 Marina Bay Sands, Singapore",
    phone: "+65 6234 5684",
    available: "Mon - Sun"
  },
  "Blink Glam": {
    description: "Lash and brow artistry that makes you blink with confidence.",
    address: "258 Jewel Changi Airport, Singapore",
    phone: "+65 6234 5685",
    available: "Mon - Sat"
  },
  "Cosmos Tattoo Art": {
    description: "Custom tattoo designs inspired by the cosmos and beyond.",
    address: "369 Haji Lane, Singapore",
    phone: "+65 6234 5686",
    available: "Tue - Sun"
  },
  "The Nail Hub": {
    description: "Creative nail art and premium nail care services.",
    address: "741 Jurong East Avenue 4, Singapore",
    phone: "+65 6234 5687",
    available: "Mon - Sun"
  }
};

const servicesByShop = {
  "Glow Beauty Salon": [
    { name: "Haircut", price: 20, duration: 30, description: "Professional haircut service." },
    { name: "Golden Facial", price: 65, duration: 60, description: "Golden facial treatment." },
    { name: "HydraFacial", price: 90, duration: 60, description: "Hydrating facial treatment." },
    { name: "Fruit Facial", price: 55, duration: 50, description: "Refreshing fruit facial." },
    { name: "Anti-Aging Facial", price: 200, duration: 90, description: "Premium anti-aging facial." },
    { name: "Chemical Peel Facial", price: 150, duration: 75, description: "Professional chemical peel facial." }
  ],
  "Women-Free": [
    { name: "Waxing", price: 90, duration: 60, description: "Professional waxing service." },
    { name: "Hair Treatment", price: 89, duration: 60, description: "Hair care and treatment." },
    { name: "Steam Bath", price: 110, duration: 60, description: "Relaxing steam bath." },
    { name: "Scrub Therapy", price: 69, duration: 50, description: "Exfoliating scrub therapy." },
    { name: "Fish Pedicure", price: 78, duration: 45, description: "Relaxing fish pedicure." }
  ],
  "Luxury Spa": [
    { name: "Thai Massage", price: 90, duration: 60, description: "Traditional Thai massage." },
    { name: "Ayurvedic Oil Massage", price: 120, duration: 75, description: "Ayurvedic oil massage." },
    { name: "Swedish Massage", price: 80, duration: 60, description: "Relaxing Swedish massage." },
    { name: "Aromatherapy Massage", price: 69, duration: 60, description: "Aromatherapy massage." },
    { name: "Foot Massage", price: 55, duration: 45, description: "Relaxing foot massage." }
  ],
  "Wellness Center": [
    { name: "Yoga Session", price: 25, duration: 60, description: "Guided yoga session." },
    { name: "Meditation", price: 25, duration: 45, description: "Guided meditation session." },
    { name: "Zumba", price: 35, duration: 60, description: "Instructor-led Zumba class." },
    { name: "Chiropractic", price: 30, duration: 30, description: "Chiropractic consultation and session." }
  ],
  "Make Up Studio": [
    { name: "Bridal Makeup", price: 190, duration: 90, description: "Complete bridal makeup." },
    { name: "Party Makeup", price: 188, duration: 75, description: "Party makeup service." },
    { name: "Photoshoot Makeup", price: 188, duration: 75, description: "Camera-ready photoshoot makeup." },
    { name: "Hair Styling", price: 90, duration: 60, description: "Professional hair styling." },
    { name: "Customized Makeup", price: 135, duration: 75, description: "Customized makeup look." }
  ],
  "Elite Barber": [
    { name: "Hair Styling", price: 25, duration: 30, description: "Professional hair styling." },
    { name: "Beard Trim", price: 15, duration: 20, description: "Precision beard trim." },
    { name: "Keratin Treatment", price: 50, duration: 60, description: "Keratin hair treatment." },
    { name: "Eyebrow Trim", price: 15, duration: 15, description: "Neat eyebrow trimming." }
  ],
  "Manly Mane Salon": [
    { name: "Hair Styling", price: 25, duration: 30, description: "Professional hair styling." },
    { name: "Hair Wash", price: 10, duration: 20, description: "Hair wash service." },
    { name: "Beard Trim", price: 15, duration: 20, description: "Precision beard trim." },
    { name: "Hair Dye", price: 125, duration: 90, description: "Professional hair dye service." }
  ],
  "Blink Glam": [
    { name: "Eyelash Extensions", price: 90, duration: 90, description: "Full eyelash extensions." },
    { name: "Eyelash Lift", price: 77, duration: 60, description: "Natural eyelash lift." },
    { name: "Under Eye Treatment", price: 80, duration: 45, description: "Under-eye care treatment." },
    { name: "Eye Spa", price: 58, duration: 45, description: "Relaxing eye spa treatment." },
    { name: "Eyelash Tint", price: 45, duration: 40, description: "Professional eyelash tint." }
  ],
  "Cosmos Tattoo Art": [
    { name: "Colour Tattoo", price: 99, duration: 90, description: "Custom colour tattoo." },
    { name: "Hand Tattoo", price: 54, duration: 60, description: "Custom hand tattoo." },
    { name: "Chest Tattoo", price: 80, duration: 90, description: "Custom chest tattoo." },
    { name: "Leg Tattoo", price: 69, duration: 75, description: "Custom leg tattoo." },
    { name: "Sleeve Tattoo", price: 55, duration: 120, description: "Custom sleeve tattoo session." },
    { name: "Tattoo Removal", price: 190, duration: 60, description: "Tattoo removal session." },
    { name: "Tattoo Touch-Up", price: 67, duration: 45, description: "Tattoo touch-up session." }
  ],
  "The Nail Hub": [
    { name: "Nail Art", price: 20, duration: 45, description: "Custom nail art." },
    { name: "Manicure", price: 15, duration: 30, description: "Classic manicure." },
    { name: "Pedicure", price: 20, duration: 40, description: "Classic pedicure." },
    { name: "Gel Manicure + Pedicure", price: 35, duration: 75, description: "Gel manicure and pedicure package." },
    { name: "Gel Extensions", price: 35, duration: 60, description: "Gel nail extensions." },
    { name: "Nail Extensions", price: 35, duration: 60, description: "Nail extension service." }
  ]
};

async function upsertAccount(data, password) {
  var existing = await User.findOne({ username: data.username });
  if (existing) {
    await User.findOneAndUpdate(
      { username: data.username },
      { $set: { fullName: data.fullName, email: data.email, role: data.role, loyaltyPoints: data.loyaltyPoints } }
    );
    return existing;
  }
  var hash = await bcrypt.hash(password, 10);
  return User.findOneAndUpdate(
    { username: data.username },
    { $set: { ...data, password: hash } },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );
}

async function seedSystemAccounts() {
  var adminPassword = process.env.ADMIN_PASSWORD || "Admin";
  var shopOwnerPassword = process.env.SHOP_OWNER_PASSWORD || "1234567";

  try {
    await upsertAccount({
      fullName: "Vaniday Admin",
      username: "vaniday admin",
      email: "admin@vaniday.local",
      role: "Merchant Admin",
      loyaltyPoints: 0
    }, adminPassword);

    for (var i = 0; i < shops.length; i++) {
      var shopName = shops[i];
      var slug = shopName.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");

      var user = await upsertAccount({
        fullName: shopName,
        username: shopName.toLowerCase(),
        email: slug + "@shops.vaniday.local",
        role: "Shop Owner",
        loyaltyPoints: 0
      }, shopOwnerPassword);

      var details = merchantDetails[shopName] || {};
      await Merchant.findOneAndUpdate(
        { owner: user._id },
        {
          owner: user._id,
          name: shopName,
          description: details.description || "",
          address: details.address || "",
          phone: details.phone || "",
          email: slug + "@shops.vaniday.local",
          image: "",
          available: details.available || "",
          active: true
        },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
      );
    }

    console.log("Seed: accounts and merchants are ready.");
  } catch (error) {
    console.error("Seed error:", error.message);
  }
}

async function seedDemoServices() {
  try {
    var merchantNames = Object.keys(servicesByShop);

    for (var i = 0; i < merchantNames.length; i++) {
      var shopName = merchantNames[i];
      var merchant = await Merchant.findOne({ name: shopName });
      if (!merchant) continue;

      var serviceList = servicesByShop[shopName];
      var approvedNames = serviceList.map(function(item) { return item.name; });
      await Service.updateMany(
        { merchant: merchant._id, name: { $nin: approvedNames } },
        { $set: { active: false } }
      );
      for (var j = 0; j < serviceList.length; j++) {
        var svc = serviceList[j];
        await Service.findOneAndUpdate(
          { merchant: merchant._id, name: svc.name },
          {
            merchant: merchant._id,
            name: svc.name,
            price: svc.price,
            duration: svc.duration,
            description: svc.description || "",
            active: true
          },
          { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
        );
      }
    }

    console.log("Seed: demo services are ready.");
  } catch (error) {
    console.error("Seed services error:", error.message);
  }
}

module.exports = { seedSystemAccounts: seedSystemAccounts, seedDemoServices: seedDemoServices, shops: shops };
