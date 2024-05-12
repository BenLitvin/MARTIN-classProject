import React from 'react';
import { createStreamableUI, createStreamableValue } from 'ai/rsc';
import { ExperimentalMessage, experimental_streamText } from 'ai';
import { Section } from '@/components/section';
import { BotMessage } from '@/components/message';
import { OpenAI } from '@ai-sdk/openai';

export async function writer(
  uiStream: ReturnType<typeof createStreamableUI>,
  streamText: ReturnType<typeof createStreamableValue<string>>,
  messages: ExperimentalMessage[]
) {
  const openai = new OpenAI({
    baseUrl: process.env.SPECIFIC_API_BASE,
    apiKey: process.env.SPECIFIC_API_KEY,
    organization: '' // Optional, specify if needed
  });

  let fullResponse = '';
  // Append the initial answer section to the UI stream
  uiStream.append(
    <Section title="Answer">
      <BotMessage content={streamText.value} />
    </Section>
  );

  try {
    const result = await experimental_streamText({
      model: openai.chat(process.env.SPECIFIC_API_MODEL || 'llama3-70b-8192'),
      maxTokens: 2500,
      system: `Your system configuration for MARTIN's dialogue interactions...`, // Put your system dialogue description here
      messages
    });

    // Stream and update responses as they are received
    for await (const text of result.textStream) {
      if (text) {
        fullResponse += text;
        streamText.update(fullResponse);
      }
    }
  } catch (error) {
    console.error('Error during text streaming:', error);
    uiStream.append(
      <Section title="Error">
        <BotMessage content={`An error occurred: ${error.message}`} />
      </Section>
    );
  } finally {
    streamText.done(); // Mark the streamable text as completed
  }

  return fullResponse;
}
