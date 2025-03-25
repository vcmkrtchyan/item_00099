"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { Book } from "@/hooks/use-books"
import { useLibrary } from "@/context/library-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { validateISBN, validateImageUrl } from "@/lib/validation"
import { DateInput } from "@/components/ui/date-input"
import { toast } from "@/components/ui/use-toast"
import { LockIcon, BookIcon, LightbulbIcon } from "lucide-react"

interface BookFormProps {
  bookId?: string
}

export function BookForm({ bookId }: BookFormProps) {
  const router = useRouter()
  const { getBook, addBook, updateBook, genres, books } = useLibrary()

  const [formData, setFormData] = useState<Omit<Book, "id">>({
    title: "",
    author: "",
    publishedDate: "",
    ISBN: "",
    summary: "",
    coverImageUrl: "",
    genreIds: [],
  })

  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [autoFilledBook, setAutoFilledBook] = useState<Book | null>(null)
  const [lastCheckedISBN, setLastCheckedISBN] = useState<string>("")

  // Add validation state
  const [errors, setErrors] = useState<{
    ISBN?: string
    coverImageUrl?: string
    publishedDate?: string
  }>({})

  // Track if form has been submitted once (for validation display)
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    if (bookId) {
      const book = getBook(bookId)
      if (book) {
        setFormData({
          title: book.title,
          author: book.author,
          publishedDate: book.publishedDate,
          ISBN: book.ISBN,
          summary: book.summary,
          coverImageUrl: book.coverImageUrl,
          genreIds: book.genreIds,
        })
        setSelectedGenres(book.genreIds)
      }
    }
  }, [bookId, getBook])

  // Find a book by ISBN
  const findBookByISBN = useCallback(
    (isbn: string): Book | undefined => {
      // Normalize ISBN by removing hyphens and spaces for comparison
      const normalizedISBN = isbn.replace(/[-\s]/g, "")

      // Find any book with the same ISBN (excluding the current book if in edit mode)
      return books.find((book) => {
        const bookISBN = book.ISBN.replace(/[-\s]/g, "")
        return bookISBN === normalizedISBN && book.id !== bookId
      })
    },
    [books, bookId],
  )

  // Check ISBN and auto-fill form
  const checkAndAutoFillISBN = useCallback(
    (isbn: string) => {
      // Skip if ISBN is empty or we've already checked this exact ISBN
      if (!isbn || isbn === lastCheckedISBN) return

      setLastCheckedISBN(isbn)

      // Check if it's a valid ISBN format
      if (!validateISBN(isbn)) {
        // Only set error if it's a complete ISBN (10 or 13 chars without hyphens)
        const normalizedISBN = isbn.replace(/[-\s]/g, "")
        if (normalizedISBN.length === 10 || normalizedISBN.length === 13) {
          setErrors((prev) => ({
            ...prev,
            ISBN: "Please enter a valid ISBN-10 or ISBN-13 format",
          }))
        }
        return
      } else {
        // Clear ISBN error if it's valid
        setErrors((prev) => ({ ...prev, ISBN: undefined }))
      }

      // Check if a book with this ISBN already exists
      const existingBook = findBookByISBN(isbn)

      if (existingBook) {
        // Only auto-fill if we haven't already or if it's a different book
        if (!autoFilledBook || autoFilledBook.id !== existingBook.id) {
          // Auto-fill the form with the existing book's details
          setFormData({
            title: existingBook.title,
            author: existingBook.author,
            publishedDate: existingBook.publishedDate,
            ISBN: isbn, // Keep the user's formatted ISBN
            summary: existingBook.summary,
            coverImageUrl: existingBook.coverImageUrl,
            genreIds: existingBook.genreIds,
          })

          setSelectedGenres(existingBook.genreIds)
          setAutoFilledBook(existingBook)

          // Notify the user
          toast({
            title: "Book details auto-filled",
            description: `We found "${existingBook.title}" with the same ISBN in your library. Fields are locked to ensure consistency.`,
            variant: "success",
            duration: 3000, // Auto-dismiss after 3 seconds
          })
        }
      } else {
        // Clear auto-filled state if no matching book is found
        if (autoFilledBook) {
          setAutoFilledBook(null)
        }
      }
    },
    [findBookByISBN, autoFilledBook, lastCheckedISBN, toast],
  )

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    // If this is the ISBN field, always allow changes
    if (name === "ISBN") {
      setFormData((prev) => ({ ...prev, [name]: value }))
      setErrors((prev) => ({ ...prev, ISBN: undefined }))

      // If ISBN is changed, check for auto-fill
      checkAndAutoFillISBN(value)

      // If ISBN is cleared or changed, unlock the form
      if (!value || (autoFilledBook && value !== autoFilledBook.ISBN)) {
        setAutoFilledBook(null)
      }
    }
    // For other fields, only allow changes if not auto-filled or in edit mode
    else if (!autoFilledBook || bookId) {
      setFormData((prev) => ({ ...prev, [name]: value }))

      if (name === "coverImageUrl") {
        setErrors((prev) => ({ ...prev, coverImageUrl: undefined }))
      }
    }
  }

  const handleDateChange = (value: string) => {
    // Only allow date changes if not auto-filled or in edit mode
    if (!autoFilledBook || bookId) {
      setFormData((prev) => ({ ...prev, publishedDate: value }))
      validatePublishedDate(value)
    }
  }

  const validatePublishedDate = (date: string): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time part for accurate date comparison

    const publishedDate = new Date(date)
    publishedDate.setHours(0, 0, 0, 0)

    if (publishedDate > today) {
      setErrors((prev) => ({
        ...prev,
        publishedDate: "Publication date cannot be in the future",
      }))
      return false
    } else {
      setErrors((prev) => ({ ...prev, publishedDate: undefined }))
      return true
    }
  }

  const handleGenreChange = (genreId: string, checked: boolean) => {
    // Only allow genre changes if not auto-filled or in edit mode
    if (!autoFilledBook || bookId) {
      if (checked) {
        setSelectedGenres((prev) => [...prev, genreId])
      } else {
        setSelectedGenres((prev) => prev.filter((id) => id !== genreId))
      }
    }
  }

  // Update the handleCoverImageBlur function to use the simplified validation
  const handleCoverImageBlur = () => {
    const { coverImageUrl } = formData

    // Only validate if there's a value (since it's optional)
    if (coverImageUrl && !validateImageUrl(coverImageUrl)) {
      setErrors((prev) => ({
        ...prev,
        coverImageUrl: "Please enter a valid URL",
      }))
    } else {
      setErrors((prev) => ({ ...prev, coverImageUrl: undefined }))
    }
  }

  // Update the validateForm function's coverImageUrl validation
  const validateForm = (): boolean => {
    const newErrors: {
      ISBN?: string
      coverImageUrl?: string
      publishedDate?: string
    } = {}

    // Validate ISBN
    if (formData.ISBN && !validateISBN(formData.ISBN)) {
      newErrors.ISBN = "Please enter a valid ISBN-10 or ISBN-13 format"
    }

    // Validate Cover Image URL - just check if it's a valid URL
    if (formData.coverImageUrl && !validateImageUrl(formData.coverImageUrl)) {
      newErrors.coverImageUrl = "Please enter a valid URL"
    }

    // Validate Published Date
    if (formData.publishedDate) {
      const isValidDate = validatePublishedDate(formData.publishedDate)
      if (!isValidDate) {
        newErrors.publishedDate = "Publication date cannot be in the future"
      }
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
      if (errors.ISBN) {
        document.getElementById("ISBN")?.focus()
      } else if (errors.coverImageUrl) {
        document.getElementById("coverImageUrl")?.focus()
      } else if (errors.publishedDate) {
        document.getElementById("publishedDate")?.focus()
      }
      return
    }

    const bookData = {
      ...formData,
      genreIds: selectedGenres,
    }

    if (bookId) {
      updateBook(bookId, bookData)
    } else {
      addBook(bookData)
    }

    router.push("/")
  }

  // Determine if fields should be read-only
  const isReadOnly = autoFilledBook !== null && !bookId

  return (
    <Card className="w-full">
      <form onSubmit={handleSubmit}>
        <CardHeader className="px-6 pt-6 pb-4">
          <CardTitle>{bookId ? "Edit Book" : "Add New Book"}</CardTitle>
          <CardDescription className="mt-1.5">
            {bookId ? "Update the book details" : "Enter the details for a new book."}
          </CardDescription>

          {!bookId && !isReadOnly && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md flex items-start gap-3">
              <LightbulbIcon className="h-5 w-5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Pro Tip: Quick Add with ISBN</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Start by entering an ISBN to automatically fill in all details if the book already exists in your
                  library.
                </p>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="px-6 py-0 space-y-5">
          {isReadOnly && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-md text-blue-700 dark:text-blue-300 text-sm flex items-center gap-3">
              <LockIcon className="h-4 w-4 flex-shrink-0" />
              <p>
                Fields are locked to ensure consistency with existing books. To edit details, change the ISBN first.
              </p>
            </div>
          )}

          <div className="space-y-2.5">
            <Label htmlFor="title" className="flex items-center gap-2">
              Title
              {isReadOnly && <LockIcon className="h-3 w-3 text-muted-foreground" />}
            </Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              readOnly={isReadOnly}
              className={isReadOnly ? "bg-muted cursor-not-allowed" : ""}
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="author" className="flex items-center gap-2">
              Author
              {isReadOnly && <LockIcon className="h-3 w-3 text-muted-foreground" />}
            </Label>
            <Input
              id="author"
              name="author"
              value={formData.author}
              onChange={handleChange}
              required
              readOnly={isReadOnly}
              className={isReadOnly ? "bg-muted cursor-not-allowed" : ""}
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="publishedDate" className="flex items-center gap-2">
              Published Date
              {isReadOnly && <LockIcon className="h-3 w-3 text-muted-foreground" />}
            </Label>
            <DateInput
              id="publishedDate"
              name="publishedDate"
              value={formData.publishedDate}
              onChange={handleChange}
              onDateChange={handleDateChange}
              required
              max={new Date().toISOString().split("T")[0]} // Set max date to today
              className={
                (isSubmitted || errors.publishedDate) && errors.publishedDate
                  ? "border-destructive ring-destructive"
                  : isReadOnly
                    ? "bg-muted cursor-not-allowed"
                    : ""
              }
              readOnly={isReadOnly}
            />
            {(isSubmitted || errors.publishedDate) && errors.publishedDate && (
              <p className="text-sm text-destructive mt-1.5">{errors.publishedDate}</p>
            )}
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="ISBN" className="flex items-center gap-2">
              ISBN
              {!bookId && !isReadOnly && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                  <BookIcon className="h-3 w-3 mr-1" />
                  Try me first!
                </span>
              )}
            </Label>
            <Input
              id="ISBN"
              name="ISBN"
              value={formData.ISBN}
              onChange={handleChange}
              required
              className={isSubmitted && errors.ISBN ? "border-destructive ring-destructive" : ""}
              placeholder="ISBN-10 or ISBN-13 format"
            />
            {isSubmitted && errors.ISBN && <p className="text-sm text-destructive mt-1.5">{errors.ISBN}</p>}
            <p className="text-xs text-muted-foreground mt-1">
              Enter a valid ISBN-10 (e.g., 0-306-40615-2) or ISBN-13 (e.g., 978-3-16-148410-0) format
            </p>
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="coverImageUrl" className="flex items-center gap-2">
              Cover Image URL
              {isReadOnly && <LockIcon className="h-3 w-3 text-muted-foreground" />}
            </Label>
            <Input
              id="coverImageUrl"
              name="coverImageUrl"
              value={formData.coverImageUrl}
              onChange={handleChange}
              onBlur={handleCoverImageBlur}
              className={
                (isSubmitted || errors.coverImageUrl) && errors.coverImageUrl
                  ? "border-destructive ring-destructive"
                  : isReadOnly
                    ? "bg-muted cursor-not-allowed"
                    : ""
              }
              placeholder="https://example.com/book-cover.jpg"
              readOnly={isReadOnly}
            />
            {(isSubmitted || errors.coverImageUrl) && errors.coverImageUrl && (
              <p className="text-sm text-destructive mt-1.5">{errors.coverImageUrl}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Enter a URL for the book cover image</p>
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="summary" className="flex items-center gap-2">
              Summary
              {isReadOnly && <LockIcon className="h-3 w-3 text-muted-foreground" />}
            </Label>
            <Textarea
              id="summary"
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              rows={4}
              readOnly={isReadOnly}
              className={isReadOnly ? "bg-muted cursor-not-allowed" : ""}
            />
          </div>

          <div className="space-y-2.5 pb-1">
            <Label className="flex items-center gap-2">
              Genres
              {isReadOnly && <LockIcon className="h-3 w-3 text-muted-foreground" />}
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {genres.map((genre) => (
                <div key={genre.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`genre-${genre.id}`}
                    checked={selectedGenres.includes(genre.id)}
                    onCheckedChange={(checked) => handleGenreChange(genre.id, checked as boolean)}
                    disabled={isReadOnly}
                    className={isReadOnly ? "cursor-not-allowed" : ""}
                  />
                  <Label
                    htmlFor={`genre-${genre.id}`}
                    className={isReadOnly ? "cursor-not-allowed text-muted-foreground" : ""}
                  >
                    {genre.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="px-6 py-5 flex justify-between border-t mt-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit">{bookId ? "Update Book" : "Add Book"}</Button>
        </CardFooter>
      </form>
    </Card>
  )
}

