import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
    const navigate = useNavigate();
    const handleLogin = () => {
        navigate('/ReservationList')
    }
    const handleSelectedRegisterPage = () => {
        navigate('/SelectedRegisterPage')
    }
    return (
        <>
            <div>
                新規登録
            </div>
        </>
    );
}