"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

const US_TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
]

const CHANNELS = [
  { value: "sms", label: "SMS" },
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
]

const CONTACT_DAYS = [
  { value: "Mon", label: "Mon" },
  { value: "Tue", label: "Tue" },
  { value: "Wed", label: "Wed" },
  { value: "Thu", label: "Thu" },
  { value: "Fri", label: "Fri" },
]

const MESSAGE_TONES = [
  { value: "friendly", label: "Friendly" },
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
]

const CRM_TYPES = [
  { value: "none", label: "None" },
  { value: "hubspot", label: "HubSpot" },
  { value: "zoho", label: "Zoho" },
  { value: "salesforce", label: "Salesforce" },
  { value: "jobadder", label: "JobAdder" },
]

interface FormData {
  crmType: string
  // Fields shown when CRM is "none"
  franchiseName: string
  locationId: string
  businessPhoneNumber: string
  businessEmail: string
  preferredReplyName: string
  // Fields shown when CRM is not "none"
  crmApiKey: string
  crmInstanceUrl: string
  // Common fields
  timezone: string
  allowedChannels: string[]
  contactDays: string[]
  businessHoursStart: string
  businessHoursEnd: string
  minHoursBetweenFollowups: string
  maxFollowupsPerLead: string
  preferredMessageTone: string
}

interface FormErrors {
  crmType?: string
  franchiseName?: string
  businessPhoneNumber?: string
  businessEmail?: string
  crmApiKey?: string
  crmInstanceUrl?: string
  timezone?: string
  allowedChannels?: string
  contactDays?: string
  businessHoursStart?: string
  businessHoursEnd?: string
  minHoursBetweenFollowups?: string
  maxFollowupsPerLead?: string
}

// US phone number validation
// Format: +1 followed by 10 digits, area code cannot start with 0 or 1
const US_PHONE_REGEX = /^\+1[2-9]\d{9}$/

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Convert time string (HH:MM) to minutes for comparison
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

const validatePhoneNumber = (phone: string): { valid: boolean; error?: string } => {
  if (!phone.startsWith("+1")) {
    return { valid: false, error: "Phone number must start with +1 (US country code)" }
  }
  
  if (!US_PHONE_REGEX.test(phone)) {
    return { 
      valid: false, 
      error: "Invalid US phone number. Must be +1 followed by 10 digits (e.g., +12025551234)" 
    }
  }
  
  return { valid: true }
}

export function FranchiseeOnboardingForm() {
  const [formData, setFormData] = useState<FormData>({
    crmType: "none",
    franchiseName: "",
    locationId: "",
    businessPhoneNumber: "",
    businessEmail: "",
    preferredReplyName: "",
    crmApiKey: "",
    crmInstanceUrl: "",
    timezone: "",
    allowedChannels: [],
    contactDays: [],
    businessHoursStart: "08:00",
    businessHoursEnd: "18:00",
    minHoursBetweenFollowups: "",
    maxFollowupsPerLead: "",
    preferredMessageTone: "friendly",
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const validateField = useCallback((field: keyof FormData, value: string | string[], allFormData?: FormData): string | undefined => {
    const crmType = allFormData?.crmType || formData.crmType
    const isNoCrm = crmType === "none"

    switch (field) {
      case "crmType":
        if (!value || (typeof value === "string" && !value.trim())) {
          return "CRM type is required"
        }
        break
      case "franchiseName":
        if (isNoCrm && (!value || (typeof value === "string" && !value.trim()))) {
          return "Franchise name is required"
        }
        break
      case "businessPhoneNumber":
        if (isNoCrm) {
          if (!value || (typeof value === "string" && !value.trim())) {
            return "Business phone number is required"
          }
          if (typeof value === "string") {
            const result = validatePhoneNumber(value)
            if (!result.valid) {
              return result.error
            }
          }
        }
        break
      case "businessEmail":
        if (isNoCrm) {
          if (!value || (typeof value === "string" && !value.trim())) {
            return "Business email is required"
          }
          if (typeof value === "string" && !EMAIL_REGEX.test(value)) {
            return "Please enter a valid email address"
          }
        }
        break
      case "crmApiKey":
        if (!isNoCrm && (!value || (typeof value === "string" && !value.trim()))) {
          return "CRM API Key is required"
        }
        break
      case "crmInstanceUrl":
        if (!isNoCrm && (!value || (typeof value === "string" && !value.trim()))) {
          return "CRM Instance URL is required"
        }
        if (!isNoCrm && typeof value === "string" && value.trim()) {
          try {
            new URL(value)
          } catch {
            return "Please enter a valid URL"
          }
        }
        break
      case "timezone":
        if (!value || (typeof value === "string" && !value.trim())) {
          return "Timezone is required"
        }
        break
      case "allowedChannels":
        if (!Array.isArray(value) || value.length === 0) {
          return "At least one channel is required"
        }
        break
      case "contactDays":
        if (!Array.isArray(value) || value.length === 0) {
          return "At least one contact day is required"
        }
        break
      case "businessHoursStart":
        if (!value || (typeof value === "string" && !value.trim())) {
          return "Business hours start time is required"
        }
        break
      case "businessHoursEnd":
        if (!value || (typeof value === "string" && !value.trim())) {
          return "Business hours end time is required"
        }
        if (typeof value === "string" && allFormData?.businessHoursStart) {
          const startMinutes = timeToMinutes(allFormData.businessHoursStart)
          const endMinutes = timeToMinutes(value)
          if (endMinutes <= startMinutes) {
            return "End time must be after start time"
          }
        }
        break
      case "minHoursBetweenFollowups":
        if (!value || (typeof value === "string" && !value.trim())) {
          return "Minimum hours is required"
        }
        if (typeof value === "string" && (isNaN(Number(value)) || Number(value) < 1)) {
          return "Must be at least 1"
        }
        break
      case "maxFollowupsPerLead":
        if (!value || (typeof value === "string" && !value.trim())) {
          return "Maximum follow-ups is required"
        }
        if (typeof value === "string") {
          const num = Number(value)
          if (isNaN(num) || num < 1 || num > 20) {
            return "Must be between 1 and 20"
          }
        }
        break
      }
    return undefined
  }, [])

  const validateAllFields = useCallback((): boolean => {
    const newErrors: FormErrors = {}
    let isValid = true

    ;(Object.keys(formData) as Array<keyof FormData>).forEach((field) => {
      const error = validateField(field, formData[field], formData)
      if (error) {
        newErrors[field as keyof FormErrors] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }, [formData, validateField])

  const handleInputChange = (field: keyof FormData, value: string) => {
    const updatedFormData = { ...formData, [field]: value }
    setFormData(updatedFormData)
    if (touched.has(field)) {
      const error = validateField(field, value, updatedFormData)
      setErrors((prev) => {
        const newErrors = { ...prev, [field]: error }
        // Re-validate businessHoursEnd when businessHoursStart changes
        if (field === "businessHoursStart" && touched.has("businessHoursEnd")) {
          newErrors.businessHoursEnd = validateField("businessHoursEnd", updatedFormData.businessHoursEnd, updatedFormData)
        }
        return newErrors
      })
    }
  }

  const handleBlur = (field: keyof FormData) => {
    setTouched((prev) => new Set(prev).add(field))
    const error = validateField(field, formData[field], formData)
    setErrors((prev) => ({ ...prev, [field]: error }))
  }

  const handleCheckboxChange = (field: "allowedChannels" | "contactDays", value: string, checked: boolean) => {
    setFormData((prev) => {
      const current = prev[field]
      const updated = checked ? [...current, value] : current.filter((v) => v !== value)
      return { ...prev, [field]: updated }
    })
    setTouched((prev) => new Set(prev).add(field))
    
    // Validate after state update
    setTimeout(() => {
      const updatedValue = formData[field].includes(value) 
        ? formData[field].filter((v) => v !== value) 
        : [...formData[field], value]
      const error = validateField(field, checked ? [...formData[field], value] : formData[field].filter((v) => v !== value))
      setErrors((prev) => ({ ...prev, [field]: error }))
    }, 0)
  }

  const isFormValid = useCallback((): boolean => {
    const isNoCrm = formData.crmType === "none"
    
    // Common required fields
    const commonFields: Array<keyof FormData> = [
      "crmType",
      "timezone",
      "allowedChannels",
      "contactDays",
      "businessHoursStart",
      "businessHoursEnd",
      "minHoursBetweenFollowups",
      "maxFollowupsPerLead",
    ]

    // Conditional fields based on CRM type
    const conditionalFields: Array<keyof FormData> = isNoCrm
      ? ["franchiseName", "businessPhoneNumber", "businessEmail"]
      : ["crmApiKey", "crmInstanceUrl"]

    const requiredFields = [...commonFields, ...conditionalFields]

    for (const field of requiredFields) {
      const error = validateField(field, formData[field], formData)
      if (error) return false
    }

    return true
  }, [formData, validateField])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all fields as touched
    const allFields = Object.keys(formData) as Array<keyof FormData>
    setTouched(new Set(allFields))

    if (!validateAllFields()) {
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()

      const isNoCrm = formData.crmType === "none"
      
      const insertData = {
        crm_type: formData.crmType,
        // Fields for when CRM is "none"
        franchise_name: isNoCrm ? formData.franchiseName.trim() : null,
        location_id: isNoCrm ? (formData.locationId.trim() || null) : null,
        business_phone_number: isNoCrm ? formData.businessPhoneNumber.trim() : null,
        business_email: isNoCrm ? formData.businessEmail.trim() : null,
        preferred_reply_name: isNoCrm ? (formData.preferredReplyName.trim() || null) : null,
        // Fields for when CRM is selected
        crm_api_key: !isNoCrm ? formData.crmApiKey.trim() : null,
        crm_instance_url: !isNoCrm ? formData.crmInstanceUrl.trim() : null,
        // Common fields
        timezone: formData.timezone,
        allowed_channels: formData.allowedChannels,
        contact_days: formData.contactDays,
        business_hours_start: formData.businessHoursStart,
        business_hours_end: formData.businessHoursEnd,
        min_hours_between_followups: Number(formData.minHoursBetweenFollowups),
        max_followups_per_lead: Number(formData.maxFollowupsPerLead),
        preferred_message_tone: formData.preferredMessageTone,
      }

      const { error: supabaseError } = await supabase
        .from("franchisee_config")
        .insert(insertData)

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      // Call webhook if URL is configured
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(insertData),
          })
        } catch (webhookError) {
          // Log but don't fail the submission if webhook fails
          console.error("Webhook call failed:", webhookError)
        }
      }

      setIsSuccess(true)
    } catch (error) {
      console.error("Submission error:", error)
      setErrors((prev) => ({
        ...prev,
        franchiseName: "An error occurred. Please try again.",
      }))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">Setup Complete</h2>
            <p className="text-muted-foreground">
              {"Your setup is complete. You'll receive a confirmation shortly."}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Franchisee Onboarding</CardTitle>
        <CardDescription>
          Complete the form below to set up your franchise configuration.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* CRM Type */}
          <div className="space-y-2">
            <Label htmlFor="crmType">
              CRM Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.crmType}
              onValueChange={(value) => {
                handleInputChange("crmType", value)
                setTouched((prev) => new Set(prev).add("crmType"))
              }}
            >
              <SelectTrigger
                id="crmType"
                aria-invalid={!!errors.crmType}
                aria-describedby={errors.crmType ? "crmType-error" : undefined}
              >
                <SelectValue placeholder="Select CRM type" />
              </SelectTrigger>
              <SelectContent>
                {CRM_TYPES.map((crm) => (
                  <SelectItem key={crm.value} value={crm.value}>
                    {crm.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {touched.has("crmType") && errors.crmType && (
              <p id="crmType-error" className="text-sm text-destructive">
                {errors.crmType}
              </p>
            )}
          </div>

          {/* Conditional Fields based on CRM Type */}
          {formData.crmType === "none" ? (
            <>
              {/* Franchise Name */}
              <div className="space-y-2">
                <Label htmlFor="franchiseName">
                  Franchise Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="franchiseName"
                  value={formData.franchiseName}
                  onChange={(e) => handleInputChange("franchiseName", e.target.value)}
                  onBlur={() => handleBlur("franchiseName")}
                  placeholder="Enter franchise name"
                  aria-invalid={!!errors.franchiseName}
                  aria-describedby={errors.franchiseName ? "franchiseName-error" : undefined}
                />
                {touched.has("franchiseName") && errors.franchiseName && (
                  <p id="franchiseName-error" className="text-sm text-destructive">
                    {errors.franchiseName}
                  </p>
                )}
              </div>

              {/* Business Email */}
              <div className="space-y-2">
                <Label htmlFor="businessEmail">
                  Business Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="businessEmail"
                  type="email"
                  value={formData.businessEmail}
                  onChange={(e) => handleInputChange("businessEmail", e.target.value)}
                  onBlur={() => handleBlur("businessEmail")}
                  placeholder="email@example.com"
                  aria-invalid={!!errors.businessEmail}
                  aria-describedby={errors.businessEmail ? "businessEmail-error" : undefined}
                />
                {touched.has("businessEmail") && errors.businessEmail && (
                  <p id="businessEmail-error" className="text-sm text-destructive">
                    {errors.businessEmail}
                  </p>
                )}
              </div>

              {/* Business Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="businessPhoneNumber">
                  Business Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="businessPhoneNumber"
                  value={formData.businessPhoneNumber}
                  onChange={(e) => handleInputChange("businessPhoneNumber", e.target.value)}
                  onBlur={() => handleBlur("businessPhoneNumber")}
                  placeholder="+1XXXXXXXXXX"
                  aria-invalid={!!errors.businessPhoneNumber}
                  aria-describedby={errors.businessPhoneNumber ? "businessPhoneNumber-error" : undefined}
                />
                {touched.has("businessPhoneNumber") && errors.businessPhoneNumber && (
                  <p id="businessPhoneNumber-error" className="text-sm text-destructive">
                    {errors.businessPhoneNumber}
                  </p>
                )}
              </div>

              {/* Location ID */}
              <div className="space-y-2">
                <Label htmlFor="locationId">Location ID</Label>
                <Input
                  id="locationId"
                  value={formData.locationId}
                  onChange={(e) => handleInputChange("locationId", e.target.value)}
                  placeholder="e.g., NYC-001"
                />
                <p className="text-sm text-muted-foreground">
                  Your territory or store code if part of a franchise network
                </p>
              </div>

              {/* Preferred Reply Name */}
              <div className="space-y-2">
                <Label htmlFor="preferredReplyName">Preferred Reply Name</Label>
                <Input
                  id="preferredReplyName"
                  value={formData.preferredReplyName}
                  onChange={(e) => handleInputChange("preferredReplyName", e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </>
          ) : (
            <>
              {/* CRM API Key */}
              <div className="space-y-2">
                <Label htmlFor="crmApiKey">
                  CRM API Key <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="crmApiKey"
                  type="password"
                  value={formData.crmApiKey}
                  onChange={(e) => handleInputChange("crmApiKey", e.target.value)}
                  onBlur={() => handleBlur("crmApiKey")}
                  placeholder="Enter your CRM API key"
                  aria-invalid={!!errors.crmApiKey}
                  aria-describedby={errors.crmApiKey ? "crmApiKey-error" : undefined}
                />
                {touched.has("crmApiKey") && errors.crmApiKey && (
                  <p id="crmApiKey-error" className="text-sm text-destructive">
                    {errors.crmApiKey}
                  </p>
                )}
              </div>

              {/* CRM Instance URL */}
              <div className="space-y-2">
                <Label htmlFor="crmInstanceUrl">
                  CRM Instance URL <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="crmInstanceUrl"
                  type="url"
                  value={formData.crmInstanceUrl}
                  onChange={(e) => handleInputChange("crmInstanceUrl", e.target.value)}
                  onBlur={() => handleBlur("crmInstanceUrl")}
                  placeholder="https://your-instance.crm.com"
                  aria-invalid={!!errors.crmInstanceUrl}
                  aria-describedby={errors.crmInstanceUrl ? "crmInstanceUrl-error" : undefined}
                />
                {touched.has("crmInstanceUrl") && errors.crmInstanceUrl && (
                  <p id="crmInstanceUrl-error" className="text-sm text-destructive">
                    {errors.crmInstanceUrl}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Timezone */}
          <div className="space-y-2">
            <Label htmlFor="timezone">
              Timezone <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) => {
                handleInputChange("timezone", value)
                setTouched((prev) => new Set(prev).add("timezone"))
              }}
            >
              <SelectTrigger
                id="timezone"
                aria-invalid={!!errors.timezone}
                aria-describedby={errors.timezone ? "timezone-error" : undefined}
              >
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {US_TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {touched.has("timezone") && errors.timezone && (
              <p id="timezone-error" className="text-sm text-destructive">
                {errors.timezone}
              </p>
            )}
          </div>

          {/* Allowed Channels */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium leading-none">
              Allowed Channels <span className="text-destructive">*</span>
            </legend>
            <div className="flex flex-wrap gap-4">
              {CHANNELS.map((channel) => (
                <div key={channel.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`channel-${channel.value}`}
                    checked={formData.allowedChannels.includes(channel.value)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange("allowedChannels", channel.value, checked === true)
                    }
                  />
                  <Label htmlFor={`channel-${channel.value}`} className="font-normal cursor-pointer">
                    {channel.label}
                  </Label>
                </div>
              ))}
            </div>
            {touched.has("allowedChannels") && errors.allowedChannels && (
              <p className="text-sm text-destructive">{errors.allowedChannels}</p>
            )}
          </fieldset>

          {/* Contact Days */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium leading-none">
              Contact Days <span className="text-destructive">*</span>
            </legend>
            <div className="flex flex-wrap gap-4">
              {CONTACT_DAYS.map((day) => (
                <div key={day.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={formData.contactDays.includes(day.value)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange("contactDays", day.value, checked === true)
                    }
                  />
                  <Label htmlFor={`day-${day.value}`} className="font-normal cursor-pointer">
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
            {touched.has("contactDays") && errors.contactDays && (
              <p className="text-sm text-destructive">{errors.contactDays}</p>
            )}
          </fieldset>

          {/* Business Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessHoursStart">
                Business Hours Start <span className="text-destructive">*</span>
              </Label>
              <Input
                id="businessHoursStart"
                type="time"
                value={formData.businessHoursStart}
                onChange={(e) => handleInputChange("businessHoursStart", e.target.value)}
                onBlur={() => handleBlur("businessHoursStart")}
                aria-invalid={!!errors.businessHoursStart}
                aria-describedby={errors.businessHoursStart ? "businessHoursStart-error" : undefined}
              />
              {touched.has("businessHoursStart") && errors.businessHoursStart && (
                <p id="businessHoursStart-error" className="text-sm text-destructive">
                  {errors.businessHoursStart}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessHoursEnd">
                Business Hours End <span className="text-destructive">*</span>
              </Label>
              <Input
                id="businessHoursEnd"
                type="time"
                value={formData.businessHoursEnd}
                onChange={(e) => handleInputChange("businessHoursEnd", e.target.value)}
                onBlur={() => handleBlur("businessHoursEnd")}
                aria-invalid={!!errors.businessHoursEnd}
                aria-describedby={errors.businessHoursEnd ? "businessHoursEnd-error" : undefined}
              />
              {touched.has("businessHoursEnd") && errors.businessHoursEnd && (
                <p id="businessHoursEnd-error" className="text-sm text-destructive">
                  {errors.businessHoursEnd}
                </p>
              )}
            </div>
          </div>

          {/* Follow-up Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minHoursBetweenFollowups">
                Min Hours Between Follow-ups <span className="text-destructive">*</span>
              </Label>
              <Input
                id="minHoursBetweenFollowups"
                type="number"
                min="1"
                value={formData.minHoursBetweenFollowups}
                onChange={(e) => handleInputChange("minHoursBetweenFollowups", e.target.value)}
                onBlur={() => handleBlur("minHoursBetweenFollowups")}
                placeholder="e.g., 24"
                aria-invalid={!!errors.minHoursBetweenFollowups}
                aria-describedby={errors.minHoursBetweenFollowups ? "minHours-error" : undefined}
              />
              {touched.has("minHoursBetweenFollowups") && errors.minHoursBetweenFollowups && (
                <p id="minHours-error" className="text-sm text-destructive">
                  {errors.minHoursBetweenFollowups}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxFollowupsPerLead">
                Max Follow-ups Per Lead <span className="text-destructive">*</span>
              </Label>
              <Input
                id="maxFollowupsPerLead"
                type="number"
                min="1"
                max="20"
                value={formData.maxFollowupsPerLead}
                onChange={(e) => handleInputChange("maxFollowupsPerLead", e.target.value)}
                onBlur={() => handleBlur("maxFollowupsPerLead")}
                placeholder="1-20"
                aria-invalid={!!errors.maxFollowupsPerLead}
                aria-describedby={errors.maxFollowupsPerLead ? "maxFollowups-error" : undefined}
              />
              {touched.has("maxFollowupsPerLead") && errors.maxFollowupsPerLead && (
                <p id="maxFollowups-error" className="text-sm text-destructive">
                  {errors.maxFollowupsPerLead}
                </p>
              )}
            </div>
          </div>

          {/* Preferred Message Tone */}
          <div className="space-y-2">
            <Label htmlFor="preferredMessageTone">Preferred Message Tone</Label>
            <Select
              value={formData.preferredMessageTone}
              onValueChange={(value) => handleInputChange("preferredMessageTone", value)}
            >
              <SelectTrigger id="preferredMessageTone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESSAGE_TONES.map((tone) => (
                  <SelectItem key={tone.value} value={tone.value}>
                    {tone.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={!isFormValid() || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Complete Setup"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
