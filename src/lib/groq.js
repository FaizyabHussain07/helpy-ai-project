import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

const SYSTEM_PROMPT = "You are a helpful AI assistant. Return ONLY valid JSON. No explanation, no markdown, no backticks.";

const callGroq = async (messages, maxTokens = 300) => {
  try {
    const response = await groq.chat.completions.create({
      model: 'llama3-70b-8192',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      max_tokens: maxTokens
    });
    
    const content = response.choices[0]?.message?.content?.trim();
    if (!content) throw new Error('Empty response');
    
    // Try to parse as JSON, fallback to extracting JSON from markdown
    try {
      return JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Invalid JSON response');
    }
  } catch (error) {
    console.error('Groq API error:', error);
    return null;
  }
};

// 1. Categorize request based on title
export const categorizeRequest = async (title) => {
  if (!title?.trim()) return { category: 'Other' };
  
  const result = await callGroq([{
    role: 'user',
    content: `Given this help request title: "${title}"
    
Categorize it into one of these categories: Web Development, Design, Career, Study, or Other.

Return JSON: {"category": "CategoryName"}`
  }]);
  
  return result || { category: 'Other' };
};

// 2. Suggest tags based on description
export const suggestTags = async (description) => {
  if (!description?.trim()) return { tags: [] };
  
  const result = await callGroq([{
    role: 'user',
    content: `Given this help request description: "${description}"
    
Suggest 3-5 relevant skill tags (like React, Python, Figma, etc.).

Return JSON: {"tags": ["tag1", "tag2", "tag3"]}`
  }]);
  
  return result || { tags: [] };
};

// 3. Rewrite description for clarity
export const rewriteDescription = async (description) => {
  if (!description?.trim()) return { rewritten: description };
  
  const result = await callGroq([{
    role: 'user',
    content: `Rewrite this help request description to be clearer and more structured (2-3 sentences max):
"${description}"

Return JSON: {"rewritten": "improved description"}`
  }]);
  
  return result || { rewritten: description };
};

// 4. Generate AI summary
export const generateAISummary = async (description) => {
  if (!description?.trim()) return { summary: 'No description provided.' };
  
  const result = await callGroq([{
    role: 'user',
    content: `Summarize this help request in 1-2 sentences:
"${description}"

Return JSON: {"summary": "brief summary"}`
  }]);
  
  return result || { summary: description.substring(0, 100) + '...' };
};

// 5. Generate onboarding suggestions
export const generateOnboardingSuggestions = async (skills) => {
  if (!skills?.length) {
    return { 
      canHelpWith: ['General tech questions', 'Learning guidance'], 
      mightNeedHelpWith: ['Exploring new skills'] 
    };
  }
  
  const result = await callGroq([{
    role: 'user',
    content: `Given these user skills: ${skills.join(', ')}
    
Suggest:
1. What they can help others with (3-4 areas)
2. What they might need help with (2-3 areas)

Return JSON: {"canHelpWith": ["area1", "area2", "area3"], "mightNeedHelpWith": ["area1", "area2"]}`
  }]);
  
  return result || { 
    canHelpWith: skills.map(s => `${s} help`), 
    mightNeedHelpWith: ['Advanced topics'] 
  };
};

// 6. Generate dashboard insights
export const generateDashboardInsights = async (requestTitles) => {
  if (!requestTitles?.length) {
    return { 
      insights: [
        { title: 'Community Active', body: 'Many requests are being posted daily' }
      ] 
    };
  }
  
  const result = await callGroq([{
    role: 'user',
    content: `Given these recent help request titles: ${requestTitles.slice(0, 10).join(', ')}
    
Generate 2 insights about what the community needs help with.

Return JSON: {"insights": [{"title": "Short title", "body": "Brief description"}, {"title": "Short title", "body": "Brief description"}]}`
  }]);
  
  return result || { 
    insights: [
      { title: 'Popular Topics', body: 'The community is actively seeking help' },
      { title: 'Help Available', body: 'Many skilled helpers are ready to assist' }
    ] 
  };
};

// 7. Generate community trends
export const generateCommunityTrends = async (requestTitles) => {
  if (!requestTitles?.length) {
    return { 
      trends: [
        { title: 'Web Development', description: 'Most common support area' }
      ],
      urgentCount: 0,
      mentorPoolCount: 0
    };
  }
  
  const result = await callGroq([{
    role: 'user',
    content: `Analyze these request titles: ${requestTitles.slice(0, 15).join(', ')}
    
Identify the top 2 trending topics and estimate urgency level.

Return JSON: {"trends": [{"title": "Topic", "description": "Why it's trending"}], "urgentCount": 0, "mentorPoolCount": 0}`
  }]);
  
  return result || { 
    trends: [{ title: 'General Help', description: 'Various support requests' }],
    urgentCount: 0,
    mentorPoolCount: 0
  };
};
