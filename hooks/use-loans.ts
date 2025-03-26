import { useLocalStorage } from "./use-local-storage"

export interface Loan {
  id: string
  bookId: string
  borrower: string
  loanDate: string
  dueDate: string
  returnDate: string | null
  returned: boolean
}

export type LoanStatus = "active" | "pending" | "overdue" | "returned" | "scheduled"

export function useLoans() {
  const [loans, setLoans] = useLocalStorage<Loan[]>("loans", [])

  const addLoan = (loan: Omit<Loan, "id">) => {
    const newLoan = {
      ...loan,
      id: crypto.randomUUID(),
    }
    setLoans((prevLoans) => [...prevLoans, newLoan])
    return newLoan
  }

  const updateLoan = (id: string, updatedLoan: Partial<Loan>) => {
    setLoans((prevLoans) => prevLoans.map((loan) => (loan.id === id ? { ...loan, ...updatedLoan } : loan)))
  }

  const deleteLoan = (id: string) => {
    setLoans((prevLoans) => prevLoans.filter((loan) => loan.id !== id))
  }

  // New method to delete multiple loans at once
  const bulkDeleteLoans = (ids: string[]) => {
    if (ids.length === 0) return 0

    setLoans((prevLoans) => prevLoans.filter((loan) => !ids.includes(loan.id)))
    return ids.length // Return the number of deleted loans
  }

  // Delete all loans associated with a specific book
  const deleteBookLoans = (bookId: string) => {
    const bookLoanIds = loans.filter((loan) => loan.bookId === bookId).map((loan) => loan.id)

    return bulkDeleteLoans(bookLoanIds)
  }

  const getLoan = (id: string) => {
    return loans.find((loan) => loan.id === id)
  }

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

    return loans.some((loan) => {
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

    return loans.some((loan) => {
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
    const conflictingLoan = loans.find((loan) => {
      // Skip the loan being edited (if provided)
      if (excludeLoanId && loan.id === excludeLoanId) return false

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

    return !conflictingLoan
  }

  const getActiveLoans = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return loans.filter((loan) => {
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

    return loans.filter((loan) => {
      if (loan.returned) return false

      const loanDate = new Date(loan.loanDate)
      loanDate.setHours(0, 0, 0, 0)

      // Only include loans scheduled for the future
      return loanDate.getTime() > today.getTime()
    })
  }

  const getOverdueLoans = () => {
    const today = new Date().toISOString().split("T")[0]
    return loans.filter((loan) => !loan.returned && loan.dueDate < today && loan.loanDate <= today)
  }

  const getPendingLoans = () => {
    const today = new Date().toISOString().split("T")[0]
    return loans.filter((loan) => !loan.returned && loan.dueDate === today && loan.loanDate <= today)
  }

  return {
    loans,
    addLoan,
    updateLoan,
    deleteLoan,
    bulkDeleteLoans,
    deleteBookLoans,
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

