'use client';

import { useRef, useState, KeyboardEvent, ChangeEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, ImageIcon, X } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import { useUploadChatImage, type ChatAttachment } from '@/hooks/useChat';

interface ChatComposerProps {
    onSend: (body: string, attachments?: ChatAttachment[]) => void;
    onTyping?: () => void;
    isSending?: boolean;
    disabled?: boolean;
    placeholder?: string;
}

export default function ChatComposer({ onSend, onTyping, isSending, disabled, placeholder = 'พิมพ์ข้อความ...' }: ChatComposerProps) {
    const [value, setValue] = useState('');
    const [pendingImage, setPendingImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadImage = useUploadChatImage();

    const isBusy = isSending || uploadImage.isPending;

    const handleSend = () => {
        const body = value.trim();
        if ((!body && !pendingImage) || isBusy || disabled) return;
        onSend(body, pendingImage ? [{ url: pendingImage, type: 'image' }] : undefined);
        setValue('');
        setPendingImage(null);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // allow re-selecting the same file later
        if (!file) return;

        try {
            const result = await uploadImage.mutateAsync(file);
            setPendingImage(result.url);
        } catch {
            toast.error('อัปโหลดรูปภาพไม่สำเร็จ');
        }
    };

    return (
        <div className="border-t bg-white shrink-0">
            {pendingImage && (
                <div className="flex items-center gap-2 px-3 pt-2">
                    <div className="relative h-14 w-14 rounded-lg overflow-hidden border border-gray-200">
                        {/* eslint-disable-next-line @next/next/no-img-element -- transient local preview, not worth Next/Image's overhead */}
                        <img src={getImageUrl(pendingImage)} alt="รูปที่แนบ" className="h-full w-full object-cover" />
                        <button
                            onClick={() => setPendingImage(null)}
                            aria-label="ลบรูปที่แนบ"
                            className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-black/60 text-white flex items-center justify-center"
                        >
                            <X className="h-2.5 w-2.5" />
                        </button>
                    </div>
                </div>
            )}
            <div className="flex items-end gap-2 p-3">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                />
                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isBusy || disabled}
                    className="h-10 w-10 shrink-0"
                    aria-label="แนบรูปภาพ"
                >
                    {uploadImage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                </Button>
                <Textarea
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        onTyping?.();
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    rows={1}
                    maxLength={2000}
                    className="min-h-10 max-h-32 resize-none"
                />
                <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={(!value.trim() && !pendingImage) || isBusy || disabled}
                    className="h-10 w-10 shrink-0"
                    aria-label="ส่งข้อความ"
                >
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
            </div>
        </div>
    );
}
