
interface ButtonProps {
    label: string;
    onButtonClick: () => void
}
const ButtonComponent: React.FC<ButtonProps> = ({ ...ButtonProps }) => {
    return (
        <>
            <button onClick={ButtonProps.onButtonClick} className="bg-blue-400  text-white rounded-3xl w-64 h-16 mb-10 font-bold">{ButtonProps.label}</button >
        </>
    );
}
export default ButtonComponent;
