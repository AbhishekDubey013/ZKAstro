/**
 * Perplexity LLM client for polishing agent predictions
 */

interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function polishPrediction(
  dayScore: number,
  factors: string[],
  question: string,
  targetDate: string,
  agentPersonality: string
): Promise<{ summary: string; highlights: string }> {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    // Return template-based prediction if no API key
    return generateTemplatePrediction(dayScore, factors, agentPersonality);
  }

  try {
    const messages: PerplexityMessage[] = [
      {
        role: 'system',
        content: `You are an expert Western astrologer providing daily guidance. Your personality: ${agentPersonality}. Be concise, engaging, and practical.`,
      },
      {
        role: 'user',
        content: `Generate a daily astrology prediction for ${targetDate}.

Question: ${question}

Day Score: ${dayScore}/100
Astrological Factors: ${factors.join('; ')}

Provide:
1. A 2-3 sentence summary (conversational, encouraging, specific to the score and factors)
2. 3-4 key highlights as bullet points (actionable advice)

Be authentic and helpful. Acknowledge both opportunities and challenges.`,
      },
    ];

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-chat',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.statusText}`);
    }

    const data: PerplexityResponse = await response.json();
    const content = data.choices[0]?.message?.content || '';

    // Parse the response to extract summary and highlights
    const lines = content.split('\n').filter(line => line.trim());
    
    let summary = '';
    const highlightsList: string[] = [];
    let inHighlights = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.toLowerCase().includes('highlight') || trimmed.toLowerCase().includes('key point')) {
        inHighlights = true;
        continue;
      }

      if (inHighlights) {
        if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.match(/^\d+\./)) {
          highlightsList.push(trimmed.replace(/^[-•\d.]+\s*/, ''));
        }
      } else {
        if (!summary) {
          summary = trimmed;
        } else {
          summary += ' ' + trimmed;
        }
      }
    }

    // Fallback parsing if structured format not found
    if (!summary || highlightsList.length === 0) {
      const allText = content.trim();
      const parts = allText.split(/\n\n+/);
      summary = parts[0] || allText.substring(0, 300);
      
      if (parts.length > 1) {
        const bulletPoints = parts.slice(1).join('\n').split('\n').filter(l => l.trim());
        bulletPoints.forEach(bp => {
          if (bp.trim()) {
            highlightsList.push(bp.replace(/^[-•\d.]+\s*/, ''));
          }
        });
      }

      if (highlightsList.length === 0) {
        highlightsList.push('Focus on the cosmic energies present today');
        highlightsList.push('Stay mindful of planetary influences');
        highlightsList.push('Trust your intuition');
      }
    }

    return {
      summary: summary.trim() || generateTemplateSummary(dayScore, factors),
      highlights: highlightsList.slice(0, 4).map(h => `- ${h}`).join('\n'),
    };
  } catch (error) {
    console.error('Error calling Perplexity API:', error);
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
    return `This looks like a promising day for you! The cosmic alignments are favorable, with ${factors.slice(0, 2).join(' and ')}. Use this positive energy to move forward with your goals and connect with others.`;
  } else if (dayScore >= 40) {
    return `Today presents a mixed cosmic picture with both opportunities and challenges. ${factors[0]} suggests you'll need to balance different energies. Stay flexible and trust your instincts as you navigate the day.`;
  } else {
    return `The stars suggest a more contemplative day ahead. With ${factors.slice(0, 2).join(' and ')}, it's a good time to slow down, reflect, and take care of yourself. Not every day needs to be action-packed.`;
  }
}

function generateTemplateHighlights(dayScore: number, factors: string[]): string {
  const highlights: string[] = [];

  if (dayScore >= 70) {
    highlights.push('Take initiative on important projects');
    highlights.push('Social connections are highlighted');
    highlights.push('Trust your creative impulses');
  } else if (dayScore >= 40) {
    highlights.push('Balance work and personal time carefully');
    highlights.push('Communication may require extra patience');
    highlights.push('Focus on what you can control');
  } else {
    highlights.push('Prioritize rest and self-care');
    highlights.push('Avoid major decisions if possible');
    highlights.push('Reflect on recent lessons learned');
  }

  highlights.push('Stay grounded in your truth');

  return highlights.map(h => `- ${h}`).join('\n');
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
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    // Return template-based response if no API key
    return `Based on your prediction (Day Score: ${context.dayScore}/100), ${generateTemplateResponse(userQuestion, context)}`;
  }

  try {
    const messages: PerplexityMessage[] = [
      {
        role: 'system',
        content: `You are a practical astrologer providing actionable daily guidance. ${context.agentPersonality ? `Your personality: ${context.agentPersonality}.` : ''} 

You are helping a user understand their daily prediction for ${context.targetDate}.

Prediction Context:
- Day Score: ${context.dayScore}/100
- Astrological Factors: ${context.transitFactors.join('; ')}
- Original Prediction: ${context.predictionSummary}

IMPORTANT: Give PRACTICAL, ACTIONABLE advice that the user can actually use today:
- Focus on specific actions they can take
- Explain HOW the astrological factors affect their day practically
- Give timing advice (morning, afternoon, evening) when relevant
- Mention what to DO and what to AVOID
- Be conversational but concrete
- Reference specific planetary influences and their real-world effects

Example: Instead of "Venus energy is strong", say "Venus in your sector suggests this afternoon is ideal for important conversations with colleagues - they'll be more receptive to your ideas."`,
      },
    ];

    // Add conversation history (limit to last 5 messages to avoid token limits)
    const recentHistory = conversationHistory.slice(-5);
    messages.push(...recentHistory);

    // Add current user question
    messages.push({
      role: 'user',
      content: userQuestion,
    });

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-chat',
        messages,
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.statusText}`);
    }

    const data: PerplexityResponse = await response.json();
    const answer = data.choices[0]?.message?.content || '';

    return answer.trim() || generateTemplateResponse(userQuestion, context);
  } catch (error) {
    console.error('Error calling Perplexity chat API:', error);
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
