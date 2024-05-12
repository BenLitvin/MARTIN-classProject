import { createStreamableUI, createStreamableValue } from 'ai/rsc'
import {
  ExperimentalMessage,
  ToolCallPart,
  ToolResultPart,
  experimental_streamText
} from 'ai'
import { searchSchema } from '@/lib/schema/search'
import { Section } from '@/components/section'
import { OpenAI } from '@ai-sdk/openai'
import { BotMessage } from '@/components/message'
import Exa from 'exa-js'
import { Card } from '@/components/ui/card'
import { SearchResults } from '../types'
import { SearchSection } from '@/components/search-section'

export async function researcher(
  uiStream: ReturnType<typeof createStreamableUI>,
  streamText: ReturnType<typeof createStreamableValue<string>>,
  messages: ExperimentalMessage[],
  useSpecificModel?: boolean
) {
  const openai = new OpenAI({
    baseUrl: process.env.OPENAI_API_BASE, // optional base URL for proxies etc.
    apiKey: process.env.OPENAI_API_KEY, // optional API key, default to env property OPENAI_API_KEY
    organization: '' // optional organization
  })

  const searchAPI: 'tavily' | 'exa' = 'tavily'

  let fullResponse = ''
  let hasError = false
  const answerSection = (
    <Section title="Answer">
      <BotMessage content={streamText.value} />
    </Section>
  )

  let isFirstToolResponse = true
  const result = await experimental_streamText({
    model: openai.chat(process.env.OPENAI_API_MODEL || 'gpt-4-turbo'),
    maxTokens: 2500,
    system: `Objective: Guide MARTIN in conducting empathetic and thorough medical consultations, emphasizing a methodical approach in gathering information through a structured dialogue.
    Role of MARTIN
    
    Function: Serve as an AI medical assistant tasked with assessing user-reported symptoms by asking detailed, one-at-a-time questions, summarizing information, and providing medically sound advice.
    Communication Style: Maintain a tone that is professional, patient, and empathetic throughout the interaction.
    Dialogue Structure
    
    Initial Greeting and Query Reception:
    MARTIN: Begins with a welcoming greeting and an open-ended question to prompt the user to state their health concern.
    Sequential Questioning:
    Guideline: MARTIN should ask questions in a logical order, focusing on one symptom or related detail at a time. Wait for the user’s response before proceeding to the next question.
    Example: After the user mentions a symptom, MARTIN asks about the location, nature of the pain, duration, and then other associated symptoms or triggers.
    Summarization of Information:
    MARTIN: After gathering details, summarize the key points to confirm accuracy with the user. This ensures both parties agree on the discussed symptoms and conditions before proceeding.
    Example: "You mentioned a dull headache at the back of your head that started four hours ago, possibly worsened by stress. You've taken Advil, which provided slight relief."
    Medical Advice:
    Providing Advice: Based on the information gathered and summarized, MARTIN provides actionable medical advice, tailored to the symptoms and user responses.
    Proactive Support: Encourage the user to monitor their condition and suggest when to seek further medical consultation.
    Example: "Considering your symptoms, you might be experiencing a tension headache... If the pain persists or worsens, or if you start to experience new symptoms, please consult with a healthcare professional."
    Encouragement of Further Questions:
    MARTIN: Offer the user an opportunity to ask additional questions or express any other concerns, reinforcing the AI’s role as a supportive assistant.
    Example: "Do you have any other questions or is there anything else I can assist you with today?"
    Conclusion and Follow-Up
    
    MARTIN: Conclude the conversation by reminding the user of the importance of their health and the availability of MARTIN for future inquiries.
    Example: "Remember, taking care of your health is important, and I'm here to help whenever you need. Feel free to return if you have more questions in the future."
    Additional Recommendations
    
    Follow-Up Mechanism: Suggest ways the user can follow up on their condition, such as using a symptom diary or mobile app for tracking.
    Stress Management Resources: Provide links or suggestions for stress management techniques that could help alleviate symptoms associated with stress-related conditions.
    
    Instructions for Handling Non-Medical Questions
    Recognize the Off-Topic Question
    
    MARTIN: Quickly identify that the question is unrelated to its medical expertise.
    Respond with Politeness and Humor
    
    Response Strategy: Politely acknowledge the off-topic question, add a joke or humorous remark to keep the tone light, and then steer the conversation back to medical issues.`,
    messages,
    tools: {
      search: {
        description: 'Search the web for information',
        parameters: searchSchema,
        execute: async ({
          query,
          max_results,
          search_depth
        }: {
          query: string
          max_results: number
          search_depth: 'basic' | 'advanced'
        }) => {
          // If this is the first tool response, remove spinner
          if (isFirstToolResponse) {
            isFirstToolResponse = false
            uiStream.update(null)
          }
          // Append the search section
          const streamResults = createStreamableValue<string>()
          uiStream.append(<SearchSection result={streamResults.value} />)

          // Tavily API requires a minimum of 5 characters in the query
          const filledQuery =
            query.length < 5 ? query + ' '.repeat(5 - query.length) : query
          let searchResult
          try {
            searchResult =
              searchAPI === 'tavily'
                ? await tavilySearch(filledQuery, max_results, search_depth)
                : await exaSearch(query)
          } catch (error) {
            console.error('Search API error:', error)
            hasError = true
          }

          if (hasError) {
            fullResponse += `\nAn error occurred while searching for "${query}.`
            uiStream.update(
              <Card className="p-4 mt-2 text-sm">
                {`An error occurred while searching for "${query}".`}
              </Card>
            )
            return searchResult
          }

          streamResults.done(JSON.stringify(searchResult))

          return searchResult
        }
      }
    }
  })

  const toolCalls: ToolCallPart[] = []
  const toolResponses: ToolResultPart[] = []
  for await (const delta of result.fullStream) {
    switch (delta.type) {
      case 'text-delta':
        if (delta.textDelta) {
          // If the first text delata is available, add a ui section
          if (fullResponse.length === 0 && delta.textDelta.length > 0) {
            // Update the UI
            uiStream.update(answerSection)
          }

          fullResponse += delta.textDelta
          streamText.update(fullResponse)
        }
        break
      case 'tool-call':
        toolCalls.push(delta)
        break
      case 'tool-result':
        // Append the answer section if the specific model is not used
        if (!useSpecificModel && toolResponses.length === 0) {
          uiStream.append(answerSection)
        }
        toolResponses.push(delta)
        break
      case 'error':
        hasError = true
        fullResponse += `\nError occurred while executing the tool`
        break
    }
  }
  messages.push({
    role: 'assistant',
    content: [{ type: 'text', text: fullResponse }, ...toolCalls]
  })

  if (toolResponses.length > 0) {
    // Add tool responses to the messages
    messages.push({ role: 'tool', content: toolResponses })
  }

  return { result, fullResponse, hasError, toolResponses }
}

async function tavilySearch(
  query: string,
  maxResults: number = 10,
  searchDepth: 'basic' | 'advanced' = 'basic'
): Promise<any> {
  const apiKey = process.env.TAVILY_API_KEY
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: maxResults < 5 ? 5 : maxResults,
      search_depth: searchDepth,
      include_images: true,
      include_answers: true
    })
  })

  if (!response.ok) {
    throw new Error(`Error: ${response.status}`)
  }

  const data = await response.json()
  return data
}

async function exaSearch(query: string, maxResults: number = 10): Promise<any> {
  const apiKey = process.env.EXA_API_KEY
  const exa = new Exa(apiKey)
  return exa.searchAndContents(query, {
    highlights: true,
    numResults: maxResults
  })
}
