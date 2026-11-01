const https = require('https');
const { GEMINI_API_KEY, GEMINI_MODEL, OPENAI_API_KEY } = require('../config/env');

function formatINR(val) {
  return '₹' + Number(val || 0).toLocaleString('en-IN');
}

class AIService {
  /**
   * Main entry point: Calls live Gemini/OpenAI API if key present,
   * otherwise falls back seamlessly to the built-in Indian Intelligent Event Synthesis Engine.
   */
  async generateAIResponse(prompt, systemInstruction = '') {
    if (GEMINI_API_KEY) {
      try {
        const result = await this.callGeminiAPI(prompt, systemInstruction);
        if (result) return result;
      } catch (err) {
        console.warn('Gemini API call failed, falling back to local synthesis engine:', err.message);
      }
    } else if (OPENAI_API_KEY) {
      try {
        const result = await this.callOpenAIAPI(prompt, systemInstruction);
        if (result) return result;
      } catch (err) {
        console.warn('OpenAI API call failed, falling back to local synthesis engine:', err.message);
      }
    }

    return null; // Local engine will handle it directly
  }

  callGeminiAPI(prompt, systemInstruction) {
    return new Promise((resolve, reject) => {
      const model = GEMINI_MODEL || 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ]
      };

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }

      const data = JSON.stringify(payload);
      const req = https.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        },
        timeout: 15000
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (parsed.candidates && parsed.candidates[0]?.content?.parts?.[0]?.text) {
              resolve(parsed.candidates[0].content.parts[0].text);
            } else if (parsed.error) {
              reject(new Error(parsed.error.message || 'Gemini error'));
            } else {
              resolve(null);
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Gemini API timed out'));
      });
      req.write(data);
      req.end();
    });
  }

  callOpenAIAPI(prompt, systemInstruction) {
    return new Promise((resolve, reject) => {
      const url = 'https://api.openai.com/v1/chat/completions';
      const messages = [];
      if (systemInstruction) {
        messages.push({ role: 'system', content: systemInstruction });
      }
      messages.push({ role: 'user', content: prompt });

      const data = JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7
      });

      const req = https.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Length': Buffer.byteLength(data)
        },
        timeout: 15000
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (parsed.choices && parsed.choices[0]?.message?.content) {
              resolve(parsed.choices[0].message.content);
            } else {
              reject(new Error(parsed.error?.message || 'OpenAI error'));
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  /**
   * Generates a comprehensive full event plan with Indian context and Rupees.
   */
  async generateComprehensivePlan(eventData) {
    const { name, type, guestCount, estimatedBudget, location, theme, preferences } = eventData;
    const perGuestBudget = Math.round(estimatedBudget / (guestCount || 1));

    // Try Live AI first
    const prompt = `You are Gatherly's master event planning AI for Indian celebrations and international events. Generate a structured master plan for:
Event Name: ${name}
Type: ${type}
Location: ${location || 'India (e.g. Udaipur, Mumbai, Bengaluru, Goa, Delhi NCR)'}
Guests: ${guestCount}
Budget: ₹${estimatedBudget} (₹${perGuestBudget} per guest in Indian Rupees)
Theme: ${theme || 'Royal Indian & Contemporary'}
Preferences: ${JSON.stringify(preferences || {})}.

Return a JSON object containing:
- executiveSummary (string with Indian Rupees currency ₹)
- recommendedThemes (array of 3 objects with name, colorPalette, mood)
- decorConcepts (array of 4 decor points)
- foodMenu (appetizers, mains, desserts, signatureDrinks)
- entertainment (array of 3 ideas)
- timelineHighlights (schedule highlights)
- costSavingTips (array of 3 specific savings in INR ₹)`;

    const liveResponse = await this.generateAIResponse(prompt, 'You are an elite Indian & global event planner who outputs clean, valid JSON with currency in Rupees (₹).');
    if (liveResponse) {
      try {
        const jsonMatch = liveResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        // fallback to algorithmic synthesizer below
      }
    }

    // High-Fidelity Indian Synthesizer
    return this.synthesizePlanByType(type, eventData, perGuestBudget);
  }

  /**
   * Local Synthesis Engine tuned by event type and Indian context in Rupees
   */
  synthesizePlanByType(type, eventData, perGuestBudget) {
    const { name, guestCount, estimatedBudget, location, theme } = eventData;
    const loc = location || 'Udaipur, Rajasthan';

    if (type === 'wedding') {
      return {
        executiveSummary: `A grand royal celebration for ${guestCount} guests in ${loc}, blending rich Vedic traditions with modern palatial hospitality at an optimal ${formatINR(perGuestBudget)}/guest allocation.`,
        recommendedThemes: [
          {
            name: theme || 'Royal Rajputana Gilded Gold & Crimson',
            colorPalette: ['#D63031', '#FDCB6E', '#6C5CE7', '#FFF200'],
            mood: 'Palatial, regal, vibrant, and sacred.'
          },
          {
            name: 'Sunset Goan Beach & Bohemian Mogra',
            colorPalette: ['#00CEC9', '#FDCB6E', '#E17055', '#FFFFFF'],
            mood: 'Breezy coastal romance with marigold drapes and fairy-lit coconut palms.'
          },
          {
            name: 'Modern Punjabi Sangeet & Neon Royale',
            colorPalette: ['#E84393', '#6C5CE7', '#FDCB6E', '#2D3436'],
            mood: 'High-voltage, celebratory, Dhol-powered, and glamorous.'
          }
        ],
        decorConcepts: [
          'Mandap Centerpiece: 4-pillar hand-carved floral Mandap draped in fresh Pushkar marigolds, fragrant Madurai mogra, and brass diya clusters.',
          'Entrance Wow-Factor: Grand floral Phoolon Ki Chaadar pathway with royal rose petal carpet and warm brass urlis with floating candles.',
          'Lighting Ambiance: Warm amber architectural wash on heritage stone arches, fairy light canopies over dinner courtyard, and cold pyros for Varmala.',
          'Interactive Photobooth: Royal Rajasthani Jharokha window frame with customized floral initials and traditional turbans/props.'
        ],
        foodMenu: {
          appetizers: ['Paneer Tikka Angara with mint lachha', 'Crispy Dahi Ke Kebab with pomegranate reduction', 'Live Delhi 6 Chaat Counter (Golgappas, Papdi Chaat, Raj Kachori)'],
          mains: ['Dal Baati Churma with pure desi ghee', 'Shahi Paneer Lababdar & Dum Awadhi Biryani', 'Kashmiri Dum Aloo with fresh garlic naan & missi roti'],
          desserts: ['Hot Jalebi with thick Rabri & pistachio garnish', 'Royal Kesar Pista Kulfi in clay Matkas', 'Gulab Jamun stuffed with saffron & gulkand'],
          signatureDrinks: ['"The Kesariya Rajwadi Spritz": Saffron cooler with elderflower, rose water, and gold shimmer', '"Chai Shai Bar": Kulhad Masala Chai & South Indian Filter Kaapi']
        },
        entertainment: [
          'Baaraat & Welcome: High-energy live Punjabi Dhol troupe with brass band escorting the groom.',
          'Varmala & Pheras: Classical Shehnai and live Sitar-Flute jugalbandi creating a serene Vedic aura.',
          'Sangeet Night: Celebrity Bollywood DJ with choreographed family dance battles and LED dhol finale.'
        ],
        timelineHighlights: [
          '09:30 AM - Haldi & Phoolon Ki Holi Ceremony',
          '03:30 PM - Safa Tying for 150 Baaraati Guests',
          '04:30 PM - Grand Baaraat Procession with Dhol',
          '06:00 PM - Sunset Lakeside Varmala with Cold Sparklers',
          '07:30 PM - Sacred Pheras & Kanyadaan under Mandap',
          '08:30 PM - Royal Courtyard Dinner & Live Ghazals',
          '11:15 PM - Emotional Bidaai & Vintage Car Send-Off'
        ],
        costSavingTips: [
          { tip: 'Procure seasonal Indian florals (Marigold & Jasmine)', estimatedSavings: Math.round(estimatedBudget * 0.04), description: 'Opting for locally harvested Pushkar marigolds and jasmine instead of imported Dutch carnations reduces floral costs by 30% while looking richer.' },
          { tip: 'Host Mehendi & Sangeet at the same palace venue', estimatedSavings: Math.round(estimatedBudget * 0.06), description: 'Combining afternoon Mehendi with evening Sangeet at a shared venue pavilion eliminates dual setup and transit logistics.' },
          { tip: 'Digital RSVP QR with single-sheet royal invite', estimatedSavings: Math.round(estimatedBudget * 0.02), description: 'Use a single gold-embossed card with a WhatsApp/web QR code instead of a multi-envelope box for relatives.' }
        ]
      };
    } else if (type === 'birthday') {
      return {
        executiveSummary: `An electrifying birthday celebration for ${guestCount} guests in ${loc}, packed with Bollywood nostalgia, live entertainment, and unforgettable photo ops at ${formatINR(perGuestBudget)}/guest.`,
        recommendedThemes: [
          {
            name: theme || 'Bollywood Retro 90s & Cyber Neon',
            colorPalette: ['#E84393', '#6C5CE7', '#00CEC9', '#FDCB6E'],
            mood: 'High-voltage, playful, nostalgic, and energetic.'
          },
          {
            name: 'Mumbai Seaface Sunset Rooftop Glam',
            colorPalette: ['#FDCB6E', '#6C5CE7', '#FFFFFF', '#FAB1A0'],
            mood: 'Chic, breezy, rooftop lounge vibes with deep house and Bollywood beats.'
          },
          {
            name: 'Royal Heritage Haveli Night',
            colorPalette: ['#2D3436', '#FDCB6E', '#D63031', '#6C5CE7'],
            mood: 'Candlelit, opulent, intimate, and sophisticated.'
          }
        ],
        decorConcepts: [
          'Entrance Statement: Neon sign corridor with famous Bollywood dialogues and LED party arch.',
          'Interactive 360-Degree Video Booth with fun Bollywood movie props and instant reels export.',
          'Table Setup: Mirrored surfaces with micro-LED fairylights and gold metallic confetti.',
          'Lighting Scheme: Dynamic moving beam spotlights and ultraviolet wash on dance floor.'
        ],
        foodMenu: {
          appetizers: ['Gourmet Vada Pav Sliders with spicy thecha dip', 'Amritsari Fish Fingers / Paneer Kurkure with mint chutney', 'Crispy Corn & Waterchestnut bhel in bamboo cones'],
          mains: ['Live Kathi Roll & Tawa Counter (Paneer / Chicken Tikka)', 'Mini Pav Bhaji fondue bowls with butter brioche'],
          desserts: ['Custom 3D sculptured cake with sparkler candles', 'Live Nitrogen Ice Cream or Churros with Rabri dip'],
          signatureDrinks: ['"Mumbai Mule": Vodka, kokum syrup, ginger beer, lime', '"Spiced Mango Chilli Mezcalita": Mango purée with green chilli kick']
        },
        entertainment: [
          'Bollywood Trivia & Roasting Segment featuring funny childhood photos on LED screens.',
          'Live DJ spinning 90s Shah Rukh Khan hits transitioning to UK Punjabi and EDM chartbusters.',
          'LED Dhol performance during the cake cutting countdown.'
        ],
        timelineHighlights: [
          '07:30 PM - Red Carpet Welcome & Signature Cocktails',
          '08:30 PM - Live Finger Food & 360 Photo Booth Competition',
          '09:45 PM - Birthday Roast, Video Tribute & Cake Cutting',
          '10:15 PM - High-Energy Dance Floor with DJ & Dhol',
          '12:00 AM - Midnight Biryani & Kulhad Masala Chai Counter'
        ],
        costSavingTips: [
          { tip: 'Host cocktail-style with live food counters', estimatedSavings: Math.round(estimatedBudget * 0.08), description: 'Passed small bites and live tawa counters encourage mingling and cut seated dinner staffing costs.' },
          { tip: 'Curated Spotify warmup playlist for first 90 minutes', estimatedSavings: Math.round(estimatedBudget * 0.04), description: 'Book your celebrity DJ for the peak 3 party hours to avoid hourly overtime rates.' },
          { tip: 'DIY Polaroid Memory Wall', estimatedSavings: Math.round(estimatedBudget * 0.03), description: 'Provide two Instax cameras with film for guests to peg memories on a fairy-lit twine board.' }
        ]
      };
    } else {
      // Community Event in India
      return {
        executiveSummary: `A vibrant community gathering bringing together ${guestCount} attendees in ${loc}, celebrating local culture, artisans, and sustainability within a ${formatINR(estimatedBudget)} budget.`,
        recommendedThemes: [
          {
            name: theme || 'Karnataka Cultural Heritage & Eco Artisan Fair',
            colorPalette: ['#00B894', '#FDCB6E', '#6C5CE7', '#DFE6E9'],
            mood: 'Sustainable, welcoming, artisan-driven, and family-friendly.'
          },
          {
            name: 'Desi Street Food & Music Utsav',
            colorPalette: ['#E17055', '#6C5CE7', '#FDCB6E', '#0984E3'],
            mood: 'Sensory-rich, energetic, flavorful, and celebratory.'
          },
          {
            name: 'City Youth & Tech Innovation Carnival',
            colorPalette: ['#6C5CE7', '#FDCB6E', '#2D3436', '#FFFFFF'],
            mood: 'Forward-looking, dynamic, collaborative, and inspiring.'
          }
        ],
        decorConcepts: [
          'Eco-Friendly Wooden Kiosks with handloom cotton canopies and terracotta signage.',
          'Community Wall of Hope: 20-foot canvas where all attendees paint or write a wish for the city.',
          'Shaded Pavilion: Bamboo and jute seating with marigold floral rangolis at entryways.',
          'Stage Decor: Brass lamp Deepam lighting ceremony backdrop with warm LED floodlights.'
        ],
        foodMenu: {
          appetizers: ['Karnataka Davanagere Benne Dosa bites', 'Steaming Idli-Vada with 3 coastal chutneys', 'Chaat stalls with freshly crushed sugarcane juice'],
          mains: ['Local Artisan Food Trucks (Biryani pots, Kathi rolls, Millet thalis)', 'Khichdi & Kadhi live community pots'],
          desserts: ['Mysore Pak & Dharwad Peda counters', 'Fresh tender coconut water stalls', 'Seasonal Mango Kulfi'],
          signatureDrinks: ['"Filter Kaapi Station": Authentic brass tumbler filter coffee', '"Fresh Nimbu Shikanji": Mint and cumin infused lemonade']
        },
        entertainment: [
          'Main Stage: Rotating performances by local Yakshagana folk artists, student dance crews, and indie acoustic acts.',
          'Workshops: Live pottery making, clay diya sculpting, and organic gardening demos for families.',
          'Community Awards: Felicitating neighborhood green champions and student achievers.'
        ],
        timelineHighlights: [
          '10:00 AM - Deepam Lighting & Inaugural Shehnai Melody',
          '11:00 AM - Artisan Market & Organic Farmers Stalls Open',
          '01:00 PM - Food Truck Plaza & Live Street Performances',
          '03:30 PM - Interactive Pottery & Folk Dance Workshops',
          '05:00 PM - Community Awards Ceremony & Volunteer Thanks',
          '06:30 PM - Grand Musical Finale & Eco Clean-Up Drive'
        ],
        costSavingTips: [
          { tip: 'Partner with local food truck collective', estimatedSavings: Math.round(estimatedBudget * 0.12), description: 'Food trucks charge attendees directly or share revenue, eliminating fixed catering risk.' },
          { tip: 'Local business banner sponsorship tiers', estimatedSavings: Math.round(estimatedBudget * 0.15), description: 'Offer local neighborhood shops stall space and stage banners to fund production costs.' },
          { tip: 'Student volunteer brigade for coordination', estimatedSavings: Math.round(estimatedBudget * 0.10), description: 'Recruit university volunteers for crowd wayfinding and badge desks with certificates and meals.' }
        ]
      };
    }
  }

  /**
   * Generates personalised Indian ideas based on category, budget in ₹, guest count, theme, location.
   */
  async generatePersonalizedIdeas(params) {
    const { category, budget, guestCount, theme, location, preferences } = params;

    const prompt = `Generate 5 creative, practical, and budget-conscious ideas for an Indian celebration:
Category: ${category}
Available Budget: ₹${budget} (INR)
Guests: ${guestCount}
Theme: ${theme || 'Indian Celebration'}
Location: ${location || 'Indian Venue (e.g. Udaipur, Mumbai, Bengaluru, Delhi, Goa)'}
Preferences: ${preferences || 'Traditional & Modern'}.

For each idea, provide:
- title
- description
- estimatedCost (in INR ₹)
- category (Theme, Decor, Food, Entertainment, Logistics)
- whyItWorks`;

    const live = await this.generateAIResponse(prompt);
    if (live) {
      try {
        const jsonMatch = live.match(/\[[\s\S]*\]/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
      } catch (e) {
        // fallback to algorithmic synthesizer below
      }
    }

    // Algorithmic Indian idea generator tailored specifically to inputs
    const ideas = [
      {
        title: `Royal Saffron "Kesariya" Welcome Drink in Terracotta Kulhads`,
        category: 'Food',
        estimatedCost: Math.min(25000, Math.round(budget * 0.03)),
        description: `Greet your ${guestCount} guests upon arrival in ${location || 'the venue'} with chilled saffron, rose water, and almond milk coolers served in eco-friendly handcrafted earthen kulhads.`,
        whyItWorks: `Creates an unforgettable royal arrival hospitality moment at minimal cost while supporting local potters.`
      },
      {
        title: `Interactive Audio Guestbook in Vintage Brass Telephone`,
        category: 'Entertainment',
        estimatedCost: Math.min(18000, Math.round(budget * 0.025)),
        description: `Set up an antique brass rotary telephone on a marigold-dressed table where relatives and friends dial to record heartfelt blessings, funny jokes, and memories.`,
        whyItWorks: `Costs far less than a full 360-photo booth while preserving timeless voices of elder family members.`
      },
      {
        title: `Floating Brass Urlis with Scented Mogra & Tealights`,
        category: 'Decor',
        estimatedCost: Math.min(30000, Math.round(budget * 0.04)),
        description: `Line key entrance pathways with 10 antique brass urlis filled with fresh water, yellow marigolds, white jasmine mogra, and floating sandalwood tealight candles.`,
        whyItWorks: `Delivers 10x the visual luxury of expensive imported props with authentic Indian fragrance.`
      },
      {
        title: `Plantable Seed Paper Kankotri / Thank-You Cards`,
        category: 'Logistics',
        estimatedCost: Math.min(15000, Math.round(budget * 0.015)),
        description: `Custom gold-foil embossed cards made of wildflower seed paper that guests take home to plant in their home gardens.`,
        whyItWorks: `Eco-friendly, memorable, and blooms into actual flowers long after the celebration concludes.`
      },
      {
        title: `Midnight Kulhad Masala Chai & Hot Jalebi Station`,
        category: 'Food',
        estimatedCost: Math.min(22000, Math.round(budget * 0.03)),
        description: `Deliver freshly brewed ginger-cardamom chai in clay cups alongside hot crispy jalebis straight from the frying kadhai during the final hour of the event.`,
        whyItWorks: `Re-energizes all dancing guests and leaves everyone raving about the midnight hospitality.`
      }
    ];

    return ideas;
  }

  /**
   * Generates smart cost-saving suggestions for budget management in Rupees.
   */
  async generateCostSavingSuggestions(event, budget, expenses) {
    const totalSpent = expenses.reduce((acc, curr) => acc + (curr.actualAmount || curr.estimatedAmount || 0), 0);
    const isOverbudget = totalSpent > budget.totalBudget;
    const overage = Math.max(0, totalSpent - budget.totalBudget);

    const suggestions = [
      {
        area: 'Floral & Mandap Architecture',
        action: 'Seasonal Pushkar Marigold & Jasmine over Dutch Florals',
        estimatedSavings: Math.round(budget.totalBudget * 0.05),
        impact: 'High Savings / Authentic Vibe',
        details: 'Replacing imported peonies with fresh marigolds, tuberoses, and Madurai jasmine saves up to 35% on floral procurement while looking authentically grand.'
      },
      {
        area: 'Food & Banqueting',
        action: 'Curated 4-Course Feast vs. Overcrowded 80-Item Buffet',
        estimatedSavings: Math.round(budget.totalBudget * 0.07),
        impact: 'Zero Quality Loss',
        details: 'Focusing on 25 signature well-prepared dishes with 3 live stations (Chaat, Tandoor, Jalebi) reduces food wastage and banquet plate costs significantly.'
      },
      {
        area: 'Invitations & Packaging',
        action: 'Gold-Foil Single Sheet + Digital QR RSVP Portal',
        estimatedSavings: Math.round(budget.totalBudget * 0.03),
        impact: 'Eco-Friendly & Modern',
        details: 'Ditch heavy multi-box courier packages for a single luxury embossed invitation with a WhatsApp RSVP QR code.'
      },
      {
        area: 'Photography Coverage',
        action: 'Targeted Golden Hour & Ceremony Coverage',
        estimatedSavings: Math.round(budget.totalBudget * 0.04),
        impact: 'Focused Quality',
        details: 'Schedule full multi-camera drone crew for key rituals (Varmala, Pheras, Sangeet) and a single candid photographer for late night hours.'
      }
    ];

    return {
      totalSpent,
      totalBudget: budget.totalBudget,
      isOverbudget,
      overage,
      suggestions
    };
  }
}

const aiService = new AIService();
module.exports = aiService;
