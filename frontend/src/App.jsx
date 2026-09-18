import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PlayerSessionProvider } from './context/PlayerSessionContext';
import { SocketProvider } from './context/SocketContext';
import { AudioProvider } from './context/AudioContext';
import Button from './components/common/Button';
import WelcomeScreen from './components/Welcome/WelcomeScreen';
import RoomScreen from './components/Room/RoomScreen';

function App() {
  return (
    <PlayerSessionProvider>
      <SocketProvider>
        <AudioProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={
                <WelcomeScreen />
              } />
              <Route path="/room/:code" element={<RoomScreen />} />
            </Routes>
          </BrowserRouter>
        </AudioProvider>
      </SocketProvider>
    </PlayerSessionProvider>
  );
}

export default App;
