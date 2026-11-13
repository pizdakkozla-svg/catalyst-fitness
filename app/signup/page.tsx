import { Suspense } from 'react'
import { AuthForm } from '@/components/auth/auth-form'

export const dynamic = 'force-dynamic'

export default function SignupPage() { return <main className="flex min-h-screen items-center justify-center px-5 py-12"><Suspense fallback={null}><AuthForm mode="signup" /></Suspense></main> }
