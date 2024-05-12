import { createStreamableUI, createStreamableValue } from 'ai/rsc';
import { ExperimentalMessage, experimental_streamObject } from 'ai';
import { PartialRelated, relatedSchema } from '@/lib/schema/related';
import { Section } from '@/components/section';
import SearchRelated from '@/components/search-related';
import { OpenAI } from '@ai-sdk/openai';
import React from 'react'; // Ensure React is imported for JSX to work

export async function querySuggestor(
  uiStream: ReturnType<typeof createStreamableUI>,
  messages: ExperimentalMessage[]
) {
  const openai = new OpenAI({
    baseUrl: process.env.OPENAI_API_BASE, // Optional base URL for proxies etc.
    apiKey: process.env.OPENAI_API_KEY, // Optional API key, default to env property OPENAI_API_KEY
    organization: '' // Optional organization
  });

  const objectStream = createStreamableValue<PartialRelated>();
  uiStream.append(
    <Section title="Related" separator={true}>
      <SearchRelated relatedQueries={objectStream.value} />
    </Section>
  );

  // First experimental_streamObject call for general medical consultation
  await experimental_streamObject({
    model: openai.chat(process.env.OPENAI_API_MODEL || 'gpt-4-turbo'),
    system: `Objective: Guide MARTIN in conducting empathetic and thorough medical consultations, emphasizing a methodical approach in gathering information through a structured dialogue.`,
    messages,
    schema: relatedSchema
  })
  .then(async result => {
    // Dynamically generate medical queries based on user interaction
    for await (const obj of result.partialObjectStream) {
      objectStream.update({
        related: [
          "Can you describe the type of pain you're experiencing?",
          "How long have you been experiencing these symptoms?",
          "Are there any other symptoms associated with your condition?"
        ]
      });
    }
  })
  .finally(() => {
    objectStream.done();
  });

  // Second experimental_streamObject call for handling specific scenario queries
  await experimental_streamObject({
    model: openai.chat(process.env.OPENAI_API_MODEL || 'gpt-4-turbo'),
    system: `Handling specific scenario related to Starship's third test flight as an example.`,
    messages,
    schema: relatedSchema
  })
  .then(async result => {
    // Initialize with specific example queries related to a hypothetical context (e.g., Starship's third test flight)
    objectStream.update({
      related: [
        "What were the primary objectives achieved during Starship's third test flight?",
        "What factors contributed to the ultimate outcome of Starship's third test flight?",
        "How will the results of the third test flight influence SpaceX's future development plans for Starship?"
      ]
    });
  })
  .finally(() => {
    objectStream.done();
  });
}
