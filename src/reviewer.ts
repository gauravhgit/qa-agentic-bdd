import OpenAI from 'openai';
import { SYSTEM_PROMPTS } from './prompts';
import { RequirementOutput } from './synthesizer';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ReviewOutput {
  approved: boolean;
  architectFeedback: string[];
  refinedGherkinScenarios: string[];
}

export async function reviewAndRefineScenarios(
  requirements: RequirementOutput
): Promise<ReviewOutput> {
  console.log(`[QA Architect] Reviewing Gherkin scenarios for testability...`);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPTS.QA_ARCHITECT_REVIEWER },
      { role: 'user', content: `Input Story & Scenarios:\n${JSON.stringify(requirements, null, 2)}` }
    ]
  });

  const review: ReviewOutput = JSON.parse(response.choices[0].message.content || '{}');

  if (review.approved) {
    console.log(`[QA Architect] APPROVED scenarios.`);
  } else {
    console.warn(`[QA Architect] REJECTED scenarios. Requesting revisions...`);
    console.warn(`Feedback:\n - ${review.architectFeedback?.join('\n - ')}`);
  }

  return review;
}