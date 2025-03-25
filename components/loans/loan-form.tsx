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

interface LoanFormProps {
  loanId?: string
  initialBookId?: string
}

export function LoanForm({ loanId, initialBookId = "" }: LoanFormProps) {
  const router = useRouter()
  const { getLoan, addLoan, updateLoan, books, getBook, loans } = useLibrary()

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
  }>({})

  // Track if form has been submitted once (for validation display)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Track if we're in edit mode
  const isEditMode = !!loanId

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when value is selected
    if (name === "bookId" && value) {
      setErrors((prev) => ({ ...prev, bookId: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: { bookId?: string } = {}

    // Validate book selection
    if (!formData.bookId) {
      newErrors.bookId = "Please select a book"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitted(true)

    // Validate the form
    if (!validateForm()) {
      // Focus the first error field
      if (errors.bookId && !isEditMode) {
        document.getElementById("book-select")?.focus()
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
      addLoan(formData)
    }

    router.push("/loans")
  }

  // Filter out books that are already on loan
  const availableBooks = books.filter((book) => {
    if (loanId) {
      const loan = getLoan(loanId)
      if (loan && loan.bookId === book.id) {
        return true // Include the current book when editing
      }
    }

    // Check if the book is already loaned
    const isLoaned = loans.some((loan) => loan.bookId === book.id && !loan.returned && loan.id !== loanId)

    return !isLoaned
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
                      availableBooks.map((book) => (
                        <SelectItem key={book.id} value={book.id}>
                          {book.title} by {book.author}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-muted-foreground">
                        No available books. All books are currently on loan.
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {isSubmitted && errors.bookId && <p className="text-sm text-destructive mt-1">{errors.bookId}</p>}
              </>
            )}
            {selectedBook && <p className="text-sm text-muted-foreground mt-1">ISBN: {selectedBook.ISBN}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="borrower" className="flex items-center">
              Borrower <span className="text-destructive ml-1">*</span>
            </Label>
            <Input id="borrower" name="borrower" value={formData.borrower} onChange={handleChange} required />
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
              required
            />
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
            />
          </div>
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

