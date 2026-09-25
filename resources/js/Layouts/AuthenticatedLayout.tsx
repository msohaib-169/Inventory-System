// @ts-nocheck
import React, { useState } from 'react';
import { Header } from '@/Components/Header';
import { Sidebar } from '@/Components/Sidebar';
import { CURRENCIES } from '@/types';
import { router } from '@inertiajs/react';

export default function AuthenticatedLayout({ header, children }) {
    const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);

    const handleTabChange = (tab) => {
        if (tab === 'profile') {
            router.get(route('profile.edit'));
        } else {
            router.get(route('dashboard'));
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800 antialiased font-sans">
            <Header
                activeTab="profile"
                onResetData={() => {}}
                lowStockCount={0}
                currency={selectedCurrency}
                onCurrencyChange={setSelectedCurrency}
            />

            <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
                <Sidebar activeTab="profile" setActiveTab={handleTabChange} />

                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}

