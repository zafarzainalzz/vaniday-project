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
    { name: "Hair Styling", price: 45, duration: 45, description: "Professional cut and style." },
    { name: "Manicure", price: 25, duration: 30, description: "Classic manicure with polish." },
    { name: "Pedicure", price: 35, duration: 40, description: "Relaxing pedicure treatment." },
    { name: "Facial Treatment", price: 60, duration: 60, description: "Deep cleansing facial for radiant skin." }
  ],
  "Women-Free": [
    { name: "Men's Haircut", price: 20, duration: 30, description: "Precision haircut for men." },
    { name: "Beard Trim", price: 10, duration: 15, description: "Neat and shaped beard trim." },
    { name: "Hot Towel Shave", price: 15, duration: 20, description: "Classic hot towel razor shave." },
    { name: "Hair & Beard Combo", price: 28, duration: 40, description: "Full grooming combo package." }
  ],
  "Luxury Spa": [
    { name: "Full Body Massage", price: 90, duration: 60, description: "Aromatherapy full body massage." },
    { name: "Body Wrap", price: 110, duration: 75, description: "Detoxifying body wrap treatment." },
    { name: "Hot Stone Therapy", price: 95, duration: 60, description: "Heated stone muscle relief." },
    { name: "Couples Spa Package", price: 180, duration: 90, description: "Side-by-side spa experience for two." }
  ],
  "Wellness Center": [
    { name: "Yoga Session", price: 30, duration: 60, description: "Guided yoga for all levels." },
    { name: "Meditation Class", price: 20, duration: 45, description: "Guided mindfulness meditation." },
    { name: "Wellness Consultation", price: 50, duration: 30, description: "Personalized wellness assessment." },
    { name: "Sound Healing", price: 40, duration: 50, description: "Therapeutic sound bath session." }
  ],
  "Make Up Studio": [
    { name: "Bridal Makeup", price: 150, duration: 90, description: "Elegant bridal makeup with trial." },
    { name: "Party Makeup", price: 60, duration: 45, description: "Glamorous look for any event." },
    { name: "HD Makeup", price: 80, duration: 60, description: "Camera-ready high definition makeup." },
    { name: "Makeup Lesson", price: 100, duration: 75, description: "One-on-one makeup techniques class." }
  ],
  "Elite Barber": [
    { name: "Classic Haircut", price: 22, duration: 30, description: "Traditional barber haircut." },
    { name: "Beard Sculpting", price: 15, duration: 20, description: "Precision beard shaping and design." },
    { name: "Scalp Treatment", price: 30, duration: 30, description: "Refreshing scalp massage and treatment." },
    { name: "Gentleman's Package", price: 45, duration: 55, description: "Haircut, shave, and scalp treatment." }
  ],
  "Manly Mane Salon": [
    { name: "Hair Coloring", price: 70, duration: 90, description: "Full color or highlights application." },
    { name: "Hair Treatment", price: 50, duration: 45, description: "Deep conditioning and repair treatment." },
    { name: "Hair Styling", price: 35, duration: 40, description: "Professional styling for any occasion." },
    { name: "Keratin Treatment", price: 120, duration: 120, description: "Smoothing keratin hair treatment." }
  ],
  "Blink Glam": [
    { name: "Eyelash Extensions", price: 80, duration: 90, description: "Classic full set lash extensions." },
    { name: "Lash Refill", price: 50, duration: 60, description: "Fill and refresh existing lashes." },
    { name: "Brow Shaping", price: 20, duration: 20, description: "Precision eyebrow threading and shaping." },
    { name: "Lash Lift & Tint", price: 65, duration: 50, description: "Natural curl lift with tint." }
  ],
  "Cosmos Tattoo Art": [
    { name: "Small Tattoo", price: 80, duration: 60, description: "Designs under 3 inches." },
    { name: "Medium Tattoo", price: 150, duration: 90, description: "Designs 3 to 6 inches." },
    { name: "Large Tattoo", price: 300, duration: 150, description: "Complex designs over 6 inches." },
    { name: "Touch Up Session", price: 40, duration: 30, description: "Refresh and correct existing tattoos." }
  ],
  "The Nail Hub": [
    { name: "Gel Nails", price: 35, duration: 45, description: "Long-lasting gel polish application." },
    { name: "Nail Art", price: 45, duration: 50, description: "Custom hand-painted nail art." },
    { name: "Acrylic Nails", price: 50, duration: 55, description: "Full set acrylic nail extensions." },
    { name: "Nail Repair", price: 15, duration: 20, description: "Fix broken or damaged nails." }
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
