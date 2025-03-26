"use client"

import { useLocalStorage } from "./use-local-storage"
import { toast } from "sonner"

export interface Loan {
  id: string
  bookId: string
  borrower: string
  loanDate: string
  dueDate: string
  returnDate: string | null
  returned: boolean
  isDeleted?: boolean // Added isDeleted flag
}

export type LoanStatus = "active" | "pending" | "overdue" | "returned" | "scheduled"

export function useLoans() {
  const [loans, setLoans] = useLocalStorage<Loan[]>("loans", [])
  const [books, setBooks] = useLocalStorage<any[]>("books", [])

  // Get only non-deleted loans for the UI
  const visibleLoans = loans.filter((loan) => !loan.isDeleted)

  const addLoan = (loan: Omit<Loan, "id" | "isDeleted">) => {
    const newLoan = {
      ...loan,
      id: crypto.randomUUID(),
      isDeleted: false,
    }
    setLoans((prevLoans) => [...prevLoans, newLoan])
    return newLoan
  }

  // Update the updateLoan function to add a toast notification
  const updateLoan = (id: string, updatedLoan: Partial<Loan>) => {
    const loan = loans.find((l) => l.id === id)
    setLoans((prevLoans) => prevLoans.map((loan) => (loan.id === id ? { ...loan, ...updatedLoan } : loan)))

    // Add toast notification for loan update if not already handled in the form
    if (loan && !updatedLoan.returned) {
      const bookId = updatedLoan.bookId || loan.bookId
      toast.success(`Loan has been updated`)
    }
  }

  const deleteLoan = (id: string) => {
    // Find the loan to mark as deleted
    const loanToDelete = loans.find((loan) => loan.id === id && !loan.isDeleted)

    if (!loanToDelete) return

    // Get the book title if available by looking up in localStorage directly
    let bookTitle = "Unknown book"
    try {
      const booksData = localStorage.getItem("books")
      if (booksData) {
        const allBooks = JSON.parse(booksData)
        const book = allBooks.find((b: any) => b.id === loanToDelete.bookId && !b.isDeleted)
        if (book) {
          bookTitle = book.title
        }
      }
    } catch (error) {
      console.error("Error getting book title:", error)
    }

    // Mark the loan as deleted
    setLoans((prevLoans) => prevLoans.map((loan) => (loan.id === id ? { ...loan, isDeleted: true } : loan)))

    // Show toast notification with undo option
    toast(`Loan for "${bookTitle}" has been deleted`, {
      action: {
        label: "Undo",
        onClick: () => undoDeleteLoan(id),
      },
      duration: 5000, // 5 seconds to undo
    })
  }

  const undoDeleteLoan = (id: string) => {
    console.log("Attempting to undo delete for loan ID:", id)

    // Find the loan to restore
    const loanToRestore = loans.find((loan) => loan.id === id)

    console.log("Loan to restore:", loanToRestore)

    if (!loanToRestore) {
      console.error("Could not find loan with ID:", id)
      return false
    }

    // Mark the loan as not deleted
    setLoans((prevLoans) => {
      const updatedLoans = prevLoans.map((loan) => (loan.id === id ? { ...loan, isDeleted: false } : loan))
      console.log("Updated loans after undo:", updatedLoans)
      return updatedLoans
    })

    // Show confirmation toast
    toast(`Loan has been restored`)

    return true
  }

  // Mark loans as deleted/not deleted for a specific book
  const setLoanDeletedStatus = (bookId: string, isDeleted: boolean) => {
    // Find all loans for this book
    const bookLoans = loans.filter((loan) => loan.bookId === bookId && loan.isDeleted !== isDeleted)

    if (bookLoans.length === 0) return 0

    // Update the loans
    setLoans((prevLoans) => prevLoans.map((loan) => (loan.bookId === bookId ? { ...loan, isDeleted } : loan)))

    return bookLoans.length
  }

  // Restore loans for a book
  const restoreBookLoans = (bookId: string) => {
    console.log("Restoring loans for book ID:", bookId)

    // Find all loans for this book that are marked as deleted
    const loansToRestore = loans.filter((loan) => loan.bookId === bookId && loan.isDeleted === true)

    console.log("Loans to restore:", loansToRestore)

    if (loansToRestore.length === 0) {
      console.log("No loans to restore for this book")
      return 0
    }

    // Update the loans
    setLoans((prevLoans) => {
      const updatedLoans = prevLoans.map((loan) =>
        loan.bookId === bookId && loan.isDeleted ? { ...loan, isDeleted: false } : loan,
      )
      console.log("Updated loans after restore:", updatedLoans)
      return updatedLoans
    })

    return loansToRestore.length
  }

  // New method to delete multiple loans at once
  const bulkDeleteLoans = (ids: string[]) => {
    if (ids.length === 0) return 0

    // Find the loans to mark as deleted
    const loansToDelete = loans.filter((loan) => ids.includes(loan.id) && !loan.isDeleted)

    if (loansToDelete.length === 0) return 0

    // Mark the loans as deleted
    setLoans((prevLoans) => prevLoans.map((loan) => (ids.includes(loan.id) ? { ...loan, isDeleted: true } : loan)))

    // Show toast notification with undo option
    toast(`${loansToDelete.length} loans have been deleted`, {
      action: {
        label: "Undo",
        onClick: () => undoBulkDeleteLoans(ids),
      },
      duration: 5000, // 5 seconds to undo
    })

    return loansToDelete.length
  }

  const undoBulkDeleteLoans = (ids: string[]) => {
    console.log("Attempting to undo bulk delete for loan IDs:", ids)

    // Find the loans to restore
    const loansToRestore = loans.filter((loan) => ids.includes(loan.id))

    console.log("Loans to restore:", loansToRestore)

    if (loansToRestore.length === 0) {
      console.error("Could not find loans with the provided IDs")
      return 0
    }

    // Mark the loans as not deleted
    setLoans((prevLoans) => {
      const updatedLoans = prevLoans.map((loan) => (ids.includes(loan.id) ? { ...loan, isDeleted: false } : loan))
      console.log("Updated loans after bulk undo:", updatedLoans)
      return updatedLoans
    })

    // Show confirmation toast
    toast(`${loansToRestore.length} loans have been restored`)

    return loansToRestore.length
  }

  // Delete all loans associated with a specific book
  const deleteBookLoans = (bookId: string) => {
    // Find all loans for this book
    const bookLoans = loans.filter((loan) => loan.bookId === bookId && !loan.isDeleted)
    const loanIds = bookLoans.map((loan) => loan.id)

    // Mark the loans as deleted
    const count = setLoanDeletedStatus(bookId, true)

    return { loanIds, count }
  }

  const getLoan = (id: string) => {
    return loans.find((loan) => loan.id === id)
  }

  // Update the returnBook function to remove the toast notification
  const returnBook = (id: string, returnDate?: string) => {
    setLoans((prevLoans) =>
      prevLoans.map((loan) =>
        loan.id === id
          ? {
              ...loan,
              returnDate: returnDate || new Date().toISOString().split("T")[0],
              returned: true,
            }
          : loan,
      ),
    )

    // Remove the toast notification from here since it's handled in the components
  }

  const getLoanStatus = (loan: Loan): LoanStatus => {
    if (loan.returned) {
      return "returned"
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time part for accurate date comparison

    const loanDate = new Date(loan.loanDate)
    loanDate.setHours(0, 0, 0, 0) // Reset time part for accurate date comparison

    // If loan date is in the future, it's scheduled
    if (loanDate.getTime() > today.getTime()) {
      return "scheduled"
    }

    const dueDate = new Date(loan.dueDate)
    dueDate.setHours(0, 0, 0, 0) // Reset time part for accurate date comparison

    if (dueDate.getTime() < today.getTime()) {
      return "overdue"
    } else if (dueDate.getTime() === today.getTime()) {
      return "pending"
    } else {
      return "active"
    }
  }

  // Check if a book is currently loaned (not including future loans)
  const isBookCurrentlyLoaned = (bookId: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return visibleLoans.some((loan) => {
      if (loan.bookId !== bookId || loan.returned) return false

      const loanDate = new Date(loan.loanDate)
      loanDate.setHours(0, 0, 0, 0)

      // Only count as loaned if the loan date is today or in the past
      return loanDate.getTime() <= today.getTime()
    })
  }

  // Check if a book has any future loans scheduled
  const hasScheduledLoans = (bookId: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return visibleLoans.some((loan) => {
      if (loan.bookId !== bookId || loan.returned) return false

      const loanDate = new Date(loan.loanDate)
      loanDate.setHours(0, 0, 0, 0)

      return loanDate.getTime() > today.getTime()
    })
  }

  // Check if a book is available for loan during a specific period
  const isBookAvailableForPeriod = (bookId: string, startDate: string, endDate: string, excludeLoanId?: string) => {
    // Convert dates to timestamps for easier comparison
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()

    // Get today's date to determine if we're checking a historical loan
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const isHistoricalPeriod = new Date(endDate).getTime() < today.getTime()

    // Check all loans for this book (including returned ones for historical validation)
    // For current/future loans, we only need to check against non-returned loans
    const conflictingLoan = visibleLoans.find((loan) => {
      // Skip the loan being edited (if provided)
      if (excludeLoanId && loan.id === excludeLoanId) return false

      // Skip loans for other books
      if (loan.bookId !== bookId) return false

      if (!isHistoricalPeriod && loan.returned) return false

      const loanStart = new Date(loan.loanDate).getTime()
      const loanEnd = new Date(loan.dueDate).getTime()

      // Check if date ranges overlap
      return start <= loanEnd && end >= loanStart
    })

    return !conflictingLoan
  }

  const getActiveLoans = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return visibleLoans.filter((loan) => {
      if (loan.returned) return false

      const loanDate = new Date(loan.loanDate)
      loanDate.setHours(0, 0, 0, 0)

      // Only include loans that have started (today or earlier)
      return loanDate.getTime() <= today.getTime()
    })
  }

  const getScheduledLoans = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return visibleLoans.filter((loan) => {
      if (loan.returned) return false

      const loanDate = new Date(loan.loanDate)
      loanDate.setHours(0, 0, 0, 0)

      // Only include loans scheduled for the future
      return loanDate.getTime() > today.getTime()
    })
  }

  const getOverdueLoans = () => {
    const today = new Date().toISOString().split("T")[0]
    return visibleLoans.filter((loan) => !loan.returned && loan.dueDate < today && loan.loanDate <= today)
  }

  const getPendingLoans = () => {
    const today = new Date().toISOString().split("T")[0]
    return visibleLoans.filter((loan) => !loan.returned && loan.dueDate === today && loan.loanDate <= today)
  }

  return {
    loans: visibleLoans, // Only return non-deleted loans
    addLoan,
    updateLoan,
    deleteLoan,
    undoDeleteLoan,
    bulkDeleteLoans,
    undoBulkDeleteLoans,
    deleteBookLoans,
    setLoanDeletedStatus,
    restoreBookLoans,
    getLoan,
    returnBook,
    getLoanStatus,
    isBookCurrentlyLoaned,
    hasScheduledLoans,
    isBookAvailableForPeriod,
    getActiveLoans,
    getScheduledLoans,
    getOverdueLoans,
    getPendingLoans,
  }
}

