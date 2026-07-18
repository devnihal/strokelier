import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div style={{ padding: 24 }}>Welcome to Strokelier (Tokens Loaded)</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
