"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoanForm } from "@/components/loans/loan-form"
import { useLibrary } from "@/context/library-context"
import { toast } from "@/components/ui/use-toast"

interface EditLoanContentProps {
  loanId: string
}

export function EditLoanContent({ loanId }: EditLoanContentProps) {
  const router = useRouter()
  const { getLoan } = useLibrary()

  // Check if the loan is already returned and redirect if it is
  useEffect(() => {
    const loan = getLoan(loanId)
    if (loan?.returned) {
      toast({
        title: "Cannot edit returned loan",
        description: "Loans that have been returned cannot be edited.",
        variant: "destructive",
      })
      router.push("/loans")
    }
  }, [loanId, getLoan, router])

  return (
    <div className="max-w-2xl mx-auto">
      <LoanForm loanId={loanId} />
    </div>
  )
}

