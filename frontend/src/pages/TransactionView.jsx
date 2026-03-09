import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function TransactionView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [transaction, setTransaction] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTransaction()
  }, [id])

  const loadTransaction = async () => {
    try {
      const response = await api.get(`/api/transactions/${id}`)
      if (response.data.success) {
        setTransaction(response.data.data)
      } else {
        toast.error('Transaction not found')
        navigate('/transactions')
      }
    } catch (error) {
      console.error('Error loading transaction:', error)
      toast.error('Failed to load transaction')
      navigate('/transactions')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      SUCCESS: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      PARTIAL: 'bg-blue-100 text-blue-800',
      FAILED: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Transaction not found</p>
        <button
          onClick={() => navigate('/transactions')}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          Back to Transactions
        </button>
      </div>
    )
  }

  const progressPercent = transaction.total_paid && transaction.amount 
    ? Math.min((transaction.total_paid / transaction.amount) * 100, 100) 
    : 0
  const remainingAmount = transaction.amount && transaction.total_paid
    ? Math.max(transaction.amount - transaction.total_paid, 0)
    : transaction.amount

  // Parse partial payments if it's a JSON string
  let partialPayments = []
  if (transaction.partial_payments) {
    try {
      partialPayments = typeof transaction.partial_payments === 'string'
        ? JSON.parse(transaction.partial_payments)
        : transaction.partial_payments
    } catch (e) {
      console.error('Error parsing partial payments:', e)
    }
  }

  return (
    <div>
      <button
        onClick={() => navigate('/transactions')}
        className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Transactions
      </button>

      <h1 className="text-2xl font-bold mb-6">Transaction Details</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Transaction Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Transaction Information</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-600">Reference:</dt>
                <dd className="font-medium">{transaction.reference}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Transaction ID:</dt>
                <dd className="font-mono text-sm">{transaction.transaction_id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Amount:</dt>
                <dd className="font-bold text-lg">{formatCurrency(transaction.amount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Status:</dt>
                <dd>
                  <span className={`px-3 py-1 rounded font-medium ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">MNO Provider:</dt>
                <dd>{transaction.mno_provider}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Currency:</dt>
                <dd>{transaction.currency || 'TZS'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Created:</dt>
                <dd className="text-sm">{formatDate(transaction.created_at)}</dd>
              </div>
              {transaction.updated_at && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">Updated:</dt>
                  <dd className="text-sm">{formatDate(transaction.updated_at)}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Receipt (if SUCCESS) */}
          {transaction.status === 'SUCCESS' && transaction.receipt_number && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Receipt</h2>
              <div className="border-2 border-dashed p-6 rounded-lg">
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-green-600">✓ PAID</div>
                  <div className="text-sm text-gray-600 mt-1">POWER-PAY RECEIPT</div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Receipt:</span>
                    <span className="font-mono">{transaction.receipt_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reference:</span>
                    <span className="font-medium">{transaction.reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-bold">{formatCurrency(transaction.amount)}</span>
                  </div>
                  {transaction.payment_date && (
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{formatDate(transaction.payment_date)}</span>
                    </div>
                  )}
                </div>
                <button className="w-full mt-4 bg-green-600 text-white py-2 rounded hover:bg-green-700 flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Payer Info & FLEXIBLE Payments */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Payer Information</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-gray-600">Name:</dt>
                <dd className="font-medium">{transaction.payer_name || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Phone:</dt>
                <dd>{transaction.payer_phone || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Email:</dt>
                <dd className="text-sm">{transaction.payer_email || '-'}</dd>
              </div>
              {transaction.payment_desc && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">Description:</dt>
                  <dd className="text-sm">{transaction.payment_desc}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* FLEXIBLE Payment Tracker */}
          {transaction.status === 'PARTIAL' && partialPayments.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Payment Progress</h2>
              
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Progress: {progressPercent.toFixed(0)}%</span>
                  <span className="text-gray-600">
                    {formatCurrency(transaction.total_paid || 0)} / {formatCurrency(transaction.amount)}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-blue-50 rounded">
                  <div className="text-2xl font-bold text-blue-600">{transaction.payment_count || 0}</div>
                  <div className="text-xs text-gray-600">Payments</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="text-sm font-bold text-green-600">{formatCurrency(transaction.total_paid || 0)}</div>
                  <div className="text-xs text-gray-600">Paid</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded">
                  <div className="text-sm font-bold text-orange-600">{formatCurrency(remainingAmount)}</div>
                  <div className="text-xs text-gray-600">Remaining</div>
                </div>
              </div>

              {/* Payment History */}
              <div>
                <h3 className="font-semibold mb-3">Payment History</h3>
                <div className="space-y-3">
                  {partialPayments.map((payment, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">Payment {index + 1}</div>
                          <div className="text-xs text-gray-500">
                            {formatDate(payment.transactionDate || payment.timestamp)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">{formatCurrency(payment.amount)}</div>
                          {payment.channel && (
                            <div className="text-xs text-gray-500">{payment.channel}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">
                        {payment.receipt && (
                          <div>Receipt: <span className="font-mono">{payment.receipt}</span></div>
                        )}
                        {payment.transactionId && (
                          <div>ID: <span className="font-mono">{payment.transactionId}</span></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                <div className="text-sm text-yellow-800">
                  ℹ️ This is a FLEXIBLE payment. Customer can pay in installments.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
