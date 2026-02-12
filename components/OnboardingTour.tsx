'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Sparkles, Grid3x3, X, ChevronRight } from 'lucide-react'

const STEPS = [
  {
    id: 1,
    icon: Sparkles,
    title: 'Bem-vindo ao Jacupemba AI',
    description: 'Seu assistente local inteligente para descobrir comércios, serviços e informações do bairro Jacupemba.',
    highlight: 'Conectamos você com tudo que precisa, de forma rápida e personalizada.'
  },
  {
    id: 2,
    icon: MessageSquare,
    title: 'Pergunte ao Agente',
    description: 'Use o chat para fazer perguntas sobre qualquer coisa do bairro: comércios, serviços, eventos e muito mais.',
    highlight: 'O agente tem personalidade sarcástica mas é super útil!'
  },
  {
    id: 3,
    icon: Grid3x3,
    title: 'Explore Feed e Vitrine',
    description: 'Veja relatos da comunidade no Feed e ofertas na Vitrine. Você também pode contribuir com seus próprios relatos.',
    highlight: 'Mantenha-se informado sobre o que acontece no bairro.'
  }
]

interface OnboardingTourProps {
  onComplete: () => void
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    setIsVisible(false)
    setTimeout(() => {
      onComplete()
    }, 300)
  }

  if (!isVisible) return null

  const step = STEPS[currentStep]
  const Icon = step.icon
  const isLastStep = currentStep === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 rounded-lg p-1 hover:bg-zinc-100 transition-colors"
        >
          <X className="h-5 w-5 text-zinc-500" />
        </button>

        {/* Content */}
        <div className="p-8">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-700 p-4">
              <Icon className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Title & Description */}
          <div className="mb-6 text-center">
            <h2 className="mb-3 text-2xl font-bold text-zinc-900">
              {step.title}
            </h2>
            <p className="mb-4 text-zinc-600 leading-relaxed">
              {step.description}
            </p>
            <div className="rounded-lg bg-zinc-50 p-3 border border-zinc-200">
              <p className="text-sm font-medium text-zinc-800">
                💡 {step.highlight}
              </p>
            </div>
          </div>

          {/* Progress indicators */}
          <div className="mb-6 flex justify-center gap-2">
            {STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'w-8 bg-zinc-900'
                    : index < currentStep
                    ? 'w-2 bg-zinc-400'
                    : 'w-2 bg-zinc-200'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {!isLastStep && (
              <button
                onClick={handleSkip}
                className="flex-1 rounded-lg border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Pular
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
            >
              {isLastStep ? (
                'Começar'
              ) : (
                <>
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {/* Step counter */}
          <div className="mt-4 text-center">
            <span className="text-xs text-zinc-500">
              {currentStep + 1} de {STEPS.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
