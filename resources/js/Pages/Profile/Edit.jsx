import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { User, Shield, Key, AlertTriangle } from 'lucide-react';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AuthenticatedLayout>
            <Head title="Profile & Account Settings" />

            <div className="space-y-6">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <div className="p-3.5 bg-indigo-600/30 border border-indigo-400/40 rounded-2xl text-indigo-300">
                            <User className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold">User Profile & Account Settings</h1>
                                <span className="px-2.5 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                                    Active Account
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                                Manage your personal profile details, password, and security settings
                            </p>
                        </div>
                    </div>
                </div>

                {/* Profile Information Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                        className="max-w-2xl"
                    />
                </div>

                {/* Password Update Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                    <UpdatePasswordForm className="max-w-2xl" />
                </div>

                {/* Delete Account Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                    <DeleteUserForm className="max-w-2xl" />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
