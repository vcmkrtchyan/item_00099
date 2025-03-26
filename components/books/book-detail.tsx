"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import type { Book } from "@/hooks/use-books"
import { useLibrary } from "@/context/library-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash, BookOpen, CheckCircle, Calendar } from "lucide-react"
import Link from "next/link"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { BookPlaceholder } from "./book-placeholder"
import { toast } from "sonner"

interface BookDetailProps {
  book: Book
}

export function BookDetail({ book }: BookDetailProps) {
  const router = useRouter()
  const { deleteBook, genres, loans, returnBook, isBookCurrentlyLoaned, hasScheduledLoans } = useLibrary()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showReturnDialog, setShowReturnDialog] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [associatedLoans, setAssociatedLoans] = useState<typeof loans>([])
  const [hasActiveLoans, setHasActiveLoans] = useState(false)
  const [hasScheduledLoan, setHasScheduledLoan] = useState(false)

  const bookGenres = genres.filter((genre) => book.genreIds.includes(genre.id))

  // Find all loans associated with this book
  useEffect(() => {
    const bookLoans = loans.filter((loan) => loan.bookId === book.id)
    const activeLoans = bookLoans.filter((loan) => !loan.returned && isCurrentLoan(loan))
    const scheduledLoan = bookLoans.some((loan) => !loan.returned && isFutureLoan(loan))

    // Sort loans by date (ascending)
    const sortedLoans = [...bookLoans].sort((a, b) => {
      return new Date(a.loanDate).getTime() - new Date(b.loanDate).getTime()
    })

    setAssociatedLoans(sortedLoans)
    setHasActiveLoans(activeLoans.length > 0)
    setHasScheduledLoan(scheduledLoan)
  }, [book.id, loans])

  // Helper function to check if a loan is current (not in the future)
  const isCurrentLoan = (loan: (typeof loans)[0]) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const loanDate = new Date(loan.loanDate)
    loanDate.setHours(0, 0, 0, 0)

    return loanDate.getTime() <= today.getTime()
  }

  // Helper function to check if a loan is in the future
  const isFutureLoan = (loan: (typeof loans)[0]) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const loanDate = new Date(loan.loanDate)
    loanDate.setHours(0, 0, 0, 0)

    return loanDate.getTime() > today.getTime()
  }

  // Get active (current) loans
  const activeLoans = associatedLoans.filter((loan) => !loan.returned && isCurrentLoan(loan))

  // Get scheduled (future) loans
  const scheduledLoans = associatedLoans.filter((loan) => !loan.returned && isFutureLoan(loan))

  const isLoaned = activeLoans.length > 0
  const activeLoan = isLoaned ? activeLoans[0] : null

  // Determine if we should show the image or placeholder
  const showPlaceholder = imageError || !book.coverImageUrl

  const handleDelete = () => {
    try {
      console.log("Deleting book:", book.id)

      // Delete the book (the toast with undo is now handled in the hook)
      const result = deleteBook(book.id)
      console.log("Delete result:", result)

      // Navigate back to the books list
      router.push("/")
    } catch (error) {
      console.error("Error deleting book:", error)
    }
  }

  const handleLoanBook = () => {
    router.push(`/loans/new?bookId=${book.id}`)
  }

  const handleReturnBook = () => {
    if (activeLoan) {
      returnBook(activeLoan.id)

      // Show toast notification using Sonner
      toast(`${book?.title || "Book"} has been returned`, {
        description: `Returned by ${activeLoan.borrower}`,
      })

      setShowReturnDialog(false)
    }
  }

  // Helper function to determine the loan status
  const getLoanStatus = () => {
    if (isLoaned) {
      const loan = activeLoans[0]
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset time part for accurate date comparison

      const dueDate = new Date(loan.dueDate)
      dueDate.setHours(0, 0, 0, 0) // Reset time part for accurate date comparison

      if (dueDate.getTime() < today.getTime()) {
        return (
          <div className="text-red-600 dark:text-red-500 flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Overdue - loaned to {loan.borrower}</span>
          </div>
        )
      } else if (dueDate.getTime() === today.getTime()) {
        return (
          <div className="text-yellow-600 dark:text-yellow-500 flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Due today - loaned to {loan.borrower}</span>
          </div>
        )
      } else {
        return (
          <div className="text-blue-600 dark:text-blue-500 flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>On loan to {loan.borrower}</span>
          </div>
        )
      }
    } else {
      // Always show as available when not currently loaned
      // (scheduled loans are shown in their own section)
      return <div className="text-green-600 dark:text-green-500">Available</div>
    }
  }

  // Create the delete confirmation message
  const getDeleteConfirmationMessage = () => {
    // Get the current count of all loans associated with this book
    const loanCount = loans.filter((loan) => loan.bookId === book.id).length

    let message = `Are you sure you want to delete "${book.title}"?`

    if (loanCount > 0) {
      message += ` This will also delete ${loanCount} associated loan record${loanCount === 1 ? "" : "s"}.`
    }

    message += " This action cannot be undone."

    return message
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row gap-6">
          <div className="relative w-full md:w-1/3 max-w-[200px] aspect-[2/3] mx-auto md:mx-0 rounded-md overflow-hidden">
            {!showPlaceholder ? (
              <Image
                src={book.coverImageUrl || "/placeholder.svg"}
                alt={book.title}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <BookPlaceholder title={book.title} author={book.author} />
            )}
          </div>
          <div className="flex-1">
            <CardTitle className="text-2xl">{book.title}</CardTitle>
            <CardDescription className="text-lg mt-1">by {book.author}</CardDescription>

            <div className="mt-4 space-y-2">
              <div>
                <span className="font-medium">Published:</span> {book.publishedDate}
              </div>
              <div>
                <span className="font-medium">ISBN:</span> {book.ISBN}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {bookGenres.map((genre) => (
                  <Badge key={genre.id} variant="secondary">
                    {genre.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <h3 className="font-semibold mb-2">Summary</h3>
          <p className="text-muted-foreground whitespace-pre-line">{book.summary || "No summary available."}</p>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Loan Status</h3>
            {getLoanStatus()}
          </div>

          {scheduledLoans.length > 0 && (
            <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-md">
              <h4 className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {scheduledLoans.length === 1 ? "Scheduled Loan" : "Scheduled Loans"}
              </h4>
              <ul className="mt-2 space-y-2">
                {scheduledLoans
                  .sort((a, b) => new Date(a.loanDate).getTime() - new Date(b.loanDate).getTime())
                  .map((loan) => {
                    const loanDate = new Date(loan.loanDate).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                    const dueDate = new Date(loan.dueDate).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })

                    return (
                      <li key={loan.id} className="text-xs text-purple-600 dark:text-purple-400">
                        {loan.borrower}: {loanDate} to {dueDate}
                      </li>
                    )
                  })}
              </ul>
            </div>
          )}

          {associatedLoans.length > 0 && !isLoaned && scheduledLoans.length === 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Loan History</h3>
              <p className="text-muted-foreground">
                This book has been loaned {associatedLoans.length} time{associatedLoans.length === 1 ? "" : "s"} in the
                past.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 justify-between">
          <div className="flex gap-2">
            <Link href={`/books/${book.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>

            <ConfirmationDialog
              open={showDeleteDialog}
              onOpenChange={setShowDeleteDialog}
              title="Delete Book"
              description={getDeleteConfirmationMessage()}
              onConfirm={handleDelete}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    // Allow deletion even if the book is on loan
                    setShowDeleteDialog(true)
                  }}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
            </ConfirmationDialog>
          </div>

          <div className="flex gap-2">
            {isLoaned ? (
              <ConfirmationDialog
                open={showReturnDialog}
                onOpenChange={setShowReturnDialog}
                title="Return Book"
                description={`Are you sure you want to mark "${book.title}" as returned?`}
                onConfirm={handleReturnBook}
              >
                <AlertDialogTrigger asChild>
                  <Button variant="outline" onClick={() => setShowReturnDialog(true)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Return Book
                  </Button>
                </AlertDialogTrigger>
              </ConfirmationDialog>
            ) : (
              <Button onClick={handleLoanBook}>
                <BookOpen className="h-4 w-4 mr-2" />
                Loan Book
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

