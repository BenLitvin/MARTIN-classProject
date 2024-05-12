'use client'

import { cn } from '@/lib/utils'

function IconLogo({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      fill="currentColor"
      viewBox="0 0 256 256"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-4 w-4', className)}
      {...props}
    >
      <circle cx="128" cy="128" r="128" fill="pink"></circle>
      
      <circle cx="50" cy="50" r="15" fill="blue"></circle>
      <circle cx="50" cy="100" r="15" fill="blue"></circle>
      <circle cx="50" cy="150" r="15" fill="blue"></circle>
      <circle cx="50" cy="175" r="15" fill="blue"></circle>

      <circle cx="200" cy="50" r="15" fill="blue"></circle>
      <circle cx="200" cy="100" r="15" fill="blue"></circle>
      <circle cx="200" cy="150" r="15" fill="blue"></circle>
      <circle cx="200" cy="175" r="15" fill="blue"></circle>

      <circle cx="100" cy="95" r="18" fill="blue"></circle>
      <circle cx="150" cy="95" r="18" fill="blue"></circle>
      <circle cx="200" cy="95" r="18" fill="blue"></circle>

      <circle cx="125" cy="125" r="18" fill="blue"></circle>


    </svg>
  )
}

export { IconLogo }
