import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PlayerSessionProvider } from './context/PlayerSessionContext';
import { SocketProvider } from './context/SocketContext';
import Button from './components/common/Button';
import WelcomeScreen from './components/Welcome/WelcomeScreen';
import RoomScreen from './components/Room/RoomScreen';

function App() {
  return (
    <PlayerSessionProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={
              <WelcomeScreen />
            } />
            <Route path="/room/:code" element={<RoomScreen />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </PlayerSessionProvider>
  );
}

export default App;
