import MainLayout from './app/layout/MainLayout'

function App() {
  return (
    <MainLayout>
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Benvenuto in Athlos Suite Pro
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Sistema di gestione completo per società calcistiche professionali
        </p>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            🎯 Fase B Completata
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Layout base, tema light/dark e sidebar funzionanti!
          </p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="font-semibold text-green-800 dark:text-green-300">✅ Tailwind</div>
              <div className="text-green-600 dark:text-green-400">Configurato</div>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="font-semibold text-blue-800 dark:text-blue-300">✅ Layout</div>
              <div className="text-blue-600 dark:text-blue-400">Sidebar + Header</div>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded-lg">
              <div className="font-semibold text-purple-800 dark:text-purple-300">✅ Tema</div>
              <div className="text-purple-600 dark:text-purple-400">Light/Dark</div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default App
