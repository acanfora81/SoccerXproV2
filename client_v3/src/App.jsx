import { useState } from 'react'
import MainLayout from './app/layout/MainLayout'
import PlayersList from './features/players/pages/PlayersList'

function App() {
  const [activePage, setActivePage] = useState('players')

  return (
    <MainLayout>
      {activePage === 'players' && <PlayersList />}
    </MainLayout>
  )
}

export default App
