import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'



const exampleMessages = [
  {
    heading: 'What are the symptoms of COVID-19?',
    message: 'What are the symptoms of COVID-19?'
  },
  {
    heading: 'How to manage diabetes daily?',
    message: 'How to manage diabetes daily?'
  },
  {
    heading: 'Is the flu shot effective this year?',
    message: 'Is the flu shot effective this year?'
  },
  {
    heading: 'What are the latest treatments for depression?',
    message: 'What are the latest treatments for depression?'
  },
  {
    heading: 'How does telemedicine improve patient care?',
    message: 'How does telemedicine improve patient care?'
  },
  {
    heading: 'Are there new advancements in cancer treatment?',
    message: 'Are there new advancements in cancer treatment?'
  },
  {
    heading: 'What is the best diet for heart disease prevention?',
    message: 'What is the best diet for heart disease prevention?'
  },
  {
    heading: 'How effective are wearable health devices?',
    message: 'How effective are wearable health devices?'
  },
  {
    heading: 'What should you know about seasonal allergies?',
    message: 'What should you know about seasonal allergies?'
  },
  {
    heading: 'Is meditation beneficial for mental health?',
    message: 'Is meditation beneficial for mental health?'
  }
]
export function EmptyScreen({
  submitMessage,
  className
}: {
  submitMessage: (message: string) => void
  className?: string
}) {
  return (
    <div className={`mx-auto w-full transition-all ${className}`}>
      <div className="bg-background p-2">
        <div className="mt-4 flex flex-col items-start space-y-2 mb-4">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="link"
              className="h-auto p-0 text-base"
              name={message.message}
              onClick={async () => {
                submitMessage(message.message)
              }}
            >
              <ArrowRight size={16} className="mr-2 text-muted-foreground" />
              {message.heading}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
