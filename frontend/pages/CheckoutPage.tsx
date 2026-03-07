"use client"

import type React from "react"
import { useEffect, useState } from "react"
import type { Navigation } from "../App"
import { CheckCircleIcon } from "../components/icons/MiscIcons"
import { subscriptionApi } from "../utils/api"
import { loadStripe } from "@stripe/stripe-js"

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null

type Plan = "Premium" | "Professional"

const CheckoutPage: React.FC<{ navigation: Navigation; plan?: Plan }> = ({ navigation }) => {
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

  const handleProceed = async () => {
    if (!selectedPlan) return

    setIsProcessing(true)
    try {
      if (!stripePromise || !stripePublishableKey) {
        console.error("Stripe publishable key is not configured")
        navigation.showNotification("Payment configuration error. Please contact support.")
        return
      }

      // Keep plan selection persisted (already used elsewhere)
      if (selectedPlan?.type) {
        sessionStorage.setItem("selectedPlan", String(selectedPlan.type))
      }

      const response = await subscriptionApi.createCheckoutSession(selectedPlan._id)
      if (!response.success || !(response as any).sessionId) {
        navigation.showNotification(response.message || "Failed to start payment. Please try again.")
        return
      }

      const stripe = await stripePromise
      if (!stripe) {
        navigation.showNotification("Stripe failed to initialize. Please refresh and try again.")
        return
      }

      const { error } = await stripe.redirectToCheckout({ sessionId: (response as any).sessionId })
      if (error) {
        console.error("Stripe redirect error:", error)
        navigation.showNotification(error.message || "Payment redirect failed. Please try again.")
      }
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

          <h1 className="text-4xl font-bold text-brand-teal">Checkout</h1>
          <p className="text-gray-600 mt-2">Review your plan and proceed to pay.</p>
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

          {/* Proceed */}
          <div className="md:col-span-2">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h2 className="text-xl font-bold text-brand-teal mb-3">Pay securely with card</h2>
              <p className="text-gray-600 mb-8">You’ll be redirected to Stripe Checkout to enter your card details.</p>

              <button
                onClick={handleProceed}
                disabled={isProcessing}
                className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
                  isProcessing ? "bg-gray-400 cursor-not-allowed" : "bg-brand-teal hover:bg-brand-teal-dark"
                }`}
              >
                {isProcessing ? "Redirecting to payment..." : `Proceed to pay PKR ${selectedPlan.price}/month`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage
