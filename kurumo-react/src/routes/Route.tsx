import { Route, Routes } from "react-router-dom"
import LoginPage from "../login/LoginPage"
import RegisterPage from "../register/RegisterPage"
import SelectRegisterPage from "../register/SelectRegisterPage"
import ReservationListPage from "../reservation/ReservationListPage"

export const AppRoutes = () => {
    return (
        <Routes>
            {/* ここにRouteを追加していく */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/RegisterPage" element={<RegisterPage />} />
            <Route path="/SelectRegisterPage" element={<SelectRegisterPage />} />
            <Route path="/ConsumerRegisterPage" element={<SelectRegisterPage />} />
            <Route path="/ConsumerRegisterPage" element={<SelectRegisterPage />} />
            <Route path="/ReservationListPage" element={<ReservationListPage />} />
        </Routes>
    )
}