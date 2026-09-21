import AccordionArt from './AccordionArt'

/** Tela de carregamento (sem depender do SDK do Supabase, para ficar leve). */
export default function SplashScreen() {
  return (
    <div className="flex h-full items-center justify-center bg-[var(--color-brand-dark)]">
      <AccordionArt className="h-16 w-auto opacity-80" />
    </div>
  )
}
