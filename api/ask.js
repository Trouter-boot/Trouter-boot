export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ answer: 'Method not allowed' }); return; }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const { prompt, ai } = body || {};

  if (!prompt || !ai) {
    return res.status(400).json({ answer: 'prompt এবং ai প্রয়োজন।' });
  }

  try {
    if (ai === 'claude') {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) return res.status(500).json({ answer: 'Claude API key নেই।' });

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await response.json();
      const answer = data?.content?.[0]?.text;
      return res.status(200).json({ answer: answer || 'উত্তর পাওয়া যায়নি।' });

    } else if (ai === 'gemini') {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ answer: 'Gemini API key নেই।' });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );
      const data = await response.json();
      const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return res.status(200).json({ answer: answer || 'উত্তর পাওয়া যায়নি।' });

    } else {
      return res.status(400).json({ answer: 'অজানা AI।' });
    }

  } catch (e) {
    return res.status(500).json({ answer: '❌ সার্ভারে ত্রুটি: ' + e.message });
  }
}
