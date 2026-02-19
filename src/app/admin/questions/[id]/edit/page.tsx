import { getQuestion } from '../../actions'
import { QuestionForm } from '../../components/QuestionForm'
import { notFound } from 'next/navigation'

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  try {
    const question = await getQuestion(id)
    return <QuestionForm question={question} mode="edit" />
  } catch (error) {
    notFound()
  }
}
