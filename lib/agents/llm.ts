/**
 * LLM client for polishing agent predictions
 * Uses OpenAI-compatible API with cost-efficient models
 */

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// Use gpt-4o-mini for cost efficiency - about $0.15 per 1M input tokens
const MODEL = 'gpt-4o-mini';

/**
 * Detect if a question is trying to game the system or is rubbish
 */
function detectGamingAttempt(question: string): boolean {
  const lowerQuestion = question.toLowerCase().trim();
  
  // Patterns that indicate gaming attempts
  const gamingPatterns = [
    /^(test|testing|hello|hi|hey|what|who|when|where|why|how)\s*[?!]?$/i,
    /^(a|b|c|d|1|2|3|yes|no|maybe)\s*[?!]?$/i,
    /^(lol|lmao|haha|hehe|xd)\s*[?!]?$/i,
    /^[^a-z]{3,}$/i, // Only symbols/numbers
    /^(.)\1{10,}$/i, // Repeated single character
    /^.{0,5}$/i, // Too short (less than 6 chars)
    /\b(test|testing|spam|fake|joke|troll|gaming|game)\b/i,
    /^[?!.\s]+$/, // Only punctuation
  ];
  
  // Check for patterns
  for (const pattern of gamingPatterns) {
    if (pattern.test(lowerQuestion)) {
      return true;
    }
  }
  
  // Check if question is too generic or meaningless
  const meaninglessPhrases = [
    'what is',
    'tell me',
    'explain',
    'define',
    'what does',
    'what are',
    'what do',
  ];
  
  const startsWithMeaningless = meaninglessPhrases.some(phrase => 
    lowerQuestion.startsWith(phrase) && lowerQuestion.length < 30
  );
  
  // Check if it's a real prediction question (should have future-oriented language)
  const hasFutureLanguage = /\b(will|should|can|could|might|may|going to|gonna|future|tomorrow|next|soon|this|coming)\b/i.test(lowerQuestion);
  
  // If too short, no future language, and starts with meaningless phrase = likely gaming
  if (lowerQuestion.length < 20 && !hasFutureLanguage && startsWithMeaningless) {
    return true;
  }
  
  return false;
}

export async function polishPrediction(
  dayScore: number,
  factors: string[],
  question: string,
  targetDate: string,
  agentPersonality: string
): Promise<{ summary: string; highlights: string }> {
  // Check for LLM_API_KEY first, fall back to PERPLEXITY_API_KEY for backward compatibility
  const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    console.log('No LLM API key found, using template-based predictions');
    return generateTemplatePrediction(dayScore, factors, agentPersonality);
  }

  // Determine which API to use based on the key format
  const isPerplexity = apiKey.startsWith('pplx-');
  const apiUrl = isPerplexity 
    ? 'https://api.perplexity.ai/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';
  
  const modelToUse = isPerplexity ? 'llama-3.1-sonar-small-128k-chat' : MODEL;

  try {
    // Detect if question is trying to game the system or is rubbish
    const isGamingAttempt = detectGamingAttempt(question);
    
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `${agentPersonality}

YOUR MISSION: Deliver a prediction that makes the user feel they've gained genuine cosmic insight they couldn't get anywhere else.

${isGamingAttempt ? `⚠️ GAMING DETECTED: The question "${question}" appears to be trying to game the system or is not a genuine prediction request. Give a CHEEKY, WITTY response that:
- Playfully calls out that this isn't a real prediction question
- Maintains your astrologer personality but with humor
- Suggests asking a real question instead
- Be clever and entertaining, not rude
- Keep it under 80 words` : `RESPONSE STRUCTURE:
1. COSMIC INSIGHT (2-3 sentences): Your unique interpretation of what the stars reveal about their question. Be SPECIFIC - mention the actual planetary influence and what it means for THEM.

2. THREE GUIDANCE POINTS: Each should be:
   - Actionable (something they can DO)
   - Specific to THIS day and THIS question
   - Reflecting YOUR unique astrological philosophy

QUALITY STANDARDS:
- Every sentence should contain VALUE - no filler
- Connect cosmic factors to PRACTICAL outcomes
- Make them feel you've seen something others would miss
- Your reading should feel personal, not generic

Keep total under 150 words but make every word count.`}`,
      },
      {
        role: 'user',
        content: `Question: "${question}"
Date: ${targetDate}
Day Energy Score: ${dayScore}/100
Active Cosmic Factors: ${factors.slice(0, 3).join('; ')}

${isGamingAttempt ? 'This question seems like it might be trying to game the system. Give a cheeky, witty response.' : 'Deliver your unique cosmic reading. Focus on the INSIGHT they need most right now.'}`,
      },
    ];

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelToUse,
        messages,
        temperature: 0.95, // Very high temp for maximum distinctness
        max_tokens: 300,
        // Add seed variation between agents for more distinct outputs (if supported)
        ...(agentPersonality.includes('@auriga') ? { seed: 42 } : { seed: 99 }),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`LLM API error: ${response.status} - ${errorText}`);
      throw new Error(`LLM API error: ${response.statusText}`);
    }

    const data: ChatResponse = await response.json();
    const content = data.choices[0]?.message?.content || '';

    // Parse the response - sentences first, then bullets
    const lines = content.split('\n').filter(line => line.trim());
    
    let summary = '';
    const highlightsList: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim().replace(/\*\*/g, '');
      if (!trimmed) continue;
      
      // Skip section headers
      if (trimmed.match(/^(action|recommendation|key|insight)/i) && trimmed.length < 30) continue;
      if (trimmed.match(/^\d+\.\s*$/) || trimmed === '---') continue;

      // Bullet points go to highlights
      if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.match(/^\d+\.\s+\w/)) {
        const cleaned = trimmed.replace(/^[-•\d.]+\s*/, '');
        if (cleaned.length > 5 && highlightsList.length < 3) {
          highlightsList.push(cleaned);
        }
      } else if (!summary) {
        // First non-bullet is summary
        summary = trimmed;
      } else if (summary.length < 350) {
        // Append to build fuller summary
        summary += ' ' + trimmed;
      }
    }

    // Ensure we have highlights
    if (highlightsList.length === 0) {
      highlightsList.push('Trust your instincts on this');
      highlightsList.push('Stay focused on your goals');
      highlightsList.push('Review before committing');
    }

    return {
      summary: summary.trim().substring(0, 400) || generateTemplateSummary(dayScore, factors),
      highlights: highlightsList.slice(0, 3).map(h => `• ${h}`).join('\n'),
    };
  } catch (error) {
    console.error('Error calling LLM API:', error);
    return generateTemplatePrediction(dayScore, factors, agentPersonality);
  }
}

function generateTemplatePrediction(
  dayScore: number,
  factors: string[],
  personality: string
): { summary: string; highlights: string } {
  return {
    summary: generateTemplateSummary(dayScore, factors),
    highlights: generateTemplateHighlights(dayScore, factors),
  };
}

function generateTemplateSummary(dayScore: number, factors: string[]): string {
  if (dayScore >= 70) {
    return `This looks favorable for you. ${factors[0] || 'The planetary alignments'} creates supportive energy for moving forward. ${factors[1] ? factors[1] + ' adds additional momentum.' : ''} The cosmic climate suggests this is a good time to take action on what matters to you.`;
  } else if (dayScore >= 40) {
    return `The energies are mixed right now. ${factors[0] || 'Current transits'} suggests some caution is warranted, though opportunities exist. ${factors[1] ? 'Meanwhile, ' + factors[1].toLowerCase() + '.' : ''} Proceed thoughtfully and trust your judgment on timing.`;
  } else {
    return `Consider waiting for better timing. ${factors[0] || 'The current planetary positions'} indicates potential obstacles or delays. ${factors[1] ? factors[1] + ' reinforces this.' : ''} Use this period for preparation and planning rather than major action.`;
  }
}

function generateTemplateHighlights(dayScore: number, factors: string[]): string {
  if (dayScore >= 70) {
    return `• Take initiative on important decisions\n• Reach out to key people in your network\n• Trust your instincts when opportunities arise`;
  } else if (dayScore >= 40) {
    return `• Proceed carefully but don't hesitate too long\n• Double-check details before committing\n• Balance optimism with practical planning`;
  } else {
    return `• Postpone major decisions if possible\n• Focus on research and preparation\n• Use this time for reflection and planning`;
  }
}

/**
 * Generate chat response using prediction context
 */
export async function generateChatResponse(
  userQuestion: string,
  context: {
    dayScore: number;
    transitFactors: string[];
    predictionSummary: string;
    targetDate: string;
    agentPersonality?: string;
  },
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    return `Based on your prediction (Day Score: ${context.dayScore}/100), ${generateTemplateResponse(userQuestion, context)}`;
  }

  const isPerplexity = apiKey.startsWith('pplx-');
  const apiUrl = isPerplexity 
    ? 'https://api.perplexity.ai/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';
  
  const modelToUse = isPerplexity ? 'llama-3.1-sonar-small-128k-chat' : MODEL;

  try {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a practical astrologer providing actionable guidance. ${context.agentPersonality ? `Your personality: ${context.agentPersonality}.` : ''} 

You are helping a user understand their prediction for ${context.targetDate}.

Prediction Context:
- Day Score: ${context.dayScore}/100
- Astrological Factors: ${context.transitFactors.join('; ')}
- Original Prediction: ${context.predictionSummary}

Give PRACTICAL, ACTIONABLE advice:
- Focus on specific actions they can take
- Explain HOW astrological factors affect them practically
- Be conversational but concrete
- Keep responses concise (2-3 sentences max)`,
      },
    ];

    // Add conversation history (limit to last 4 messages)
    const recentHistory = conversationHistory.slice(-4);
    messages.push(...recentHistory);

    // Add current user question
    messages.push({
      role: 'user',
      content: userQuestion,
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelToUse,
        messages,
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.statusText}`);
    }

    const data: ChatResponse = await response.json();
    const answer = data.choices[0]?.message?.content || '';

    return answer.trim() || generateTemplateResponse(userQuestion, context);
  } catch (error) {
    console.error('Error calling LLM chat API:', error);
    return generateTemplateResponse(userQuestion, context);
  }
}

function generateTemplateResponse(question: string, context: { dayScore: number; transitFactors: string[] }): string {
  const lowerQ = question.toLowerCase();
  
  if (lowerQ.includes('career') || lowerQ.includes('work') || lowerQ.includes('job')) {
    if (context.dayScore >= 60) {
      return `With your ${context.dayScore}/100 day score, career matters look favorable. ${context.transitFactors[0] || 'The current planetary alignments'} supports professional initiatives. Consider taking thoughtful action on work-related goals.`;
    } else {
      return `Your day score of ${context.dayScore}/100 suggests proceeding carefully with career matters. This may be a better time for planning and preparation rather than major moves. ${context.transitFactors[0] || 'The current transits'} indicates patience will serve you well.`;
    }
  } else if (lowerQ.includes('love') || lowerQ.includes('relationship') || lowerQ.includes('romance')) {
    return `Regarding relationships, ${context.transitFactors.find(f => f.includes('Venus') || f.includes('Moon')) || 'the current cosmic climate'} influences your emotional connections. With a day score of ${context.dayScore}/100, approach heart matters with both openness and awareness.`;
  } else if (lowerQ.includes('money') || lowerQ.includes('finance') || lowerQ.includes('wealth')) {
    return `For financial matters, your ${context.dayScore}/100 score suggests ${context.dayScore >= 60 ? 'favorable conditions for financial decisions, though always use practical judgment' : 'taking a cautious approach. Review rather than rush'}. ${context.transitFactors[0] || 'Current planetary positions'} recommends mindful consideration.`;
  } else {
    return `Based on your prediction with a ${context.dayScore}/100 day score and ${context.transitFactors[0] || 'current astrological factors'}, I'd suggest staying attuned to the cosmic energies while maintaining your practical wisdom. Each day brings its own unique opportunities and lessons.`;
  }
}
