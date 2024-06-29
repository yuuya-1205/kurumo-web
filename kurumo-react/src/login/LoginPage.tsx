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
            <body className="bg-blue-500">
                <div className="flex flex-col h-10">
                    <div className="bg-blue-500 sticky top-0">
                    </div>
                </div>
            </body>
            <div className="mx-auto w-80 h-100">
                <img className="mb-10" src={base_logo} alt="Description of image" />
                <form >
                    <FormComponent text={"メールアドレス"} label={"mail"}></FormComponent>
                    <FormComponent text={"パスワード"} label={"password"}></FormComponent>
                </form>

                <div className="text-right mb-20 underline text-blue-300">
                    パスワードをお忘れの方はこちら
                </div>
                <ButtonComponent label={"ログイン"} onButtonClick={handleSelectedRegisterPage}></ButtonComponent>
                <div className="flex-1 border-b border-gray-500 mb-20"></div>
                <div className="text-center">または </div>
                <ButtonComponent label={"新規登録"} onButtonClick={handleLogin}></ButtonComponent>
            </div>
        </>
    );
}