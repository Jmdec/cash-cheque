"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Download } from "lucide-react"
import domtoimage from "dom-to-image"
import { ChequeVoucherPreview } from "@/components/cheque-voucher-preview"

interface ChequeVoucher {
  id: string
  paid_to: string
  voucher_no: string
  date: string
  amount: number | null
  purpose: string
  note?: string
  check_date?: string
  check_no: string
  account_name: string
  account_number: string
  project_details?: string
  owner_client?: string
  received_by_name: string
  received_by_signature_url: string | null
  received_by_date: string
  approved_by_name: string
  approved_by_signature_url: string | null
  approved_by_date: string
  status: string
}

export default function ChequeVoucherViewPage() {
  const { id } = useParams()
  const { toast } = useToast()
  const [voucher, setVoucher] = useState<ChequeVoucher | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (id) {
      const fetchVoucher = async () => {
        try {
          setIsLoading(true)
          const response = await fetch(`/api/cheque-vouchers/${id}`)
          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || "Failed to fetch cheque voucher")
          }
          const data: ChequeVoucher = await response.json()
          setVoucher(data)
        } catch (err: any) {
          setError(err.message)
          toast({
            title: "Error",
            description: `Failed to load cheque voucher: ${err.message}`,
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      }

      fetchVoucher()
    }
  }, [id, toast])

  // Function to export the voucher as an image using dom-to-image
  const exportAsImage = async () => {
    if (!previewRef.current) return
    try {
      setIsSaving(true)
      const node = previewRef.current
      // Wait for images (e.g., logos, signatures) to load
      const images = Array.from(node.querySelectorAll("img"))
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve()
          return new Promise((res) => {
            img.onload = img.onerror = res
          })
        }),
      )
      // Generate PNG from node, using a fixed width for export
      const originalWidth = node.style.width
      const originalMaxWidth = node.style.maxWidth
      node.style.width = "1800px"
      node.style.maxWidth = "1800px"
      const dataUrl = await (domtoimage as any).toPng(node, {
        bgcolor: "#ffffff",
        width: 1800,
        height: node.offsetHeight,
        style: {
          backgroundColor: "#ffffff",
          boxSizing: "border-box",
        },
      })
      node.style.width = originalWidth
      node.style.maxWidth = originalMaxWidth
      // Download
      const link = document.createElement("a")
      link.download = `cheque-voucher-${voucher?.voucher_no || "untitled"}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error("Export failed:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export voucher image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading cheque voucher details...</p>
      </div>
    )
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>
  }

  if (!voucher) {
    return <div className="p-4 text-gray-500">Cheque Voucher not found.</div>
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Cheque Voucher View</h1>
        <p className="text-slate-500">View and export cheque voucher details.</p>
      </div>

      <div className="mb-4 flex justify-end w-full">
        <Button onClick={exportAsImage} variant="outline" className="flex items-center gap-2 bg-transparent" disabled={isSaving}>
          <Download className="h-4 w-4" />
          {isSaving ? "Exporting..." : "Export as Image"}
        </Button>
      </div>

      {/* Full Width Preview Section */}
      <Card className="w-full border rounded-lg bg-white shadow-sm">
        <ChequeVoucherPreview ref={previewRef} voucher={voucher} />
      </Card>
    </div>
  )
}
