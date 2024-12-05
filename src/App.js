import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate
} from 'react-router-dom';
import Tutorial from './pages/Tutorial'; // Import the new Tutorial component
import Room from './pages/Room'; // Import the new Room component
import NotFound from './pages/404'; // Import the new 404 component

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/tutorial" />} />
        <Route path="/tutorial" element={<Tutorial />} />
        <Route path="/room" element={<Room />} />
        <Route path="*" element={<NotFound />} /> {/* Add the 404 route */}
      </Routes>
    </Router>
  );
}

export default App;
