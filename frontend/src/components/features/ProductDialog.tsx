import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import ProductForm from './ProductForm';
import { useCreateProduct, useUpdateProduct, useProduct } from '@/hooks/useProducts';

interface ProductDialogProps {
    productId?: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function ProductDialog({ productId, open, onOpenChange }: ProductDialogProps) {
    const createProduct = useCreateProduct();
    const updateProduct = useUpdateProduct();

    // Fetch product data if productId is provided
    const { data: product, isLoading: isFetching } = useProduct(productId || '');

    const handleSubmit = async (data: any) => {
        try {
            if (productId) {
                await updateProduct.mutateAsync({ id: productId, data });
            } else {
                await createProduct.mutateAsync(data);
            }
            onOpenChange(false);
        } catch (error) {
            console.error('Submit error:', error);
        }
    };

    const isLoading = createProduct.isPending || updateProduct.isPending || (!!productId && isFetching);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
                <DialogHeader>
                    <DialogTitle>{productId ? 'แก้ไขสินค้า' : 'สร้างสินค้าใหม่'}</DialogTitle>
                    <DialogDescription>
                        {productId
                            ? 'อัปเดตข้อมูลรายละเอียดสินค้าและตัวเลือกต่างๆ'
                            : 'เพิ่มสินค้าใหม่พร้อมตัวเลือกสินค้าลงในคลังของคุณ'}
                    </DialogDescription>
                </DialogHeader>

                {isLoading && !!productId && !product ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                ) : (
                    <ProductForm
                        product={product}
                        onSubmit={handleSubmit}
                        onCancel={() => onOpenChange(false)}
                        isLoading={createProduct.isPending || updateProduct.isPending}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
