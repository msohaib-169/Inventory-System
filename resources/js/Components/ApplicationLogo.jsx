export default function ApplicationLogo({ className = '' }) {
    return (
        <img
            src="/images/logo.png"
            alt="Logo"
            className={`rounded-full object-cover border-2 border-indigo-500/60 shadow-md ${className}`}
        />
    );
}
