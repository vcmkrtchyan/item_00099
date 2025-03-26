import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { NewLoanContent } from "@/components/loans/new-loan-content"

export default function NewLoanPage() {
  return (
    <div className="space-y-6 px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <Link href="/loans">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Loans
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <NewLoanContent />
      </Suspense>
    </div>
  )
}

