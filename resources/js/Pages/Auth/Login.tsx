// @ts-nocheck
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onSuccess: () => {
                window.location.href = route('dashboard');
            },
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            {/* Welcome Section */}
            <div className="mb-8 text-center welcome-animation">
                <img
                    src="/images/logo.png"
                    alt="Zartab Fatima Collection Logo"
                    className="mb-3 inline-block h-16 w-16 rounded-full object-cover border-2 border-indigo-500 shadow-lg transition-all duration-500 hover:scale-110"
                />

                <h1 className="text-3xl font-extrabold tracking-tight text-gray-800 transition-all duration-500 hover:text-indigo-600">
                    Welcome to Zartab
                </h1>

                <h2 className="mt-1 text-xl font-semibold text-indigo-600">
                    Inventory System
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                    Please log in to access your inventory dashboard
                </p>
            </div>

            {/* Status Message */}
            {status && (
                <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm font-medium text-green-600 shadow-sm status-animation">
                    {status}
                </div>
            )}

            <form
                onSubmit={submit}
                className="login-form-animation"
            >
                {/* Email */}
                <div className="form-field">
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full transition-all duration-300 hover:border-indigo-400 hover:shadow-sm focus:scale-[1.01] focus:border-indigo-500 focus:ring-indigo-500"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) =>
                            setData('email', e.target.value)
                        }
                    />

                    <InputError
                        message={errors.email}
                        className="mt-2"
                    />
                </div>

                {/* Password */}
                <div className="mt-4 form-field-delay">
                    <InputLabel
                        htmlFor="password"
                        value="Password"
                    />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full transition-all duration-300 hover:border-indigo-400 hover:shadow-sm focus:scale-[1.01] focus:border-indigo-500 focus:ring-indigo-500"
                        autoComplete="current-password"
                        onChange={(e) =>
                            setData('password', e.target.value)
                        }
                    />

                    <InputError
                        message={errors.password}
                        className="mt-2"
                    />
                </div>

                {/* Remember Me */}
                <div className="mt-4 block remember-animation">
                    <label className="flex cursor-pointer items-center transition-all duration-300 hover:translate-x-1">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData(
                                    'remember',
                                    e.target.checked
                                )
                            }
                        />

                        <span className="ms-2 text-sm text-gray-600 transition-colors duration-300 hover:text-indigo-600">
                            Remember me
                        </span>
                    </label>
                </div>

                {/* Actions */}
                <div className="mt-6 flex items-center justify-end action-animation">
                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="rounded-md text-sm text-gray-600 underline transition-all duration-300 hover:translate-x-1 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Forgot your password?
                        </Link>
                    )}

                    <PrimaryButton
                        className="ms-4 transform transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
                        disabled={processing}
                    >
                        <span className="flex items-center gap-2">
                            {processing && (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                            )}

                            {processing
                                ? 'Logging in...'
                                : 'Log in'}
                        </span>
                    </PrimaryButton>
                </div>
            </form>

            {/* Animations */}
            <style>{`
                @keyframes welcome {
                    0% {
                        opacity: 0;
                        transform: translateY(-30px) scale(0.95);
                    }

                    100% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                @keyframes loginForm {
                    0% {
                        opacity: 0;
                        transform: translateY(30px);
                    }

                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes status {
                    0% {
                        opacity: 0;
                        transform: scale(0.95);
                    }

                    100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes field {
                    0% {
                        opacity: 0;
                        transform: translateX(-20px);
                    }

                    100% {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                .welcome-animation {
                    animation: welcome 0.8s ease-out;
                }

                .login-form-animation {
                    animation: loginForm 0.9s ease-out;
                }

                .status-animation {
                    animation: status 0.5s ease-out;
                }

                .form-field {
                    animation: field 0.6s ease-out;
                }

                .form-field-delay {
                    animation: field 0.7s ease-out;
                }

                .remember-animation {
                    animation: field 0.8s ease-out;
                }

                .action-animation {
                    animation: field 0.9s ease-out;
                }
            `}</style>
        </GuestLayout>
    );
}
