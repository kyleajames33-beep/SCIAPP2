'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Upload, FileJson, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function QuestionImportPage() {
  const [jsonInput, setJsonInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastResult, setLastResult] = useState<{ success: boolean; count?: number; message?: string } | null>(null)

  const handleProcess = async () => {
    if (!jsonInput.trim()) {
      toast.error('Please paste JSON data first')
      return
    }

    setIsProcessing(true)
    setLastResult(null)

    try {
      // Parse JSON
      const parsed = JSON.parse(jsonInput)
      const questions = Array.isArray(parsed) ? parsed : [parsed]

      // Validate basic structure
      if (questions.length === 0) {
        throw new Error('No questions found in JSON')
      }

      // Send to API
      const response = await fetch('/api/questions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import questions')
      }

      setLastResult({ success: true, count: data.count, message: data.message })
      toast.success(`Successfully imported ${data.count} questions!`)
      setJsonInput('') // Clear input on success
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import questions'
      setLastResult({ success: false, message })
      toast.error(message)
    } finally {
      setIsProcessing(false)
    }
  }

  const exampleJson = `[
  {
    "text": "What is the atomic number of Carbon?",
    "options": ["6", "8", "12", "14"],
    "correctAnswer": 0,
    "subject": "Chemistry",
    "topic": "Atomic Structure",
    "difficulty": "easy",
    "explanation": "Carbon has 6 protons, which determines its atomic number."
  },
  {
    "text": "Which gas is most abundant in Earth's atmosphere?",
    "options": ["Oxygen", "Nitrogen", "Carbon Dioxide", "Argon"],
    "correctAnswer": 1,
    "subject": "Chemistry",
    "topic": "Atmospheric Chemistry",
    "difficulty": "medium",
    "explanation": "Nitrogen makes up about 78% of Earth's atmosphere."
  }
]`

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Upload className="w-8 h-8" />
              Question Importer
            </h1>
            <p className="text-purple-200 mt-2">Bulk import questions from JSON</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Instructions */}
          <Card className="bg-white/10 backdrop-blur-lg border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileJson className="w-5 h-5" />
                JSON Format
              </CardTitle>
              <CardDescription className="text-purple-200">
                Paste your questions as a JSON array with the following structure:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm text-green-400 font-mono">
                {exampleJson}
              </pre>
              <div className="mt-4 space-y-2 text-sm text-purple-100">
                <p><strong>Required fields:</strong></p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li><code className="bg-purple-500/30 px-1 rounded">text</code> - The question text</li>
                  <li><code className="bg-purple-500/30 px-1 rounded">options</code> - Array of exactly 4 options</li>
                  <li><code className="bg-purple-500/30 px-1 rounded">correctAnswer</code> - Index of correct option (0-3)</li>
                </ul>
                <p className="mt-3"><strong>Optional fields:</strong></p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li><code className="bg-purple-500/30 px-1 rounded">subject</code> - Default: "Chemistry"</li>
                  <li><code className="bg-purple-500/30 px-1 rounded">topic</code> - Default: "General"</li>
                  <li><code className="bg-purple-500/30 px-1 rounded">difficulty</code> - "easy", "medium", or "hard" (Default: "medium")</li>
                  <li><code className="bg-purple-500/30 px-1 rounded">explanation</code> - Optional explanation shown after answering</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Input Area */}
          <Card className="bg-white/10 backdrop-blur-lg border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white">Paste JSON</CardTitle>
              <CardDescription className="text-purple-200">
                Copy your JSON array and paste it below
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Paste your JSON array here..."
                className="min-h-[300px] bg-gray-900 border-purple-500/30 text-white font-mono text-sm"
              />

              <div className="flex items-center gap-4">
                <Button
                  onClick={handleProcess}
                  disabled={isProcessing || !jsonInput.trim()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Process & Import
                    </>
                  )}
                </Button>

                {jsonInput.trim() && (
                  <Button
                    onClick={() => setJsonInput('')}
                    variant="outline"
                    className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                  >
                    Clear
                  </Button>
                )}
              </div>

              {/* Result */}
              {lastResult && (
                <div
                  className={`p-4 rounded-lg border-2 ${
                    lastResult.success
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {lastResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-semibold ${lastResult.success ? 'text-green-300' : 'text-red-300'}`}>
                        {lastResult.success ? 'Success!' : 'Error'}
                      </p>
                      <p className={`text-sm mt-1 ${lastResult.success ? 'text-green-200' : 'text-red-200'}`}>
                        {lastResult.message}
                      </p>
                      {lastResult.success && lastResult.count !== undefined && (
                        <p className="text-sm mt-1 text-green-100">
                          {lastResult.count} {lastResult.count === 1 ? 'question' : 'questions'} added to the database
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
