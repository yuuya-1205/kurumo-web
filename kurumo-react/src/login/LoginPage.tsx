import { useNavigate } from "react-router-dom";
import base_logo from "../assets/images/base_logo.png"
import ButtonComponent from "../components/ButtonComponent";
import FormComponent from "../components/FormComponent";


export default function LoginPage() {
    const navigate = useNavigate();
    const handleLogin = () => {
        navigate('/ReservationList')
    }
    const handleSelectedRegisterPage = () => {
        navigate('/RegisterPage')
    }
    return (
        <>
            <header className="bg-green-200 w-full">
            </header>
            {/* 中央揃えできない */}
            <img className="mb-10" src={base_logo} alt="Description of image" />
            <div className="flex flex-col items-center  mb-2 h-screen">
                <form className='text-left font-bold w-full '>
                    <FormComponent text={"メールアドレス"} label={"mail"}></FormComponent>
                    <FormComponent text={"パスワード"} label={"password"}></FormComponent>
                </form>
                <ButtonComponent label={"こんばんは"} onButtonClick={handleSelectedRegisterPage}></ButtonComponent>
            </div>
        </>
    );
}