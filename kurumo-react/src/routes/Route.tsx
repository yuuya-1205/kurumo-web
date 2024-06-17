import { Route, Routes } from "react-router-dom"
import LoginPage from "../login/LoginPage"
import RegisterPage from "../register/RegisterPage"

export const AppRoutes = () => {
    return (
        <Routes>
            {/* ここにRouteを追加していく */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/RegisterPage" element={<RegisterPage />} />
        </Routes>
    )
}