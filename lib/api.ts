// Updated API client with proper database activity logging
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

interface ApiResponse<T = any> {
  success?: boolean
  data?: T
  accounts?: T
  message?: string
  error?: string
  account?: {
    // This property is crucial for deleted account info
    id: number
    account_name: string
    account_number: string
    created_at: string
    updated_at: string
    created_by?: string
    user_id?: number
  }
  pagination?: {
    current_page: number
    total_pages: number
    total_items: number
    per_page: number
    has_more: boolean
    has_previous: boolean
  }
}

class ApiClient {
  private baseURL: string
  private token: string | null = null
  private currentUser: any = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    console.log("API Client initialized with base URL:", baseURL)
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token")
      const storedUser = localStorage.getItem("current_user")
      this.currentUser = storedUser ? JSON.parse(storedUser) : null
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token)
    }
  }

  setCurrentUser(user: any) {
    this.currentUser = user
    if (typeof window !== "undefined") {
      localStorage.setItem("current_user", JSON.stringify(user))
    }
  }

  getCurrentUser() {
    return this.currentUser
  }

  removeToken() {
    this.token = null
    this.currentUser = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("current_user")
    }
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    }

    // Handle different header types
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value
        })
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          headers[key] = value
        })
      } else {
        Object.assign(headers, options.headers)
      }
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    const config: RequestInit = {
      ...options,
      headers,
    }

    try {
      console.log(`[ApiClient] Request: ${options.method || "GET"} ${url}`)
      if (options.body) {
        console.log("[ApiClient] Request body:", JSON.parse(options.body as string))
      }
      const response = await fetch(url, config)
      console.log(`[ApiClient] Response status: ${response.status} for ${url}`)

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        let errorContent: any = null // To hold the parsed JSON or raw text

        try {
          errorContent = await response.json()
          console.error("[ApiClient] Error response data (JSON):", errorContent)
          // If JSON parsing succeeded, try to extract message/error
          if (typeof errorContent === "object" && errorContent !== null) {
            errorMessage = errorContent.message || errorContent.error || errorMessage
          } else {
            // If it's valid JSON but not an object (e.g., a string "Error!", or a number)
            errorMessage += ` - ${String(errorContent)}`
          }
        } catch (jsonParseError: any) {
          // If response.json() failed (e.g., not valid JSON)
          console.error("[ApiClient] Failed to parse error response as JSON:", jsonParseError)
          errorMessage += ` - JSON parse error: ${jsonParseError.message || jsonParseError}`
          try {
            // Attempt to read as plain text as a fallback
            const errorText = await response.text()
            console.error("[ApiClient] Error response data (text fallback):", errorText)
            if (errorText) {
              errorMessage += ` - Raw response: ${errorText}`
            }
          } catch (textReadError) {
            console.error("[ApiClient] Could not read error response text:", textReadError)
          }
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log(`[ApiClient] Response data for ${url}:`, data)
      return data
    } catch (error) {
      console.error(`[ApiClient] Error for ${url}:`, error)
      throw error
    }
  }

  // HTTP Methods
  async get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" })
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" })
  }

  // Auth methods
  async login(email: string, password: string) {
    const response = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
    if (response.success && response.user) {
      this.setCurrentUser(response.user)
    }
    return response
  }

  async register(name: string, email: string, password: string) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    })
  }

  async logout() {
    return this.request("/auth/logout", {
      method: "POST",
    })
  }

  async getCurrentUserInfo() {
    try {
      const response = await this.request("/auth/user")
      if (response && response.user) {
        this.setCurrentUser(response.user)
      }
      return response
    } catch (error) {
      console.error("Error getting current user:", error)
      return null
    }
  }

  // Activity Logs methods - Now saves to database
  async logActivity(activityData: {
    action: string
    entity_type: string
    entity_id: number
    entity_name: string
    description: string
    metadata?: any // Keep this optional
  }) {
    try {
      console.log("[ApiClient] Logging activity to database:", activityData)
      const response = await this.request("/activity-logs", {
        method: "POST",
        body: JSON.stringify({
          ...activityData,
          metadata: activityData.metadata || {}, // Provide default empty object
        }),
      })
      console.log("[ApiClient] Activity logged successfully:", response)
      return response
    } catch (error) {
      console.error("[ApiClient] Error logging activity to database:", error)
      // Still store locally as fallback
      this.storeLocalActivity(activityData)
      throw error
    }
  }

  // Get activity logs from database
  async getActivityLogs(params?: {
    entity_type?: string
    action?: string
    start_date?: string
    end_date?: string
    limit?: number
    page?: number
    search?: string
  }) {
    try {
      console.log("[ApiClient] Fetching activity logs from database with params:", params)
      const queryParams = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "all") {
            queryParams.append(key, value.toString())
          }
        })
      }
      const endpoint = `/activity-logs${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
      const response = await this.request(endpoint)
      console.log("[ApiClient] Activity logs response from database:", response)
      return response
    } catch (error) {
      console.error("[ApiClient] Error fetching activity logs from database:", error)
      // Fallback to local activities if database fails
      return this.getFallbackActivityLogs(params)
    }
  }

  // Store activity in both database AND localStorage
  private async storeActivity(activity: {
    action: string
    entity_type: string
    entity_id: number
    entity_name: string
    description: string
    metadata?: any // Make this optional
  }) {
    // Store in database first
    try {
      await this.logActivity(activity)
    } catch (error) {
      console.error("[ApiClient] Failed to store activity in database, storing locally:", error)
    }
    // Also store locally for immediate display
    this.storeLocalActivity(activity)
  }

  // Account methods with activity logging
  async getAccounts(): Promise<ApiResponse> {
    try {
      console.log("[ApiClient] Fetching accounts from API...")
      const response = await this.request("/accounts")
      console.log("[ApiClient] Accounts response structure:", {
        hasData: !!response.data,
        isDataArray: response.data && Array.isArray(response.data),
        hasPagination: response.data && response.data.data && Array.isArray(response.data.data),
        directArray: Array.isArray(response),
        hasAccounts: !!response.accounts,
        isAccountsArray: response.accounts && Array.isArray(response.accounts),
      })
      return response
    } catch (error) {
      console.error("[ApiClient] Error in getAccounts:", error)
      throw error
    }
  }

  async createAccount(accountName: string, accountNumber: string): Promise<ApiResponse> {
    try {
      const response = await this.request("/accounts", {
        method: "POST",
        body: JSON.stringify({
          account_name: accountName,
          account_number: accountNumber,
        }),
      })
      if (response && (response.success || response.data)) {
        await this.storeActivity({
          action: "created",
          entity_type: "account",
          entity_id: response.data?.id || Date.now(),
          entity_name: `${accountName} (${accountNumber})`,
          description: `Created account "${accountName}" with number ${accountNumber}`,
          metadata: { account_name: accountName, account_number: accountNumber },
        })
      }
      return response
    } catch (error) {
      console.error("[ApiClient] Error creating account:", error)
      throw error
    }
  }

  async updateAccount(id: number, accountName: string, accountNumber: string): Promise<ApiResponse> {
    try {
      const response = await this.request(`/accounts/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          account_name: accountName,
          account_number: accountNumber,
        }),
      })
      if (response && (response.success || response.data)) {
        await this.storeActivity({
          action: "updated",
          entity_type: "account",
          entity_id: id,
          entity_name: `${accountName} (${accountNumber})`,
          description: `Updated account "${accountName}"`,
          metadata: { account_name: accountName, account_number: accountNumber },
        })
      }
      return response
    } catch (error) {
      console.error("[ApiClient] Error updating account:", error)
      throw error
    }
  }

  async deleteAccount(id: number): Promise<ApiResponse> {
    try {
      // Explicitly type the response to ensure 'account' property is recognized
      const response: ApiResponse = await this.request(`/accounts/${id}`, {
        method: "DELETE",
      })

      // IMPORTANT: Log the response received from the API call
      console.log("[ApiClient] Response from deleteAccount API call:", JSON.stringify(response, null, 2))
      console.log(
        "[ApiClient] Response.account from deleteAccount API call:",
        JSON.stringify(response.account, null, 2),
      )

      let deletedAccountName = `Account #${id}` // Default fallback
      // Check if response.account exists and has account_name
      if (response.account && response.account.account_name) {
        deletedAccountName = response.account.account_name
      }
      console.log("[ApiClient] Determined deletedAccountName for logging:", deletedAccountName)

      if (response && (response.success || response.message)) {
        // IMPORTANT: Log the activity data being prepared for storage
        console.log("[ApiClient] Activity data prepared for storage:", {
          action: "deleted",
          entity_type: "account",
          entity_id: id,
          entity_name: deletedAccountName, // Use the actual account name
          description: `Deleted account "${deletedAccountName}"`, // Use the actual account name in description
          metadata: {},
        })
        await this.storeActivity({
          action: "deleted",
          entity_type: "account",
          entity_id: id,
          entity_name: deletedAccountName, // Use the actual account name
          description: `Deleted account "${deletedAccountName}"`, // Use the actual account name in description
          metadata: {},
        })
      }
      return response
    } catch (error) {
      console.error("[ApiClient] Error deleting account:", error)
      throw error
    }
  }

  // Cash Voucher methods with activity logging
  async createCashVoucher(voucherData: any) {
    try {
      const response = await this.request("/cash-vouchers", {
        method: "POST",
        body: JSON.stringify(voucherData),
      })
      if (response && (response.success || response.data)) {
        await this.storeActivity({
          action: "created",
          entity_type: "cash_voucher",
          entity_id: response.data?.id || Date.now(),
          entity_name: `Cash Voucher #${voucherData.voucher_number || "New"}`,
          description: `Created cash voucher for ${voucherData.paid_to}`,
          metadata: {
            amount: Number.parseFloat(voucherData.amount) || 0,
            paid_to: voucherData.paid_to,
            voucher_number: voucherData.voucher_number,
            account_id: voucherData.account_id,
          },
        })
      }
      return response
    } catch (error) {
      console.error("[ApiClient] Error creating cash voucher:", error)
      throw error
    }
  }

  async getCashVouchers(params?: {
    status?: string
    start_date?: string
    end_date?: string
    search?: string
    page?: number
    per_page?: number
  }) {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString())
        }
      })
    }
    const endpoint = `/cash-vouchers${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
    return this.request(endpoint)
  }

  async getCashVoucher(id: string) {
    return this.request(`/cash-vouchers/${id}`)
  }

  async updateCashVoucher(id: string, voucherData: any) {
    try {
      const response = await this.request(`/cash-vouchers/${id}`, {
        method: "PUT",
        body: JSON.stringify(voucherData),
      })
      if (response && (response.success || response.data)) {
        await this.storeActivity({
          action: "updated",
          entity_type: "cash_voucher",
          entity_id: Number.parseInt(id),
          entity_name: `Cash Voucher #${voucherData.voucher_number || id}`,
          description: `Updated cash voucher #${voucherData.voucher_number || id}`,
          metadata: {
            amount: Number.parseFloat(voucherData.amount) || 0,
            changes: voucherData,
          },
        })
      }
      return response
    } catch (error) {
      console.error("[ApiClient] Error updating cash voucher:", error)
      throw error
    }
  }

  async cancelCashVoucher(id: string) {
    try {
      const response = await this.request(`/cash-vouchers/${id}/cancel`, {
        method: "POST",
      })
      if (response && (response.success || response.message)) {
        await this.storeActivity({
          action: "cancelled",
          entity_type: "cash_voucher",
          entity_id: Number.parseInt(id),
          entity_name: `Cash Voucher #${id}`,
          description: `Cancelled cash voucher #${id}`,
          metadata: {},
        })
      }
      return response
    } catch (error) {
      console.error("[ApiClient] Error cancelling cash voucher:", error)
      throw error
    }
  }

  async deleteCashVoucher(id: string) {
    try {
      const response = await this.request(`/cash-vouchers/${id}`, {
        method: "DELETE",
      })
      if (response && (response.success || response.message)) {
        await this.storeActivity({
          action: "deleted",
          entity_type: "cash_voucher",
          entity_id: Number.parseInt(id),
          entity_name: `Cash Voucher #${id}`,
          description: `Deleted cash voucher #${id}`,
          metadata: {},
        })
      }
      return response
    } catch (error) {
      console.error("[ApiClient] Error deleting cash voucher:", error)
      throw error
    }
  }

  async approveCashVoucher(id: string) {
    try {
      const response = await this.request(`/cash-vouchers/${id}/approve`, {
        method: "POST",
      })
      if (response && (response.success || response.message)) {
        await this.storeActivity({
          action: "approved",
          entity_type: "cash_voucher",
          entity_id: Number.parseInt(id),
          entity_name: `Cash Voucher #${id}`,
          description: `Approved cash voucher #${id}`,
          metadata: {},
        })
      }
      return response
    } catch (error) {
      console.error("[ApiClient] Error approving cash voucher:", error)
      throw error
    }
  }

  async markCashVoucherAsPaid(id: string) {
    try {
      const response = await this.request(`/cash-vouchers/${id}/mark-as-paid`, {
        method: "POST",
      })
      if (response && (response.success || response.message)) {
        await this.storeActivity({
          action: "paid",
          entity_type: "cash_voucher",
          entity_id: Number.parseInt(id),
          entity_name: `Cash Voucher #${id}`,
          description: `Marked cash voucher #${id} as paid`,
          metadata: {},
        })
      }
      return response
    } catch (error) {
      console.error("[ApiClient] Error marking cash voucher as paid:", error)
      throw error
    }
  }

  async getNextCashVoucherNumber(accountId?: string) {
    try {
      const endpoint = accountId ? `/cash-vouchers/next-number?account_id=${accountId}` : "/cash-vouchers/next-number"
      console.log(
        `[ApiClient] Fetching next voucher number with${accountId ? "" : "out"} account ID:`,
        accountId || "none",
      )
      const response = await this.request(endpoint)
      console.log("[ApiClient] Next voucher number response:", response)
      return response
    } catch (error) {
      console.error("[ApiClient] Error getting next voucher number:", error)
      throw error
    }
  }

  // Get next voucher number for auto-increment (now requires account ID)
  async getNextVoucherNumber(accountId?: string) {
    try {
      if (!accountId) {
        throw new Error("Account ID is required for voucher number generation")
      }

      console.log("[ApiClient] Fetching next auto-increment voucher number for account:", accountId)
      const response = await this.request(`/vouchers/next-number?account_id=${accountId}`)
      console.log("[ApiClient] Next auto-increment voucher number response:", response)
      return response
    } catch (error) {
      console.error("[ApiClient] Error getting next auto-increment voucher number:", error)
      throw error
    }
  }

  // Cheque Voucher methods with activity logging
  async createChequeVoucher(chequeVoucherData: any) {
    try {
      const response = await this.request("/cheque-vouchers", {
        method: "POST",
        body: JSON.stringify(chequeVoucherData),
      })
      if (response && (response.success || response.data)) {
        await this.storeActivity({
          action: "created",
          entity_type: "cheque_voucher",
          entity_id: response.data?.id || Date.now(),
          entity_name: `Cheque Voucher #${chequeVoucherData.voucher_no || chequeVoucherData.cheque_no || "New"}`,
          description: `Created cheque voucher #${chequeVoucherData.voucher_no || chequeVoucherData.cheque_no} for ${chequeVoucherData.paid_to}`,
          metadata: {
            amount: Number.parseFloat(chequeVoucherData.amount) || 0,
            paid_to: chequeVoucherData.paid_to,
            voucher_no: chequeVoucherData.voucher_no,
            cheque_no: chequeVoucherData.cheque_no,
            particulars: chequeVoucherData.particulars,
          },
        })
      }
      return response
    } catch (error) {
      console.error("[ApiClient] Error creating cheque voucher:", error)
      throw error
    }
  }

  async getChequeVouchers(params?: {
    start_date?: string
    end_date?: string
    search?: string
    page?: number
    per_page?: number
  }) {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString())
        }
      })
    }
    const endpoint = `/cheque-vouchers${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
    return this.request(endpoint)
  }

  async getChequeVoucher(id: string) {
    return this.request(`/cheque-vouchers/${id}`)
  }

  async updateChequeVoucher(id: string, chequeVoucherData: any) {
    try {
      const response = await this.request(`/cheque-vouchers/${id}`, {
        method: "PUT",
        body: JSON.stringify(chequeVoucherData),
      })
      if (response && (response.success || response.data)) {
        await this.storeActivity({
          action: "updated",
          entity_type: "cheque_voucher",
          entity_id: Number.parseInt(id),
          entity_name: `Cheque Voucher #${chequeVoucherData.voucher_no || chequeVoucherData.cheque_no || id}`,
          description: `Updated cheque voucher #${chequeVoucherData.voucher_no || chequeVoucherData.cheque_no || id}`,
          metadata: {
            amount: Number.parseFloat(chequeVoucherData.amount) || 0,
            voucher_no: chequeVoucherData.voucher_no,
            cheque_no: chequeVoucherData.cheque_no,
            particulars: chequeVoucherData.particulars,
          },
        })
      }
      return response
    } catch (error) {
      console.error("[ApiClient] Error updating cheque voucher:", error)
      throw error
    }
  }

  async deleteChequeVoucher(id: string) {
    try {
      const response = await this.request(`/cheque-vouchers/${id}`, {
        method: "DELETE",
      })
      if (response && (response.success || response.message)) {
        await this.storeActivity({
          action: "deleted",
          entity_type: "cheque_voucher",
          entity_id: Number.parseInt(id),
          entity_name: `Cheque Voucher #${id}`,
          description: `Deleted cheque voucher #${id}`,
          metadata: {},
        })
      }
      return response
    } catch (error) {
      console.error("[ApiClient] Error deleting cheque voucher:", error)
      throw error
    }
  }

  async getNextChequeVoucherNumber(accountNumber: string) {
    try {
      if (!accountNumber) {
        throw new Error("Account number is required for cheque number generation")
      }
      const endpoint = `/cheque-vouchers/next-number?account_number=${encodeURIComponent(accountNumber)}`
      console.log(`[ApiClient] Fetching next cheque number with account number:`, accountNumber)
      const response = await this.request(endpoint)
      console.log("[ApiClient] Next cheque number response:", response)
      return response
    } catch (error) {
      console.error("[ApiClient] Error getting next cheque number:", error)
      throw error
    }
  }

  // Dashboard Statistics
  async getDashboardStats() {
    try {
      const cashResponse = await this.getCashVouchers()
      const chequeResponse = await this.getChequeVouchers()

      console.log("[ApiClient] Cash Response:", cashResponse)
      console.log("[ApiClient] Cheque Response:", chequeResponse)

      let cashVouchers = []
      let chequeVouchers = []

      if (cashResponse) {
        if (cashResponse.data) {
          cashVouchers = Array.isArray(cashResponse.data)
            ? cashResponse.data
            : cashResponse.data.data
              ? cashResponse.data.data
              : []
        } else if (Array.isArray(cashResponse)) {
          cashVouchers = cashResponse
        }
      }

      if (chequeResponse) {
        if (chequeResponse.data) {
          chequeVouchers = Array.isArray(chequeResponse.data)
            ? chequeResponse.data
            : chequeResponse.data.data
              ? chequeResponse.data.data
              : []
        } else if (Array.isArray(chequeResponse)) {
          chequeVouchers = chequeResponse
        }
      }

      console.log("[ApiClient] Processed Cash Vouchers:", cashVouchers)
      console.log("[ApiClient] Processed Cheque Vouchers:", chequeVouchers)

      const totalCashAmount = cashVouchers.reduce((sum: number, voucher: any) => {
        const amount = Number.parseFloat(voucher.amount) || 0
        return sum + amount
      }, 0)

      const totalChequeAmount = chequeVouchers.reduce((sum: number, voucher: any) => {
        const amount = Number.parseFloat(voucher.amount) || 0
        return sum + amount
      }, 0)

      return {
        success: true,
        data: {
          totalCashVouchers: cashVouchers.length,
          totalChequeVouchers: chequeVouchers.length,
          totalCashAmount: totalCashAmount,
          totalChequeAmount: totalChequeAmount,
          totalAmount: totalCashAmount + totalChequeAmount,
          cashVouchers: cashVouchers.slice(0, 5),
          chequeVouchers: chequeVouchers.slice(0, 5),
        },
      }
    } catch (error) {
      console.error("[ApiClient] Error getting dashboard stats:", error)
      throw error
    }
  }

  // Fallback method for when database is not available
  private async getFallbackActivityLogs(params?: any) {
    try {
      const activities = await this.generateComprehensiveActivityLogs(200)

      let filteredActivities = activities

      if (params?.entity_type && params.entity_type !== "all") {
        filteredActivities = filteredActivities.filter((activity) => activity.entity_type === params.entity_type)
      }
      if (params?.action && params.action !== "all") {
        filteredActivities = filteredActivities.filter((activity) => activity.action === params.action)
      }
      if (params?.search) {
        const searchTerm = params.search.toLowerCase()
        filteredActivities = filteredActivities.filter(
          (activity) =>
            activity.description.toLowerCase().includes(searchTerm) ||
            activity.entity_name.toLowerCase().includes(searchTerm) ||
            (activity.user_name && activity.user_name.toLowerCase().includes(searchTerm)),
        )
      }

      const page = params?.page || 1
      const limit = params?.limit || 10
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedActivities = filteredActivities.slice(startIndex, endIndex)

      const totalPages = Math.ceil(filteredActivities.length / limit)

      return {
        success: true,
        data: paginatedActivities,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_items: filteredActivities.length,
          per_page: limit,
          has_more: page < totalPages,
          has_previous: page > 1,
        },
      }
    } catch (error) {
      console.error("[ApiClient] Error generating fallback activity logs:", error)
      return {
        success: true,
        data: [],
        pagination: {
          current_page: 1,
          total_pages: 1,
          total_items: 0,
          per_page: 10,
          has_more: false,
          has_previous: false,
        },
      }
    }
  }

  // Generate comprehensive activity logs from all existing data (fallback)
  private async generateComprehensiveActivityLogs(limit = 50) {
    try {
      const activities: any[] = []
      const localActivities = this.getLocalActivities()
      activities.push(...localActivities)

      const cashResponse = await this.getCashVouchers({ per_page: 30 })
      let cashVouchers = []
      if (cashResponse?.data) {
        cashVouchers = Array.isArray(cashResponse.data)
          ? cashResponse.data
          : cashResponse.data.data
            ? cashResponse.data.data
            : []
      }

      const chequeResponse = await this.getChequeVouchers({ per_page: 30 })
      let chequeVouchers = []
      if (chequeResponse?.data) {
        chequeVouchers = Array.isArray(chequeResponse.data)
          ? chequeResponse.data
          : chequeResponse.data.data
            ? chequeResponse.data.data
            : []
      }

      try {
        const accountsResponse = await this.getAccounts()
        let accounts = []
        if (accountsResponse?.data) {
          accounts = Array.isArray(accountsResponse.data)
            ? accountsResponse.data
            : accountsResponse.data.data
              ? accountsResponse.data.data
              : []
        }
        accounts.forEach((account: any) => {
          activities.push({
            id: `account-created-${account.id}`,
            action: "created",
            entity_type: "account",
            entity_id: account.id,
            entity_name: `${account.account_name} (${account.account_number})`, // Correctly uses account_name
            description: `Created account "${account.account_name}" with number ${account.account_number}`,
            user_name: account.created_by || "System User",
            created_at: account.created_at,
            metadata: {
              account_name: account.account_name,
              account_number: account.account_number,
            },
          })
        })
      } catch (error) {
        console.log("[ApiClient] Accounts not available for activity generation")
      }

      cashVouchers.forEach((voucher: any) => {
        const currentUser = this.getCurrentUser()
        const userName = currentUser?.name || currentUser?.email || voucher.created_by || "System User"
        activities.push({
          id: `cash-created-${voucher.id}`,
          action: "created",
          entity_type: "cash_voucher",
          entity_id: voucher.id,
          entity_name: `Cash Voucher #${voucher.voucher_number || voucher.id}`,
          description: `Created cash voucher #${voucher.voucher_number || voucher.id} for ${voucher.paid_to}`,
          user_name: userName,
          created_at: voucher.created_at,
          metadata: {
            amount: Number.parseFloat(voucher.amount) || 0,
            paid_to: voucher.paid_to,
            status: voucher.status,
            voucher_number: voucher.voucher_number,
          },
        })
        if (voucher.status === "approved") {
          activities.push({
            id: `cash-approved-${voucher.id}`,
            action: "approved",
            entity_type: "cash_voucher",
            entity_id: voucher.id,
            entity_name: `Cash Voucher #${voucher.voucher_number || voucher.id}`,
            description: `Approved cash voucher #${voucher.voucher_number || voucher.id}`,
            user_name: userName,
            created_at: voucher.updated_at || voucher.created_at,
            metadata: {
              amount: Number.parseFloat(voucher.amount) || 0,
              previous_status: "draft",
            },
          })
        }
        if (voucher.status === "paid") {
          activities.push({
            id: `cash-paid-${voucher.id}`,
            action: "paid",
            entity_type: "cash_voucher",
            entity_id: voucher.id,
            entity_name: `Cash Voucher #${voucher.voucher_number || voucher.id}`,
            description: `Marked cash voucher #${voucher.voucher_number || voucher.id} as paid`,
            user_name: userName,
            created_at: voucher.updated_at || voucher.created_at,
            metadata: {
              amount: Number.parseFloat(voucher.amount) || 0,
              paid_to: voucher.paid_to,
            },
          })
        }
        if (voucher.status === "cancelled") {
          activities.push({
            id: `cash-cancelled-${voucher.id}`,
            action: "cancelled",
            entity_type: "cash_voucher",
            entity_id: voucher.id,
            entity_name: `Cash Voucher #${voucher.voucher_number || voucher.id}`,
            description: `Cancelled cash voucher #${voucher.voucher_number || voucher.id}`,
            user_name: userName,
            created_at: voucher.updated_at || voucher.created_at,
            metadata: {
              amount: Number.parseFloat(voucher.amount) || 0,
              reason: voucher.cancellation_reason || "No reason provided",
            },
          })
        }
      })

      chequeVouchers.forEach((voucher: any) => {
        const currentUser = this.getCurrentUser()
        const userName = currentUser?.name || currentUser?.email || voucher.created_by || "System User"
        activities.push({
          id: `cheque-created-${voucher.id}`,
          action: "created",
          entity_type: "cheque_voucher",
          entity_id: voucher.id,
          entity_name: `Cheque Voucher #${voucher.voucher_no || voucher.cheque_no || voucher.id}`,
          description: `Created cheque voucher #${voucher.voucher_no || voucher.cheque_no || voucher.id} for ${voucher.paid_to}`,
          user_name: userName,
          created_at: voucher.created_at,
          metadata: {
            amount: Number.parseFloat(voucher.amount) || 0,
            paid_to: voucher.paid_to,
            voucher_no: voucher.voucher_no,
            cheque_no: voucher.cheque_no,
            particulars: voucher.particulars,
          },
        })
      })

      const uniqueActivities = activities.filter(
        (activity, index, self) => index === self.findIndex((a) => a.id === activity.id),
      )

      const sortedActivities = uniqueActivities
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit)

      return sortedActivities
    } catch (error) {
      console.error("[ApiClient] Error generating comprehensive activity logs:", error)
      return []
    }
  }

  // Store activity in localStorage for immediate display (fallback)
  private storeLocalActivity(activity: {
    action: string
    entity_type: string
    entity_id: number
    entity_name: string
    description: string
    metadata?: any // Make this optional
  }) {
    if (typeof window === "undefined") return
    try {
      const currentUser = this.getCurrentUser()
      const localActivity = {
        ...activity,
        id: `local-${Date.now()}-${Math.random()}`,
        user_name: currentUser?.name || currentUser?.email || "Unknown User",
        user_id: currentUser?.id || null,
        created_at: new Date().toISOString(),
        is_local: true,
        metadata: activity.metadata || {}, // Provide default empty object
      }
      const existingActivities = JSON.parse(localStorage.getItem("recent_activities") || "[]")
      const updatedActivities = [localActivity, ...existingActivities].slice(0, 50)
      localStorage.setItem("recent_activities", JSON.stringify(updatedActivities))
    } catch (error) {
      console.error("[ApiClient] Error storing local activity:", error)
    }
  }

  // Get local activities from localStorage (fallback)
  private getLocalActivities() {
    if (typeof window === "undefined") return []
    try {
      return JSON.parse(localStorage.getItem("recent_activities") || "[]")
    } catch (error) {
      console.error("[ApiClient] Error getting local activities:", error)
      return []
    }
  }
}

const apiClientInstance = new ApiClient(API_BASE_URL)

export default apiClientInstance
