import { type NextRequest, NextResponse } from "next/server"

// Mock database - in production, use a real database
// This array will reset if the serverless function instance is re-initialized (e.g., cold start)
const accounts: any[] = [
  {
    id: 1,
    account_name: "Savings Account",
    account_number: "12345",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 1,
  },
  {
    id: 2,
    account_name: "Checking Account",
    account_number: "67890",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 1,
  },
  {
    id: 3,
    account_name: "Investment Fund",
    account_number: "11223",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 1,
  },
]

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const accountId = Number.parseInt(id)

    if (isNaN(accountId)) {
      return NextResponse.json({ error: "Invalid account ID" }, { status: 400 })
    }

    const body = await request.json()
    const { account_name, account_number, user_id = 1 } = body

    if (!account_name || !account_number) {
      return NextResponse.json({ error: "Account name and number are required" }, { status: 400 })
    }

    const accountIndex = accounts.findIndex((acc) => acc.id === accountId)
    if (accountIndex === -1) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    // Check if account number already exists for a different account
    const existingAccount = accounts.find((acc) => acc.account_number === account_number && acc.id !== accountId)
    if (existingAccount) {
      return NextResponse.json({ error: "Account number already exists" }, { status: 400 })
    }

    // Update the account
    accounts[accountIndex] = {
      ...accounts[accountIndex],
      account_name,
      account_number,
      user_id,
      updated_at: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      message: "Account updated successfully",
      account: accounts[accountIndex],
    })
  } catch (error) {
    console.error("Error in PUT /api/accounts/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const accountId = Number.parseInt(id)

    if (isNaN(accountId)) {
      return NextResponse.json({ error: "Invalid account ID" }, { status: 400 })
    }

    const accountIndex = accounts.findIndex((acc) => acc.id === accountId)
    if (accountIndex === -1) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    // Store the account to be deleted before removing it
    const deletedAccount = accounts[accountIndex]

    // IMPORTANT: Log the deletedAccount object *before* it's returned
    console.log(`[API Route DELETE] Attempting to delete account with ID: ${accountId}`)
    console.log("[API Route DELETE] Deleted account object before splice:", JSON.stringify(deletedAccount, null, 2))

    // Remove the account from the mock array
    accounts.splice(accountIndex, 1)

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
      account: deletedAccount, // Return the deleted account for logging purposes
    })
  } catch (error) {
    console.error("Error in DELETE /api/accounts/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
