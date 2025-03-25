import { useLocalStorage } from "./use-local-storage"

export interface Book {
  id: string
  title: string
  author: string
  publishedDate: string
  ISBN: string
  summary: string
  coverImageUrl: string
  genreIds: string[]
}

export function useBooks() {
  const [books, setBooks] = useLocalStorage<Book[]>("books", [])

  const addBook = (book: Omit<Book, "id">) => {
    const newBook = {
      ...book,
      id: crypto.randomUUID(),
    }
    setBooks((prevBooks) => [...prevBooks, newBook])
    return newBook
  }

  const updateBook = (id: string, updatedBook: Partial<Book>) => {
    setBooks((prevBooks) => prevBooks.map((book) => (book.id === id ? { ...book, ...updatedBook } : book)))
  }

  const deleteBook = (id: string) => {
    setBooks((prevBooks) => prevBooks.filter((book) => book.id !== id))
  }

  const getBook = (id: string) => {
    return books.find((book) => book.id === id)
  }

  return {
    books,
    addBook,
    updateBook,
    deleteBook,
    getBook,
  }
}

