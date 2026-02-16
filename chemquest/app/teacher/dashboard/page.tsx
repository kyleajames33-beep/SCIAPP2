'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download, TrendingUp, Users, Clock, Target } from 'lucide-react'
import { toast } from 'sonner'

interface StudentAnalytics {
  userId: string
  username: string
  displayName: string
  gamesPlayed: number
  averageAccuracy: number
  totalCorrect: number
  totalIncorrect: number
  mostMissedTopic: string
  totalStudyTime: number
  lastPlayed: string | null
}

interface AnalyticsData {
  students: StudentAnalytics[]
  questionSets: { id: string; name: string }[]
  totalStudents: number
  totalGames: number
}

export default function TeacherDashboard() {
  const router = useRouter()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'name' | 'accuracy' | 'studyTime' | 'gamesPlayed'>('accuracy')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/teacher/analytics')

      if (response.status === 401) {
        toast.error('Please log in to access this page')
        router.push('/login')
        return
      }

      if (response.status === 403) {
        toast.error('Access denied. Teachers only.')
        router.push('/')
        return
      }

      if (response.ok) {
        const analyticsData = await response.json()
        setData(analyticsData)
      } else {
        toast.error('Failed to fetch analytics')
      }
    } catch (error) {
      console.error('Analytics fetch error:', error)
      toast.error('Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const getSortedStudents = () => {
    if (!data) return []

    const students = [...data.students]

    students.sort((a, b) => {
      let aVal: number | string = 0
      let bVal: number | string = 0

      switch (sortBy) {
        case 'name':
          aVal = a.displayName.toLowerCase()
          bVal = b.displayName.toLowerCase()
          break
        case 'accuracy':
          aVal = a.averageAccuracy
          bVal = b.averageAccuracy
          break
        case 'studyTime':
          aVal = a.totalStudyTime
          bVal = b.totalStudyTime
          break
        case 'gamesPlayed':
          aVal = a.gamesPlayed
          bVal = b.gamesPlayed
          break
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }

      return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
    })

    return students
  }

  const downloadCSV = () => {
    if (!data || data.students.length === 0) {
      toast.error('No data to export')
      return
    }

    const headers = [
      'Student Name',
      'Username',
      'Games Played',
      'Average Accuracy (%)',
      'Total Correct',
      'Total Incorrect',
      'Most Missed Topic',
      'Total Study Time (min)',
      'Last Played'
    ]

    const rows = data.students.map(student => [
      student.displayName,
      student.username,
      student.gamesPlayed,
      student.averageAccuracy,
      student.totalCorrect,
      student.totalIncorrect,
      student.mostMissedTopic,
      student.totalStudyTime,
      student.lastPlayed ? new Date(student.lastPlayed).toLocaleDateString() : 'N/A'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell =>
        typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
      ).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `student_analytics_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('Analytics exported to CSV')
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading analytics...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center">
        <div className="text-white text-xl">Failed to load analytics</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Teacher Analytics Dashboard</h1>
          <p className="text-white/80">Track student progress and performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-blue-300" />
                </div>
                <div>
                  <p className="text-white/70 text-sm">Total Students</p>
                  <p className="text-white text-2xl font-bold">{data.totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="bg-green-500/20 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-300" />
                </div>
                <div>
                  <p className="text-white/70 text-sm">Total Games</p>
                  <p className="text-white text-2xl font-bold">{data.totalGames}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500/20 p-3 rounded-lg">
                  <Target className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <p className="text-white/70 text-sm">Avg Accuracy</p>
                  <p className="text-white text-2xl font-bold">
                    {data.students.length > 0
                      ? Math.round(
                          data.students.reduce((sum, s) => sum + s.averageAccuracy, 0) / data.students.length
                        )
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500/20 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-300" />
                </div>
                <div>
                  <p className="text-white/70 text-sm">Total Study Time</p>
                  <p className="text-white text-2xl font-bold">
                    {formatTime(data.students.reduce((sum, s) => sum + s.totalStudyTime, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Table */}
        <Card className="bg-white/10 backdrop-blur border-white/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Student Performance</CardTitle>
                <CardDescription className="text-white/70">
                  Detailed analytics for students who played your question sets
                </CardDescription>
              </div>
              <Button
                onClick={downloadCSV}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={data.students.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {data.students.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/70 text-lg">No student data available yet</p>
                <p className="text-white/50 text-sm mt-2">
                  Students will appear here once they play your question sets
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/20 hover:bg-white/5">
                      <TableHead
                        className="text-white font-semibold cursor-pointer hover:text-white/80"
                        onClick={() => handleSort('name')}
                      >
                        Student Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead
                        className="text-white font-semibold cursor-pointer hover:text-white/80 text-center"
                        onClick={() => handleSort('gamesPlayed')}
                      >
                        Games {sortBy === 'gamesPlayed' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead
                        className="text-white font-semibold cursor-pointer hover:text-white/80 text-center"
                        onClick={() => handleSort('accuracy')}
                      >
                        Accuracy {sortBy === 'accuracy' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead className="text-white font-semibold">Most Missed Topic</TableHead>
                      <TableHead
                        className="text-white font-semibold cursor-pointer hover:text-white/80 text-center"
                        onClick={() => handleSort('studyTime')}
                      >
                        Study Time {sortBy === 'studyTime' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead className="text-white font-semibold">Last Played</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getSortedStudents().map((student) => (
                      <TableRow key={student.userId} className="border-white/20 hover:bg-white/5">
                        <TableCell className="text-white font-medium">
                          <div>
                            <div>{student.displayName}</div>
                            <div className="text-xs text-white/60">@{student.username}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-white text-center">{student.gamesPlayed}</TableCell>
                        <TableCell className="text-center">
                          <span className={`font-semibold ${
                            student.averageAccuracy >= 80 ? 'text-green-400' :
                            student.averageAccuracy >= 60 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {student.averageAccuracy}%
                          </span>
                          <div className="text-xs text-white/60">
                            {student.totalCorrect}/{student.totalCorrect + student.totalIncorrect}
                          </div>
                        </TableCell>
                        <TableCell className="text-white">{student.mostMissedTopic}</TableCell>
                        <TableCell className="text-white text-center">
                          {formatTime(student.totalStudyTime)}
                        </TableCell>
                        <TableCell className="text-white/70 text-sm">
                          {student.lastPlayed
                            ? new Date(student.lastPlayed).toLocaleDateString()
                            : 'N/A'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Question Sets Info */}
        {data.questionSets.length > 0 && (
          <Card className="bg-white/10 backdrop-blur border-white/20 mt-6">
            <CardHeader>
              <CardTitle className="text-white">Your Question Sets</CardTitle>
              <CardDescription className="text-white/70">
                These are the question sets students have played
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.questionSets.map((qs) => (
                  <div
                    key={qs.id}
                    className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                  >
                    {qs.name}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
