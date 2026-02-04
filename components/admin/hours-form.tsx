'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import type { BusinessHours } from '@/lib/types/database'

interface HoursFormProps {
  businessId: string
  existingHours: BusinessHours[]
}

const daysOfWeek = [
  { id: 0, name: 'Domingo' },
  { id: 1, name: 'Segunda-feira' },
  { id: 2, name: 'Terça-feira' },
  { id: 3, name: 'Quarta-feira' },
  { id: 4, name: 'Quinta-feira' },
  { id: 5, name: 'Sexta-feira' },
  { id: 6, name: 'Sábado' },
]

export function HoursForm({ businessId, existingHours }: HoursFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [hours, setHours] = useState(() => {
    const hoursMap = new Map(existingHours.map(h => [h.day_of_week, h]))
    return daysOfWeek.map(day => ({
      day_of_week: day.id,
      is_open: hoursMap.get(day.id)?.is_open ?? false,
      open_time: hoursMap.get(day.id)?.open_time || '09:00',
      close_time: hoursMap.get(day.id)?.close_time || '18:00',
    }))
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const supabase = createClient()

      // Delete existing hours
      await supabase
        .from('business_hours')
        .delete()
        .eq('business_id', businessId)

      // Insert new hours
      const dataToInsert = hours.map(h => ({
        business_id: businessId,
        day_of_week: h.day_of_week,
        is_open: h.is_open,
        open_time: h.is_open ? h.open_time : null,
        close_time: h.is_open ? h.close_time : null,
      }))

      const { error } = await supabase
        .from('business_hours')
        .insert(dataToInsert)

      if (error) throw error

      setSuccess(true)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar horários')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            Horários salvos com sucesso!
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {daysOfWeek.map((day, index) => (
          <div key={day.id} className="flex items-center gap-4 p-4 border rounded-lg">
            <div className="flex items-center gap-3 w-40">
              <Switch
                checked={hours[index].is_open}
                onCheckedChange={(checked) => {
                  const newHours = [...hours]
                  newHours[index].is_open = checked
                  setHours(newHours)
                }}
                disabled={loading}
              />
              <Label className="font-medium">{day.name}</Label>
            </div>

            {hours[index].is_open && (
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor={`open-${day.id}`} className="text-sm text-muted-foreground">
                    Abre:
                  </Label>
                  <Input
                    id={`open-${day.id}`}
                    type="time"
                    value={hours[index].open_time}
                    onChange={(e) => {
                      const newHours = [...hours]
                      newHours[index].open_time = e.target.value
                      setHours(newHours)
                    }}
                    disabled={loading}
                    className="w-32"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor={`close-${day.id}`} className="text-sm text-muted-foreground">
                    Fecha:
                  </Label>
                  <Input
                    id={`close-${day.id}`}
                    type="time"
                    value={hours[index].close_time}
                    onChange={(e) => {
                      const newHours = [...hours]
                      newHours[index].close_time = e.target.value
                      setHours(newHours)
                    }}
                    disabled={loading}
                    className="w-32"
                  />
                </div>
              </div>
            )}

            {!hours[index].is_open && (
              <span className="text-sm text-muted-foreground">Fechado</span>
            )}
          </div>
        ))}
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          'Salvar Horários'
        )}
      </Button>
    </form>
  )
}
