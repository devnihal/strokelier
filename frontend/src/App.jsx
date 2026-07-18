import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PlayerSessionProvider } from './context/PlayerSessionContext';
import { SocketProvider } from './context/SocketContext';
import Button from './components/common/Button';
import WelcomeScreen from './components/Welcome/WelcomeScreen';

function App() {
  return (
    <PlayerSessionProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={
              <WelcomeScreen />
            } />
            <Route path="/room/:code" element={
              <div style={{ padding: 48, textAlign: 'center' }}>
                <h2>Game Room Placeholder</h2>
                <p>You joined a room!</p>
              </div>
            } />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </PlayerSessionProvider>
  );
}

export default App;
