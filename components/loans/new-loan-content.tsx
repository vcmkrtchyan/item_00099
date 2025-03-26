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
  const { books } = useLibrary()
  const [hasBooks, setHasBooks] = useState(true)

  const bookId = searchParams?.get("bookId") || ""

  useEffect(() => {
    // Check if there are any books in the library
    setHasBooks(books.length > 0)
  }, [books])

  return (
    <>
      {!hasBooks ? (
        <Card className="mx-4 sm:mx-0">
          <CardHeader>
            <CardTitle>No Books Available</CardTitle>
            <CardDescription>You don't have any books in your library yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You need to add books to your library before you can create loans.</p>
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
        <div className="max-w-2xl mx-auto px-4 sm:px-0">
          <LoanForm initialBookId={bookId} />
        </div>
      )}
    </>
  )
}

