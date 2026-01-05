"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  User,
  Shield,
  Mail,
  Calendar,
  Building,
  Crown,
  Clock,
  Info,
  BookOpen,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  FileText,
  Calculator,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UserData {
  id: string
  name: string
  email: string
  role: string
  email_verified_at: string | null
  created_at: string | null
  updated_at: string | null
}

interface SettingsSection {
  id: string
  title: string
  icon: React.ReactNode
  description: string
}

export default function SettingsPage() {
  const { toast } = useToast()
  const [activeSection, setActiveSection] = useState("profile")
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState<UserData | null>(null)

  const sections: SettingsSection[] = [
    {
      id: "profile",
      title: "Profile",
      icon: <User className="h-5 w-5" />,
      description: "View your personal information",
    },
    {
      id: "security",
      title: "Security",
      icon: <Shield className="h-5 w-5" />,
      description: "Account security and authentication",
    },
    {
      id: "announcements",
      title: "Announcements",
      icon: <Info className="h-5 w-5" />,
      description: "Latest system updates and news",
    },
    {
      id: "accounting",
      title: "Accounting Guide",
      icon: <BookOpen className="h-5 w-5" />,
      description: "Accounting principles and guidelines",
    },
  ]

  const fetchUserData = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("authToken")
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to view your profile.",
          variant: "destructive",
        })
        return
      }
      const response = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch user data")
      }
      const data = await response.json()
      if (data.success && data.user) {
        setUserData(data.user)
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error: any) {
      console.error("Error fetching user data:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load user information.",
        variant: "destructive",
      })
      if (error.message.includes("authenticated") || error.message.includes("401")) {
        localStorage.removeItem("authToken")
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  // Helper function to format dates consistently
  const formatDate = (dateString: string | null | undefined, includeTime = false) => {
    if (!dateString) return "Not available"
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      ...(includeTime && {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    }
    return date.toLocaleDateString("en-US", options)
  }

  const ProfileContent = () => (
    <div className="space-y-8">
      {/* User Header */}
      <div className="flex items-center space-x-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {userData?.name?.charAt(0) || "U"}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white bg-green-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900">{userData?.name || "Loading..."}</h3>
          <p className="text-purple-600 font-medium">{userData?.role || "User"}</p>
          <div className="flex items-center mt-2 text-sm text-gray-600">
            <div className="w-2 h-2 rounded-full mr-2 bg-green-400" />
            Active
          </div>
        </div>
      </div>
      {/* User Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center mb-4">
            <Mail className="h-5 w-5 text-blue-500 mr-3" />
            <h4 className="font-semibold text-gray-900">Email Address</h4>
          </div>
          <p className="text-gray-600 font-mono text-sm bg-gray-50 px-3 py-2 rounded-lg">
            {userData?.email || "Not provided"}
          </p>
          <div className="mt-2 flex items-center">
            <div
              className={`w-2 h-2 rounded-full mr-2 ${userData?.email_verified_at ? "bg-green-400" : "bg-orange-400"}`}
            />
            <span className={`text-xs ${userData?.email_verified_at ? "text-green-600" : "text-orange-600"}`}>
              {userData?.email_verified_at ? "Verified" : "Not Verified"}
            </span>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center mb-4">
            <Building className="h-5 w-5 text-green-500 mr-3" />
            <h4 className="font-semibold text-gray-900">Role</h4>
          </div>
          <p className="text-gray-600">{userData?.role || "Not specified"}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center mb-4">
            <Calendar className="h-5 w-5 text-orange-500 mr-3" />
            <h4 className="font-semibold text-gray-900">Member Since</h4>
          </div>
          <p className="text-gray-600">{formatDate(userData?.created_at)}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center mb-4">
            <Clock className="h-5 w-5 text-indigo-500 mr-3" />
            <h4 className="font-semibold text-gray-900">Last Updated</h4>
          </div>
          <p className="text-gray-600">{formatDate(userData?.updated_at, true)}</p>
        </motion.div>
      </div>
      {/* Account Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-6"
      >
        <div className="flex items-center mb-4">
          <Crown className="h-5 w-5 text-indigo-500 mr-3" />
          <h4 className="font-semibold text-gray-900">Account Information</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">#{userData?.id || "N/A"}</div>
            <div className="text-sm text-gray-600">User ID</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">Active</div>
            <div className="text-sm text-gray-600">Account Status</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-600">{userData?.role || "User"}</div>
            <div className="text-sm text-gray-600">Role</div>
          </div>
        </div>
      </motion.div>
    </div>
  )

  const SecurityContent = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-100 p-6">
        <div className="flex items-center mb-4">
          <Shield className="h-6 w-6 text-green-500 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Account Security</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Authentication Status</h4>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
              <span className="text-green-600 font-medium">Authenticated</span>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Email Verification</h4>
            <div className="flex items-center">
              <div
                className={`w-3 h-3 rounded-full mr-2 ${
                  userData?.email_verified_at ? "bg-green-400" : "bg-orange-400"
                }`}
              ></div>
              <span className={`font-medium ${userData?.email_verified_at ? "text-green-600" : "text-orange-600"}`}>
                {userData?.email_verified_at ? "Verified" : "Not Verified"}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Security Information</h4>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-gray-600">Account Created</span>
            <span className="text-gray-900 font-medium">{formatDate(userData?.created_at, true)}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-gray-600">Email Verified</span>
            <span className={`font-medium ${userData?.email_verified_at ? "text-green-600" : "text-orange-600"}`}>
              {userData?.email_verified_at ? formatDate(userData.email_verified_at, true) : "Not verified"}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-gray-600">Last Profile Update</span>
            <span className="text-gray-900 font-medium">{formatDate(userData?.updated_at, true)}</span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-gray-600">Login Method</span>
            <span className="text-green-600 font-medium">Email & Password</span>
          </div>
        </div>
      </div>
    </div>
  )

  const AnnouncementsContent = () => (
    <div className="space-y-6">
      {/* Latest Updates */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
        <div className="flex items-center mb-4">
          <CheckCircle className="h-6 w-6 text-blue-500 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Latest System Updates</h3>
        </div>
        <div className="space-y-4">
          {/* New Announcement: Purpose Data Fetch */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-900">Purpose Data Display Fix</h4>
              <span className="text-xs text-gray-500 bg-green-100 text-green-700 px-2 py-1 rounded">Bug Fix</span>
            </div>
            <p className="text-sm text-gray-600">
              Resolved an issue where purpose data was not being fetched and displayed correctly. The system now
              properly retrieves and shows all purpose-related information.
            </p>
          </div>
          {/* New Announcement: Enhanced Search Functionality */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-900">Enhanced Search Capabilities</h4>
              <span className="text-xs text-gray-500 bg-blue-100 text-blue-700 px-2 py-1 rounded">Improvement</span>
            </div>
            <p className="text-sm text-gray-600">
              Search functionality has been significantly improved. Users can now search across all data fields in
              tables, not just the payee name, providing more flexible and comprehensive data retrieval.
            </p>
          </div>
          {/* New Announcement: Pagination Fix */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-900">Pagination System Overhaul</h4>
              <span className="text-xs text-gray-500 bg-purple-100 text-purple-700 px-2 py-1 rounded">
                Fix & Improve
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Addressed issues with pagination. There is now only one functional pagination control, and it correctly
              displays all data across multiple pages, ensuring all records are accessible.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-900">Voucher Cancel and Update Fixes</h4>
              <span className="text-xs text-gray-500 bg-green-100 text-green-700 px-2 py-1 rounded">Bug Fix</span>
            </div>
            <p className="text-sm text-gray-600">
              The issues related to voucher cancellation and updating have been successfully resolved and implemented
              across the system, ensuring smoother operations.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-900">Enhanced Admin View Pages</h4>
              <span className="text-xs text-gray-500 bg-green-100 text-green-700 px-2 py-1 rounded">New Feature</span>
            </div>
            <p className="text-sm text-gray-600">
              Comprehensive admin view pages have been added for both Cash Vouchers and Cheque Vouchers with detailed
              information display, signature viewing, and enhanced data management capabilities.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-900">Complete CRUD Operations</h4>
              <span className="text-xs text-gray-500 bg-blue-100 text-blue-700 px-2 py-1 rounded">Enhanced</span>
            </div>
            <p className="text-sm text-gray-600">
              Full Create, Read, Update, and Delete functionality implemented for voucher management. Users can now
              perform all essential operations with proper validation and error handling.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-900">OTP Email Verification for Deletions</h4>
              <span className="text-xs text-gray-500 bg-red-100 text-red-700 px-2 py-1 rounded">Security</span>
            </div>
            <p className="text-sm text-gray-600">
              Enhanced security measure: OTP (One-Time Password) is now sent to registered email addresses when
              attempting to delete vouchers, ensuring authorized access and preventing accidental deletions.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-900">Export to Image Functionality</h4>
              <span className="text-xs text-gray-500 bg-purple-100 text-purple-700 px-2 py-1 rounded">New Feature</span>
            </div>
            <p className="text-sm text-gray-600">
              Admin view pages now include export to image functionality, allowing users to generate high-quality image
              exports of vouchers for printing, sharing, or archival purposes.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-900">Advanced Activity Tracking</h4>
              <span className="text-xs text-gray-500 bg-orange-100 text-orange-700 px-2 py-1 rounded">Improved</span>
            </div>
            <p className="text-sm text-gray-600">
              Comprehensive activity logging system tracks all voucher operations including creation, modifications,
              approvals, and deletions with detailed audit trails for compliance and monitoring.
            </p>
          </div>
        </div>
      </div>
      {/* Voucher System Features */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 p-6">
        <div className="flex items-center mb-4">
          <FileText className="h-6 w-6 text-green-500 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Voucher Management System Features</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Cash Vouchers</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Complete voucher details with project information</li>
              <li>• Digital signature capture for received and approved by</li>
              <li>• Total amount calculation and tracking</li>
              <li>• Status management (Done, Approved, Cancelled, Rejected)</li>
              <li>• Owner/client information management</li>
            </ul>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Cheque Vouchers</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Bank account details and cheque number tracking</li>
              <li>• Check date and payment information</li>
              <li>• Account name and number management</li>
              <li>• Digital approval workflow with signatures</li>
              <li>• Comprehensive project and client tracking</li>
            </ul>
          </div>
        </div>
      </div>
      {/* Important Notices */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-100 p-6">
        <div className="flex items-center mb-4">
          <AlertCircle className="h-6 w-6 text-orange-500 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Important System Information</h3>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Voucher Numbering System</h4>
            <p className="text-sm text-gray-600">
              All vouchers follow a sequential numbering system for proper audit trails. Voucher numbers are
              automatically generated and cannot be manually modified to ensure data integrity.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Digital Signature Requirements</h4>
            <p className="text-sm text-gray-600">
              Both cash and cheque vouchers require digital signatures from authorized personnel. Signature URLs are
              securely stored and displayed in admin view pages for verification purposes.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Data Backup and Recovery</h4>
            <p className="text-sm text-gray-600">
              All voucher data is automatically backed up daily. Deleted vouchers are retained in archive for 30 days
              before permanent deletion, allowing for recovery if needed.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Export and Printing Guidelines</h4>
            <p className="text-sm text-gray-600">
              Use the export to image feature for official documentation. Exported images maintain high resolution and
              include all voucher details, signatures, and approval information for legal compliance.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const AccountingContent = () => (
    <div className="space-y-6">
      {/* Voucher Accounting Principles */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 p-6">
        <div className="flex items-center mb-4">
          <Calculator className="h-6 w-6 text-green-500 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Voucher Accounting Principles</h3>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Cash Voucher Accounting</h4>
            <p className="text-sm text-gray-600">
              Cash vouchers represent immediate cash transactions and must be recorded at the time of payment or
              receipt. They affect the cash account directly and require proper documentation for audit trails.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Cheque Voucher Accounting</h4>
            <p className="text-sm text-gray-600">
              Cheque vouchers represent bank transactions that may have a timing difference between issuance and
              clearance. Record when issued, not when cleared, and maintain proper bank reconciliation procedures.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Double-Entry for Vouchers</h4>
            <p className="text-sm text-gray-600">
              Every voucher transaction must have equal debits and credits. Cash payments typically debit expense/asset
              accounts and credit cash/bank accounts. Proper account coding ensures accurate financial reporting.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Voucher Authorization</h4>
            <p className="text-sm text-gray-600">
              All vouchers require proper authorization before processing. Digital signatures ensure accountability and
              create an audit trail for compliance and internal control purposes.
            </p>
          </div>
        </div>
      </div>
      {/* Voucher Processing Guidelines */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
        <div className="flex items-center mb-4">
          <FileText className="h-6 w-6 text-blue-500 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Voucher Processing Guidelines</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Cash Voucher Processing</h4>
            <p className="text-sm text-gray-600 mb-2">Step-by-step process for cash voucher handling:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Verify supporting documents (receipts, invoices)</li>
              <li>• Check account codes and amounts</li>
              <li>• Obtain required approvals and signatures</li>
              <li>• Record transaction in cash book immediately</li>
              <li>• File voucher with sequential numbering</li>
              <li>• Update cash position and reconcile daily</li>
            </ul>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Cheque Voucher Processing</h4>
            <p className="text-sm text-gray-600 mb-2">Step-by-step process for cheque voucher handling:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Prepare cheque voucher with payee details</li>
              <li>• Verify bank account and cheque number</li>
              <li>• Obtain authorized signatures on cheque</li>
              <li>• Record in bank register when issued</li>
              <li>• Track cheque status until clearance</li>
              <li>• Perform monthly bank reconciliation</li>
            </ul>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Voucher Numbering System</h4>
            <p className="text-sm text-gray-600 mb-2">Proper numbering ensures audit trail integrity:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Sequential numbering for all vouchers</li>
              <li>• Separate series for cash and cheque vouchers</li>
              <li>• No gaps or duplicates in numbering</li>
              <li>• Cross-reference with supporting documents</li>
            </ul>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Digital Signature Management</h4>
            <p className="text-sm text-gray-600 mb-2">Electronic approval workflow requirements:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Capture signatures for "Received By" and "Approved By"</li>
              <li>• Store signature images securely</li>
              <li>• Maintain signature authorization matrix</li>
              <li>• Regular review of signature authorities</li>
            </ul>
          </div>
        </div>
      </div>
      {/* Account Classification for Vouchers */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 p-6">
        <div className="flex items-center mb-4">
          <TrendingUp className="h-6 w-6 text-purple-500 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Account Classification for Vouchers</h3>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Common Cash Voucher Accounts</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <strong className="text-gray-900">Expense Accounts:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• Office Supplies</li>
                  <li>• Travel & Transportation</li>
                  <li>• Utilities</li>
                  <li>• Professional Services</li>
                  <li>• Maintenance & Repairs</li>
                </ul>
              </div>
              <div>
                <strong className="text-gray-900">Asset Accounts:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• Equipment Purchases</li>
                  <li>• Inventory</li>
                  <li>• Prepaid Expenses</li>
                  <li>• Petty Cash Replenishment</li>
                  <li>• Advances to Employees</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Common Cheque Voucher Accounts</h4>
            <div className="grid grid-cols-1 md:grid-columns-2 gap-4 text-sm text-gray-600">
              <div>
                <strong className="text-gray-900">Payment Types:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• Supplier Payments</li>
                  <li>• Salary & Wages</li>
                  <li>• Loan Payments</li>
                  <li>• Tax Payments</li>
                  <li>• Rent & Lease Payments</li>
                </ul>
              </div>
              <div>
                <strong className="text-gray-900">Bank Accounts:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• Current Account</li>
                  <li>• Savings Account</li>
                  <li>• Payroll Account</li>
                  <li>• Project-specific Accounts</li>
                  <li>• Foreign Currency Accounts</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Project-Based Accounting</h4>
            <p className="text-sm text-gray-600 mb-2">
              Track vouchers by project for better cost control and reporting:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Assign project codes to all vouchers</li>
              <li>• Separate project income and expenses</li>
              <li>• Generate project-wise financial reports</li>
              <li>• Monitor project budgets vs. actual costs</li>
              <li>• Track project profitability</li>
            </ul>
          </div>
        </div>
      </div>
      {/* Voucher Control & Compliance */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 p-6">
        <div className="flex items-center mb-4">
          <CheckCircle className="h-6 w-6 text-indigo-500 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Voucher Control & Compliance</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Internal Controls</h4>
            <p className="text-sm text-gray-600">
              Implement proper controls to prevent errors and fraud in voucher processing and ensure accurate financial
              records.
            </p>
            <ul className="text-sm text-gray-600 space-y-1 mt-2">
              <li>• Segregation of duties (preparer vs. approver)</li>
              <li>• Authorization limits for different amounts</li>
              <li>• Regular voucher sequence checks</li>
              <li>• Monthly bank reconciliations</li>
            </ul>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Audit Trail Requirements</h4>
            <p className="text-sm text-gray-600">
              Maintain complete documentation for all voucher transactions to support audits and regulatory compliance.
            </p>
            <ul className="text-sm text-gray-600 space-y-1 mt-2">
              <li>• Supporting documents attached to vouchers</li>
              <li>• Clear approval signatures and dates</li>
              <li>• Activity logs for all voucher changes</li>
              <li>• Backup and archive procedures</li>
            </ul>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Monthly Reconciliation</h4>
            <p className="text-sm text-gray-600">
              Regular reconciliation ensures accuracy and identifies discrepancies early in the accounting process.
            </p>
            <ul className="text-sm text-gray-600 space-y-1 mt-2">
              <li>• Cash book vs. general ledger</li>
              <li>• Bank statements vs. cheque register</li>
              <li>• Outstanding cheques tracking</li>
              <li>• Petty cash physical counts</li>
            </ul>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Voucher Retention Policy</h4>
            <p className="text-sm text-gray-600">
              Proper document retention ensures compliance with legal and regulatory requirements.
            </p>
            <ul className="text-sm text-gray-600 space-y-1 mt-2">
              <li>• Physical vouchers: 7 years minimum</li>
              <li>• Digital copies: Secure cloud storage</li>
              <li>• Supporting documents: Same retention period</li>
              <li>• Disposal procedures for expired records</li>
            </ul>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Error Correction Procedures</h4>
            <p className="text-sm text-gray-600">
              Proper procedures for handling voucher errors maintain data integrity and audit trail completeness.
            </p>
            <ul className="text-sm text-gray-600 space-y-1 mt-2">
              <li>• Never alter original vouchers</li>
              <li>• Create reversal entries for corrections</li>
              <li>• Document reasons for all changes</li>
              <li>• Obtain approval for error corrections</li>
            </ul>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Reporting & Analysis</h4>
            <p className="text-sm text-gray-600">
              Generate regular reports from voucher data to support business decision-making and financial analysis.
            </p>
            <ul className="text-sm text-gray-600 space-y-1 mt-2">
              <li>• Daily cash position reports</li>
              <li>• Monthly expense analysis by category</li>
              <li>• Project-wise cost reports</li>
              <li>• Vendor payment summaries</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Loading user information...</span>
        </div>
      )
    }
    switch (activeSection) {
      case "profile":
        return <ProfileContent />
      case "security":
        return <SecurityContent />
      case "announcements":
        return <AnnouncementsContent />
      case "accounting":
        return <AccountingContent />
      default:
        return <ProfileContent />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account information and view system information</p>
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 p-2 sticky top-8">
              <nav className="space-y-1">
                {sections.map((section) => (
                  <motion.button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all ${
                      activeSection === section.id
                        ? "bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border border-purple-200"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className={`mr-3 ${activeSection === section.id ? "text-purple-600" : "text-gray-400"}`}>
                      {section.icon}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium">{section.title}</div>
                      <div className="text-xs text-gray-500 mt-1">{section.description}</div>
                    </div>
                    {activeSection === section.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 bg-purple-600 rounded-full"
                      />
                    )}
                  </motion.button>
                ))}
              </nav>
            </div>
          </motion.div>
          {/* Main Content */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-3">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {sections.find((s) => s.id === activeSection)?.title}
                </h2>
                <p className="text-gray-600 mt-1">{sections.find((s) => s.id === activeSection)?.description}</p>
              </div>
              <div className="p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderContent()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
