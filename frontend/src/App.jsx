import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SingleEvaluation from './pages/SingleEvaluation';
import AsyncEvaluation from './pages/AsyncEvaluation';
import BatchEvaluation from './pages/BatchEvaluation';
import ApiInfo from './pages/ApiInfo';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/single" element={<SingleEvaluation />} />
          <Route path="/async" element={<AsyncEvaluation />} />
          <Route path="/batch" element={<BatchEvaluation />} />
          <Route path="/info" element={<ApiInfo />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
