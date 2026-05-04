import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import "./App.css";
import Header from "./components/elements/Header";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import NonAuthRequiredRoute from "./components/middlewares/NonAuthRequiredRoute";
import { AppProvider } from "./lib/AppProvider";
import Login from "./components/pages/Login";
import Signup from "./components/pages/Signup";
import Home from "./components/pages/Home";
import { ToastContainer } from "react-toastify";
import AuthRequiredRoute from "./components/middlewares/AuthRequiredRoute";
import Profile from "./components/pages/Profile";

function App() {
  const queryClient = new QueryClient();
  return (
    <div>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route
                path="/auth/*"
                element={
                  <NonAuthRequiredRoute>
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                    </Routes>
                  </NonAuthRequiredRoute>
                }
              />
              <Route
                path="/*"
                element={
                  <AuthRequiredRoute>
                    <Routes>
                      <Route path="/profile" element={<Profile />} />
                    </Routes>
                  </AuthRequiredRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </QueryClientProvider>
      <ToastContainer />
    </div>
  );
}

export default App;
