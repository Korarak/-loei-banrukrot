import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { getImageUrl } from '@/lib/utils';
import { ProductImage } from '@/hooks/useProducts';

interface ImagePreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    images: ProductImage[];
    productName: string;
    initialImageIndex?: number;
}

export default function ImagePreviewDialog({
    open,
    onOpenChange,
    images,
    productName,
    initialImageIndex = 0
}: ImagePreviewDialogProps) {
    const [currentIndex, setCurrentIndex] = useState(initialImageIndex);

    useEffect(() => {
        if (open) {
            setCurrentIndex(initialImageIndex);
        }
    }, [open, initialImageIndex]);

    if (!images || images.length === 0) return null;

    const handlePrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const currentImage = images[currentIndex];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl w-full p-0 bg-black/95 border-none text-white overflow-hidden" aria-describedby={undefined}>
                <div className="relative h-[80vh] flex flex-col">
                    {/* Header */}
                    <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 bg-gradient-to-b from-black/50 to-transparent">
                        <DialogTitle className="text-lg font-medium text-white">
                            {productName}
                            <span className="ml-2 text-sm text-gray-300 font-normal">
                                ({currentIndex + 1} / {images.length})
                            </span>
                        </DialogTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            className="text-white hover:bg-white/20 rounded-full"
                        >
                            <X className="h-6 w-6" />
                        </Button>
                    </div>

                    {/* Main Image */}
                    <div className="flex-1 relative flex items-center justify-center bg-black">
                        <div className="relative w-full h-full">
                            <Image
                                src={getImageUrl(currentImage.imagePath)}
                                alt={`${productName} - Image ${currentIndex + 1}`}
                                fill
                                className="object-contain"
                                priority
                                unoptimized
                            />
                        </div>

                        {/* Navigation Buttons */}
                        {images.length > 1 && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handlePrevious}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full h-12 w-12"
                                >
                                    <ChevronLeft className="h-8 w-8" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleNext}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full h-12 w-12"
                                >
                                    <ChevronRight className="h-8 w-8" />
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Thumbnails */}
                    {images.length > 1 && (
                        <div className="h-24 bg-black/80 flex items-center gap-2 px-4 overflow-x-auto">
                            {images.map((img, index) => (
                                <button
                                    key={img._id || index}
                                    onClick={() => setCurrentIndex(index)}
                                    className={`relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${index === currentIndex
                                        ? 'border-white opacity-100'
                                        : 'border-transparent opacity-50 hover:opacity-75'
                                        }`}
                                >
                                    <Image
                                        src={getImageUrl(img.imagePath)}
                                        alt={`Thumbnail ${index + 1}`}
                                        fill
                                        className="object-cover"
                                        sizes="64px"
                                        unoptimized
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
