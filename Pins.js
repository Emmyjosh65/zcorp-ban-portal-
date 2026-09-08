/*
  ZCORP PIN & ACCESS KEY CONFIGURATION
  NOTE: This file is stored client-side for the demo. Do NOT rely on it for production security.
*/
const ZCORP_PINS = {
  // Admin PIN (hidden in the UI, validated but not displayed)
  adminPin: "ZCORP2026",

  // Owner contact
  owner: { name: "Owner Zeus", phone: "+2349066760078" },

  // Reseller contacts
  resellers: [
    { name: "Reseller 1", phone: "+2349134814154" },
    { name: "Reseller 2", phone: "+2347046884802" }
  ],

  // Pre-generated access keys (20 per plan). Each key is a string; Main.js interprets plan/price/expiry.
  accessKeys: [
    // ONE-TIME (2500, one use)
    "ZCORP-OT-1A2B","ZCORP-OT-2C3D","ZCORP-OT-3E4F","ZCORP-OT-4G5H","ZCORP-OT-5J6K",
    "ZCORP-OT-6L7M","ZCORP-OT-7N8P","ZCORP-OT-8Q9R","ZCORP-OT-9S2T","ZCORP-OT-0U1V",
    "ZCORP-OT-A2B3","ZCORP-OT-C4D5","ZCORP-OT-E6F7","ZCORP-OT-G8H9","ZCORP-OT-J1K2",
    "ZCORP-OT-L3M4","ZCORP-OT-N5P6","ZCORP-OT-Q7R8","ZCORP-OT-S9T0","ZCORP-OT-U1V2",

    // WEEKLY (9000, expires after 7 days)
    "ZCORP-WK-1A2B","ZCORP-WK-2C3D","ZCORP-WK-3E4F","ZCORP-WK-4G5H","ZCORP-WK-5J6K",
    "ZCORP-WK-6L7M","ZCORP-WK-7N8P","ZCORP-WK-8Q9R","ZCORP-WK-9S2T","ZCORP-WK-0U1V",
    "ZCORP-WK-A2B3","ZCORP-WK-C4D5","ZCORP-WK-E6F7","ZCORP-WK-G8H9","ZCORP-WK-J1K2",
    "ZCORP-WK-L3M4","ZCORP-WK-N5P6","ZCORP-WK-Q7R8","ZCORP-WK-S9T0","ZCORP-WK-U1V2",

    // MONTHLY (29000, expires after 30 days)
    "ZCORP-MO-1A2B","ZCORP-MO-2C3D","ZCORP-MO-3E4F","ZCORP-MO-4G5H","ZCORP-MO-5J6K",
    "ZCORP-MO-6L7M","ZCORP-MO-7N8P","ZCORP-MO-8Q9R","ZCORP-MO-9S2T","ZCORP-MO-0U1V",
    "ZCORP-MO-A2B3","ZCORP-MO-C4D5","ZCORP-MO-E6F7","ZCORP-MO-G8H9","ZCORP-MO-J1K2",
    "ZCORP-MO-L3M4","ZCORP-MO-N5P6","ZCORP-MO-Q7R8","ZCORP-MO-S9T0","ZCORP-MO-U1V2",

    // YEARLY (145000, expires after 365 days)
    "ZCORP-YR-1A2B","ZCORP-YR-2C3D","ZCORP-YR-3E4F","ZCORP-YR-4G5H","ZCORP-YR-5J6K",
    "ZCORP-YR-6L7M","ZCORP-YR-7N8P","ZCORP-YR-8Q9R","ZCORP-YR-9S2T","ZCORP-YR-0U1V",
    "ZCORP-YR-A2B3","ZCORP-YR-C4D5","ZCORP-YR-E6F7","ZCORP-YR-G8H9","ZCORP-YR-J1K2",
    "ZCORP-YR-L3M4","ZCORP-YR-N5P6","ZCORP-YR-Q7R8","ZCORP-YR-S9T0","ZCORP-YR-U1V2"
  ]
};
