'use server';
/**
 * @fileOverview A flow for generating engaging titles and paragraph text for the public homepage.
 *
 * - generateSiteContent - The exported function to call the flow.
 * - GenerateSiteContentInput - The TypeScript type for the input.
 * - GenerateSiteContentOutput - The TypeScript type for the output.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input schema
const GenerateSiteContentInputSchema = z.object({
  schoolName: z.string().describe('The name of the school.'),
  missionStatement: z.string().describe('A brief mission statement or description of the school. This will be used as the basis for rewriting mission text and other paragraphs.'),
});
export type GenerateSiteContentInput = z.infer<typeof GenerateSiteContentInputSchema>;

// Output schema
const GenerateSiteContentOutputSchema = z.object({
  heroTitle: z.string().describe("A catchy, welcoming title for the main hero section."),
  heroSubtitle: z.string().describe("An engaging subtitle that expands on the hero title."),
  missionTitle: z.string().describe("A title for the mission statement section, like 'Our Mission' or 'Our Vision'."),
  missionText1: z.string().describe("The first paragraph of the mission statement text, professionally rewritten based on the user's input."),
  missionText2: z.string().describe("An optional second paragraph for the mission statement, expanding on the first."),
  whyChooseTitle: z.string().describe("A title for the section explaining why to choose the school, e.g., 'Why Choose [School Name]?'."),
  feature1Title: z.string().describe("A concise title for the first key feature of the school."),
  feature1Text: z.string().describe("A short paragraph expanding on the first key feature."),
  feature2Title: z.string().describe("A concise title for the second key feature of the school."),
  feature2Text: z.string().describe("A short paragraph expanding on the second key feature."),
  feature3Title: z.string().describe("A concise title for the third key feature of the school."),
  feature3Text: z.string().describe("A short paragraph expanding on the third key feature."),
  academicsTitle: z.string().describe("A title for the academics section."),
  academicsText: z.string().describe("A paragraph about the school's academic excellence."),
  communityTitle: z.string().describe("A title for the community or campus life section."),
  communityText: z.string().describe("A paragraph about the school's vibrant community and campus life."),
});
export type GenerateSiteContentOutput = z.infer<typeof GenerateSiteContentOutputSchema>;


// The prompt for generation
const contentPrompt = ai.definePrompt({
    name: 'generateSiteContentPrompt',
    input: { schema: GenerateSiteContentInputSchema },
    output: { schema: GenerateSiteContentOutputSchema },
    prompt: `You are a creative copywriter for educational institutions. Your task is to generate a full set of engaging and professional titles and descriptive paragraphs for a school's homepage.

    The school's name is: {{{schoolName}}}
    Their mission statement is: "{{{missionStatement}}}"

    Based on this, generate all the required content. Rewrite the mission statement into professional, welcoming text for the website. Be creative, but keep the tone professional and concise.
    `,
});

// The main flow
const generateSiteContentFlow = ai.defineFlow(
  {
    name: 'generateSiteContentFlow',
    inputSchema: GenerateSiteContentInputSchema,
    outputSchema: GenerateSiteContentOutputSchema,
  },
  async (input) => {
    const { output } = await contentPrompt(input);
    return output!;
  }
);


// Exported wrapper function
export async function generateSiteContent(input: GenerateSiteContentInput): Promise<GenerateSiteContentOutput> {
  return generateSiteContentFlow(input);
}
