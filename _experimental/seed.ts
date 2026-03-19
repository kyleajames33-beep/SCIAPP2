import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Read questions from JSON file
  const questionsPath = path.join(__dirname, '..', 'data', 'chemistry_questions.json')
  const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'))

  // Clear existing questions
  await prisma.question.deleteMany({})
  console.log('Cleared existing questions')

  // Insert questions
  let insertedCount = 0
  for (const q of questionsData.questions || []) {
    await prisma.question.create({
      data: {
        question: q.question || '',
        optionA: q.options?.[0] || '',
        optionB: q.options?.[1] || '',
        optionC: q.options?.[2] || '',
        optionD: q.options?.[3] || '',
        correctAnswer: q.correctAnswer ?? 0,
        topic: q.topic || 'General',
        difficulty: q.difficulty || 'medium',
      },
    })
    insertedCount++
  }

  console.log(`Inserted ${insertedCount} questions`)
  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
