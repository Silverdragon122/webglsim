import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate
} from 'react-router-dom';
import Room from './pages/Room'; // Import the new Room component
import NotFound from './pages/404'; // Import the new 404 component

function App() {
  return (
    <Router>
      <Routes>
        <Route path="*" element={<Room />} /> {/* Add the 404 route */}
      </Routes>
    </Router>
  );
}

export default App;
