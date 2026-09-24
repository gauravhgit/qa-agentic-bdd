import { execSync } from 'child_process';
import * as fs from 'fs';
import OpenAI from 'openai';
import { SYSTEM_PROMPTS } from './prompts';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function runAndSelfHeal(testFilePath: string, maxRetries: number = 2): Promise<boolean> {
  let attempt = 0;

  while (attempt <= maxRetries) {
    console.log(`\n Running Playwright Test Suite (Attempt ${attempt + 1}/${maxRetries + 1})...`);
    
    try {
      // Execute Playwright runner on target test
      execSync(`npx playwright test ${testFilePath} --reporter=list`, { stdio: 'inherit' });
      console.log(` Test Suite PASSED successfully!`);
      return true;
    } catch (error: any) {
      console.error(` Test Execution Failed on Attempt ${attempt + 1}`);

      if (attempt === maxRetries) {
        console.error(` Max self-healing retries reached. Test remains broken.`);
        return false;
      }

      console.log(` Initiating AI Self-Healing Loop...`);
      const brokenCode = fs.readFileSync(testFilePath, 'utf-8');
      const errorLog = error.stdout?.toString() || error.message || 'Unknown Playwright Error';

      // Send broken code + stack trace to LLM
      const healResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS.SELF_HEALER },
          { 
            role: 'user', 
            content: `Original Playwright Code:\n\`\`\`typescript\n${brokenCode}\n\`\`\`\n\nExecution Failure Log:\n${errorLog}` 
          }
        ]
      });

      const healedRaw = healResponse.choices[0].message.content || '';
      const healedMatch = healedRaw.match(/```typescript([\s\S]*?)```/) || healedRaw.match(/```ts([\s\S]*?)```/);
      const healedCode = healedMatch ? healedMatch[1].trim() : healedRaw.trim();

      // Overwrite the failed test file with healed code
      fs.writeFileSync(testFilePath, healedCode, 'utf-8');
      console.log(` Updated ${testFilePath} with healed code. Retrying test...`);

      attempt++;
    }
  }

  return false;
}