export default function NotFound() {
    return (
        <div className="flex h-screen flex-col items-center justify-center bg-white dark:bg-zinc-950 px-4">
            <div className="text-center">
                <div className="mb-6 flex justify-center">
                    <img
                        src="/avatar.png"
                        alt="Jacupemba"
                        className="h-24 w-24 object-contain opacity-50"
                    />
                </div>
                <h1 className="text-6xl font-bold text-zinc-300 dark:text-zinc-700">404</h1>
                <h2 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    Página não encontrada
                </h2>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    Eita, essa rua não existe no Jacupemba! 🤷
                </p>
                <a
                    href="/"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-zinc-800 active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                    Voltar ao início
                </a>
            </div>
        </div>
    )
}
