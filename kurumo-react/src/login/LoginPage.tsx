import { useNavigate } from "react-router-dom";
import base_logo from "../assets/images/base_logo.png"


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
                    <p className='text-blue-900'>メールアドレス</p>
                    <input type='mail' name='email' className=' bg-white p-2 rounded-lg  w-full max-w-md border border-grey mb-10'></input>
                    <p className='text-blue-900'>パスワード</p>
                    <input type='password' name='password' className=' bg-white p-2 rounded-lg  w-full max-w-md border border-grey mb-10'></input>
                </form>
                <button onClick={handleLogin} className="bg-blue-400  text-white rounded-3xl w-64 h-16 mb-10 font-bold">ログイン</button >
                <button onClick={handleSelectedRegisterPage} className="bg-blue-400  text-white rounded-3xl w-64 h-16 font-bold">新規登録</button >
            </div>
        </>
    );
}