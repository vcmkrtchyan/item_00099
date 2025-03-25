"use client"

import type React from "react"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useLibrary } from "@/context/library-context"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { DateInput } from "@/components/ui/date-input"

export default function ReturnBookPage() {
  const params = useParams()
  const router = useRouter()
  const { getLoan, returnBook, getBook } = useLibrary()
  const loanId = params.id as string

  const loan = getLoan(loanId)
  const book = loan ? getBook(loan.bookId) : null

  const [returnDate, setReturnDate] = useState(new Date().toISOString().split("T")[0])

  if (!loan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/loans">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Loans
            </Button>
          </Link>
        </div>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold">Loan Not Found</h1>
          <p className="text-muted-foreground mt-2">The loan you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    )
  }

  if (loan.returned) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/loans">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Loans
            </Button>
          </Link>
        </div>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold">Book Already Returned</h1>
          <p className="text-muted-foreground mt-2">This book has already been marked as returned.</p>
        </div>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Update the loan with the return date
    returnBook(loanId, returnDate)

    toast({
      title: "Book Returned",
      description: `${book?.title} has been marked as returned.`,
    })

    router.push("/loans")
  }

  const handleDateChange = (value: string) => {
    setReturnDate(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/loans">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Loans
          </Button>
        </Link>
      </div>
      <div className="max-w-2xl mx-auto">
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Return Book</CardTitle>
              <CardDescription>Mark this book as returned to your library.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Book</Label>
                <div className="p-2 border rounded-md bg-muted">{book ? book.title : "Unknown Book"}</div>
              </div>

              <div className="space-y-2">
                <Label>Borrower</Label>
                <div className="p-2 border rounded-md bg-muted">{loan.borrower}</div>
              </div>

              <div className="space-y-2">
                <Label>Loan Date</Label>
                <div className="p-2 border rounded-md bg-muted">{loan.loanDate}</div>
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <div className="p-2 border rounded-md bg-muted">{loan.dueDate}</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="returnDate">Return Date</Label>
                <DateInput
                  id="returnDate"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  onDateChange={handleDateChange}
                  min={loan.loanDate}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit">Mark as Returned</Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

