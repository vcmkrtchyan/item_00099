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

export type LoanStatus = "active" | "pending" | "overdue" | "returned"

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

  const getActiveLoans = () => {
    return loans.filter((loan) => !loan.returned)
  }

  const getOverdueLoans = () => {
    const today = new Date().toISOString().split("T")[0]
    return loans.filter((loan) => !loan.returned && loan.dueDate < today)
  }

  const getPendingLoans = () => {
    const today = new Date().toISOString().split("T")[0]
    return loans.filter((loan) => !loan.returned && loan.dueDate === today)
  }

  return {
    loans,
    addLoan,
    updateLoan,
    deleteLoan,
    getLoan,
    returnBook,
    getLoanStatus,
    getActiveLoans,
    getOverdueLoans,
    getPendingLoans,
  }
}

