import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Button from './components/common/Button';
import Logo from './components/common/Logo';
import StrokeDivider from './components/common/StrokeDivider';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Logo />
            <StrokeDivider />
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 32 }}>
              <Button>Open Atelier</Button>
              <Button variant="danger">Danger Action</Button>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
