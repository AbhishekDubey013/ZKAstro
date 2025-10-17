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
        model: 'llama-3.1-sonar-small-128k-online',
        messages,
        temperature: 0.7,
        max_tokens: 500,
        stream: false,
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
