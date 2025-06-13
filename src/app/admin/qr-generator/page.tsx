"use client"

import { useState } from 'react'
import { AuthGuard } from '@/components/auth-guard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IconDownload, IconQrcode, IconRefresh, IconCopy } from '@tabler/icons-react'
import { toast } from 'sonner'

export default function QRGeneratorPage() {
  const [qrData, setQrData] = useState<{
    qr_code: string
    form_url: string
    location: string
    category: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    location: '',
    category: 'general'
  })

  const categories = [
    { value: 'general', label: 'General Complaint' },
    { value: 'water', label: 'Water Supply' },
    { value: 'electricity', label: 'Electricity' },
    { value: 'roads', label: 'Roads & Infrastructure' },
    { value: 'sanitation', label: 'Sanitation' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'safety', label: 'Safety & Security' },
  ]

  const generateQR = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        location: formData.location || 'general',
        category: formData.category,
        format: 'json'
      })

      const response = await fetch(`/api/generate-qr?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to generate QR code')
      }

      const data = await response.json()
      setQrData(data)
      toast.success('QR code generated successfully!')

    } catch (error) {
      console.error('Error generating QR code:', error)
      toast.error('Failed to generate QR code')
    } finally {
      setLoading(false)
    }
  }

  const downloadQR = () => {
    if (!qrData) return

    const link = document.createElement('a')
    link.href = qrData.qr_code
    link.download = `grievance-qr-${formData.location || 'general'}-${formData.category}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('QR code downloaded!')
  }

  const copyURL = () => {
    if (!qrData) return

    navigator.clipboard.writeText(qrData.form_url)
    toast.success('Form URL copied to clipboard!')
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="container mx-auto px-4 py-6">
            <div>
              <h1 className="text-3xl font-bold">QR Code Generator</h1>
              <p className="text-muted-foreground">
                Generate QR codes for grievance submission forms
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconQrcode className="h-5 w-5" />
                  Generate QR Code
                </CardTitle>
                <CardDescription>
                  Create QR codes for specific locations or categories
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="e.g., Ward 12, Central Market, Bus Stand"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave blank for general use. This will pre-fill the location field in the form.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Default Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={generateQR} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <IconRefresh className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <IconQrcode className="mr-2 h-4 w-4" />
                      Generate QR Code
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Generated QR Code</CardTitle>
                <CardDescription>
                  QR code and form URL for distribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                {qrData ? (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <img
                        src={qrData.qr_code}
                        alt="Grievance QR Code"
                        className="border rounded-lg"
                        style={{ maxWidth: '256px', width: '100%' }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Form URL</Label>
                      <div className="flex gap-2">
                        <Input
                          value={qrData.form_url}
                          readOnly
                          className="text-xs"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={copyURL}
                        >
                          <IconCopy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <Label className="text-xs text-muted-foreground">Location</Label>
                        <p>{qrData.location || 'General'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Category</Label>
                        <p>{categories.find(c => c.value === qrData.category)?.label}</p>
                      </div>
                    </div>

                    <Button onClick={downloadQR} className="w-full">
                      <IconDownload className="mr-2 h-4 w-4" />
                      Download QR Code
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <IconQrcode className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      Generate a QR code to display here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Usage Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium">1. Print & Display</h4>
                  <p className="text-muted-foreground">
                    Print QR codes and display them at public locations, office counters, or notice boards.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">2. Location-Specific</h4>
                  <p className="text-muted-foreground">
                    Create location-specific QR codes to automatically pre-fill the location field in forms.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">3. Category-Based</h4>
                  <p className="text-muted-foreground">
                    Generate category-specific QR codes for different types of grievances or departments.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}