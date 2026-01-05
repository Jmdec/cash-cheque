"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, PlusCircle, Info, Lightbulb } from "lucide-react" // Added Lightbulb icon
import Link from "next/link"
import ABICLoader from "@/components/abic-loader"
import api from "@/lib/api"

const CreateAccountContent = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false)
    }, 800) // Show loader for 800ms on initial load
    return () => clearTimeout(timer)
  }, [])

  // Add this early return for initial loading
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ABICLoader size="lg" text="Loading account form..." className="animate-fade-in" />
      </div>
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    const formData = new FormData(event.currentTarget)
    const account_name = formData.get("account_name") as string
    const account_number = formData.get("account_number") as string

    try {
      await api.createAccount(account_name, account_number)
      toast({
        title: "Account created successfully",
        description: `Account ${account_name} has been created`,
      })
      router.push("/dashboard/accounts")
    } catch (error: any) {
      toast({
        title: "Failed to create account",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* Loader Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 shadow-2xl">
            <ABICLoader size="lg" text="Creating account..." />
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard/accounts">
            <Button
              variant="ghost"
              className="text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Accounts
            </Button>
          </Link>
        </div>

        {/* Main content area with a two-column layout on larger screens */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Form Card */}
          <Card className="lg:col-span-2 shadow-xl border border-gray-200 rounded-xl overflow-hidden">
            <CardHeader className="bg-white p-6 border-b border-gray-100 flex flex-row items-center space-x-4">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                <PlusCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-extrabold text-gray-900">Create New Account</CardTitle>
                <CardDescription className="text-gray-600 text-base mt-1">
                  Fill in the details to add a new accounting account to your system.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6 bg-white">
              <form onSubmit={handleSubmit} className="space-y-7">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="account_name" className="text-gray-800 font-semibold text-sm">
                      Account Name
                    </Label>
                    <Input
                      id="account_name"
                      name="account_name"
                      type="text"
                      placeholder="e.g., Office Supplies, Marketing Expenses"
                      required
                      className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                    />
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Info className="h-3 w-3 text-gray-400 flex-shrink-0" />A descriptive name for the account.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account_number" className="text-gray-800 font-semibold text-sm">
                      Account Number
                    </Label>
                    <Input
                      id="account_number"
                      name="account_number"
                      type="text"
                      placeholder="e.g., 1001, 2500, ACC-001"
                      required
                      className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                    />
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Info className="h-3 w-3 text-gray-400 flex-shrink-0" />A unique identifier for the account.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-md transition-all duration-200 shadow-md hover:shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                  <Link href="/dashboard/accounts" className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-800 transition-all duration-200 py-2.5 px-4 rounded-md shadow-sm hover:shadow-md"
                    >
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Right Column: Account Guidelines Card */}
          <Card className="lg:col-span-1 shadow-xl border border-gray-200 rounded-xl bg-white">
            <CardHeader className="p-6 pb-4 flex flex-row items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center flex-shrink-0">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
              </div>
              <CardTitle className="text-lg font-bold text-gray-900">Account Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="text-sm text-gray-700">
                <h4 className="font-semibold text-gray-900 mb-2">Account Name Guidelines:</h4>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>Use descriptive names that clearly identify the account purpose.</li>
                  <li>Both text and numbers are allowed.</li>
                  <li>Keep names concise but informative.</li>
                </ul>
              </div>
              <div className="text-sm text-gray-700">
                <h4 className="font-semibold text-gray-900 mb-2">Account Number Guidelines:</h4>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>Account numbers must be unique across the system.</li>
                  <li>Use a consistent numbering scheme for organization.</li>
                  <li>Consider using prefixes for different account types.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default CreateAccountContent
