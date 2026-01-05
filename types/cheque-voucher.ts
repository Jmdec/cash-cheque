export interface ParticularItem {
  id: string
  description: string
  amount: string
}

export interface ChequeVoucherFormData {
  account_id?: string
  voucher_no: string
  cheque_no: string
  paid_to: string
  date: string
  particulars?: ParticularItem[] // Make this optional to match component usage
  total_amount: string
  // Received By section (left side)
  received_signature?: string
  received_printed_name?: string
  // Approved By section (right side)
  approved_signature?: string
  approved_printed_name?: string
  approved_date?: string
}

export interface EditChequeVoucherFormData {
  voucher_no: string
  cheque_no: string
  paid_to: string
  date: string
  total_amount: string
  received_printed_name: string
  approved_printed_name: string
  approved_date: string
}

export interface ChequeVoucher {
  id: number
  user_id?: number
  account_id?: number
  voucher_no: string
  cheque_no: string
  paid_to: string
  date: string
  particulars: ParticularItem[]
  total_amount: number
  // Received By fields
  received_signature?: string
  received_printed_name?: string
  // Approved By fields
  approved_signature?: string
  approved_printed_name: string
  approved_date: string
  status: string
  created_at: string
  updated_at: string
  user?: {
    id: number
    name: string
    email: string
  }
  account?: {
    id: number
    account_name: string
    account_number: string
  }
}
