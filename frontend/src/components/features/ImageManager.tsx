'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2, Star, StarOff, Plus, MoveUp, MoveDown, Upload, Loader2, X } from 'lucide-react';
import {
    useAddProductImage,
    useUpdateProductImage,
    useDeleteProductImage,
    useReorderProductImages
} from '@/hooks/useProductImages';
import api from '@/lib/api';
import { toast } from 'sonner';
import { getImageUrl } from '@/lib/utils';

interface ProductImage {
    _id: string;
    imagePath: string;
    isPrimary: boolean;
    sortOrder: number;
}

interface ImageManagerProps {
    productId: string;
    images: ProductImage[];
}

export default function ImageManager({ productId, images: initialImages }: ImageManagerProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [deleteImageId, setDeleteImageId] = useState<string | null>(null);
    const [images, setImages] = useState(initialImages);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync local state with props when they change (e.g. after deletion/upload)
    useEffect(() => {
        setImages(initialImages);
    }, [initialImages]);

    const addImage = useAddProductImage();
    const updateImage = useUpdateProductImage();
    const deleteImage = useDeleteProductImage();
    const reorderImages = useReorderProductImages();

    const cropImageToSquare = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new (window as any).Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const size = Math.min(img.width, img.height);
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context not available'));
                    return;
                }

                // Center crop
                const x = (img.width - size) / 2;
                const y = (img.height - size) / 2;
                ctx.drawImage(img, x, y, size, size, 0, 0, size, size);

                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Canvas toBlob failed'));
                }, 'image/webp', 0.9);
            };
            img.onerror = () => reject(new Error('Image load failed'));
            img.src = URL.createObjectURL(file);
        });
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const originalFile = e.target.files?.[0];
        if (!originalFile) return;

        // Validate file type
        if (!originalFile.type.startsWith('image/')) {
            toast.error('กรุณาอัปโหลดไฟล์รูปภาพ');
            return;
        }

        // Validate file size (5MB)
        if (originalFile.size > 5 * 1024 * 1024) {
            toast.error('ขนาดไฟล์ต้องไม่เกิน 5MB');
            return;
        }

        setIsUploading(true);
        try {
            // Standardize to 1:1 aspect ratio before upload
            const squareBlob = await cropImageToSquare(originalFile);
            const file = new File([squareBlob], originalFile.name.replace(/\.[^/.]+$/, "") + ".webp", { type: 'image/webp' });

            const formData = new FormData();
            formData.append('image', file);

            // Upload to backend
            const response = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                const imagePath = response.data.data.imagePath;
                // Add to product
                await addImage.mutateAsync({
                    productId,
                    imagePath, // Store relative path
                    isPrimary: images.length === 0
                });
                toast.success('อัปโหลดรูปภาพสำเร็จ');
            }
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('อัปโหลดรูปภาพไม่สำเร็จ');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleSetPrimary = async (imageId: string) => {
        await updateImage.mutateAsync({
            productId,
            imageId,
            isPrimary: true
        });
    };

    const handleDeleteImage = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent any default behavior
        if (!deleteImageId) return;

        try {
            await deleteImage.mutateAsync({
                productId,
                imageId: deleteImageId
            });
            setDeleteImageId(null); // Close dialog on success
        } catch (error) {
            // Error is handled by the hook's onError
            console.error("Failed to delete image:", error);
        }
    };

    const handleMoveImage = async (index: number, direction: 'up' | 'down') => {
        const newImages = [...images];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= newImages.length) return;

        // Optimistic update
        // Swap
        [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];

        // Update sortOrder for local state
        const reorderedImagesForState = newImages.map((img, idx) => ({
            ...img,
            sortOrder: idx
        }));

        setImages(reorderedImagesForState);

        try {
            // Prepare payload
            const reorderedImagesPayload = reorderedImagesForState.map((img) => ({
                id: img._id,
                sortOrder: img.sortOrder
            }));

            // Validate payload
            if (reorderedImagesPayload.some(img => !img.id)) {
                throw new Error("Invalid image ID found");
            }

            await reorderImages.mutateAsync({
                productId,
                images: reorderedImagesPayload
            });
        } catch (error) {
            console.error("Failed to reorder images:", error);
            // Revert state on error
            setImages(images);
            toast.error("ไม่สามารถบันทึกลำดับได้ กรุณาลองใหม่อีกครั้ง");
        }
    };

    const sortedImages = [...images].sort((a, b) => a.sortOrder - b.sortOrder);

    return (
        <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-xl border border-dashed border-gray-300 text-center">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                />
                <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                        {isUploading ? (
                            <Loader2 className="h-6 w-6 text-green-600 animate-spin" />
                        ) : (
                            <Upload className="h-6 w-6 text-gray-400" />
                        )}
                    </div>
                    <div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading || addImage.isPending}
                            className="mb-2"
                        >
                            {isUploading ? 'กำลังอัปโหลด...' : 'คลิกเพื่ออัปโหลดรูปภาพ'}
                        </Button>
                        <p className="text-xs text-gray-500">
                            SVG, PNG, JPG หรือ GIF (สูงสุด 5MB)
                        </p>
                    </div>
                </div>
            </div>

            {sortedImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {sortedImages.map((image, index) => (
                        <Card key={image._id} className="p-2 relative group overflow-hidden">
                            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                                <Image
                                    src={getImageUrl(image.imagePath)}
                                    alt="Product"
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 50vw, 25vw"
                                    unoptimized
                                />
                                {image.isPrimary && (
                                    <div className="absolute top-2 left-2 bg-black text-white px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-sm">
                                        <Star className="h-3 w-3 fill-current text-yellow-400" />
                                        รูปหลัก
                                    </div>
                                )}

                                { /* Static Delete Action - White Background */ }
                                <div className="absolute bottom-2 right-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="icon"
                                        className="h-8 w-8 rounded-xl shadow-lg bg-white hover:bg-red-50 text-red-600 border border-gray-100 transition-all hover:scale-110 active:scale-95"
                                        onClick={() => setDeleteImageId(image._id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                {!image.isPrimary && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSetPrimary(image._id)}
                                        disabled={updateImage.isPending}
                                        className="w-full text-xs h-8"
                                    >
                                        ตั้งเป็นรูปหลัก
                                    </Button>
                                )}

                                <div className="flex gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleMoveImage(index, 'up')}
                                        disabled={index === 0 || reorderImages.isPending}
                                        className="flex-1 h-8"
                                    >
                                        <MoveUp className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleMoveImage(index, 'down')}
                                        disabled={index === sortedImages.length - 1 || reorderImages.isPending}
                                        className="flex-1 h-8"
                                    >
                                        <MoveDown className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed">
                    <p>ยังไม่มีรูปภาพ</p>
                </div>
            )}

            <AlertDialog open={!!deleteImageId} onOpenChange={() => setDeleteImageId(null)}>
                <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>ลบรูปภาพหรือไม่?</AlertDialogTitle>
                        <AlertDialogDescription>
                            การดำเนินการนี้ไม่สามารถยกเลิกได้ และรูปภาพจะถูกลบอย่างถาวร
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteImage.isPending}>ยกเลิก</AlertDialogCancel>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDeleteImage}
                            disabled={deleteImage.isPending}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleteImage.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    กำลังลบ...
                                </>
                            ) : (
                                'ลบ'
                            )}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
