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


            {/* まず、縦済みする。 */}
            {/* ①これを中央揃えする。
            ②幅を決める
             */}
            <div className="mx-auto w-80 h-100 bg-green-200">
                <form >
                    <FormComponent text={"メールアドレス"} label={"mail"}></FormComponent>
                    <FormComponent text={"パスワード"} label={"password"}></FormComponent>
                </form>

                <div className="text-right mb-20">
                    こんばんは
                </div>
                <ButtonComponent label={"ログイン"} onButtonClick={handleSelectedRegisterPage}></ButtonComponent>
                <div className="flex-1 border-b border-gray-500 mb-20"></div>
                <div className="text-center">または </div>
                <ButtonComponent label={"新規登録"} onButtonClick={handleSelectedRegisterPage}></ButtonComponent>

            </div>
        </>
    );
}