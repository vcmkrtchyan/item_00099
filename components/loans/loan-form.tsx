"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import type { Loan } from "@/hooks/use-loans"
import { useLibrary } from "@/context/library-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateInput } from "@/components/ui/date-input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Calendar, Info, BookOpen, History } from "lucide-react"
import { z } from "zod"

interface LoanFormProps {
  loanId?: string
  initialBookId?: string
}

export function LoanForm({ loanId, initialBookId = "" }: LoanFormProps) {
  const router = useRouter()
  const { getLoan, addLoan, updateLoan, books, getBook, loans, isBookAvailableForPeriod, isBookCurrentlyLoaned } =
    useLibrary()

  const [formData, setFormData] = useState<Omit<Loan, "id">>({
    bookId: initialBookId,
    borrower: "",
    loanDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    returnDate: null,
    returned: false,
  })

  // Store the original loan data for comparison
  const originalLoanRef = useRef<Omit<Loan, "id"> | null>(null)

  // Track if form has been modified
  const [isModified, setIsModified] = useState(false)

  // Add validation state
  const [errors, setErrors] = useState<{
    bookId?: string
    borrower?: string
    loanDate?: string
    dueDate?: string
    dateConflict?: string
    dateConflictDetails?: string
  }>({})

  // Track if form has been submitted once (for validation display)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Track if we're in edit mode
  const isEditMode = !!loanId

  // Track if this is a future loan
  const [isFutureLoan, setIsFutureLoan] = useState(false)

  // Track if this is a historical loan
  const [isHistoricalLoan, setIsHistoricalLoan] = useState(false)

  // Track if the selected book is currently on loan
  const [selectedBookOnLoan, setSelectedBookOnLoan] = useState(false)

  useEffect(() => {
    if (loanId) {
      const loan = getLoan(loanId)
      if (loan) {
        const loanData = {
          bookId: loan.bookId,
          borrower: loan.borrower,
          loanDate: loan.loanDate,
          dueDate: loan.dueDate,
          returnDate: loan.returnDate,
          returned: loan.returned,
        }

        setFormData(loanData)

        // Store the original data for comparison
        originalLoanRef.current = { ...loanData }

        // Reset modified state
        setIsModified(false)

        // Check if this is a future loan
        checkIfFutureLoan(loan.loanDate)

        // Check if this is a historical loan
        checkIfHistoricalLoan(loan.loanDate, loan.dueDate)
      }
    }
  }, [loanId, getLoan])

  // Check if form data has been modified
  useEffect(() => {
    if (isEditMode && originalLoanRef.current) {
      // Compare current form data with original data
      const isChanged =
        formData.borrower !== originalLoanRef.current.borrower ||
        formData.loanDate !== originalLoanRef.current.loanDate ||
        formData.dueDate !== originalLoanRef.current.dueDate

      setIsModified(isChanged)
    } else if (!isEditMode) {
      // In create mode, enable button if required fields are filled
      setIsModified(!!formData.bookId && !!formData.borrower && !!formData.loanDate && !!formData.dueDate)
    }
  }, [formData, isEditMode])

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error for this field
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  // Update the handleDateChange function to validate date conflicts immediately
  const handleDateChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear any existing date errors
    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
      dateConflict: undefined,
    }))

    // Check if this is a future loan when loan date changes
    if (name === "loanDate") {
      checkIfFutureLoan(value)
    }

    // Validate date range when both dates are set
    if (formData.bookId && ((name === "loanDate" && formData.dueDate) || (name === "dueDate" && formData.loanDate))) {
      const loanDate = name === "loanDate" ? value : formData.loanDate
      const dueDate = name === "dueDate" ? value : formData.dueDate

      // Check if this is a historical loan
      checkIfHistoricalLoan(loanDate, dueDate)

      validateDateRange(formData.bookId, loanDate, dueDate)
    }
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

  // Add a helper function to check for date conflicts and provide feedback
  const checkDateConflicts = (bookId: string) => {
    if (!bookId || !formData.loanDate || !formData.dueDate) return

    // Check if the selected dates conflict with existing loans
    if (!isBookAvailableForPeriod(bookId, formData.loanDate, formData.dueDate, loanId)) {
      setErrors((prev) => ({
        ...prev,
        dateConflict: "These dates conflict with an existing loan for this book",
      }))

      // Find the conflicting loans to show details
      const conflictingLoans = findConflictingLoans(bookId, formData.loanDate, formData.dueDate)

      if (conflictingLoans.length > 0) {
        // Format the dates of conflicting loans for display
        const conflictDetails = conflictingLoans
          .map((loan) => {
            const status = loan.returned ? " (historical)" : ""
            return `${loan.borrower}: ${loan.loanDate} to ${loan.dueDate}${status}`
          })
          .join(", ")

        setErrors((prev) => ({
          ...prev,
          dateConflictDetails: conflictDetails,
        }))
      }
    } else {
      // Clear conflict errors if no conflicts
      setErrors((prev) => ({
        ...prev,
        dateConflict: undefined,
        dateConflictDetails: undefined,
      }))
    }
  }

  // Update the handleSelectChange function to check for date conflicts when a book is selected
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when value is selected
    if (name === "bookId" && value) {
      setErrors((prev) => ({ ...prev, bookId: undefined }))

      // Check if the selected book is currently on loan
      setSelectedBookOnLoan(isBookCurrentlyLoaned(value))

      // Check for date conflicts if we have both dates
      if (formData.loanDate && formData.dueDate) {
        validateDateRange(value, formData.loanDate, formData.dueDate)
      }
    }
  }

  // Validate that the loan date is not after the due date
  const validateDateRange = (bookId: string, loanDate: string, dueDate: string): boolean => {
    const loanDateObj = new Date(loanDate)
    const dueDateObj = new Date(dueDate)

    // Get the book to check its publishing date
    const book = getBook(bookId)
    if (!book) return false

    // Check if loan date is before the book's publishing date
    const publishingDateObj = new Date(book.publishedDate)
    publishingDateObj.setHours(0, 0, 0, 0)

    if (loanDateObj < publishingDateObj) {
      setErrors((prev) => ({
        ...prev,
        dateConflict: `Loan date cannot be before the book's publishing date (${book.publishedDate})`,
      }))
      return false
    }

    // Check if loan date is after due date
    if (loanDateObj > dueDateObj) {
      setErrors((prev) => ({
        ...prev,
        dateConflict: "Loan date cannot be after due date",
      }))
      return false
    }

    // If the book is currently on loan, ensure the loan date is in the future
    // But skip this check if we're editing the current loan for this book
    // OR if this is a historical loan (both loan date and due date are in the past)
    if (isBookCurrentlyLoaned(bookId) && !(isEditMode && formData.bookId === bookId)) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Check if this is a historical loan (both dates in the past)
      const isHistoricalLoan = loanDateObj < today && dueDateObj < today

      // Only apply the restriction for non-historical loans
      if (loanDateObj <= today && !isHistoricalLoan) {
        setErrors((prev) => ({
          ...prev,
          dateConflict:
            "This book is currently on loan. You can only schedule a future loan or add a historical record.",
        }))
        return false
      }
    }

    // Check for conflicts with existing loans
    // Skip checking against the current loan in edit mode
    if (!isBookAvailableForPeriod(bookId, loanDate, dueDate, loanId)) {
      setErrors((prev) => ({
        ...prev,
        dateConflict: "This book is already loaned during part of this period",
      }))

      // Find and display conflicting loans
      const conflictingLoans = findConflictingLoans(bookId, loanDate, dueDate)

      if (conflictingLoans.length > 0) {
        // Format the dates of conflicting loans for display
        const conflictDetails = conflictingLoans
          .map((loan) => {
            const status = loan.returned ? " (historical)" : ""
            return `${loan.borrower}: ${loan.loanDate} to ${loan.dueDate}${status}`
          })
          .join(", ")

        setErrors((prev) => ({
          ...prev,
          dateConflictDetails: conflictDetails,
        }))
      }

      return false
    }

    // Clear any existing date conflict errors
    setErrors((prev) => ({
      ...prev,
      dateConflict: undefined,
      dateConflictDetails: undefined,
    }))

    return true
  }

  // Create a Zod schema for form validation
  const createLoanSchema = (bookId: string) => {
    // Get the book to check its publishing date
    const book = bookId ? getBook(bookId) : null
    const publishingDate = book?.publishedDate || "1900-01-01"

    return z
      .object({
        bookId: z.string().min(1, "Please select a book"),
        borrower: z.string().min(1, "Borrower name is required"),
        loanDate: z
          .string()
          .min(1, "Loan date is required")
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
        dueDate: z.string().min(1, "Due date is required"),
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
          path: ["dateConflict"],
        },
      )
      .refine(
        (data) => {
          if (!data.bookId || !data.loanDate || !data.dueDate) return true

          // Skip this check if we're editing the current loan
          if (isEditMode && data.bookId === formData.bookId) return true

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
          path: ["dateConflict"],
        },
      )
      .refine(
        (data) => {
          if (!data.bookId || !data.loanDate || !data.dueDate) return true
          return isBookAvailableForPeriod(data.bookId, data.loanDate, data.dueDate, loanId)
        },
        {
          message: "This book is already loaned during part of this period",
          path: ["dateConflict"],
        },
      )
  }

  const validateForm = (): boolean => {
    // Create the schema based on current form data
    const schema = createLoanSchema(formData.bookId)

    // Reset errors
    setErrors({})

    try {
      // Validate the form data against the schema
      schema.parse(formData)

      // If we get here, validation passed
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Convert Zod errors to our error format
        const newErrors: Record<string, string> = {}

        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            const path = err.path[0].toString()
            newErrors[path] = err.message
          }
        })

        // If we have a date conflict, check for conflicting loans to show details
        if (newErrors.dateConflict && formData.bookId && formData.loanDate && formData.dueDate) {
          const conflictingLoans = findConflictingLoans(formData.bookId, formData.loanDate, formData.dueDate)

          if (conflictingLoans.length > 0) {
            // Format the dates of conflicting loans for display
            const conflictDetails = conflictingLoans
              .map((loan) => {
                const status = loan.returned ? " (historical)" : ""
                return `${loan.borrower}: ${loan.loanDate} to ${loan.dueDate}${status}`
              })
              .join(", ")

            newErrors.dateConflictDetails = conflictDetails
          }
        }

        setErrors(newErrors)
      }

      return false
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitted(true)

    // Validate the form
    if (!validateForm()) {
      // Focus the first error field
      if (errors.bookId && !isEditMode) {
        document.getElementById("book-select")?.focus()
      } else if (errors.borrower) {
        document.getElementById("borrower")?.focus()
      } else if (errors.dateConflict) {
        // Scroll to the date conflict error
        const errorElement = document.getElementById("date-conflict-error")
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }
      return
    }

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
          ...formData,
          returned: existingLoan.returned,
          returnDate: existingLoan.returnDate,
        })
      }
    } else {
      // For new loans, check if it's a historical loan (both dates in the past)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const loanDateObj = new Date(formData.loanDate)
      loanDateObj.setHours(0, 0, 0, 0)

      const dueDateObj = new Date(formData.dueDate)
      dueDateObj.setHours(0, 0, 0, 0)

      const isHistoricalLoan = loanDateObj < today && dueDateObj < today

      if (isHistoricalLoan) {
        // For historical loans, automatically mark as returned
        // Use the due date as the return date
        addLoan({
          ...formData,
          returned: true,
          returnDate: formData.dueDate,
        })
      } else {
        // For current or future loans, use the standard process
        addLoan(formData)
      }
    }

    router.push("/loans")
  }

  // Update the availableBooks filtering logic to include ALL books, even those currently on loan
  // We'll handle the validation of dates separately
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

  const selectedBook = formData.bookId ? getBook(formData.bookId) : null

  return (
    <Card>
      <form onSubmit={handleSubmit} noValidate>
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

          <div className="space-y-2">
            <Label htmlFor="book-select" className="flex items-center">
              Book <span className="text-destructive ml-1">*</span>
            </Label>
            {isEditMode ? (
              // In edit mode, show the book as non-editable text
              <div className="p-2 border rounded-md bg-muted">
                {selectedBook ? `${selectedBook.title} by ${selectedBook.author}` : "Unknown Book"}
              </div>
            ) : (
              // In create mode, show the book selector
              <>
                <Select
                  value={formData.bookId}
                  onValueChange={(value) => handleSelectChange("bookId", value)}
                  disabled={!!initialBookId}
                  name="bookId"
                >
                  <SelectTrigger
                    id="book-select"
                    className={isSubmitted && errors.bookId ? "border-destructive ring-destructive" : ""}
                  >
                    <SelectValue placeholder="Select a book" />
                  </SelectTrigger>
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
                {isSubmitted && errors.bookId && <p className="text-sm text-destructive mt-1">{errors.bookId}</p>}
              </>
            )}
            {selectedBook && (
              <div className="text-sm text-muted-foreground mt-1">
                <p>ISBN: {selectedBook.ISBN}</p>
                <p>Published: {selectedBook.publishedDate}</p>
              </div>
            )}
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="borrower" className="flex items-center">
              Borrower <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="borrower"
              name="borrower"
              value={formData.borrower}
              onChange={handleChange}
              required
              className={isSubmitted && errors.borrower ? "border-destructive ring-destructive" : ""}
            />
            {isSubmitted && errors.borrower && <p className="text-sm text-destructive mt-1">{errors.borrower}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="loanDate" className="flex items-center">
              Loan Date <span className="text-destructive ml-1">*</span>
            </Label>
            <DateInput
              id="loanDate"
              name="loanDate"
              value={formData.loanDate}
              onChange={handleChange}
              onDateChange={(value) => handleDateChange("loanDate", value)}
              min={selectedBook ? selectedBook.publishedDate : undefined}
              required
              className={isSubmitted && errors.loanDate ? "border-destructive ring-destructive" : ""}
            />
            {isSubmitted && errors.loanDate && <p className="text-sm text-destructive mt-1">{errors.loanDate}</p>}
            {selectedBook && (
              <p className="text-xs text-muted-foreground mt-1">
                Cannot be earlier than the book's publishing date ({selectedBook.publishedDate})
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate" className="flex items-center">
              Due Date <span className="text-destructive ml-1">*</span>
            </Label>
            <DateInput
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              onDateChange={(value) => handleDateChange("dueDate", value)}
              required
              min={formData.loanDate}
              className={isSubmitted && errors.dueDate ? "border-destructive ring-destructive" : ""}
            />
            {isSubmitted && errors.dueDate && <p className="text-sm text-destructive mt-1">{errors.dueDate}</p>}
          </div>

          {(isSubmitted || errors.dateConflict) && errors.dateConflict && (
            <Alert variant="destructive" id="date-conflict-error" className="animate-fadeIn">
              <Info className="h-4 w-4" />
              <AlertTitle>Date Conflict</AlertTitle>
              <AlertDescription>
                {errors.dateConflict}
                {errors.dateConflictDetails && (
                  <div className="mt-2 text-sm">
                    <p className="font-medium">Conflicting loans:</p>
                    <p>{errors.dateConflictDetails}</p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isEditMode && !isModified}>
            {loanId ? "Update Loan" : "Create Loan"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

