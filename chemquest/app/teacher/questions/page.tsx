'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  BookOpen, Plus, ArrowLeft, Loader2, Upload, Eye,
  FileQuestion, Gamepad2, Check, X, AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface QuestionData {
  id: string
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: number
  topic: string
  difficulty: string
  explanation: string | null
}

interface QuestionSet {
  id: string
  name: string
  description: string | null
  subject: string
  module: string | null
  isPublic: boolean
  questionCount: number
  timesPlayed: number
  questions: QuestionData[]
  createdAt: string
}

export default function TeacherQuestionsPage() {
  const router = useRouter()
  const [sets, setSets] = useState<QuestionSet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showImport, setShowImport] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [previewSet, setPreviewSet] = useState<QuestionSet | null>(null)

  // Import form state
  const [importForm, setImportForm] = useState({
    name: '',
    description: '',
    module: '',
    subject: 'Chemistry',
    isPublic: false,
    questionsJson: '',
  })

  useEffect(() => {
    const fetchSets = async () => {
      try {
        const response = await fetch('/api/teacher/sets')
        if (response.status === 401) {
          router.push('/auth/login')
          return
        }
        if (response.status === 403) {
          toast.error('Only teachers can access this page')
          router.push('/')
          return
        }
        const data = await response.json()
        setSets(data.sets || [])
      } catch (error) {
        console.error('Failed to fetch sets:', error)
        toast.error('Failed to load question sets')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSets()
  }, [router])

  const handleImport = async () => {
    if (!importForm.name.trim()) {
      toast.error('Please enter a name for the question set')
      return
    }

    let questions
    try {
      questions = JSON.parse(importForm.questionsJson)
      if (!Array.isArray(questions)) {
        throw new Error('Questions must be an array')
      }
    } catch {
      toast.error('Invalid JSON format. Please check your questions.')
      return
    }

    setImportLoading(true)

    try {
      const response = await fetch('/api/questions/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: importForm.name,
          description: importForm.description || null,
          module: importForm.module || null,
          subject: importForm.subject,
          isPublic: importForm.isPublic,
          questions,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import')
      }

      toast.success(`Imported ${data.questionsImported} questions!`)
      setShowImport(false)
      setImportForm({
        name: '',
        description: '',
        module: '',
        subject: 'Chemistry',
        isPublic: false,
        questionsJson: '',
      })

      // Refresh the list
      const refreshResponse = await fetch('/api/teacher/sets')
      const refreshData = await refreshResponse.json()
      setSets(refreshData.sets || [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to import questions')
    } finally {
      setImportLoading(false)
    }
  }

  const SAMPLE_JSON = `[
  {
    "question": "What is the atomic number of Carbon?",
    "options": ["4", "6", "12", "14"],
    "correctAnswer": 1,
    "topic": "Atomic Structure",
    "difficulty": "easy",
    "explanation": "Carbon has 6 protons in its nucleus."
  }
]`

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-300 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-4 py-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <BookOpen className="w-8 h-8" />
                Question Manager
              </h1>
              <p className="text-purple-200">Create and manage your question sets</p>
            </div>
          </div>
          <Button
            onClick={() => setShowImport(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Import Questions
          </Button>
        </motion.div>

        {/* Import Modal */}
        <AnimatePresence>
          {showImport && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowImport(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <Card className="bg-purple-900/95 border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      Import Question Set
                    </CardTitle>
                    <CardDescription className="text-purple-200">
                      Upload a JSON array of questions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-purple-100">Set Name *</Label>
                        <Input
                          placeholder="e.g., Module 2 - Bonding"
                          value={importForm.name}
                          onChange={(e) => setImportForm({ ...importForm, name: e.target.value })}
                          className="bg-white/10 border-purple-500/30 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-purple-100">Module</Label>
                        <Input
                          placeholder="e.g., Module 2"
                          value={importForm.module}
                          onChange={(e) => setImportForm({ ...importForm, module: e.target.value })}
                          className="bg-white/10 border-purple-500/30 text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-purple-100">Description</Label>
                      <Input
                        placeholder="Brief description of this question set"
                        value={importForm.description}
                        onChange={(e) => setImportForm({ ...importForm, description: e.target.value })}
                        className="bg-white/10 border-purple-500/30 text-white"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={importForm.isPublic}
                        onCheckedChange={(checked) => setImportForm({ ...importForm, isPublic: checked })}
                      />
                      <Label className="text-purple-100">Make this set public</Label>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-purple-100">Questions JSON *</Label>
                      <Textarea
                        placeholder={SAMPLE_JSON}
                        value={importForm.questionsJson}
                        onChange={(e) => setImportForm({ ...importForm, questionsJson: e.target.value })}
                        className="bg-white/10 border-purple-500/30 text-white font-mono text-sm h-48"
                      />
                      <p className="text-xs text-purple-300">
                        Format: Array of objects with question, options (array of 4), correctAnswer (0-3), topic, difficulty (easy/medium/hard), and optional explanation
                      </p>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" onClick={() => setShowImport(false)} className="text-purple-200">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleImport}
                        disabled={importLoading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {importLoading ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importing...</>
                        ) : (
                          <><Upload className="w-4 h-4 mr-2" />Import</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview Modal */}
        <AnimatePresence>
          {previewSet && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setPreviewSet(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-3xl max-h-[90vh] overflow-y-auto"
              >
                <Card className="bg-purple-900/95 border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      {previewSet.name}
                    </CardTitle>
                    <CardDescription className="text-purple-200">
                      {previewSet.questionCount} questions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="space-y-2">
                      {previewSet.questions.map((q, index) => (
                        <AccordionItem key={q.id} value={q.id} className="border-purple-500/20">
                          <AccordionTrigger className="text-white hover:text-purple-200 text-left">
                            <span className="flex items-center gap-2">
                              <Badge variant="outline" className="text-purple-300">
                                Q{index + 1}
                              </Badge>
                              <span className="truncate max-w-md">{q.question}</span>
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="text-purple-100">
                            <div className="space-y-2 pl-4">
                              {['A', 'B', 'C', 'D'].map((letter, i) => {
                                const option = [q.optionA, q.optionB, q.optionC, q.optionD][i]
                                const isCorrect = q.correctAnswer === i
                                return (
                                  <div
                                    key={letter}
                                    className={`flex items-center gap-2 p-2 rounded ${
                                      isCorrect ? 'bg-green-500/20 text-green-300' : ''
                                    }`}
                                  >
                                    {isCorrect ? (
                                      <Check className="w-4 h-4 text-green-400" />
                                    ) : (
                                      <X className="w-4 h-4 text-red-400/50" />
                                    )}
                                    <span className="font-bold">{letter}.</span> {option}
                                  </div>
                                )
                              })}
                              <div className="flex gap-2 mt-2">
                                <Badge className="bg-purple-600">{q.topic}</Badge>
                                <Badge
                                  className={`${
                                    q.difficulty === 'easy'
                                      ? 'bg-green-600'
                                      : q.difficulty === 'medium'
                                      ? 'bg-yellow-600'
                                      : 'bg-red-600'
                                  }`}
                                >
                                  {q.difficulty}
                                </Badge>
                              </div>
                              {q.explanation && (
                                <div className="mt-2 p-2 bg-blue-500/20 rounded text-blue-200 text-sm">
                                  <strong>Explanation:</strong> {q.explanation}
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                    <Button
                      className="mt-4 w-full"
                      variant="ghost"
                      onClick={() => setPreviewSet(null)}
                    >
                      Close
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Question Sets List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {sets.length === 0 ? (
            <Card className="bg-white/10 backdrop-blur-lg border-purple-500/20">
              <CardContent className="py-12 text-center">
                <FileQuestion className="w-16 h-16 mx-auto mb-4 text-purple-400 opacity-50" />
                <h3 className="text-xl font-bold text-white mb-2">No Question Sets Yet</h3>
                <p className="text-purple-200 mb-4">
                  Import your first question set to get started
                </p>
                <Button onClick={() => setShowImport(true)} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Import Questions
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sets.map((set, index) => (
                <motion.div
                  key={set.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white/10 backdrop-blur-lg border-purple-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            {set.name}
                            {set.isPublic ? (
                              <Badge className="bg-green-600">Public</Badge>
                            ) : (
                              <Badge variant="outline" className="text-purple-300">Private</Badge>
                            )}
                          </h3>
                          {set.description && (
                            <p className="text-purple-200 text-sm mt-1">{set.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-purple-300">
                            <span className="flex items-center gap-1">
                              <FileQuestion className="w-4 h-4" />
                              {set.questionCount} questions
                            </span>
                            <span className="flex items-center gap-1">
                              <Gamepad2 className="w-4 h-4" />
                              {set.timesPlayed} games played
                            </span>
                            {set.module && (
                              <Badge variant="outline" className="text-purple-300">
                                {set.module}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewSet(set)}
                          className="text-purple-200 hover:text-white"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
