import { useNavigate } from "react-router-dom";
import ButtonComponent from "../components/ButtonComponent";

export default function ConsumerRegisterPage() {
    const navigate = useNavigate();
    const handleCustomerRegisterPage = () => {
        navigate('/CustomerRegisterPage')
    }
    const handleConsumerRegisterPage = () => {
        navigate('/ConsumerRegisterPage')
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
                こんばんは
                <ButtonComponent label={"情報を掲載する"} onButtonClick={handleConsumerRegisterPage}></ButtonComponent>
            </div>

        </>
    );
}