import React from 'react'
import { AlertTriangle, X } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  variant = 'default' // 'default' | 'danger'
}) => {
  if (!isOpen) return null

  const variantStyles = {
    default: {
      button: 'btn-primary',
      icon: 'text-primary-600'
    },
    danger: {
      button: 'btn-danger',
      icon: 'text-red-600'
    }
  }

  const currentVariant = variantStyles[variant] || variantStyles.default

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <AlertTriangle className={`h-6 w-6 ${currentVariant.icon}`} />
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 p-6 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`${currentVariant.button} flex-1 flex items-center justify-center space-x-2`}
          >
            {isLoading && <LoadingSpinner size="sm" />}
            <span>{confirmLabel}</span>
          </button>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="btn-secondary flex-1"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog 