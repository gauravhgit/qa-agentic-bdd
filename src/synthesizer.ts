import OpenAI from 'openai';
import { SYSTEM_PROMPTS } from './prompts';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface RequirementOutput {
  title: string;
  userStory: string;
  gherkinScenarios: string[];
}

export async function synthesizeRequirements(
  featureTopic: string,
  feedback?: string[]
): Promise<RequirementOutput> {
  console.log(`[Product Owner] Generating scenarios for: "${featureTopic}"...`);

  let userPrompt = `Feature Concept: ${featureTopic}`;
  if (feedback && feedback.length > 0) {
    console.log(`[Product Owner] Incorporating feedback from QA Architect revision request...`);
    userPrompt += `\n\nPrevious QA Architect Feedback to Fix:\n - ${feedback.join('\n - ')}`;
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPTS.REQUIREMENT_SYNTHESIZER },
      { role: 'user', content: userPrompt }
    ]
  });

  const content = response.choices[0].message.content || '{}';
  const requirements: RequirementOutput = JSON.parse(content);

  console.log(`[Product Owner] Story: ${requirements.userStory}`);
  console.log(`[Product Owner] Generated Scenarios:\n${requirements.gherkinScenarios?.join('\n\n')}\n`);

  return requirements;
}