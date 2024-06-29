import { useNavigate } from "react-router-dom";
import FormComponent from "../components/FormComponent";
import ButtonComponent from "../components/ButtonComponent";

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
            <body className="bg-blue-500">
                <div className="flex flex-col h-10">
                    <div className="bg-blue-500 sticky top-0">
                    </div>
                </div>
            </body>
            <div className="mx-auto w-80 h-100 ">
                <FormComponent text={"メールアドレス"} label={"mail"}></FormComponent>
                <ButtonComponent label={"新規登録"} onButtonClick={handleSelectedRegisterPage}></ButtonComponent>
            </div>

        </>
    );
}