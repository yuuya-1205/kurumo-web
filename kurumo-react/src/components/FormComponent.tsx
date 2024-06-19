interface FormProps {
    text: string;
    label: string;
}
const FormComponent: React.FC<FormProps> = ({ ...FormProps }) => {
    return (
        <>
            <p className='text-blue-900'>{FormProps.text}</p>
            <input type={FormProps.label} name={FormProps.label} className=' bg-white p-2 rounded-lg  w-full max-w-md border border-grey mb-10'></input>
        </>

    );
}
export default FormComponent;