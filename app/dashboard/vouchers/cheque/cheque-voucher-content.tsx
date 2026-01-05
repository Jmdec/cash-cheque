"use client"

import { useState, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Download, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import ChequeVoucherPreview from "@/components/vouchers/cheque-voucher-preview"
import html2canvas from "html2canvas"
import api from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import ABICLoader from "@/components/abic-loader"
import type { ChequeVoucherFormData, ParticularItem } from "@/types/cheque-voucher"

interface Account {
  id: number
  account_name: string
  account_number: string
}

const ChequeVoucherPageContent = () => {
  const searchParams = useSearchParams()
  const accountId = searchParams.get("account_id")
  const previewRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingNumber, setIsLoadingNumber] = useState(false)
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)
  const [accounts, setAccounts] = useState<Account[]>([])
  const { toast } = useToast()

  const [formData, setFormData] = useState<ChequeVoucherFormData>({
    account_id: accountId || "",
    voucher_no: "",
    cheque_no: "",
    paid_to: "",
    date: new Date().toISOString().split("T")[0],
    particulars: [{ id: "1", description: "", amount: "" }],
    total_amount: "",
    received_signature: "",
    received_printed_name: "",
    approved_signature: "",
    approved_printed_name: "",
    approved_date: new Date().toISOString().split("T")[0],
  })

  const showLoader = isExporting || isSaving || isLoadingNumber

  // Calculate total amount whenever particulars change
  useEffect(() => {
    // Safe access to particulars with fallback to empty array
    const particulars = formData.particulars || []
    const total = particulars.reduce((sum, particular) => {
      const amount = Number.parseFloat(particular.amount) || 0
      return sum + amount
    }, 0)
    setFormData((prev) => ({
      ...prev,
      total_amount: total.toString(),
    }))
  }, [formData.particulars])

  // Fetch accounts on component load
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setIsLoadingAccounts(true)
        const response = await api.getAccounts()
        let accountsData: Account[] = []
        if (response?.data) {
          if (Array.isArray(response.data)) {
            accountsData = response.data
          } else if (response.data.data && Array.isArray(response.data.data)) {
            accountsData = response.data.data
          }
        }
        setAccounts(accountsData || [])
        if (accountId) {
          const selectedAccount = accountsData.find((acc) => acc.id.toString() === accountId)
          if (selectedAccount) {
            setFormData((prev) => ({
              ...prev,
              account_id: accountId,
            }))
            fetchVoucherNumber(accountId)
          }
        }
      } catch (error) {
        console.error("Error fetching accounts:", error)
      } finally {
        setIsLoadingAccounts(false)
      }
    }
    fetchAccounts()
  }, [accountId])

  const fetchVoucherNumber = async (accountId?: string) => {
    try {
      setIsLoadingNumber(true)
      const selectedAccountId = accountId || formData.account_id
      if (!selectedAccountId) {
        toast({
          title: "Error",
          description: "Please select an account first",
          variant: "destructive",
        })
        return
      }
      const voucherResponse = await api.getNextVoucherNumber(selectedAccountId)
      if (voucherResponse.success) {
        setFormData((prev) => ({
          ...prev,
          voucher_no: voucherResponse.voucher_number,
        }))
      } else {
        throw new Error("Failed to generate voucher number")
      }
    } catch (error) {
      console.error("Error fetching voucher number:", error)
      toast({
        title: "Warning",
        description: "Could not fetch voucher number. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingNumber(false)
    }
  }

  const handleAccountChange = (accountId: string) => {
    const selectedAccount = accounts.find((acc) => acc.id.toString() === accountId)
    if (selectedAccount) {
      setFormData((prev) => ({
        ...prev,
        account_id: accountId,
      }))
      fetchVoucherNumber(accountId)
    } else {
      setFormData((prev) => ({
        ...prev,
        account_id: "",
        voucher_no: "",
      }))
    }
  }

  const addParticular = () => {
    const newParticular: ParticularItem = {
      id: Date.now().toString(),
      description: "",
      amount: "",
    }
    setFormData((prev) => ({
      ...prev,
      particulars: [...(prev.particulars || []), newParticular],
    }))
  }

  const removeParticular = (id: string) => {
    const currentParticulars = formData.particulars || []
    if (currentParticulars.length > 1) {
      setFormData((prev) => ({
        ...prev,
        particulars: (prev.particulars || []).filter((p) => p.id !== id),
      }))
    }
  }

  const updateParticular = (id: string, field: "description" | "amount", value: string) => {
    setFormData((prev) => ({
      ...prev,
      particulars: (prev.particulars || []).map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    }))
  }

  const validateForm = () => {
    const errors: string[] = []
    if (!formData.account_id) errors.push("Please select an account")
    if (!formData.voucher_no.trim()) errors.push("Voucher number is required")
    if (!formData.cheque_no.trim()) errors.push("Cheque number is required")
    if (!formData.paid_to.trim()) errors.push("Paid to is required")
    if (!formData.date) errors.push("Date is required")

    const particulars = formData.particulars || []
    const hasValidParticulars = particulars.some((p) => p.description.trim() && Number.parseFloat(p.amount) > 0)
    if (!hasValidParticulars) errors.push("At least one particular with description and amount is required")
    if (!formData.total_amount || Number.parseFloat(formData.total_amount) <= 0)
      errors.push("Total amount must be greater than 0")
    if (!(formData.approved_printed_name || "").trim()) errors.push("Approved printed name is required")
    if (!formData.approved_date) errors.push("Approved date is required")

    return errors
  }

  const updateFormData = (field: keyof ChequeVoucherFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleFileUpload = (field: "received_signature" | "approved_signature", file: File) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      updateFormData(field, event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // FIXED: Export with proper scaling for full content
  const exportAsJPEG = async () => {
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join(", "),
        variant: "destructive",
      })
      return
    }

    if (!previewRef.current) return
    setIsExporting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 100))
      // FIXED: Temporarily scale up for export to capture full content
      const voucherElement = previewRef.current.querySelector("[data-voucher-container]") as HTMLElement
      const originalTransform = voucherElement?.style.transform || ""
      const originalWidth = voucherElement?.style.width || ""

      if (voucherElement) {
        // Temporarily set to full size for export
        voucherElement.style.transform = "scale(1)"
        voucherElement.style.width = "800px"
      }

      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: false,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1200,
        windowHeight: 800,
      })

      // Restore original styling
      if (voucherElement) {
        voucherElement.style.transform = originalTransform
        voucherElement.style.width = originalWidth
      }

      const link = document.createElement("a")
      link.download = `cheque-voucher-${formData.voucher_no || "draft"}.jpg`
      link.href = canvas.toDataURL("image/jpeg", 0.95)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export Successful",
        description: `Cheque voucher ${formData.voucher_no} has been exported.`,
      })
    } catch (error) {
      console.error("Error exporting voucher:", error)
      toast({
        title: "Export Failed",
        description: "Error exporting voucher. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const saveVoucher = async () => {
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join(", "),
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const dataToSave = {
        ...formData,
        account_id: formData.account_id ? Number.parseInt(formData.account_id) : null,
        particulars: JSON.stringify(formData.particulars || []),
        amount: formData.total_amount,
      }

      const response = await api.createChequeVoucher(dataToSave)
      if (response.success) {
        toast({
          title: "Success",
          description: `Cheque voucher ${formData.voucher_no} has been saved successfully!`,
        })
        // FIXED: Refresh voucher number after successful save
        if (formData.account_id) {
          await fetchVoucherNumber(formData.account_id)
        }
        // Clear form data except account selection
        setFormData((prev) => ({
          ...prev,
          cheque_no: "",
          paid_to: "",
          particulars: [{ id: "1", description: "", amount: "" }],
          total_amount: "",
          received_signature: "",
          received_printed_name: "",
          approved_signature: "",
          approved_printed_name: "",
          approved_date: new Date().toISOString().split("T")[0],
        }))
      } else {
        throw new Error(response.message || "Failed to save cheque voucher")
      }
    } catch (error) {
      console.error("Error saving cheque voucher:", error)
      toast({
        title: "Save Failed",
        description: "Error saving cheque voucher. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Safe access to particulars with fallback
  const particulars = formData.particulars || []

  return (
    <div className="space-y-6">
      {showLoader && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <ABICLoader
              size="lg"
              text={
                isExporting
                  ? "Exporting voucher..."
                  : isSaving
                    ? "Saving voucher to database..."
                    : isLoadingNumber
                      ? "Generating voucher number..."
                      : "Processing..."
              }
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link href="/dashboard/accounts">
          <Button variant="ghost" size="sm" className="w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Accounts
          </Button>
        </Link>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            onClick={saveVoucher}
            variant="outline"
            disabled={isSaving}
            className="w-full sm:w-auto bg-transparent"
          >
            {isSaving ? "Saving..." : "Save Voucher"}
          </Button>
          <Button
            onClick={exportAsJPEG}
            disabled={isExporting}
            className="flex items-center w-full sm:w-auto"
            style={{
              backgroundColor: isExporting ? "#a24c9a" : "#b94ba7",
              color: "white",
              cursor: isExporting ? "not-allowed" : "pointer",
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export as JPEG"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Form Section */}
        <Card>
          <CardHeader>
            <CardTitle>Cheque Voucher Details</CardTitle>
            <CardDescription>Fill in the cheque voucher information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Account Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Account Selection</h3>
              <div className="space-y-2">
                <Label htmlFor="account_id">
                  Select Account <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.account_id} onValueChange={handleAccountChange} disabled={isLoadingAccounts}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingAccounts ? "Loading accounts..." : "Select an account"} />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{account.account_name}</span>
                          <span className="text-sm text-muted-foreground">Account #{account.account_number}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="voucher_no">Voucher No. (Auto-generated)</Label>
                  <Input
                    id="voucher_no"
                    value={isLoadingNumber ? "Generating..." : formData.voucher_no}
                    disabled
                    className="bg-gray-50 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cheque_no">
                    Cheque No. <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="cheque_no"
                    value={formData.cheque_no}
                    onChange={(e) => updateFormData("cheque_no", e.target.value)}
                    placeholder="Enter cheque number manually"
                    required
                    className="font-mono"
                  />
                  <p className="text-sm text-muted-foreground">Enter the cheque number manually</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paid_to">
                    Paid To <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="paid_to"
                    value={formData.paid_to}
                    onChange={(e) => updateFormData("paid_to", e.target.value)}
                    placeholder="Enter recipient name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">
                    Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => updateFormData("date", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Particulars Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2 flex-1">Particulars</h3>
                <Button type="button" onClick={addParticular} size="sm" className="ml-4">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Particular
                </Button>
              </div>
              {particulars.map((particular, index) => (
                <div key={particular.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Particular #{index + 1}</Label>
                    {particulars.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeParticular(particular.id)}
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`description-${particular.id}`}>
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id={`description-${particular.id}`}
                      value={particular.description}
                      onChange={(e) => updateParticular(particular.id, "description", e.target.value)}
                      placeholder="Enter particular description"
                      rows={2}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`amount-${particular.id}`}>
                      Amount <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`amount-${particular.id}`}
                      value={particular.amount}
                      onChange={(e) => updateParticular(particular.id, "amount", e.target.value)}
                      placeholder="0.00"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                </div>
              ))}
              {/* Total Amount Display */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <Label className="text-lg font-semibold">Total Amount:</Label>
                  <span className="text-lg font-bold">
                    {Number.parseFloat(formData.total_amount || "0").toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Received By Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Received By</h3>
              <div className="space-y-2">
                <Label htmlFor="received_signature">Signature</Label>
                <Input
                  id="received_signature"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload("received_signature", file)
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="received_printed_name">Printed Name</Label>
                <Input
                  id="received_printed_name"
                  value={formData.received_printed_name || ""}
                  onChange={(e) => updateFormData("received_printed_name", e.target.value)}
                  placeholder="Enter printed name"
                />
              </div>
            </div>

            {/* Approved By Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Approved By</h3>
              <div className="space-y-2">
                <Label htmlFor="approved_signature">Signature</Label>
                <Input
                  id="approved_signature"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload("approved_signature", file)
                  }}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="approved_printed_name">
                    Printed Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="approved_printed_name"
                    value={formData.approved_printed_name || ""}
                    onChange={(e) => updateFormData("approved_printed_name", e.target.value)}
                    placeholder="Enter printed name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="approved_date">
                    Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="approved_date"
                    type="date"
                    value={formData.approved_date || ""}
                    onChange={(e) => updateFormData("approved_date", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview Section - FIXED: No scrolling, perfect fit */}
        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>Real-time preview of your cheque voucher</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              ref={previewRef}
              className="border border-gray-300 bg-white voucher-container"
              data-voucher-container
              style={{
                // FIXED: Perfect fit without scrolling
                width: "100%",
                maxWidth: "100%",
                overflow: "hidden", // NO scrolling
                padding: "8px",
                // Scale to fit perfectly within container
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
              }}
            >
              <ChequeVoucherPreview formData={formData} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ChequeVoucherPageContent
