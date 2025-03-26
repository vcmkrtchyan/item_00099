"use client"

import { useState } from "react"
import { useLibrary } from "@/context/library-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, CheckCircle, Trash, Calendar } from "lucide-react"
import Link from "next/link"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"

export function LoanList() {
  const { loans, books, getBook, returnBook, deleteLoan, getLoanStatus } = useLibrary()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loanToReturn, setLoanToReturn] = useState<string | null>(null)
  const [loanToDelete, setLoanToDelete] = useState<string | null>(null)

  const filteredLoans = loans.filter((loan) => {
    const book = getBook(loan.bookId)
    const matchesSearch =
      book?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.borrower.toLowerCase().includes(searchTerm.toLowerCase())

    // Get loan status
    const status = getLoanStatus(loan)

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && status === "active") ||
      (statusFilter === "pending" && status === "pending") ||
      (statusFilter === "overdue" && status === "overdue") ||
      (statusFilter === "scheduled" && status === "scheduled") ||
      (statusFilter === "returned" && loan.returned)

    return matchesSearch && matchesStatus
  })

  const handleReturnBook = () => {
    if (loanToReturn) {
      const loan = getLoan(loanToReturn)
      const book = loan ? getBook(loan.bookId) : null

      returnBook(loanToReturn)

      // Show toast notification
      toast({
        title: "Book Returned",
        description: book ? `"${book.title}" has been returned successfully.` : "Book has been returned successfully.",
        variant: "success",
      })

      setLoanToReturn(null)
    }
  }

  const handleDeleteLoan = () => {
    if (loanToDelete) {
      const loan = getLoan(loanToDelete)
      const book = loan ? getBook(loan.bookId) : null

      deleteLoan(loanToDelete)

      // Show toast notification
      toast({
        title: "Loan Deleted",
        description: book ? `Loan for "${book.title}" has been deleted.` : "Loan has been deleted.",
        variant: "success",
      })

      setLoanToDelete(null)
    }
  }

  const getLoan = (id: string) => {
    return loans.find((loan) => loan.id === id)
  }

  const getLoanStatusBadge = (loan: (typeof loans)[0]) => {
    const statusType = getLoanStatus(loan)

    switch (statusType) {
      case "returned":
        return <Badge variant="outline">Returned</Badge>
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>
      case "pending":
        return <Badge variant="warning">Pending Return</Badge>
      case "active":
        return <Badge variant="secondary">Active</Badge>
      case "scheduled":
        return (
          <Badge className="bg-purple-500 hover:bg-purple-600">
            <Calendar className="h-3 w-3 mr-1" />
            Scheduled
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-end justify-between">
        <div className="flex-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by book title or borrower..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Loans</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending Return</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Link href="/loans/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Loan
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Loans</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLoans.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No loans found. Try adjusting your filters or create a new loan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Loan Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLoans.map((loan) => {
                    const book = getBook(loan.bookId)
                    const status = getLoanStatus(loan)
                    const isScheduled = status === "scheduled"

                    return (
                      <TableRow key={loan.id}>
                        <TableCell className="font-medium">{book ? book.title : "Unknown Book"}</TableCell>
                        <TableCell>{loan.borrower}</TableCell>
                        <TableCell>{loan.loanDate}</TableCell>
                        <TableCell>{loan.dueDate}</TableCell>
                        <TableCell>{getLoanStatusBadge(loan)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {!loan.returned && (
                              <Link href={`/loans/${loan.id}/edit`}>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                              </Link>
                            )}

                            {!loan.returned && !isScheduled && (
                              <ConfirmationDialog
                                open={loanToReturn === loan.id}
                                onOpenChange={(open) => {
                                  if (!open) setLoanToReturn(null)
                                }}
                                title="Return Book"
                                description={`Are you sure you want to mark "${book?.title}" as returned?`}
                                onConfirm={handleReturnBook}
                              >
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => setLoanToReturn(loan.id)}>
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="sr-only">Return</span>
                                  </Button>
                                </AlertDialogTrigger>
                              </ConfirmationDialog>
                            )}

                            {/* Delete Loan Button */}
                            <ConfirmationDialog
                              open={loanToDelete === loan.id}
                              onOpenChange={(open) => {
                                if (!open) setLoanToDelete(null)
                              }}
                              title="Delete Loan"
                              description={`Are you sure you want to delete this loan${book ? ` for "${book.title}"` : ""}? This action cannot be undone.`}
                              onConfirm={handleDeleteLoan}
                            >
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => setLoanToDelete(loan.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </AlertDialogTrigger>
                            </ConfirmationDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

