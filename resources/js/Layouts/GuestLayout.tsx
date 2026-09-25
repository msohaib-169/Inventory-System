// @ts-nocheck
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div
            className="flex min-h-screen flex-col items-center justify-center bg-cover bg-center bg-no-repeat"
            style={{
                backgroundImage: "url('/images/logo.png')",
            }}
        >

            {/* Dark Overlay */}
            <div className="flex min-h-screen w-full items-center justify-center bg-black/50 px-4">

                {/* Login Card */}
                <div className="w-full overflow-hidden rounded-2xl bg-white/95 px-6 py-8 shadow-2xl backdrop-blur-sm sm:max-w-md">

                    {children}

                </div>

            </div>

        </div>
    );
}
