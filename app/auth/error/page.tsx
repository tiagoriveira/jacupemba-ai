import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="bg-destructive text-destructive-foreground p-3 rounded-lg">
              <AlertCircle className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Erro de Autenticação</CardTitle>
          <CardDescription className="text-center">
            Ocorreu um erro ao processar sua autenticação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-center text-muted-foreground">
            Por favor, tente novamente ou entre em contato com o suporte se o problema persistir.
          </p>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button asChild className="w-full">
            <Link href="/auth/login">Tentar novamente</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
