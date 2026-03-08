import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-xl shadow-lg relative">
                <div className="absolute top-4 left-4">
                    <Button variant="ghost" size="sm" asChild className="text-gray-500 hover:text-gray-900">
                        <Link href="/">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Link>
                    </Button>
                </div>
                <div className="pt-8">
                    {children}
                </div>
            </div>
        </div>
    );
}
