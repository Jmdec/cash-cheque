"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import LoadingWrapper from "@/components/loading-wrapper"
import Image from "next/image"
import AutocompleteInput from "@/components/autocomplete-input"

interface ChequeVoucher {
  id: string
  paid_to: string
  voucher_no: string
  date: string
  amount: number
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

// Get the Laravel API URL from environment variables
const LARAVEL_API_URL = process.env.NEXT_PUBLIC_API_URL

// Helper function to get full signature URL
const getSignatureUrl = (relativePath: string | null) => {
  if (!relativePath) {
    return "/placeholder.svg?height=60&width=120&text=No+Signature"
  }

  if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
    if (LARAVEL_API_URL) {
      return `/api/proxy-image?url=${encodeURIComponent(relativePath)}`
    } else {
      return "/placeholder.svg?height=60&width=120&text=No+API+URL"
    }
  }

  if (relativePath.startsWith("/signatures/")) {
    if (!LARAVEL_API_URL) {
      return "/placeholder.svg?height=60&width=120&text=No+API+URL"
    }
    let baseUrl = LARAVEL_API_URL.replace(/\/+$/, "")
    if (baseUrl.endsWith("/api")) {
      baseUrl = baseUrl.slice(0, -4)
    }
    const fullLaravelUrl = `${baseUrl}${relativePath}`
    return `/api/proxy-image?url=${encodeURIComponent(fullLaravelUrl)}`
  }

  return "/placeholder.svg?height=60&width=120&text=Invalid+Path"
}

export default function ChequeVoucherEditPage() {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [voucher, setVoucher] = useState<ChequeVoucher | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    paid_to: "",
    voucher_no: "",
    date: "",
    amount: 0,
    purpose: "",
    note: "",
    check_date: "",
    check_no: "",
    account_name: "",
    account_number: "",
    project_details: "",
    owner_client: "",
    received_by_name: "",
    received_by_signature: null as File | null,
    received_by_signature_cleared: false,
    received_by_date: "",
    approved_by_name: "",
    approved_by_signature: null as File | null,
    approved_by_signature_cleared: false,
    approved_by_date: "",
    status: "",
  })

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
          setFormData({
            paid_to: data.paid_to || "",
            voucher_no: data.voucher_no || "",
            date: data.date ? new Date(data.date).toISOString().split("T")[0] : "",
            amount: data.amount || 0,
            purpose: data.purpose || "",
            note: data.note || "",
            check_date: data.check_date ? new Date(data.check_date).toISOString().split("T")[0] : "",
            check_no: data.check_no || "",
            account_name: data.account_name || "",
            account_number: data.account_number || "",
            project_details: data.project_details || "",
            owner_client: data.owner_client || "",
            received_by_name: data.received_by_name || "",
            received_by_signature: null,
            received_by_signature_cleared: false,
            received_by_date: data.received_by_date ? new Date(data.received_by_date).toISOString().split("T")[0] : "",
            approved_by_name: data.approved_by_name || "",
            approved_by_signature: null,
            approved_by_signature_cleared: false,
            approved_by_date: data.approved_by_date ? new Date(data.approved_by_date).toISOString().split("T")[0] : "",
            status: data.status || "",
          })
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === "file") {
      const file = (e.target as HTMLInputElement).files?.[0] || null
      setFormData((prev) => ({
        ...prev,
        [name]: file,
        [`${name}_cleared`]: false,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "number" ? Number.parseFloat(value) || 0 : value,
      }))
    }
  }

  const handleClearSignature = (field: "received_by_signature" | "approved_by_signature") => {
    setFormData((prev) => ({
      ...prev,
      [field]: null,
      [`${field}_cleared`]: true,
    }))
    if (field === "received_by_signature") {
      setVoucher((prev) => (prev ? { ...prev, received_by_signature_url: null } : null))
    } else if (field === "approved_by_signature") {
      setVoucher((prev) => (prev ? { ...prev, approved_by_signature_url: null } : null))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

    setIsSaving(true)
    setError(null)

    const payload = new FormData()

    // Add basic fields
    payload.append("paid_to", formData.paid_to)
    payload.append("voucher_no", formData.voucher_no)
    payload.append("date", formData.date)
    payload.append("amount", formData.amount.toString())
    payload.append("purpose", formData.purpose)
    payload.append("note", formData.note)
    payload.append("check_date", formData.check_date)
    payload.append("check_no", formData.check_no)
    payload.append("account_name", formData.account_name)
    payload.append("account_number", formData.account_number)
    payload.append("project_details", formData.project_details)
    payload.append("owner_client", formData.owner_client)
    payload.append("status", formData.status)

    // Add signature fields
    payload.append("received_by_name", formData.received_by_name)
    payload.append("received_by_date", formData.received_by_date)
    payload.append("approved_by_name", formData.approved_by_name)
    payload.append("approved_by_date", formData.approved_by_date)

    // Add signature files if present
    if (formData.received_by_signature instanceof File) {
      payload.append("received_by_signature", formData.received_by_signature)
    }
    if (formData.approved_by_signature instanceof File) {
      payload.append("approved_by_signature", formData.approved_by_signature)
    }

    // Add signature cleared flags
    if (formData.received_by_signature_cleared) {
      payload.append("received_by_signature_cleared", "1")
    }
    if (formData.approved_by_signature_cleared) {
      payload.append("approved_by_signature_cleared", "1")
    }

    payload.append("_method", "PUT")

    try {
      const response = await fetch(`/api/cheque-vouchers/${id}`, {
        method: "POST",
        body: payload,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || JSON.stringify(errorData.errors) || "Failed to update cheque voucher")
      }

      toast({
        title: "Success",
        description: "Cheque voucher updated successfully!",
      })
      router.push("/admin/cheque")
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Error",
        description: `Failed to update cheque voucher: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <LoadingWrapper>
        <p>Loading cheque voucher for editing...</p>
      </LoadingWrapper>
    )
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>
  }

  if (!voucher) {
    return <div className="p-4 text-gray-500">Cheque Voucher not found.</div>
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Edit Cheque Voucher</h1>
        <Button onClick={() => router.back()}>Back to List</Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 p-6 border rounded-lg shadow-sm bg-white">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="voucher_no">Voucher No</Label>
            <AutocompleteInput
              value={formData.voucher_no}
              onChange={(val) => setFormData({ ...formData, voucher_no: val })}
              type="voucher_no"
              voucher="cheque"
              required={true}
            />
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="paid_to">Paid To</Label>
            <AutocompleteInput
              value={formData.paid_to}
              onChange={(val) => setFormData({ ...formData, paid_to: val })}
              type="paid_to"
              voucher="cheque"
            />
          </div>
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" name="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="Done">Done</option>
              <option value="approved">Approved</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Additional Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="purpose">Purpose</Label>
            <Textarea id="purpose" name="purpose" value={formData.purpose} onChange={handleChange} rows={3} />
          </div>
          <div>
            <Label htmlFor="note">Note</Label>
            <Textarea id="note" name="note" value={formData.note} onChange={handleChange} rows={3} />
          </div>
          <div>
            <Label htmlFor="check_date">Check Date</Label>
            <Input id="check_date" name="check_date" type="date" value={formData.check_date} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="check_no">Check No</Label>
             <AutocompleteInput
              value={formData.check_no}
              onChange={(val) => setFormData({ ...formData, check_no: val })}
              type="check_no"
              voucher="cheque"
              
            />
          </div>
          <div>
            <Label htmlFor="account_name">Account Name</Label>
             <AutocompleteInput
              value={formData.account_name}
              onChange={(val) => setFormData({ ...formData, account_name: val })}
              type="account_name"
              voucher="cheque"
            />
          </div>
          <div>
            <Label htmlFor="account_number">Account Number</Label>
            <AutocompleteInput
              value={formData.account_number}
              onChange={(val) => setFormData({ ...formData, account_number: val })}
              type="account_number"
              voucher="cheque"
            />
          </div>
          <div>
            <Label htmlFor="project_details">Project Details</Label>
            <Input id="project_details" name="project_details" value={formData.project_details} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="owner_client">Owner/Client</Label>
            <AutocompleteInput
              value={formData.owner_client}
              onChange={(val) => setFormData({ ...formData, owner_client: val })}
              type="owner_client"
              voucher="cheque"
            />
          </div>
        </div>

        {/* Received By */}
        <div>
          <h2 className="text-xl font-bold mt-6 mb-4">Received By</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="received_by_name">Name</Label>
              <Input id="received_by_name" name="received_by_name" value={formData.received_by_name} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="received_by_date">Date</Label>
              <Input id="received_by_date" name="received_by_date" type="date" value={formData.received_by_date} onChange={handleChange} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="received_by_signature">Signature</Label>
              <Input id="received_by_signature" name="received_by_signature" type="file" onChange={handleChange} />
              {voucher?.received_by_signature_url && !formData.received_by_signature_cleared && (
                <div className="mt-2 flex items-center space-x-2">
                  <Image
                    src={getSignatureUrl(voucher.received_by_signature_url) || "/placeholder.svg"}
                    alt="Current Received By Signature"
                    width={100}
                    height={50}
                    className="border"
                    crossOrigin="anonymous"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => handleClearSignature("received_by_signature")}>
                    Clear Signature
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Approved By */}
        <div>
          <h2 className="text-xl font-bold mt-6 mb-4">Approved By</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="approved_by_name">Name</Label>
              <Input id="approved_by_name" name="approved_by_name" value={formData.approved_by_name} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="approved_by_date">Date</Label>
              <Input id="approved_by_date" name="approved_by_date" type="date" value={formData.approved_by_date} onChange={handleChange} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="approved_by_signature">Signature</Label>
              <Input id="approved_by_signature" name="approved_by_signature" type="file" onChange={handleChange} />
              {voucher?.approved_by_signature_url && !formData.approved_by_signature_cleared && (
                <div className="mt-2 flex items-center space-x-2">
                  <Image
                    src={getSignatureUrl(voucher.approved_by_signature_url) || "/placeholder.svg"}
                    alt="Current Approved By Signature"
                    width={100}
                    height={50}
                    className="border"
                    crossOrigin="anonymous"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => handleClearSignature("approved_by_signature")}>
                    Clear Signature
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  )
}
