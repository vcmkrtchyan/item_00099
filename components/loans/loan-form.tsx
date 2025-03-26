"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import type { Loan } from "@/hooks/use-loans"
import { useLibrary } from "@/context/library-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Calendar, Info, BookOpen, History } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { SimpleDatePicker } from "@/components/ui/simple-date-picker"
import { toast } from "sonner"

interface LoanFormProps {
  loanId?: string
  initialBookId?: string
}

export function LoanForm({ loanId, initialBookId = "" }: LoanFormProps) {
  const router = useRouter()
  const { getLoan, addLoan, updateLoan, books, getBook, loans, isBookAvailableForPeriod, isBookCurrentlyLoaned } =
    useLibrary()

  // Store the original loan data for comparison
  const originalLoanRef = useRef<Omit<Loan, "id"> | null>(null)

  // Track if we're in edit mode
  const isEditMode = !!loanId

  // Track if this is a future loan
  const [isFutureLoan, setIsFutureLoan] = useState(false)

  // Track if this is a historical loan
  const [isHistoricalLoan, setIsHistoricalLoan] = useState(false)

  // Track if the selected book is currently on loan
  const [selectedBookOnLoan, setSelectedBookOnLoan] = useState(false)

  // Track conflicting loans for display
  const [conflictingLoans, setConflictingLoans] = useState<string>("")

  // Calendar open state for loanDate and dueDate
  const [loanDateCalendarOpen, setLoanDateCalendarOpen] = useState(false)
  const [dueDateCalendarOpen, setDueDateCalendarOpen] = useState(false)

  // Create a dynamic schema function
  const createLoanSchema = (bookId: string) => {
    // Get the book to check its publishing date
    const book = bookId ? getBook(bookId) : null
    const publishingDate = book?.publishedDate || "1900-01-01"

    return z
      .object({
        bookId: z.string({
          required_error: "Please select a book",
        }),
        borrower: z
          .string({
            required_error: "Borrower name is required",
          })
          .min(1, "Borrower name is required"),
        loanDate: z
          .string({
            required_error: "Loan date is required",
          })
          .refine(
            (date) => {
              if (!date) return false
              const loanDateObj = new Date(date)
              const publishingDateObj = new Date(publishingDate)
              return loanDateObj >= publishingDateObj
            },
            {
              message: `Loan date cannot be before the book's publishing date (${publishingDate})`,
            },
          ),
        dueDate: z.string({
          required_error: "Due date is required",
        }),
      })
      .refine(
        (data) => {
          if (!data.loanDate || !data.dueDate) return true
          const loanDateObj = new Date(data.loanDate)
          const dueDateObj = new Date(data.dueDate)
          return loanDateObj <= dueDateObj
        },
        {
          message: "Loan date cannot be after due date",
          path: ["dueDate"],
        },
      )
      .refine(
        (data) => {
          if (!data.bookId || !data.loanDate || !data.dueDate) return true

          // Skip this check if we're editing the current loan
          if (isEditMode && form.getValues("bookId") === originalLoanRef.current?.bookId) return true

          // Check if this is a historical loan
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          const loanDateObj = new Date(data.loanDate)
          loanDateObj.setHours(0, 0, 0, 0)

          const dueDateObj = new Date(data.dueDate)
          dueDateObj.setHours(0, 0, 0, 0)

          const isHistoricalLoan = loanDateObj < today && dueDateObj < today

          // If the book is currently on loan and this is not a historical loan,
          // ensure the loan date is in the future
          if (isBookCurrentlyLoaned(data.bookId) && !isHistoricalLoan) {
            return loanDateObj > today
          }

          return true
        },
        {
          message: "This book is currently on loan. You can only schedule a future loan or add a historical record.",
          path: ["loanDate"],
        },
      )
      .refine(
        (data) => {
          if (!data.bookId || !data.loanDate || !data.dueDate) return true
          return isBookAvailableForPeriod(data.bookId, data.loanDate, data.dueDate, loanId)
        },
        {
          message: "This book is already loaned during part of this period",
          path: ["loanDate"],
        },
      )
  }

  // Initialize form with default schema
  const form = useForm<z.infer<ReturnType<typeof createLoanSchema>>>({
    resolver: zodResolver(createLoanSchema(initialBookId || "")),
    defaultValues: {
      bookId: initialBookId || "",
      borrower: "",
      loanDate: new Date().toISOString().split("T")[0],
      dueDate: "",
    },
  })

  // Update the schema when the book changes
  useEffect(() => {
    const bookId = form.getValues("bookId")
    if (bookId) {
      form.clearErrors()
      form.setError("root", { message: "" })
      form.trigger()
    }
  }, [form.watch("bookId")])

  // Load existing loan data if in edit mode
  useEffect(() => {
    if (loanId) {
      const loan = getLoan(loanId)
      if (loan) {
        const loanData = {
          bookId: loan.bookId,
          borrower: loan.borrower,
          loanDate: loan.loanDate,
          dueDate: loan.dueDate,
        }

        // Reset form with loan data
        form.reset(loanData)

        // Store the original data for comparison
        originalLoanRef.current = {
          ...loanData,
          returnDate: loan.returnDate,
          returned: loan.returned,
        }

        // Check if this is a future loan
        checkIfFutureLoan(loan.loanDate)

        // Check if this is a historical loan
        checkIfHistoricalLoan(loan.loanDate, loan.dueDate)

        // Update the form resolver with the correct book ID
        form.clearErrors()
        form.setError("root", { message: "" })
      }
    }
  }, [loanId, getLoan])

  // Check if the loan date is in the future
  const checkIfFutureLoan = (loanDate: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const loanDateObj = new Date(loanDate)
    loanDateObj.setHours(0, 0, 0, 0)

    setIsFutureLoan(loanDateObj.getTime() > today.getTime())
  }

  // Check if both loan date and due date are in the past
  const checkIfHistoricalLoan = (loanDate: string, dueDate: string) => {
    if (!loanDate || !dueDate) {
      setIsHistoricalLoan(false)
      return
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const loanDateObj = new Date(loanDate)
    loanDateObj.setHours(0, 0, 0, 0)

    const dueDateObj = new Date(dueDate)
    dueDateObj.setHours(0, 0, 0, 0)

    setIsHistoricalLoan(loanDateObj.getTime() < today.getTime() && dueDateObj.getTime() < today.getTime())
  }

  // Find conflicting loans and return details for display
  const findConflictingLoans = (bookId: string, startDate: string, endDate: string) => {
    if (!bookId || !startDate || !endDate) return []

    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()

    // Get today's date to determine if we're checking a historical loan
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const isHistoricalPeriod = new Date(endDate).getTime() < today.getTime()

    return loans.filter((loan) => {
      // Skip the loan being edited
      if (loanId && loan.id === loanId) return false

      // Skip loans for other books
      if (loan.bookId !== bookId) return false

      // For historical loans, we need to check against all loans (including returned ones)
      // For current/future loans, we only need to check against non-returned loans
      if (!isHistoricalPeriod && loan.returned) return false

      const loanStart = new Date(loan.loanDate).getTime()
      const loanEnd = new Date(loan.dueDate).getTime()

      // Check if date ranges overlap
      return start <= loanEnd && end >= loanStart
    })
  }

  // Handle date changes
  const handleDateChange = (name: "loanDate" | "dueDate", value: string) => {
    form.setValue(name, value)
    form.trigger(name)

    // Check if this is a future loan when loan date changes
    if (name === "loanDate") {
      checkIfFutureLoan(value)
    }

    // Check if this is a historical loan
    const loanDate = name === "loanDate" ? value : form.getValues("loanDate")
    const dueDate = name === "dueDate" ? value : form.getValues("dueDate")

    if (loanDate && dueDate) {
      checkIfHistoricalLoan(loanDate, dueDate)

      // Check for conflicting loans
      const bookId = form.getValues("bookId")
      if (bookId) {
        const conflicts = findConflictingLoans(bookId, loanDate, dueDate)

        if (conflicts.length > 0) {
          // Format the dates of conflicting loans for display
          const conflictDetails = conflicts
            .map((loan) => {
              const status = loan.returned ? " (historical)" : ""
              return `${loan.borrower}: ${loan.loanDate} to ${loan.dueDate}${status}`
            })
            .join(", ")

          setConflictingLoans(conflictDetails)
        } else {
          setConflictingLoans("")
        }
      }
    }
  }

  // Handle book selection
  const handleBookSelect = (value: string) => {
    form.setValue("bookId", value)
    form.trigger("bookId")

    // Check if the selected book is currently on loan
    setSelectedBookOnLoan(isBookCurrentlyLoaned(value))

    // Update the form resolver with the new book ID
    form.clearErrors()
  }

  // Form submission handler
  const onSubmit = (data: z.infer<ReturnType<typeof createLoanSchema>>) => {
    // Don't allow updating returned loans
    if (loanId) {
      const existingLoan = getLoan(loanId)
      if (existingLoan?.returned) {
        return
      }

      // When updating, preserve the original returned status
      // This ensures the return status can't be changed during edit
      if (existingLoan) {
        updateLoan(loanId, {
          ...data,
          returned: existingLoan.returned,
          returnDate: existingLoan.returnDate,
        })

        // Add toast notification for loan update
        const book = getBook(data.bookId)
        toast(`Loan for "${book?.title || "book"}" has been updated`)
      }
    } else {
      // For new loans, check if it's a historical loan (both dates in the past)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const loanDateObj = new Date(data.loanDate)
      loanDateObj.setHours(0, 0, 0, 0)

      const dueDateObj = new Date(data.dueDate)
      dueDateObj.setHours(0, 0, 0, 0)

      const isHistoricalLoan = loanDateObj < today && dueDateObj < today

      const book = getBook(data.bookId)

      if (isHistoricalLoan) {
        // For historical loans, automatically mark as returned
        // Use the due date as the return date
        addLoan({
          ...data,
          returned: true,
          returnDate: data.dueDate,
        })

        // Add toast notification for historical loan
        toast(`Historical loan for "${book?.title || "book"}" has been added`)
      } else {
        // For current or future loans, use the standard process
        addLoan({
          ...data,
          returned: false,
          returnDate: null,
        })

        // Add toast notification for new loan
        if (loanDateObj > today) {
          toast(`Future loan for "${book?.title || "book"}" has been scheduled`)
        } else {
          toast(`"${book?.title || "Book"}" has been loaned to ${data.borrower}`)
        }
      }
    }

    router.push("/loans")
  }

  // Filter available books
  const availableBooks = books.filter((book) => {
    if (loanId) {
      const loan = getLoan(loanId)
      if (loan && loan.bookId === book.id) {
        return true // Include the current book when editing
      }
    }

    // Include all books - we'll validate dates later
    return true
  })

  const selectedBook = form.watch("bookId") ? getBook(form.watch("bookId")) : null

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>{loanId ? "Edit Loan" : "Create New Loan"}</CardTitle>
            <CardDescription>{loanId ? "Update the loan details" : "Enter the details for a new loan"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isFutureLoan && (
              <Alert className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
                <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <AlertTitle className="text-purple-700 dark:text-purple-300">Future Loan</AlertTitle>
                <AlertDescription className="text-purple-600 dark:text-purple-400">
                  This loan is scheduled for a future date. The book will remain available until the loan date.
                </AlertDescription>
              </Alert>
            )}

            {isHistoricalLoan && !isEditMode && (
              <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                <History className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle className="text-amber-700 dark:text-amber-300">Historical Loan</AlertTitle>
                <AlertDescription className="text-amber-600 dark:text-amber-400">
                  You're adding a historical loan record. This loan will automatically be marked as returned.
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="bookId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    Book <span className="text-destructive ml-1">*</span>
                  </FormLabel>
                  {isEditMode ? (
                    // In edit mode, show the book as non-editable text
                    <div className="p-2 border rounded-md bg-muted">
                      {selectedBook ? `${selectedBook.title} by ${selectedBook.author}` : "Unknown Book"}
                    </div>
                  ) : (
                    // In create mode, show the book selector
                    <Select
                      disabled={!!initialBookId}
                      onValueChange={(value) => {
                        field.onChange(value)
                        handleBookSelect(value)
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger id="book-select">
                          <SelectValue placeholder="Select a book" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableBooks.length > 0 ? (
                          availableBooks.map((book) => {
                            const isOnLoan = isBookCurrentlyLoaned(book.id)
                            return (
                              <SelectItem key={book.id} value={book.id}>
                                <div className="flex items-center">
                                  <span>
                                    {book.title} by {book.author}
                                  </span>
                                  {isOnLoan && (
                                    <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 flex items-center">
                                      <BookOpen className="h-3 w-3 mr-1" />
                                      Currently on loan
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            )
                          })
                        ) : (
                          <div className="p-2 text-center text-muted-foreground">No books found in your library.</div>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                  {selectedBook && (
                    <FormDescription>
                      ISBN: {selectedBook.ISBN}
                      <br />
                      Published: {selectedBook.publishedDate}
                    </FormDescription>
                  )}
                </FormItem>
              )}
            />

            {selectedBookOnLoan && !isEditMode && (
              <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-blue-700 dark:text-blue-300">Book Currently On Loan</AlertTitle>
                <AlertDescription className="text-blue-600 dark:text-blue-400">
                  This book is currently on loan. You can schedule a future loan by selecting a loan date after the
                  current loan ends, or add a historical loan record with both dates in the past.
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="borrower"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    Borrower <span className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="loanDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    Loan Date <span className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <SimpleDatePicker
                      date={field.value ? new Date(field.value) : undefined}
                      onDateChange={(date) => {
                        if (date) {
                          const dateString = date.toISOString().split("T")[0]
                          field.onChange(dateString)
                          handleDateChange("loanDate", dateString)
                        }
                      }}
                      minDate={selectedBook ? new Date(selectedBook.publishedDate) : undefined}
                      placeholder="Select loan date"
                    />
                  </FormControl>
                  <FormMessage />
                  {selectedBook && (
                    <FormDescription>
                      Cannot be earlier than the book's publishing date ({selectedBook.publishedDate})
                    </FormDescription>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    Due Date <span className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <SimpleDatePicker
                      date={field.value ? new Date(field.value) : undefined}
                      onDateChange={(date) => {
                        if (date) {
                          const dateString = date.toISOString().split("T")[0]
                          field.onChange(dateString)
                          handleDateChange("dueDate", dateString)
                        }
                      }}
                      minDate={form.getValues("loanDate") ? new Date(form.getValues("loanDate")) : undefined}
                      placeholder="Select due date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {conflictingLoans && (
              <Alert variant="destructive" id="date-conflict-error" className="animate-fadeIn">
                <Info className="h-4 w-4" />
                <AlertTitle>Date Conflict</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 text-sm">
                    <p className="font-medium">Conflicting loans:</p>
                    <p>{conflictingLoans}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isEditMode && !form.formState.isDirty}>
              {loanId ? "Update Loan" : "Create Loan"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}

