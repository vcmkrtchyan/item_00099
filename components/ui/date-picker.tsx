"use client"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  setDate: (date?: Date) => void
  disabled?: boolean
  placeholder?: string
  minDate?: Date
  maxDate?: Date
}

export function DatePicker({
  date,
  setDate,
  disabled,
  placeholder = "Pick a date",
  minDate,
  maxDate,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button" // Important: prevents form submission
          variant={"outline"}
          className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          disabled={(calendarDate) => {
            // Disable dates outside the min/max range
            if (minDate && calendarDate < new Date(minDate.setHours(0, 0, 0, 0))) {
              return true
            }
            if (maxDate && calendarDate > new Date(maxDate.setHours(23, 59, 59, 999))) {
              return true
            }
            return false
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

