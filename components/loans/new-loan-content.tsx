"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { LoanForm } from "@/components/loans/loan-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BookPlus } from "lucide-react"
import { useLibrary } from "@/context/library-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function NewLoanContent() {
  const searchParams = useSearchParams()
  const { books, loans } = useLibrary()
  const [hasAvailableBooks, setHasAvailableBooks] = useState(true)

  const bookId = searchParams?.get("bookId") || ""

  useEffect(() => {
    // Check if there are any books available for loan
    const availableBooks = books.filter((book) => {
      // Check if the book is already loaned
      const isLoaned = loans.some((loan) => loan.bookId === book.id && !loan.returned)

      return !isLoaned
    })

    setHasAvailableBooks(availableBooks.length > 0)
  }, [books, loans])

  return (
    <>
      {!hasAvailableBooks ? (
        <Card>
          <CardHeader>
            <CardTitle>No Books Available</CardTitle>
            <CardDescription>All books in your library are currently on loan.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You need to add new books to your library or wait for some books to be returned before creating a new
              loan.
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link href="/loans">
              <Button variant="outline">Back to Loans</Button>
            </Link>
            <Link href="/create-book">
              <Button>
                <BookPlus className="h-4 w-4 mr-2" />
                Add New Book
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ) : (
        <div className="max-w-2xl mx-auto">
          <LoanForm initialBookId={bookId} />
        </div>
      )}
    </>
  )
}

