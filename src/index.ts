import { synthesizeRequirements, RequirementOutput } from './synthesizer';
import { reviewAndRefineScenarios } from './reviewer';
import { generatePlaywrightTest } from './agent';
import { runAndSelfHeal } from './runner';

async function main() {
  const targetFeature = 'User authentication flow on Saucedemo.com including standard login and invalid password validation';
  const maxReviewAttempts = 3;

  let attempt = 0;
  let approved = false;
  let feedback: string[] = [];
  let finalRequirements: RequirementOutput | null = null;

  // Feedback Loop: Product Owner <-> QA Architect
  while (attempt < maxReviewAttempts && !approved) {
    console.log(`\n--- Requirement Synthesis & Review Iteration ${attempt + 1}/${maxReviewAttempts} ---`);
    
    // Step 1: PO generates requirements (incorporating feedback if retrying)
    const requirements = await synthesizeRequirements(targetFeature, feedback);

    // Step 2: QA Architect evaluates requirements for testability
    const review = await reviewAndRefineScenarios(requirements);

    if (review.approved) {
      approved = true;
      finalRequirements = {
        ...requirements,
        gherkinScenarios: review.refinedGherkinScenarios || requirements.gherkinScenarios
      };
    } else {
      feedback = review.architectFeedback;
      attempt++;
    }
  }

  if (!approved || !finalRequirements) {
    throw new Error(`QA Architect did not approve requirements within ${maxReviewAttempts} iterations.`);
  }

  // Step 3: Automation Engineer generates Playwright code
  const specPath = await generatePlaywrightTest(finalRequirements, 'auth.spec.ts');

  // Step 4: Run tests & self-heal on failure
  await runAndSelfHeal(specPath);
}

main().catch(console.error);