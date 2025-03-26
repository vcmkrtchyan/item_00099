"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useBooks, type Book } from "@/hooks/use-books"
import { useGenres, type Genre } from "@/hooks/use-genres"
import { useLoans, type Loan } from "@/hooks/use-loans"

interface LibraryContextType {
  // Books
  books: Book[]
  addBook: (book: Omit<Book, "id">) => Book
  updateBook: (id: string, book: Partial<Book>) => void
  deleteBook: (id: string) => { deletedLoansCount: number }
  getBook: (id: string) => Book | undefined

  // Genres
  genres: Genre[]
  addGenre: (genre: Omit<Genre, "id">) => Genre
  updateGenre: (id: string, genre: Partial<Genre>) => void
  deleteGenre: (id: string) => boolean
  getGenre: (id: string) => Genre | undefined

  // Loans
  loans: Loan[]
  addLoan: (loan: Omit<Loan, "id">) => Loan
  updateLoan: (id: string, loan: Partial<Loan>) => void
  deleteLoan: (id: string) => void
  getLoan: (id: string) => Loan | undefined
  returnBook: (id: string) => void
  getActiveLoans: () => Loan[]
  getOverdueLoans: () => Loan[]
  isBookCurrentlyLoaned: (bookId: string) => boolean
  hasScheduledLoans: (bookId: string) => boolean
  isBookAvailableForPeriod: (bookId: string, startDate: string, endDate: string, excludeLoanId?: string) => boolean
  getLoanStatus: (loan: Loan) => any
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined)

export function LibraryProvider({ children }: { children: ReactNode }) {
  const booksHook = useBooks()
  const genresHook = useGenres()
  const loansHook = useLoans()

  const value = {
    ...booksHook,
    ...genresHook,
    ...loansHook,
  }

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary() {
  const context = useContext(LibraryContext)
  if (context === undefined) {
    throw new Error("useLibrary must be used within a LibraryProvider")
  }
  return context
}

