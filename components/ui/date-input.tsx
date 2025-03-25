"use client"

import type React from "react"

import { forwardRef } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onDateChange?: (date: string) => void
  readOnly?: boolean
}

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, onDateChange, readOnly, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (readOnly) return

      if (props.onChange) {
        props.onChange(e)
      }
      if (onDateChange) {
        onDateChange(e.target.value)
      }
    }

    // Style the date input to hide the default calendar icon
    // and add our own that covers the entire input
    return (
      <div className={cn("relative", className)}>
        <Input
          ref={ref}
          type="date"
          onChange={handleChange}
          className={cn(
            readOnly ? "bg-muted cursor-not-allowed" : "cursor-pointer",
            // Hide the default calendar icon in various browsers
            "[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer",
            "[&::-webkit-date-and-time-value]:w-full",
          )}
          readOnly={readOnly}
          {...props}
        />
      </div>
    )
  },
)

DateInput.displayName = "DateInput"

export { DateInput }

