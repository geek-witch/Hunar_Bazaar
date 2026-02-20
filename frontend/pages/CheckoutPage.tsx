"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Page, type Navigation } from "../App"
import { CheckCircleIcon } from "../components/icons/MiscIcons"
import { subscriptionApi } from "../utils/api"

type Plan = "Premium" | "Professional"

const CheckoutPage: React.FC<{ navigation: Navigation; plan?: Plan }> = ({ navigation }) => {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal">("card")
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPlanDetails = async () => {
      try {
        const planType = sessionStorage.getItem('selectedPlan') || 'Premium'
        const response = await subscriptionApi.getPlans()
        if (response.success && Array.isArray(response.data)) {
          const plan = response.data.find((p: any) => p.type === planType)
          if (plan) {
            setSelectedPlan(plan)
          } else {
            // Fallback or error
            setSelectedPlan(response.data.find((p: any) => p.type === 'Premium'))
          }
        }
      } catch (error) {
        console.error('Error fetching plan details:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlanDetails()
  }, [])

  const handlePayment = async () => {
    if (!selectedPlan) return
    setIsProcessing(true)
    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Save subscription to localStorage
      localStorage.setItem("userPlan", selectedPlan.type)
      localStorage.setItem("subscriptionDate", new Date().toISOString())

      navigation.showNotification(`Successfully Upgraded to ${selectedPlan.name} Plan!`)
      // Small delay to show notification before navigating
      setTimeout(() => {
        navigation.navigateTo(Page.Home)
      }, 500)
    } catch (error) {
      navigation.showNotification("Payment Failed. Please Try Again.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return <div className="min-h-screen bg-brand-light-blue flex items-center justify-center text-gray-500">Loading plan details...</div>
  }

  if (!selectedPlan) {
    return <div className="min-h-screen bg-brand-light-blue flex items-center justify-center text-gray-500">Plan not found.</div>
  }

  return (
    <div className="bg-brand-light-blue min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">

          <h1 className="text-4xl font-bold text-brand-teal">Complete Your Purchase</h1>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="md:col-span-1">
            <div className="bg-white p-8 rounded-xl shadow-lg sticky top-8">
              <h2 className="text-xl font-bold text-brand-teal mb-6">Order Summary</h2>

              <div className="mb-6 pb-6 border-b">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{selectedPlan.name} Plan</h3>
                <p className="text-sm text-gray-500 mb-4">{selectedPlan.description}</p>
                <ul className="space-y-2 mb-4">
                  {selectedPlan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Price:</span>
                  <span className="font-semibold text-gray-800">PKR {selectedPlan.price}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Billing Cycle:</span>
                  <span className="text-gray-800">Monthly</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-brand-teal">PKR {selectedPlan.price}/month</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="md:col-span-2">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h2 className="text-xl font-bold text-brand-teal mb-6">Payment Information</h2>

              {/* Payment Method Selection */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Select Payment Method</h3>
                <div className="space-y-3">
                  <label
                    className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all"
                    style={{ borderColor: paymentMethod === "card" ? "#1a5f7a" : "#e5e7eb" }}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={(e) => setPaymentMethod(e.target.value as "card")}
                      className="w-4 h-4"
                    />
                    <span className="ml-3 font-medium text-gray-800">Credit/Debit Card</span>
                  </label>
                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-all">
                    <input
                      type="radio"
                      name="payment"
                      value="paypal"
                      checked={paymentMethod === "paypal"}
                      onChange={(e) => setPaymentMethod(e.target.value as "paypal")}
                      className="w-4 h-4"
                    />
                    <span className="ml-3 font-medium text-gray-800">PayPal</span>
                  </label>
                </div>
              </div>

              {/* Card Payment Form */}
              {paymentMethod === "card" && (
                <div className="space-y-4 mb-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
                    <input
                      type="text"
                      placeholder="Issa Ali"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                    <input
                      type="text"
                      placeholder="4532 1234 5678 9010"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                      <input
                        type="text"
                        placeholder="123"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* PayPal Notice */}
              {paymentMethod === "paypal" && (
                <div className="bg-blue-50 p-4 rounded-lg mb-8 border border-blue-200">
                  <p className="text-sm text-blue-800">
                    You will be redirected to PayPal to complete your payment securely.
                  </p>
                </div>
              )}

              {/* Billing Address */}
              <div className="mb-8 pb-8 border-b">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Billing Address</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      placeholder="Ali@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="City"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal"
                    />
                    <input
                      type="text"
                      placeholder="Country"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal"
                    />
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="mb-8">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 mt-1" defaultChecked />
                  <span className="text-sm text-gray-700">
                    I agree to the{" "}
                    <a href="#" className="text-brand-teal hover:underline">
                      Terms & Conditions
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-brand-teal hover:underline">
                      Privacy Policy
                    </a>
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${isProcessing ? "bg-gray-400 cursor-not-allowed" : "bg-brand-teal hover:bg-brand-teal-dark"
                  }`}
              >
                {isProcessing ? "Processing Payment..." : `Pay PKR ${selectedPlan.price}/month`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage
