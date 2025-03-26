"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import type { Book } from "@/hooks/use-books"
import { useLibrary } from "@/context/library-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { validateISBN, validateImageUrl } from "@/lib/validation"
// Add the import for Sonner toast at the top of the file
// Add this import near the other imports:
import { toast } from "sonner"
import { LockIcon, BookIcon, LightbulbIcon, ChevronsUpDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

// Add this import at the top
import { SimpleDatePicker } from "@/components/ui/simple-date-picker"

interface BookFormProps {
  bookId?: string
}

// Create the book schema
const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  publishedDate: z
    .string()
    .min(1, "Published date is required")
    .refine((date) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const publishedDate = new Date(date)
      publishedDate.setHours(0, 0, 0, 0)
      return publishedDate <= today
    }, "Publication date cannot be in the future"),
  ISBN: z
    .string()
    .min(1, "ISBN is required")
    .refine((isbn) => validateISBN(isbn), "Please enter a valid ISBN-10 or ISBN-13 format"),
  summary: z.string().optional(),
  coverImageUrl: z
    .string()
    .optional()
    .refine((url) => !url || validateImageUrl(url), "Please enter a valid URL"),
  genreIds: z.array(z.string()).default([]),
})

type BookFormValues = z.infer<typeof bookSchema>

export function BookForm({ bookId }: BookFormProps) {
  const router = useRouter()
  const { getBook, addBook, updateBook, genres, books } = useLibrary()

  const [autoFilledBook, setAutoFilledBook] = useState<Book | null>(null)
  const [lastCheckedISBN, setLastCheckedISBN] = useState<string>("")
  const [showGenreDropdown, setShowGenreDropdown] = useState(false)
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [calendarOpen, setCalendarOpen] = useState(false)

  // Initialize form
  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: "",
      author: "",
      publishedDate: "",
      ISBN: "",
      summary: "",
      coverImageUrl: "",
      genreIds: [],
    },
  })

  // Load existing book data if in edit mode
  useEffect(() => {
    if (bookId) {
      const book = getBook(bookId)
      if (book) {
        form.reset({
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
  }, [bookId, getBook, form])

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
          form.setError("ISBN", {
            message: "Please enter a valid ISBN-10 or ISBN-13 format",
          })
        }
        return
      } else {
        form.clearErrors("ISBN")
      }

      // Check if a book with this ISBN already exists
      const existingBook = findBookByISBN(isbn)

      if (existingBook) {
        // Only auto-fill if we haven't already or if it's a different book
        if (!autoFilledBook || autoFilledBook.id !== existingBook.id) {
          // Auto-fill the form with the existing book's details
          form.reset({
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
          toast.success(`Book details auto-filled for "${existingBook.title}"`)
        }
      } else {
        // Clear auto-filled state if no matching book is found
        if (autoFilledBook) {
          setAutoFilledBook(null)
        }
      }
    },
    [findBookByISBN, autoFilledBook, lastCheckedISBN, toast, form],
  )

  // Handle ISBN change
  const handleISBNChange = (value: string) => {
    form.setValue("ISBN", value)
    form.clearErrors("ISBN")

    // Check for auto-fill
    checkAndAutoFillISBN(value)

    // If ISBN is cleared or changed, unlock the form
    if (!value || (autoFilledBook && value !== autoFilledBook.ISBN)) {
      setAutoFilledBook(null)
    }
  }

  // Handle date change
  const handleDateChange = (value: string) => {
    // Only allow date changes if not auto-filled or in edit mode
    if (!autoFilledBook || bookId) {
      form.setValue("publishedDate", value)
      form.trigger("publishedDate")
    }
  }

  // Handle genre checkbox change
  const handleGenreChange = (genreId: string, checked: boolean) => {
    const currentGenres = form.getValues("genreIds") || []

    if (checked) {
      const updatedGenres = [...currentGenres, genreId]
      form.setValue("genreIds", updatedGenres)
      setSelectedGenres(updatedGenres)
    } else {
      const updatedGenres = currentGenres.filter((id) => id !== genreId)
      form.setValue("genreIds", updatedGenres)
      setSelectedGenres(updatedGenres)
    }
  }

  // Form submission handler
  const onSubmit = (data: BookFormValues) => {
    if (bookId) {
      updateBook(bookId, data)
      toast.success(`"${data.title}" has been updated successfully`)
    } else {
      const newBook = addBook(data)
      toast.success(`"${data.title}" has been added to your library`)
    }

    router.push("/")
  }

  // Determine if fields should be read-only
  const isReadOnly = autoFilledBook !== null && !bookId

  // Get genre names for display
  const getGenreNames = (ids: string[]) => {
    return ids
      .map((id) => {
        const genre = genres.find((g) => g.id === id)
        return genre ? genre.name : ""
      })
      .filter(Boolean)
  }

  // Close genre dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showGenreDropdown && !target.closest(".genre-dropdown-container")) {
        setShowGenreDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showGenreDropdown])

  const handleDateSelect = (date: Date | undefined) => {
    setCalendarOpen(false)
    if (date) {
      const dateString = date.toISOString().split("T")[0]
      form.setValue("publishedDate", dateString)
      handleDateChange(dateString)
    }
  }

  return (
    <Card className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
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

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Title
                    {isReadOnly && <LockIcon className="h-3 w-3 text-muted-foreground" />}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      readOnly={isReadOnly}
                      className={isReadOnly ? "bg-muted cursor-not-allowed" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Author
                    {isReadOnly && <LockIcon className="h-3 w-3 text-muted-foreground" />}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      readOnly={isReadOnly}
                      className={isReadOnly ? "bg-muted cursor-not-allowed" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="publishedDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Published Date
                    {isReadOnly && <LockIcon className="h-3 w-3 text-muted-foreground" />}
                  </FormLabel>
                  <FormControl>
                    {isReadOnly ? (
                      <Input value={field.value} readOnly className="bg-muted cursor-not-allowed" />
                    ) : (
                      <SimpleDatePicker
                        date={field.value ? new Date(field.value) : undefined}
                        onDateChange={(date) => {
                          if (date) {
                            const dateString = date.toISOString().split("T")[0]
                            field.onChange(dateString)
                            handleDateChange(dateString)
                          }
                        }}
                        maxDate={new Date()}
                        placeholder="Select published date"
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ISBN"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    ISBN
                    {!bookId && !isReadOnly && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        <BookIcon className="h-3 w-3 mr-1" />
                        Try me first!
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => {
                        field.onChange(e)
                        handleISBNChange(e.target.value)
                      }}
                      placeholder="ISBN-10 or ISBN-13 format"
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    Enter a valid ISBN-10 (e.g., 0-306-40615-2) or ISBN-13 (e.g., 978-3-16-148410-0) format
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="coverImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Cover Image URL
                    {isReadOnly && <LockIcon className="h-3 w-3 text-muted-foreground" />}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      readOnly={isReadOnly}
                      className={isReadOnly ? "bg-muted cursor-not-allowed" : ""}
                      placeholder="https://example.com/book-cover.jpg"
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>Enter a URL for the book cover image</FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Summary
                    {isReadOnly && <LockIcon className="h-3 w-3 text-muted-foreground" />}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      readOnly={isReadOnly}
                      className={isReadOnly ? "bg-muted cursor-not-allowed" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="genreIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Genres
                    {isReadOnly && <LockIcon className="h-3 w-3 text-muted-foreground" />}
                  </FormLabel>
                  <FormControl>
                    {isReadOnly ? (
                      <div className="p-2 border rounded-md bg-muted flex flex-wrap gap-2">
                        {selectedGenres.length > 0 ? (
                          getGenreNames(selectedGenres).map((name, index) => (
                            <Badge key={index} variant="secondary">
                              {name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">No genres selected</span>
                        )}
                      </div>
                    ) : (
                      <div className="relative genre-dropdown-container">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-between h-auto min-h-10"
                          onClick={() => setShowGenreDropdown(!showGenreDropdown)}
                        >
                          <div className="flex flex-wrap gap-1 py-0.5">
                            {selectedGenres.length > 0 ? (
                              getGenreNames(selectedGenres).map((name, index) => (
                                <Badge key={index} variant="secondary" className="mr-1">
                                  {name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground">Select genres</span>
                            )}
                          </div>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>

                        {showGenreDropdown && (
                          <div className="absolute z-50 w-full mt-1 rounded-md border bg-popover p-4 shadow-md">
                            {genres.length === 0 ? (
                              <div className="py-2 text-center text-sm text-muted-foreground">
                                No genres available. Add some genres first.
                              </div>
                            ) : (
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {genres.map((genre) => (
                                  <div key={genre.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`genre-${genre.id}`}
                                      checked={selectedGenres.includes(genre.id)}
                                      onCheckedChange={(checked) => handleGenreChange(genre.id, checked as boolean)}
                                    />
                                    <label htmlFor={`genre-${genre.id}`} className="text-sm cursor-pointer">
                                      {genre.name}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="px-6 py-5 flex justify-between border-t mt-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit">{bookId ? "Update Book" : "Add Book"}</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}

