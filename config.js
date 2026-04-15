/**
 * AGA TAG Bot — Configuration
 * Edit this file to change behaviour, messages, and limits
 */

module.exports = {

  // ─── Chrome / Puppeteer path ───
  // Leave blank for auto-detection on Mac/Windows
  // On Linux: usually '/usr/bin/google-chrome' or '/usr/bin/chromium-browser'
  chromePath: process.env.CHROME_PATH || '',

  // ─── Broadcast settings ───
  broadcast: {
    dailyLimit: 200,          // Max sends per day (stay safe at 200)
    minDelaySeconds: 18,      // Min gap between sends (seconds)
    maxDelaySeconds: 45,      // Max gap between sends (seconds)
    checkIntervalSeconds: 20, // How often bot checks queue (seconds)

    // Message templates per segment
    // Variables: {name}, {sub_community}, {community}
    templates: {
      // Segment A: potential sellers
      A: `Hi {name}, this is Shlok from AGA Real Estate.

I noticed you own a property in Tilal Al Ghaf — one of the communities I specialise in.

Buyer demand for TAG has stayed strong through Q1 2026. If you've ever thought about selling or wanted to know what your unit is worth today, I'm happy to share a quick data point — no obligation.

Just reply and I'll get back to you.`,

      // Segment B: potential landlords
      B: `Hi {name}, this is Shlok from AGA Real Estate.

I work specifically in Tilal Al Ghaf and I've been helping owners rent out their units at strong rates this year.

If your property is currently vacant or coming up for renewal, I can tell you what comparable units in {sub_community} are renting for right now.

Just drop me a reply if it's useful.`,

      // Segment C: general warm
      C: `Hi {name}, this is Shlok from AGA Real Estate.

I specialise in Tilal Al Ghaf and keep close tabs on what's happening in the community — transactions, pricing, new developments.

Happy to share anything useful about your property or the market. Just reply if you're open to a quick conversation.`
    }
  },

  // ─── System messages ───
  messages: {
    optOut: `Understood {name} — I'll keep you off my list. If anything changes with the property down the line, feel free to reach back out. Wishing you well.`,

    callRequested: `Perfect {name}. What time works for a quick call? I'm usually free mornings UAE time but happy to work around you.`,

    fallback: `Sorry — I didn't quite catch that. Reply with a number from the menu and I'll pick up from there.

If you'd rather just ask me something directly, go ahead and type it.`
  },

  // ─── Follow-up sequences (days after no reply) ───
  followUp: {
    enabled: false, // Set to true to enable auto follow-ups
    day1: `Hi {name}, just following up in case my message got buried. Happy to connect whenever the timing is right for you.`,
    day3: `Hi {name} — still happy to share a quick market update on Tilal Al Ghaf whenever it's useful. Just reply anytime.`
  }
};
