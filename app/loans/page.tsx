import { LoanList } from "@/components/loans/loan-list"

export default function LoansPage() {
  return (
    <div className="space-y-6 px-4 md:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Loans</h1>
        <p className="text-muted-foreground">Track and manage book loans.</p>
      </div>
      <LoanList />
    </div>
  )
}

