"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"

interface SimpleDatePickerProps {
  date?: Date
  onDateChange: (date?: Date) => void
  disabled?: boolean
  placeholder?: string
  minDate?: Date
  maxDate?: Date
}

export function SimpleDatePicker({
  date,
  onDateChange,
  disabled,
  placeholder = "Pick a date",
  minDate,
  maxDate,
}: SimpleDatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  // Close the calendar when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant={"outline"}
        className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
        disabled={disabled}
        onClick={() => setOpen(!open)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {date ? format(date, "PPP") : <span>{placeholder}</span>}
      </Button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 bg-popover rounded-md border shadow-md">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(date) => {
              onDateChange(date)
              setOpen(false)
            }}
            disabled={(date) => {
              if (minDate && date < minDate) return true
              if (maxDate && date > maxDate) return true
              return false
            }}
            initialFocus
          />
        </div>
      )}
    </div>
  )
}

