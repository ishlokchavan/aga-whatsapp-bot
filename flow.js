/**
 * AGA TAG WhatsApp Bot — Flow State Machine
 * 
 * Each state defines:
 *   - message: what the bot sends when entering this state
 *   - options: valid numeric replies and where they go
 *   - collect: key to store the user's input under
 *   - fallback: message when input isn't recognised
 *   - notify: alert Shlok when this state is reached
 */

const flow = {

  // ─── Entry point: contact replies to your outbound blast ───

  NEW: {
    message: `Thanks for getting back to me, {name}.

I can help you with a few things for your Tilal Al Ghaf property:

1 - Get a current market valuation
2 - List it for sale
3 - List it for rent
4 - I'm looking to buy in TAG
5 - Just have a question`,
    options: {
      '1': { next: 'VALUATION_SUB_COMMUNITY', data: { intent: 'valuation' } },
      '2': { next: 'SELL_TIMELINE', data: { intent: 'sell' } },
      '3': { next: 'RENT_AVAILABILITY', data: { intent: 'rent' } },
      '4': { next: 'BUY_TYPE', data: { intent: 'buy' } },
      '5': { next: 'OPEN_QUESTION', data: { intent: 'question' } }
    },
    fallback: `Just reply with a number (1–5) and I'll take it from there.

1 - Get a valuation
2 - Sell
3 - Rent out
4 - Buy in TAG
5 - Ask a question`
  },

  // ─── Valuation flow ───

  VALUATION_SUB_COMMUNITY: {
    message: `Happy to help with that.

Which sub-community is your property in?

1 - Serenity Lakes / Elysian Mansions
2 - Alaya South / Amara
3 - Lanai Islands
4 - Other / not sure`,
    options: {
      '1': { next: 'VALUATION_UNIT_TYPE', data: { subCommunity: 'Serenity Lakes / Elysian Mansions' } },
      '2': { next: 'VALUATION_UNIT_TYPE', data: { subCommunity: 'Alaya South / Amara' } },
      '3': { next: 'VALUATION_UNIT_TYPE', data: { subCommunity: 'Lanai Islands' } },
      '4': { next: 'VALUATION_UNIT_TYPE', data: { subCommunity: 'TAG' } }
    },
    fallback: `Please reply with a number:\n\n1 - Serenity Lakes / Elysian Mansions\n2 - Alaya South / Amara\n3 - Lanai Islands\n4 - Other`
  },

  VALUATION_UNIT_TYPE: {
    message: `And what type of unit is it?

1 - Villa (standalone)
2 - Townhouse
3 - Apartment
4 - Plot`,
    options: {
      '1': { next: 'VALUATION_BEDS', data: { unitType: 'Villa' } },
      '2': { next: 'VALUATION_BEDS', data: { unitType: 'Townhouse' } },
      '3': { next: 'VALUATION_BEDS', data: { unitType: 'Apartment' } },
      '4': { next: 'VALUATION_HANDOFF', data: { unitType: 'Plot', beds: 'N/A' } }
    },
    fallback: `Please reply with a number:\n\n1 - Villa\n2 - Townhouse\n3 - Apartment\n4 - Plot`
  },

  VALUATION_BEDS: {
    message: `Last one — how many bedrooms?

1 - 3BR
2 - 4BR
3 - 5BR
4 - 6BR+`,
    options: {
      '1': { next: 'VALUATION_HANDOFF', data: { beds: '3BR' } },
      '2': { next: 'VALUATION_HANDOFF', data: { beds: '4BR' } },
      '3': { next: 'VALUATION_HANDOFF', data: { beds: '5BR' } },
      '4': { next: 'VALUATION_HANDOFF', data: { beds: '6BR+' } }
    },
    fallback: `Please reply with a number:\n\n1 - 3BR\n2 - 4BR\n3 - 5BR\n4 - 6BR+`
  },

  VALUATION_HANDOFF: {
    message: `Got it. Based on recent DLD transactions in {subCommunity}, I can give you a realistic market range for your {beds} {unitType}.

I'll pull the latest comparable sales and send you a summary — should take me about an hour.

Or reply CALL if you'd prefer to discuss directly.`,
    notify: '🏠 VALUATION REQUEST',
    terminal: true
  },

  // ─── Sell flow ───

  SELL_TIMELINE: {
    message: `To give you the right advice, when are you looking to sell?

1 - Within 3 months
2 - 3 to 6 months
3 - 6 to 12 months
4 - Just exploring for now`,
    options: {
      '1': { next: 'SELL_HOT_HANDOFF', data: { sellTimeline: 'Within 3 months', priority: 'hot' } },
      '2': { next: 'SELL_HOT_HANDOFF', data: { sellTimeline: '3–6 months', priority: 'hot' } },
      '3': { next: 'SELL_WARM_HANDOFF', data: { sellTimeline: '6–12 months', priority: 'warm' } },
      '4': { next: 'SELL_WARM_HANDOFF', data: { sellTimeline: 'Exploring', priority: 'nurture' } }
    },
    fallback: `Please reply with a number:\n\n1 - Within 3 months\n2 - 3–6 months\n3 - 6–12 months\n4 - Just exploring`
  },

  SELL_HOT_HANDOFF: {
    message: `That's a strong window. TAG is moving well right now and we have active buyers for this community.

I'd suggest a quick 15-minute call so I can walk you through current pricing and what a realistic sale timeline looks like.

Reply CALL and I'll reach out — or let me know what time works for you.`,
    notify: '🔥 HOT SELLER LEAD',
    terminal: true
  },

  SELL_WARM_HANDOFF: {
    message: `That makes sense — good to plan ahead.

I'll keep you updated on TAG market movements so when you're ready you'll have a clear picture.

Reply CALL anytime if you'd like to talk through options.`,
    notify: '📋 WARM SELLER LEAD',
    terminal: true
  },

  // ─── Rent flow ───

  RENT_AVAILABILITY: {
    message: `Happy to help you list it.

Is the property currently vacant or with a tenant?

1 - Vacant now
2 - Tenant leaving within 1–2 months
3 - Tenanted — planning ahead
4 - Not sure yet`,
    options: {
      '1': { next: 'RENT_UNIT_TYPE', data: { rentStatus: 'Vacant', rentPriority: 'hot' } },
      '2': { next: 'RENT_UNIT_TYPE', data: { rentStatus: 'Leaving soon', rentPriority: 'hot' } },
      '3': { next: 'RENT_UNIT_TYPE', data: { rentStatus: 'Tenanted', rentPriority: 'warm' } },
      '4': { next: 'RENT_UNIT_TYPE', data: { rentStatus: 'Unknown', rentPriority: 'nurture' } }
    },
    fallback: `Please reply with a number:\n\n1 - Vacant now\n2 - Tenant leaving soon\n3 - Tenanted\n4 - Not sure`
  },

  RENT_UNIT_TYPE: {
    message: `Which sub-community is it in?

1 - Serenity Lakes / Elysian Mansions
2 - Alaya South / Amara
3 - Lanai Islands
4 - Other / not sure`,
    options: {
      '1': { next: 'RENT_HANDOFF', data: { subCommunity: 'Serenity Lakes / Elysian Mansions' } },
      '2': { next: 'RENT_HANDOFF', data: { subCommunity: 'Alaya South / Amara' } },
      '3': { next: 'RENT_HANDOFF', data: { subCommunity: 'Lanai Islands' } },
      '4': { next: 'RENT_HANDOFF', data: { subCommunity: 'TAG' } }
    },
    fallback: `Please reply:\n\n1 - Serenity Lakes / Elysian Mansions\n2 - Alaya South / Amara\n3 - Lanai Islands\n4 - Other`
  },

  RENT_HANDOFF: {
    message: `Rental demand in TAG has been consistent — especially 3 and 4BR villas which are moving quickly.

I'll send you current rental comparables for {subCommunity} so you know what to expect.

Reply CALL if you'd prefer a quick conversation first.`,
    notify: '🏡 RENTAL LISTING ENQUIRY',
    terminal: true
  },

  // ─── Buy flow ───

  BUY_TYPE: {
    message: `Great. Are you looking for:

1 - Another unit in TAG (upgrade or investment)
2 - A different community in Dubai
3 - Off-plan (new launch, payment plan)
4 - Ready secondary market`,
    options: {
      '1': { next: 'BUY_BUDGET', data: { buyType: 'TAG resale/upgrade' } },
      '2': { next: 'BUY_OTHER_COMMUNITY', data: { buyType: 'Other community' } },
      '3': { next: 'BUY_BUDGET', data: { buyType: 'Off-plan' } },
      '4': { next: 'BUY_BUDGET', data: { buyType: 'Ready secondary' } }
    },
    fallback: `Please reply with a number 1–4.`
  },

  BUY_OTHER_COMMUNITY: {
    message: `Which area are you considering?

1 - Dubai Hills Estate
2 - MBR City / Sobha Hartland
3 - Palm Jumeirah
4 - Emaar Beachfront / JBR
5 - Flexible — show me what fits my budget`,
    options: {
      '1': { next: 'BUY_BUDGET', data: { preferredCommunity: 'Dubai Hills Estate' } },
      '2': { next: 'BUY_BUDGET', data: { preferredCommunity: 'MBR City / Sobha Hartland' } },
      '3': { next: 'BUY_BUDGET', data: { preferredCommunity: 'Palm Jumeirah' } },
      '4': { next: 'BUY_BUDGET', data: { preferredCommunity: 'Emaar Beachfront / JBR' } },
      '5': { next: 'BUY_BUDGET', data: { preferredCommunity: 'Flexible' } }
    },
    fallback: `Please reply with a number 1–5.`
  },

  BUY_BUDGET: {
    message: `What's your budget range (AED)?

1 - Under 1.5M
2 - 1.5M to 3M
3 - 3M to 6M
4 - 6M+`,
    options: {
      '1': { next: 'BUY_HANDOFF', data: { budget: 'Under AED 1.5M' } },
      '2': { next: 'BUY_HANDOFF', data: { budget: 'AED 1.5M–3M' } },
      '3': { next: 'BUY_HANDOFF', data: { budget: 'AED 3M–6M' } },
      '4': { next: 'BUY_HANDOFF', data: { budget: 'AED 6M+' } }
    },
    fallback: `Please reply:\n\n1 - Under 1.5M\n2 - 1.5M to 3M\n3 - 3M to 6M\n4 - 6M+`
  },

  BUY_HANDOFF: {
    message: `Perfect. I'll shortlist 2–3 options that match what you're looking for and send them across.

Reply CALL if you'd prefer to talk through it first — happy to do a quick 15-minute call.`,
    notify: '💰 BUYER LEAD',
    terminal: true
  },

  // ─── Open question ───

  OPEN_QUESTION: {
    message: `Of course — what would you like to know about Tilal Al Ghaf?

Feel free to type your question and I'll get back to you shortly.`,
    collect: 'openQuestion',
    notify: '❓ OPEN QUESTION',
    freeText: true,
    terminal: true
  },

  // ─── Terminal states (awaiting your manual follow-up) ───

  CALL_REQUESTED: {
    message: `Perfect. What time works for a quick call? I'm usually free mornings UAE time but happy to work around you.`,
    collect: 'callTime',
    notify: '📞 CALL TIME PREFERENCE',
    freeText: true,
    terminal: true
  },

  STOPPED: {
    terminal: true
  },

  COMPLETED: {
    terminal: true
  }
};

// ─────────────────────────────────────────────
// State machine engine
// ─────────────────────────────────────────────

function getNextState(currentState, input, contact) {
  const state = flow[currentState];

  if (!state) {
    return {
      reply: flow['NEW'].message,
      nextState: 'NEW',
      data: {}
    };
  }

  // Terminal states: if contact writes back after flow ended, restart
  if (state.terminal) {
    // Check if it's a free-text state collecting info
    if (state.freeText) {
      return {
        reply: null,
        nextState: currentState,
        data: state.collect ? { [state.collect]: input } : {},
        notify: state.notify ? `${state.notify}\nMessage: "${input}"` : null
      };
    }
    // Otherwise bring them back to main menu
    return {
      reply: flow['NEW'].message,
      nextState: 'NEW',
      data: {}
    };
  }

  // Free text state (open question, call time)
  if (state.freeText) {
    return {
      reply: null,
      nextState: currentState,
      data: state.collect ? { [state.collect]: input } : {},
      notify: state.notify ? `${state.notify}\nMessage: "${input}"` : null
    };
  }

  // Numbered option matching
  const clean = input.trim().replace(/[^0-9]/g, '');
  const option = state.options && state.options[clean];

  if (option) {
    const nextStateConfig = flow[option.next];
    return {
      reply: nextStateConfig ? nextStateConfig.message : null,
      nextState: option.next,
      data: option.data || {},
      notify: nextStateConfig && nextStateConfig.notify ? nextStateConfig.notify : null
    };
  }

  // Fallback
  return {
    reply: state.fallback || `Please reply with one of the numbered options.`,
    nextState: currentState,
    data: {}
  };
}

// ─────────────────────────────────────────────
// Message renderer — replaces {variables}
// ─────────────────────────────────────────────

function renderMessage(template, contact) {
  if (!template) return '';

  let msg = template;
  
  // Contact fields
  msg = msg.replace(/{name}/g, contact.name || 'there');
  
  // Collected data fields
  const data = contact.data || {};
  msg = msg.replace(/{subCommunity}/g, data.subCommunity || 'Tilal Al Ghaf');
  msg = msg.replace(/{unitType}/g, data.unitType || 'property');
  msg = msg.replace(/{beds}/g, data.beds || '');
  msg = msg.replace(/{budget}/g, data.budget || '');
  msg = msg.replace(/{intent}/g, data.intent || '');

  return msg.trim();
}

module.exports = { flow, getNextState, renderMessage };
