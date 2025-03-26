"use client"

import { useLocalStorage } from "./use-local-storage"
import { useLoans } from "./use-loans"
import { toast } from "sonner"

export interface Book {
  id: string
  title: string
  author: string
  publishedDate: string
  ISBN: string
  summary: string
  coverImageUrl: string
  genreIds: string[]
  isDeleted?: boolean // Added isDeleted flag
}

export function useBooks() {
  const [books, setBooks] = useLocalStorage<Book[]>("books", [])
  const { setLoanDeletedStatus, restoreBookLoans } = useLoans()

  // Get only non-deleted books for the UI
  const visibleBooks = books.filter((book) => !book.isDeleted)

  const addBook = (book: Omit<Book, "id" | "isDeleted">) => {
    const newBook = {
      ...book,
      id: crypto.randomUUID(),
      isDeleted: false,
    }
    setBooks((prevBooks) => [...prevBooks, newBook])
    return newBook
  }

  const updateBook = (id: string, updatedBook: Partial<Book>) => {
    const book = books.find((b) => b.id === id)
    setBooks((prevBooks) => prevBooks.map((book) => (book.id === id ? { ...book, ...updatedBook } : book)))

    // Add toast notification for book update
    if (book) {
      toast.success(`"${updatedBook.title || book.title}" has been updated`)
    }
  }

  const deleteBook = (id: string) => {
    // Find the book to mark as deleted
    const bookToDelete = books.find((book) => book.id === id && !book.isDeleted)

    if (!bookToDelete) return { deletedLoansCount: 0 }

    // Mark the book as deleted
    setBooks((prevBooks) => prevBooks.map((book) => (book.id === id ? { ...book, isDeleted: true } : book)))

    // Mark associated loans as deleted and get count
    const count = setLoanDeletedStatus(id, true)

    // Show toast notification with undo option
    toast(`"${bookToDelete.title}" has been deleted`, {
      description: `${count} associated loan${count === 1 ? "" : "s"} also removed`,
      action: {
        label: "Undo",
        onClick: () => undoDeleteBook(id),
      },
      duration: 5000, // 5 seconds to undo
    })

    return { deletedLoansCount: count }
  }

  const undoDeleteBook = (id: string) => {
    console.log("Attempting to undo delete for book ID:", id)

    // Find the book to restore - make sure to search ALL books, including deleted ones
    const bookToRestore = books.find((book) => book.id === id)

    console.log("Book to restore:", bookToRestore)

    if (!bookToRestore) {
      console.error("Could not find book with ID:", id)
      return false
    }

    // Mark the book as not deleted
    setBooks((prevBooks) => {
      const updatedBooks = prevBooks.map((book) => (book.id === id ? { ...book, isDeleted: false } : book))
      console.log("Updated books after undo:", updatedBooks)
      return updatedBooks
    })

    // Restore associated loans
    const restoredLoansCount = restoreBookLoans(id)
    console.log("Restored loans count:", restoredLoansCount)

    // Show confirmation toast
    toast(`"${bookToRestore.title}" has been restored`, {
      description: `${restoredLoansCount} associated loan${restoredLoansCount === 1 ? "" : "s"} also restored`,
    })

    return true
  }

  const getBook = (id: string) => {
    return books.find((book) => book.id === id)
  }

  return {
    books: visibleBooks, // Only return non-deleted books
    addBook,
    updateBook,
    deleteBook,
    undoDeleteBook,
    getBook,
  }
}

