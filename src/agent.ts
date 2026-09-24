import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { SYSTEM_PROMPTS } from './prompts';
import { RequirementOutput } from './synthesizer';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generatePlaywrightTest(
  requirements: RequirementOutput,
  outputFilename: string = 'generated_spec.spec.ts'
): Promise<string> {
  console.log(`[Agent] Generating Playwright TypeScript Test Suite...`);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPTS.PLAYWRIGHT_GENERATOR },
      { role: 'user', content: `Requirement Scenarios:\n${JSON.stringify(requirements, null, 2)}` }
    ]
  });

  const rawContent = response.choices[0].message.content || '';
  const codeMatch = rawContent.match(/```typescript([\s\S]*?)```/) || rawContent.match(/```ts([\s\S]*?)```/);
  const cleanCode = codeMatch ? codeMatch[1].trim() : rawContent.trim();

  // Save to output directory
  const targetDir = path.join(process.cwd(), 'tests', 'generated');
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  const filePath = path.join(targetDir, outputFilename);
  fs.writeFileSync(filePath, cleanCode, 'utf-8');
  console.log(`[Agent] Test suite written to: ${filePath}`);

  return filePath;
}